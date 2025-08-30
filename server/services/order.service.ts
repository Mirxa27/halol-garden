import { prisma } from '../config/database';
import { CacheService, CacheKeys, CacheTTL } from '../config/redis';
import { sendEmail } from './email.service';
import { PaymentService } from './payment.service';
import { InventoryService } from './inventory.service';
import { NotificationService } from './notification.service';
import { z } from 'zod';

// Order types
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

export enum ShippingMethod {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  OVERNIGHT = 'OVERNIGHT',
  PICKUP = 'PICKUP',
  WHITE_GLOVE = 'WHITE_GLOVE'
}

// Validation schemas
const CreateOrderSchema = z.object({
  userId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
    discount: z.number().min(0).max(100).optional(),
    metadata: z.record(z.any()).optional()
  })).min(1),
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    country: z.string().min(1),
    postalCode: z.string().min(1),
    phone: z.string().min(1)
  }),
  billingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    country: z.string().min(1),
    postalCode: z.string().min(1)
  }).optional(),
  shippingMethod: z.nativeEnum(ShippingMethod),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'STRIPE', 'MYFATOORAH', 'BANK_TRANSFER', 'CASH_ON_DELIVERY']),
  paymentDetails: z.record(z.any()).optional(),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export class OrderService {
  /**
   * Create a new order
   */
  static async createOrder(data: z.infer<typeof CreateOrderSchema>) {
    const validatedData = CreateOrderSchema.parse(data);
    
    return await prisma.$transaction(async (tx) => {
      // Verify user exists and is active
      const user = await tx.user.findUnique({
        where: { id: validatedData.userId },
        include: {
          healthcareProfile: true,
          supplierProfile: true,
          individualProfile: true
        }
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new Error('User not found or inactive');
      }

      // Verify all products exist and have sufficient inventory
      const productIds = validatedData.items.map(item => item.productId);
      const products = await tx.product.findMany({
        where: { 
          id: { in: productIds },
          status: 'ACTIVE'
        },
        include: {
          salesDetails: true,
          supplier: true
        }
      });

      if (products.length !== productIds.length) {
        throw new Error('One or more products not found or inactive');
      }

      // Check inventory for each item
      for (const item of validatedData.items) {
        const product = products.find(p => p.id === item.productId);
        if (!product) continue;

        const available = await InventoryService.checkAvailability(
          item.productId,
          item.quantity
        );

        if (!available) {
          throw new Error(`Insufficient inventory for product: ${product.name}`);
        }
      }

      // Calculate order totals
      let subtotal = 0;
      let totalDiscount = 0;
      let totalTax = 0;
      
      const orderItems = validatedData.items.map(item => {
        const product = products.find(p => p.id === item.productId)!;
        const basePrice = product.salesDetails?.basePrice || item.price;
        const discountAmount = item.discount ? (basePrice * item.discount / 100) : 0;
        const itemTotal = (basePrice - discountAmount) * item.quantity;
        const taxAmount = product.salesDetails?.taxRate 
          ? itemTotal * (product.salesDetails.taxRate / 100)
          : 0;

        subtotal += itemTotal;
        totalDiscount += discountAmount * item.quantity;
        totalTax += taxAmount;

        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: basePrice,
          discount: discountAmount,
          tax: taxAmount,
          total: itemTotal + taxAmount,
          metadata: {
            productName: product.name,
            sku: product.sku,
            supplier: product.supplier?.companyName,
            ...item.metadata
          }
        };
      });

      // Apply coupon if provided
      let couponDiscount = 0;
      if (validatedData.couponCode) {
        const coupon = await tx.coupon.findFirst({
          where: {
            code: validatedData.couponCode,
            isActive: true,
            validFrom: { lte: new Date() },
            validUntil: { gte: new Date() }
          }
        });

        if (coupon) {
          if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            throw new Error('Coupon usage limit exceeded');
          }

          if (coupon.minimumPurchase && subtotal < coupon.minimumPurchase) {
            throw new Error(`Minimum purchase of ${coupon.minimumPurchase} required for this coupon`);
          }

          if (coupon.discountType === 'PERCENTAGE') {
            couponDiscount = subtotal * (coupon.discountValue / 100);
            if (coupon.maxDiscount) {
              couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
            }
          } else {
            couponDiscount = Math.min(coupon.discountValue, subtotal);
          }

          // Update coupon usage
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { 
              usageCount: { increment: 1 }
            }
          });

          // Record coupon usage
          await tx.couponUsage.create({
            data: {
              couponId: coupon.id,
              userId: validatedData.userId,
              orderId: '', // Will be updated after order creation
              discountAmount: couponDiscount
            }
          });
        }
      }

      // Calculate shipping cost
      const shippingCost = this.calculateShippingCost(
        validatedData.shippingMethod,
        validatedData.shippingAddress,
        orderItems
      );

      // Calculate final total
      const total = subtotal - couponDiscount + totalTax + shippingCost;

      // Generate order number
      const orderNumber = this.generateOrderNumber();

      // Create the order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: validatedData.userId,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          subtotal,
          discount: totalDiscount + couponDiscount,
          tax: totalTax,
          shippingCost,
          total,
          currency: 'USD',
          shippingAddress: validatedData.shippingAddress,
          billingAddress: validatedData.billingAddress || validatedData.shippingAddress,
          shippingMethod: validatedData.shippingMethod,
          estimatedDelivery: this.calculateEstimatedDelivery(validatedData.shippingMethod),
          notes: validatedData.notes,
          metadata: {
            ...validatedData.metadata,
            couponCode: validatedData.couponCode,
            couponDiscount
          }
        }
      });

      // Create order items
      await tx.orderItem.createMany({
        data: orderItems.map(item => ({
          orderId: order.id,
          ...item
        }))
      });

      // Update coupon usage with order ID
      if (validatedData.couponCode && couponDiscount > 0) {
        await tx.couponUsage.updateMany({
          where: {
            userId: validatedData.userId,
            orderId: ''
          },
          data: {
            orderId: order.id
          }
        });
      }

      // Reserve inventory
      for (const item of orderItems) {
        await InventoryService.reserveInventory(
          item.productId,
          item.quantity,
          order.id
        );
      }

      // Process payment
      let paymentResult;
      try {
        paymentResult = await PaymentService.processPayment({
          orderId: order.id,
          amount: total,
          currency: 'USD',
          method: validatedData.paymentMethod,
          details: validatedData.paymentDetails,
          userId: validatedData.userId
        });

        // Update order with payment information
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: paymentResult.status === 'success' 
              ? PaymentStatus.COMPLETED 
              : PaymentStatus.PENDING,
            paymentMethod: validatedData.paymentMethod,
            paymentDetails: paymentResult
          }
        });

        if (paymentResult.status === 'success') {
          // Confirm inventory reservation
          for (const item of orderItems) {
            await InventoryService.confirmReservation(
              item.productId,
              order.id
            );
          }

          // Update order status
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: OrderStatus.CONFIRMED,
              confirmedAt: new Date()
            }
          });
        }
      } catch (paymentError: any) {
        // Release inventory reservation on payment failure
        for (const item of orderItems) {
          await InventoryService.releaseReservation(
            item.productId,
            order.id
          );
        }

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.FAILED,
            paymentStatus: PaymentStatus.FAILED,
            metadata: {
              ...order.metadata,
              paymentError: paymentError.message
            }
          }
        });

        throw new Error(`Payment failed: ${paymentError.message}`);
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: validatedData.userId,
          action: 'ORDER_CREATED',
          entityType: 'ORDER',
          entityId: order.id,
          changes: {
            orderNumber,
            total,
            itemCount: orderItems.length,
            paymentMethod: validatedData.paymentMethod
          }
        }
      });

      // Send notifications
      await this.sendOrderNotifications(order, user, 'created');

      // Clear user's cart
      await tx.cart.deleteMany({
        where: { userId: validatedData.userId }
      });

      return order;
    });
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    userId?: string,
    notes?: string
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: true
      }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Validate status transition
    if (!this.isValidStatusTransition(order.status, status)) {
      throw new Error(`Invalid status transition from ${order.status} to ${status}`);
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order status
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          [`${status.toLowerCase()}At`]: new Date(),
          metadata: {
            ...order.metadata,
            statusHistory: [
              ...(order.metadata?.statusHistory || []),
              {
                from: order.status,
                to: status,
                timestamp: new Date(),
                userId,
                notes
              }
            ]
          }
        }
      });

      // Handle status-specific actions
      switch (status) {
        case OrderStatus.CANCELLED:
          // Release inventory
          for (const item of order.items) {
            await InventoryService.releaseReservation(
              item.productId,
              orderId
            );
          }
          
          // Process refund if payment was completed
          if (order.paymentStatus === PaymentStatus.COMPLETED) {
            await PaymentService.processRefund({
              orderId,
              amount: order.total,
              reason: notes || 'Order cancelled'
            });
          }
          break;

        case OrderStatus.SHIPPED:
          // Update inventory
          for (const item of order.items) {
            await InventoryService.shipOrder(
              item.productId,
              item.quantity,
              orderId
            );
          }
          break;

        case OrderStatus.DELIVERED:
          // Complete the order
          await tx.order.update({
            where: { id: orderId },
            data: {
              deliveredAt: new Date()
            }
          });
          
          // Update supplier metrics
          const supplierIds = [...new Set(order.items.map(item => item.metadata?.supplierId))];
          for (const supplierId of supplierIds) {
            if (supplierId) {
              await tx.equipmentSupplier.update({
                where: { id: supplierId },
                data: {
                  totalOrders: { increment: 1 },
                  totalRevenue: { 
                    increment: order.items
                      .filter(item => item.metadata?.supplierId === supplierId)
                      .reduce((sum, item) => sum + item.total, 0)
                  }
                }
              });
            }
          }
          break;
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: userId || 'system',
          action: 'ORDER_STATUS_UPDATED',
          entityType: 'ORDER',
          entityId: orderId,
          changes: {
            previousStatus: order.status,
            newStatus: status,
            notes
          }
        }
      });

      return updated;
    });

    // Send notifications
    await this.sendOrderNotifications(updatedOrder, order.user, 'status_updated');

    return updatedOrder;
  }

  /**
   * Get order by ID
   */
  static async getOrderById(orderId: string, userId?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                supplier: {
                  select: {
                    id: true,
                    companyName: true,
                    rating: true
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true
          }
        },
        tracking: true,
        reviews: true
      }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Check access permission
    if (userId && order.userId !== userId) {
      throw new Error('Access denied');
    }

    return order;
  }

  /**
   * Get user orders
   */
  static async getUserOrders(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: OrderStatus;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ) {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                  sku: true
                }
              }
            }
          },
          tracking: {
            orderBy: { timestamp: 'desc' },
            take: 1
          }
        }
      }),
      prisma.order.count({ where })
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * Track order
   */
  static async trackOrder(orderNumber: string, email?: string) {
    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        ...(email ? { user: { email } } : {})
      },
      include: {
        tracking: {
          orderBy: { timestamp: 'desc' }
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      estimatedDelivery: order.estimatedDelivery,
      tracking: order.tracking,
      items: order.items.map(item => ({
        productName: item.product.name,
        quantity: item.quantity,
        image: item.product.images[0]
      }))
    };
  }

  // Helper methods

  private static generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  private static calculateShippingCost(
    method: ShippingMethod,
    address: any,
    items: any[]
  ): number {
    // Base rates
    const rates = {
      [ShippingMethod.STANDARD]: 10,
      [ShippingMethod.EXPRESS]: 25,
      [ShippingMethod.OVERNIGHT]: 50,
      [ShippingMethod.PICKUP]: 0,
      [ShippingMethod.WHITE_GLOVE]: 100
    };

    let baseCost = rates[method];

    // Add weight-based cost
    const totalWeight = items.reduce((sum, item) => {
      return sum + (item.metadata?.weight || 1) * item.quantity;
    }, 0);

    if (totalWeight > 50) {
      baseCost += (totalWeight - 50) * 0.5;
    }

    // Add distance-based cost (simplified)
    // In production, integrate with shipping APIs
    if (address.country !== 'US') {
      baseCost *= 2;
    }

    return Math.round(baseCost * 100) / 100;
  }

  private static calculateEstimatedDelivery(method: ShippingMethod): Date {
    const days = {
      [ShippingMethod.STANDARD]: 5,
      [ShippingMethod.EXPRESS]: 2,
      [ShippingMethod.OVERNIGHT]: 1,
      [ShippingMethod.PICKUP]: 0,
      [ShippingMethod.WHITE_GLOVE]: 7
    };

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + days[method]);
    
    // Skip weekends
    if (deliveryDate.getDay() === 0) {
      deliveryDate.setDate(deliveryDate.getDate() + 1);
    } else if (deliveryDate.getDay() === 6) {
      deliveryDate.setDate(deliveryDate.getDate() + 2);
    }

    return deliveryDate;
  }

  private static isValidStatusTransition(from: string, to: string): boolean {
    const transitions: Record<string, string[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED, OrderStatus.FAILED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [OrderStatus.REFUNDED],
      [OrderStatus.REFUNDED]: [],
      [OrderStatus.FAILED]: []
    };

    return transitions[from]?.includes(to) || false;
  }

  private static async sendOrderNotifications(order: any, user: any, type: string) {
    // Send email notification
    const emailTemplates: Record<string, any> = {
      created: {
        subject: `Order Confirmation - ${order.orderNumber}`,
        template: 'order-confirmation'
      },
      status_updated: {
        subject: `Order ${order.orderNumber} - Status Updated`,
        template: 'order-status-update'
      }
    };

    const template = emailTemplates[type];
    if (template) {
      await sendEmail({
        to: user.email,
        subject: template.subject,
        template: template.template,
        data: {
          order,
          user
        }
      });
    }

    // Send in-app notification
    await NotificationService.create({
      userId: user.id,
      type: `ORDER_${type.toUpperCase()}`,
      title: template?.subject || 'Order Update',
      message: `Your order ${order.orderNumber} has been ${type.replace('_', ' ')}`,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status
      }
    });
  }
}

export default OrderService;