import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OrderService } from '@/lib/services/order.service';
import prisma from '@/lib/prisma';
import { OrderStatus, PaymentStatus, UserType } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    $transaction: vi.fn(),
    user: {
      findUnique: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    product: {
      update: vi.fn(),
    },
    inventoryLog: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    cartItem: {
      deleteMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    refund: {
      create: vi.fn(),
    },
    shipping: {
      update: vi.fn(),
    },
  },
}));

// Mock email service
vi.mock('@/lib/email', () => ({
  sendOrderConfirmationEmail: vi.fn(),
}));

// Mock payment service
vi.mock('@/lib/payment', () => ({
  processPayment: vi.fn(),
}));

// Mock coupon service
vi.mock('@/lib/coupon', () => ({
  validateCoupon: vi.fn(),
}));

describe('OrderService', () => {
  const mockUserId = 'user-123';
  const mockOrderId = 'order-123';
  
  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    userType: UserType.INDIVIDUAL_CUSTOMER,
    cart: {
      id: 'cart-123',
      items: [
        {
          id: 'item-1',
          quantity: 2,
          product: {
            id: 'product-1',
            name: 'Medical Device',
            nameAr: 'جهاز طبي',
            price: 100,
            quantity: 10,
            status: 'ACTIVE',
            isPublished: true,
            sku: 'MD-001',
            supplierId: 'supplier-1',
            supplier: {
              companyName: 'Medical Supplies Co',
            },
            salesDetails: {
              basePrice: 100,
              discountedPrice: 90,
            },
          },
        },
      ],
    },
  };

  const mockOrderData = {
    paymentMethod: 'CREDIT_CARD',
    shippingAddress: {
      street: '123 Main St',
      city: 'Riyadh',
      state: 'Riyadh',
      country: 'Saudi Arabia',
      postalCode: '12345',
    },
    currency: 'USD',
    deviceType: 'desktop',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-ABC123',
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        total: 207,
        items: [],
        shipping: {},
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          user: { findUnique: vi.fn().mockResolvedValue(mockUser) },
          product: { update: vi.fn() },
          inventoryLog: { create: vi.fn(), updateMany: vi.fn() },
          order: { create: vi.fn().mockResolvedValue(mockOrder) },
          cartItem: { deleteMany: vi.fn() },
          auditLog: { create: vi.fn() },
        };
        return callback(tx);
      });

      const result = await OrderService.createOrder(mockUserId, mockOrderData);

      expect(result).toEqual(mockOrder);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw error if cart is empty', async () => {
      const emptyCartUser = {
        ...mockUser,
        cart: { id: 'cart-123', items: [] },
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          user: { findUnique: vi.fn().mockResolvedValue(emptyCartUser) },
        };
        return callback(tx);
      });

      await expect(
        OrderService.createOrder(mockUserId, mockOrderData)
      ).rejects.toThrow('Cart is empty');
    });

    it('should throw error if product is out of stock', async () => {
      const outOfStockUser = {
        ...mockUser,
        cart: {
          ...mockUser.cart,
          items: [
            {
              ...mockUser.cart.items[0],
              quantity: 20, // More than available
            },
          ],
        },
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          user: { findUnique: vi.fn().mockResolvedValue(outOfStockUser) },
        };
        return callback(tx);
      });

      await expect(
        OrderService.createOrder(mockUserId, mockOrderData)
      ).rejects.toThrow('Insufficient stock');
    });

    it('should apply coupon discount', async () => {
      const { validateCoupon } = await import('@/lib/coupon');
      validateCoupon.mockResolvedValue({
        isValid: true,
        discount: 20,
      });

      const orderDataWithCoupon = {
        ...mockOrderData,
        couponCode: 'SAVE20',
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          user: { findUnique: vi.fn().mockResolvedValue(mockUser) },
          product: { update: vi.fn() },
          inventoryLog: { create: vi.fn(), updateMany: vi.fn() },
          order: {
            create: vi.fn().mockImplementation((data) => ({
              ...data.data,
              id: mockOrderId,
              orderNumber: 'ORD-ABC123',
            })),
          },
          cartItem: { deleteMany: vi.fn() },
          auditLog: { create: vi.fn() },
        };
        return callback(tx);
      });

      await OrderService.createOrder(mockUserId, orderDataWithCoupon);

      expect(validateCoupon).toHaveBeenCalledWith(
        'SAVE20',
        mockUserId,
        expect.any(Number)
      );
    });
  });

  describe('processOrderPayment', () => {
    const mockOrder = {
      id: mockOrderId,
      userId: mockUserId,
      orderNumber: 'ORD-ABC123',
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: 'CREDIT_CARD',
      total: 207,
      user: mockUser,
      items: mockUser.cart.items,
    };

    it('should process payment successfully', async () => {
      const { processPayment } = await import('@/lib/payment');
      const { sendOrderConfirmationEmail } = await import('@/lib/email');

      processPayment.mockResolvedValue({
        success: true,
        transactionId: 'txn-123',
        clientSecret: 'secret-123',
      });

      prisma.order.findUnique.mockResolvedValue(mockOrder);
      prisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PROCESSING,
      });

      const result = await OrderService.processOrderPayment(mockOrderId);

      expect(result.order.status).toBe(OrderStatus.CONFIRMED);
      expect(result.payment.success).toBe(true);
      expect(sendOrderConfirmationEmail).toHaveBeenCalled();
    });

    it('should handle payment failure', async () => {
      const { processPayment } = await import('@/lib/payment');
      
      processPayment.mockResolvedValue({
        success: false,
        error: 'Insufficient funds',
      });

      prisma.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        OrderService.processOrderPayment(mockOrderId)
      ).rejects.toThrow('Payment processing failed');

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: mockOrderId },
        data: expect.objectContaining({
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.FAILED,
        }),
      });
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order successfully', async () => {
      const mockOrder = {
        id: mockOrderId,
        userId: mockUserId,
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PENDING,
        metadata: {},
        items: [],
      };

      prisma.order.findUnique.mockResolvedValue(mockOrder);
      
      prisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          order: {
            update: vi.fn().mockResolvedValue({
              ...mockOrder,
              status: OrderStatus.CANCELLED,
              cancelledAt: new Date(),
            }),
          },
          product: { update: vi.fn() },
          inventoryLog: { create: vi.fn() },
          auditLog: { create: vi.fn() },
          notification: { create: vi.fn() },
        };
        return callback(tx);
      });

      const result = await OrderService.cancelOrder(
        mockOrderId,
        mockUserId,
        'Customer request'
      );

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(result.cancelledAt).toBeDefined();
    });

    it('should create refund for paid orders', async () => {
      const paidOrder = {
        id: mockOrderId,
        userId: mockUserId,
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.COMPLETED,
        total: 207,
        metadata: {},
        items: [],
      };

      prisma.order.findUnique.mockResolvedValue(paidOrder);
      
      prisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          order: {
            update: vi.fn().mockResolvedValue({
              ...paidOrder,
              status: OrderStatus.CANCELLED,
            }),
          },
          product: { update: vi.fn() },
          inventoryLog: { create: vi.fn() },
          refund: { create: vi.fn() },
          auditLog: { create: vi.fn() },
          notification: { create: vi.fn() },
        };
        return callback(tx);
      });

      await OrderService.cancelOrder(mockOrderId, mockUserId, 'Customer request');

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw error if order cannot be cancelled', async () => {
      const deliveredOrder = {
        id: mockOrderId,
        userId: mockUserId,
        status: OrderStatus.DELIVERED,
        items: [],
      };

      prisma.order.findUnique.mockResolvedValue(deliveredOrder);

      await expect(
        OrderService.cancelOrder(mockOrderId, mockUserId, 'Too late')
      ).rejects.toThrow('Order cannot be cancelled in current status');
    });
  });

  describe('updateShippingStatus', () => {
    it('should update shipping status', async () => {
      const mockOrder = {
        id: mockOrderId,
        userId: mockUserId,
        shipping: {
          id: 'shipping-123',
          status: 'PENDING',
        },
        user: mockUser,
      };

      prisma.order.findUnique.mockResolvedValue(mockOrder);
      prisma.shipping.update.mockResolvedValue({
        ...mockOrder.shipping,
        status: 'SHIPPED',
        trackingNumber: 'TRACK123',
      });

      const result = await OrderService.updateShippingStatus(
        mockOrderId,
        'SHIPPED',
        { trackingNumber: 'TRACK123', carrier: 'DHL' }
      );

      expect(result.status).toBe('SHIPPED');
      expect(result.trackingNumber).toBe('TRACK123');
    });
  });
});