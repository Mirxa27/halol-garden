import prisma from '@/lib/prisma';
import { 
  OrderStatus, 
  PaymentStatus, 
  ShippingStatus,
  Prisma,
  Order,
  User
} from '@prisma/client';
import { AppError, ValidationError, ConflictError } from '@/lib/error-handler';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { processPayment } from '@/lib/payment';
import { validateCoupon } from '@/lib/coupon';
import { z } from 'zod';

export class OrderService {
  /**
   * Create order with comprehensive business logic
   */
  static async createOrder(userId: string, orderData: any) {
    // Start transaction
    return await prisma.$transaction(async (tx) => {
      // 1. Validate user and get profile
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: {
          cart: {
            include: {
              items: {
                include: {
                  product: {
                    include: {
                      salesDetails: true,
                      supplier: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new ValidationError('User not found');
      }

      if (!user.cart || user.cart.items.length === 0) {
        throw new ValidationError('Cart is empty');
      }

      // 2. Validate product availability and pricing
      const orderItems = [];
      let subtotal = 0;

      for (const cartItem of user.cart.items) {
        const product = cartItem.product;
        
        // Check stock
        if (product.quantity < cartItem.quantity) {
          throw new ConflictError(
            `Insufficient stock for ${product.name}. Available: ${product.quantity}`
          );
        }

        // Check if product is active
        if (product.status !== 'ACTIVE' || !product.isPublished) {
          throw new ConflictError(`Product ${product.name} is not available`);
        }

        // Calculate price
        const price = product.salesDetails?.discountedPrice || 
                     product.salesDetails?.basePrice || 
                     product.price;
        
        const itemTotal = price * cartItem.quantity;
        subtotal += itemTotal;

        orderItems.push({
          productId: product.id,
          quantity: cartItem.quantity,
          price: price,
          discount: product.salesDetails?.discountedPrice 
            ? (product.salesDetails.basePrice - product.salesDetails.discountedPrice) * cartItem.quantity 
            : 0,
          tax: itemTotal * 0.15, // 15% VAT
          total: itemTotal * 1.15,
          metadata: {
            productName: product.name,
            productNameAr: product.nameAr,
            sku: product.sku,
            supplierId: product.supplierId,
            supplierName: product.supplier.companyName,
          },
        });

        // Reserve inventory
        await tx.product.update({
          where: { id: product.id },
          data: {
            quantity: {
              decrement: cartItem.quantity,
            },
          },
        });

        // Create inventory log
        await tx.inventoryLog.create({
          data: {
            productId: product.id,
            type: 'OUT',
            quantity: -cartItem.quantity,
            balance: product.quantity - cartItem.quantity,
            reference: `ORDER-PENDING`,
            reason: 'Order placement',
            performedBy: userId,
          },
        });
      }

      // 3. Calculate totals
      const tax = subtotal * 0.15;
      const shipping = this.calculateShipping(subtotal, orderData.shippingAddress);
      let discount = 0;

      // 4. Apply coupon if provided
      if (orderData.couponCode) {
        const couponValidation = await validateCoupon(
          orderData.couponCode,
          userId,
          subtotal
        );
        
        if (!couponValidation.isValid) {
          throw new ValidationError(couponValidation.message || 'Invalid coupon');
        }
        
        discount = couponValidation.discount;
      }

      const total = subtotal + tax + shipping - discount;

      // 5. Create order
      const order = await tx.order.create({
        data: {
          userId,
          orderNumber: this.generateOrderNumber(),
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: orderData.paymentMethod,
          subtotal,
          tax,
          shipping,
          discount,
          total,
          currency: orderData.currency || 'USD',
          shippingAddress: orderData.shippingAddress,
          billingAddress: orderData.billingAddress || orderData.shippingAddress,
          notes: orderData.notes,
          metadata: {
            couponCode: orderData.couponCode,
            deviceType: orderData.deviceType,
            ipAddress: orderData.ipAddress,
          },
          items: {
            create: orderItems,
          },
          shipping: {
            create: {
              address: orderData.shippingAddress,
              shippingCost: shipping,
              estimatedDelivery: this.calculateEstimatedDelivery(orderData.shippingAddress),
            },
          },
        },
        include: {
          items: true,
          shipping: true,
        },
      });

      // 6. Update inventory logs with order reference
      await tx.inventoryLog.updateMany({
        where: {
          reference: 'ORDER-PENDING',
          performedBy: userId,
        },
        data: {
          reference: order.orderNumber,
        },
      });

      // 7. Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: user.cart.id },
      });

      // 8. Create initial audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          entity: 'Order',
          entityId: order.id,
          newData: order,
          ipAddress: orderData.ipAddress,
          userAgent: orderData.userAgent,
        },
      });

      return order;
    });
  }

  /**
   * Process payment for order
   */
  static async processOrderPayment(orderId: string, paymentData?: any) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new ValidationError('Order not found');
    }

    if (order.paymentStatus === PaymentStatus.COMPLETED) {
      throw new ConflictError('Payment already processed');
    }

    // Process payment
    const paymentResult = await processPayment(order, order.paymentMethod);

