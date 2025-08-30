import { prisma } from '../config/database';
import { CacheService, CacheKeys, CacheTTL } from '../config/redis';
import { z } from 'zod';

// Inventory types
export enum InventoryStatus {
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  RESERVED = 'RESERVED',
  BACKORDERED = 'BACKORDERED'
}

export enum InventoryMovementType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  RETURN = 'RETURN',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
  DAMAGE = 'DAMAGE',
  RESERVATION = 'RESERVATION',
  RELEASE = 'RELEASE'
}

// Validation schemas
const InventoryUpdateSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int(),
  movementType: z.nativeEnum(InventoryMovementType),
  warehouseId: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const ReservationSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  orderId: z.string(),
  expiresAt: z.date().optional(),
  customerId: z.string().optional()
});

export class InventoryService {
  private static readonly RESERVATION_EXPIRY = 15 * 60 * 1000; // 15 minutes
  private static readonly LOW_STOCK_THRESHOLD = 10;

  /**
   * Check product availability
   */
  static async checkAvailability(
    productId: string,
    quantity: number,
    warehouseId?: string
  ): Promise<boolean> {
    try {
      // Get from cache first
      const cacheKey = `${CacheKeys.INVENTORY}${productId}${warehouseId || 'all'}`;
      const cached = await CacheService.get<{ available: number }>(cacheKey);
      
      if (cached) {
        return cached.available >= quantity;
      }

      // Get from database
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          salesDetails: true,
          rentalDetails: true
        }
      });

      if (!product) {
        throw new Error('Product not found');
      }

      let available = 0;

      if (product.availabilityType === 'SALE' || product.availabilityType === 'BOTH') {
        const inventory = product.salesDetails?.inventory as any;
        available = (inventory?.quantity || 0) - (inventory?.reserved || 0);
      } else if (product.availabilityType === 'RENT') {
        const inventory = product.rentalDetails?.inventory as any;
        available = inventory?.available || 0;
      }

      // Cache the result
      await CacheService.set(
        cacheKey,
        { available, lastChecked: new Date() },
        CacheTTL.SHORT
      );

      return available >= quantity;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  }

  /**
   * Reserve inventory for an order
   */
  static async reserveInventory(
    productId: string,
    quantity: number,
    orderId: string,
    expiresAt?: Date
  ): Promise<boolean> {
    const reservation = ReservationSchema.parse({
      productId,
      quantity,
      orderId,
      expiresAt: expiresAt || new Date(Date.now() + this.RESERVATION_EXPIRY)
    });

    return await prisma.$transaction(async (tx) => {
      // Check current availability
      const product = await tx.product.findUnique({
        where: { id: productId },
        include: { salesDetails: true }
      });

      if (!product || !product.salesDetails) {
        throw new Error('Product not available for sale');
      }

      const inventory = product.salesDetails.inventory as any;
      const available = (inventory?.quantity || 0) - (inventory?.reserved || 0);

      if (available < quantity) {
        throw new Error('Insufficient inventory');
      }

      // Update inventory
      await tx.salesProduct.update({
        where: { productId },
        data: {
          inventory: {
            ...inventory,
            reserved: (inventory.reserved || 0) + quantity
          }
        }
      });

      // Create reservation record
      await tx.inventoryReservation.create({
        data: {
          productId,
          orderId,
          quantity,
          expiresAt: reservation.expiresAt,
          status: 'ACTIVE'
        }
      });

      // Record movement
      await tx.inventoryMovement.create({
        data: {
          productId,
          movementType: InventoryMovementType.RESERVATION,
          quantity: -quantity,
          referenceType: 'ORDER',
          referenceId: orderId,
          metadata: {
            orderId,
            reservedUntil: reservation.expiresAt
          }
        }
      });

      // Clear cache
      await CacheService.delete(`${CacheKeys.INVENTORY}${productId}*`);

      // Check if low stock alert needed
      await this.checkLowStock(productId, available - quantity);

      return true;
    });
  }

  /**
   * Confirm reservation (convert to sale)
   */
  static async confirmReservation(
    productId: string,
    orderId: string
  ): Promise<boolean> {
    return await prisma.$transaction(async (tx) => {
      // Find reservation
      const reservation = await tx.inventoryReservation.findFirst({
        where: {
          productId,
          orderId,
          status: 'ACTIVE'
        }
      });

      if (!reservation) {
        throw new Error('Reservation not found');
      }

      // Update reservation status
      await tx.inventoryReservation.update({
        where: { id: reservation.id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date()
        }
      });

      // Update inventory
      const product = await tx.salesProduct.findUnique({
        where: { productId }
      });

      if (!product) {
        throw new Error('Product not found');
      }

      const inventory = product.inventory as any;
      await tx.salesProduct.update({
        where: { productId },
        data: {
          inventory: {
            ...inventory,
            quantity: (inventory.quantity || 0) - reservation.quantity,
            reserved: Math.max(0, (inventory.reserved || 0) - reservation.quantity)
          }
        }
      });

      // Record movement
      await tx.inventoryMovement.create({
        data: {
          productId,
          movementType: InventoryMovementType.SALE,
          quantity: -reservation.quantity,
          referenceType: 'ORDER',
          referenceId: orderId,
          metadata: {
            orderId,
            reservationId: reservation.id
          }
        }
      });

      // Clear cache
      await CacheService.delete(`${CacheKeys.INVENTORY}${productId}*`);

      return true;
    });
  }

  /**
   * Release reservation
   */
  static async releaseReservation(
    productId: string,
    orderId: string
  ): Promise<boolean> {
    return await prisma.$transaction(async (tx) => {
      // Find reservation
      const reservation = await tx.inventoryReservation.findFirst({
        where: {
          productId,
          orderId,
          status: 'ACTIVE'
        }
      });

      if (!reservation) {
        return false; // Already released or doesn't exist
      }

      // Update reservation status
      await tx.inventoryReservation.update({
        where: { id: reservation.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date()
        }
      });

      // Update inventory
      const product = await tx.salesProduct.findUnique({
        where: { productId }
      });

      if (product) {
        const inventory = product.inventory as any;
        await tx.salesProduct.update({
          where: { productId },
          data: {
            inventory: {
              ...inventory,
              reserved: Math.max(0, (inventory.reserved || 0) - reservation.quantity)
            }
          }
        });
      }

      // Record movement
      await tx.inventoryMovement.create({
        data: {
          productId,
          movementType: InventoryMovementType.RELEASE,
          quantity: reservation.quantity,
          referenceType: 'ORDER',
          referenceId: orderId,
          metadata: {
            orderId,
            reservationId: reservation.id,
            reason: 'Order cancelled or expired'
          }
        }
      });

      // Clear cache
      await CacheService.delete(`${CacheKeys.INVENTORY}${productId}*`);

      return true;
    });
  }

  /**
   * Ship order (deduct from inventory)
   */
  static async shipOrder(
    productId: string,
    quantity: number,
    orderId: string
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const product = await tx.salesProduct.findUnique({
        where: { productId }
      });

      if (!product) {
        throw new Error('Product not found');
      }

      const inventory = product.inventory as any;
      
      // Update inventory
      await tx.salesProduct.update({
        where: { productId },
        data: {
          inventory: {
            ...inventory,
            shipped: (inventory.shipped || 0) + quantity
          }
        }
      });

      // Record movement
      await tx.inventoryMovement.create({
        data: {
          productId,
          movementType: InventoryMovementType.SALE,
          quantity: -quantity,
          referenceType: 'SHIPMENT',
          referenceId: orderId,
          metadata: {
            orderId,
            shippedAt: new Date()
          }
        }
      });
    });
  }

  /**
   * Process return (add back to inventory)
   */
  static async processReturn(
    productId: string,
    quantity: number,
    orderId: string,
    condition: 'NEW' | 'USED' | 'DAMAGED',
    notes?: string
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const product = await tx.salesProduct.findUnique({
        where: { productId }
      });

      if (!product) {
        throw new Error('Product not found');
      }

      const inventory = product.inventory as any;
      
      // Only add back to inventory if not damaged
      if (condition !== 'DAMAGED') {
        await tx.salesProduct.update({
          where: { productId },
          data: {
            inventory: {
              ...inventory,
              quantity: (inventory.quantity || 0) + quantity,
              returned: (inventory.returned || 0) + quantity
            }
          }
        });
      } else {
        // Track damaged items separately
        await tx.salesProduct.update({
          where: { productId },
          data: {
            inventory: {
              ...inventory,
              damaged: (inventory.damaged || 0) + quantity
            }
          }
        });
      }

      // Record movement
      await tx.inventoryMovement.create({
        data: {
          productId,
          movementType: condition === 'DAMAGED' ? InventoryMovementType.DAMAGE : InventoryMovementType.RETURN,
          quantity: condition === 'DAMAGED' ? 0 : quantity,
          referenceType: 'RETURN',
          referenceId: orderId,
          metadata: {
            orderId,
            condition,
            notes,
            returnedAt: new Date()
          }
        }
      });

      // Clear cache
      await CacheService.delete(`${CacheKeys.INVENTORY}${productId}*`);
    });
  }

  /**
   * Adjust inventory manually
   */
  static async adjustInventory(
    productId: string,
    adjustment: number,
    reason: string,
    userId: string
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const product = await tx.salesProduct.findUnique({
        where: { productId }
      });

      if (!product) {
        throw new Error('Product not found');
      }

      const inventory = product.inventory as any;
      const newQuantity = Math.max(0, (inventory.quantity || 0) + adjustment);
      
      // Update inventory
      await tx.salesProduct.update({
        where: { productId },
        data: {
          inventory: {
            ...inventory,
            quantity: newQuantity
          }
        }
      });

      // Record movement
      await tx.inventoryMovement.create({
        data: {
          productId,
          movementType: InventoryMovementType.ADJUSTMENT,
          quantity: adjustment,
          referenceType: 'MANUAL',
          referenceId: userId,
          metadata: {
            reason,
            adjustedBy: userId,
            previousQuantity: inventory.quantity || 0,
            newQuantity
          }
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'INVENTORY_ADJUSTMENT',
          entityType: 'PRODUCT',
          entityId: productId,
          changes: {
            adjustment,
            reason,
            previousQuantity: inventory.quantity || 0,
            newQuantity
          }
        }
      });

      // Clear cache
      await CacheService.delete(`${CacheKeys.INVENTORY}${productId}*`);

      // Check stock levels
      await this.checkLowStock(productId, newQuantity);
    });
  }

  /**
   * Get inventory history
   */
  static async getInventoryHistory(
    productId: string,
    options: {
      page?: number;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      movementType?: InventoryMovementType;
    } = {}
  ) {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      movementType
    } = options;

    const where: any = { productId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    if (movementType) {
      where.movementType = movementType;
    }

    const [movements, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              name: true,
              sku: true
            }
          }
        }
      }),
      prisma.inventoryMovement.count({ where })
    ]);

    return {
      movements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get low stock products
   */
  static async getLowStockProducts(
    threshold: number = this.LOW_STOCK_THRESHOLD,
    supplierId?: string
  ) {
    const where: any = {
      status: 'ACTIVE',
      availabilityType: { in: ['SALE', 'BOTH'] }
    };

    if (supplierId) {
      where.supplierId = supplierId;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        salesDetails: true,
        supplier: {
          select: {
            id: true,
            companyName: true
          }
        }
      }
    });

    const lowStockProducts = products.filter(product => {
      if (!product.salesDetails) return false;
      const inventory = product.salesDetails.inventory as any;
      const available = (inventory?.quantity || 0) - (inventory?.reserved || 0);
      return available <= threshold;
    }).map(product => {
      const inventory = product.salesDetails!.inventory as any;
      const available = (inventory?.quantity || 0) - (inventory?.reserved || 0);
      
      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        supplier: product.supplier,
        available,
        reserved: inventory?.reserved || 0,
        threshold,
        status: available === 0 ? InventoryStatus.OUT_OF_STOCK : InventoryStatus.LOW_STOCK
      };
    });

    return lowStockProducts;
  }

  /**
   * Check and alert for low stock
   */
  private static async checkLowStock(productId: string, currentQuantity: number): Promise<void> {
    if (currentQuantity <= this.LOW_STOCK_THRESHOLD) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          supplier: true
        }
      });

      if (product) {
        // Create notification
        await prisma.notification.create({
          data: {
            userId: product.supplier?.userId || '',
            type: 'LOW_STOCK_ALERT',
            title: 'Low Stock Alert',
            message: `Product ${product.name} (SKU: ${product.sku}) is low on stock. Current quantity: ${currentQuantity}`,
            data: {
              productId,
              sku: product.sku,
              currentQuantity,
              threshold: this.LOW_STOCK_THRESHOLD
            }
          }
        });

        // Send email alert (async, don't wait)
        if (product.supplier?.user?.email) {
          // EmailService.sendLowStockAlert(product.supplier.user.email, product, currentQuantity);
        }
      }
    }
  }

  /**
   * Clean up expired reservations
   */
  static async cleanupExpiredReservations(): Promise<number> {
    const expired = await prisma.inventoryReservation.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          lt: new Date()
        }
      }
    });

    let cleaned = 0;
    for (const reservation of expired) {
      try {
        await this.releaseReservation(reservation.productId, reservation.orderId);
        cleaned++;
      } catch (error) {
        console.error(`Failed to release reservation ${reservation.id}:`, error);
      }
    }

    return cleaned;
  }

  /**
   * Get inventory summary
   */
  static async getInventorySummary(supplierId?: string) {
    const where: any = {
      status: 'ACTIVE',
      availabilityType: { in: ['SALE', 'BOTH'] }
    };

    if (supplierId) {
      where.supplierId = supplierId;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        salesDetails: true
      }
    });

    let totalProducts = 0;
    let totalValue = 0;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalReserved = 0;

    products.forEach(product => {
      if (!product.salesDetails) return;
      
      const inventory = product.salesDetails.inventory as any;
      const available = (inventory?.quantity || 0) - (inventory?.reserved || 0);
      const price = product.salesDetails.basePrice;
      
      totalProducts++;
      totalValue += available * price;
      totalReserved += inventory?.reserved || 0;
      
      if (available === 0) {
        outOfStock++;
      } else if (available <= this.LOW_STOCK_THRESHOLD) {
        lowStock++;
      } else {
        inStock++;
      }
    });

    return {
      totalProducts,
      totalValue,
      inStock,
      lowStock,
      outOfStock,
      totalReserved,
      stockHealth: {
        percentage: totalProducts > 0 ? (inStock / totalProducts) * 100 : 0,
        status: outOfStock > totalProducts * 0.2 ? 'CRITICAL' : 
                lowStock > totalProducts * 0.3 ? 'WARNING' : 'HEALTHY'
      }
    };
  }
}

export default InventoryService;