    if (!paymentResult.success) {
      // Revert order status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.FAILED,
          cancelledAt: new Date(),
        },
      });

      // Restore inventory
      await this.restoreInventory(order);

      throw new AppError(
        paymentResult.error || 'Payment processing failed',
        400,
        true,
        'PAYMENT_FAILED'
      );
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PROCESSING,
        confirmedAt: new Date(),
      },
    });

    // Send confirmation email
    await sendOrderConfirmationEmail(updatedOrder, order.user);

    // Create notification
    await this.createOrderNotification(order.userId, order, 'confirmed');

    return {
      order: updatedOrder,
      payment: paymentResult,
    };
  }

  /**
   * Cancel order with proper cleanup
   */
  static async cancelOrder(orderId: string, userId: string, reason: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!order) {
      throw new ValidationError('Order not found');
    }

    if (order.userId !== userId && !(await this.isAdmin(userId))) {
      throw new ValidationError('Unauthorized to cancel this order');
    }

    if (!['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status)) {
      throw new ConflictError('Order cannot be cancelled in current status');
    }

    // Start transaction
    return await prisma.$transaction(async (tx) => {
      // 1. Update order status
      const cancelledOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          metadata: {
            ...order.metadata,
            cancellationReason: reason,
            cancelledBy: userId,
          },
        },
      });

      // 2. Restore inventory
      await this.restoreInventory(order);

      // 3. Process refund if payment was made
      if (order.paymentStatus === PaymentStatus.COMPLETED) {
        await tx.refund.create({
          data: {
            orderId,
            amount: order.total,
            reason,
            status: 'PENDING',
          },
        });
      }

      // 4. Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE',
          entity: 'Order',
          entityId: orderId,
          oldData: order,
          newData: cancelledOrder,
        },
      });

      // 5. Send notification
      await this.createOrderNotification(order.userId, cancelledOrder, 'cancelled');

      return cancelledOrder;
    });
  }

  /**
   * Update order shipping status
   */
  static async updateShippingStatus(
    orderId: string,
    status: ShippingStatus,
    trackingData?: any
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shipping: true,
        user: true,
      },
    });

    if (!order) {
      throw new ValidationError('Order not found');
    }

    if (!order.shipping) {
      throw new ValidationError('No shipping information found');
    }

    const updatedShipping = await prisma.shipping.update({
      where: { id: order.shipping.id },
      data: {
        status,
        trackingNumber: trackingData?.trackingNumber,
        carrier: trackingData?.carrier,
        actualDelivery: status === ShippingStatus.DELIVERED ? new Date() : undefined,
      },
    });

    // Update order status based on shipping
    if (status === ShippingStatus.SHIPPED) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.SHIPPED,
          shippedAt: new Date(),
        },
      });
    } else if (status === ShippingStatus.DELIVERED) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      });
    }

    // Send notification
    await this.createOrderNotification(order.userId, order, 'shipping_update', {
      shippingStatus: status,
      trackingNumber: trackingData?.trackingNumber,
    });

    return updatedShipping;
  }

  // Helper methods

  private static generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  private static calculateShipping(subtotal: number, address: any): number {
    // Free shipping for orders over $500
    if (subtotal >= 500) return 0;

    // Zone-based shipping
    const zones: Record<string, number> = {
      'Saudi Arabia': 25,
      'UAE': 30,
      'Kuwait': 35,
      'Qatar': 35,
      'Bahrain': 35,
      'Oman': 40,
      'Egypt': 45,
      'Jordan': 45,
      'Lebanon': 50,
    };

    return zones[address.country] || 60; // Default international shipping
  }

  private static calculateEstimatedDelivery(address: any): Date {
    const deliveryDays: Record<string, number> = {
      'Saudi Arabia': 3,
      'UAE': 4,
      'Kuwait': 5,
      'Qatar': 5,
      'Bahrain': 5,
      'Oman': 6,
      'Egypt': 7,
      'Jordan': 7,
      'Lebanon': 8,
    };

    const days = deliveryDays[address.country] || 14;
    const delivery = new Date();
    delivery.setDate(delivery.getDate() + days);
    
    // Skip weekends
    if (delivery.getDay() === 0) delivery.setDate(delivery.getDate() + 1);
    if (delivery.getDay() === 6) delivery.setDate(delivery.getDate() + 2);
    
    return delivery;
  }

  private static async restoreInventory(order: any) {
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          quantity: {
            increment: item.quantity,
          },
        },
      });

      await prisma.inventoryLog.create({
        data: {
          productId: item.productId,
          type: 'IN',
          quantity: item.quantity,
          reference: order.orderNumber,
          reason: 'Order cancellation',
        },
      });
    }
  }

  private static async createOrderNotification(
    userId: string,
    order: any,
    type: string,
    additionalData?: any
  ) {
    const messages: Record<string, { title: string; message: string }> = {
      confirmed: {
        title: 'Order Confirmed',
        message: `Your order ${order.orderNumber} has been confirmed and is being processed.`,
      },
      cancelled: {
        title: 'Order Cancelled',
        message: `Your order ${order.orderNumber} has been cancelled.`,
      },
      shipping_update: {
        title: 'Shipping Update',
        message: `Your order ${order.orderNumber} shipping status has been updated.`,
      },
    };

    const notification = messages[type] || {
      title: 'Order Update',
      message: `Your order ${order.orderNumber} has been updated.`,
    };

    await prisma.notification.create({
      data: {
        userId,
        type: 'ORDER',
        title: notification.title,
        message: notification.message,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          ...additionalData,
        },
      },
    });
  }

  private static async isAdmin(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true },
    });
    return user?.userType === 'ADMIN';
  }
}