import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { 
  OrderStatus, 
  PaymentStatus, 
  PaymentMethod,
  ShippingStatus 
} from '@prisma/client';

// Order creation validation schema
const createOrderSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    postalCode: z.string(),
    phone: z.string(),
    recipientName: z.string().optional(),
  }),
  billingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    postalCode: z.string(),
  }).optional(),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
});

// GET /api/orders - Get user's orders
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId };
    if (status) {
      where.status = status as OrderStatus;
    }

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  nameAr: true,
                  sku: true,
                  images: true,
                },
              },
            },
          },
          shipping: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create order from cart
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
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
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Calculate order totals
    let subtotal = 0;
    const orderItems = cart.items.map(item => {
      const price = item.product.salesDetails?.discountedPrice || 
                   item.product.salesDetails?.basePrice || 0;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: price,
        discount: item.product.salesDetails?.discountedPrice ? 
                 (item.product.salesDetails.basePrice - item.product.salesDetails.discountedPrice) : 0,
        tax: itemTotal * 0.15, // 15% VAT
        total: itemTotal * 1.15,
        metadata: {
          productName: item.product.name,
          sku: item.product.sku,
          supplierId: item.product.supplierId,
        },
      };
    });

    // Calculate tax and shipping
    const tax = subtotal * 0.15;
    const shipping = subtotal > 500 ? 0 : 50;
    const total = subtotal + tax + shipping;

    // Apply coupon if provided
    let discount = 0;
    if (validatedData.couponCode) {
      // TODO: Implement coupon validation
      // For now, apply a fixed 10% discount for demo
      if (validatedData.couponCode === 'DEMO10') {
        discount = total * 0.1;
      }
    }

    const finalTotal = total - discount;

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Generate order number
      const orderCount = await tx.order.count();
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(6, '0')}`;

      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: validatedData.paymentMethod,
          subtotal,
          tax,
          shipping,
          discount,
          total: finalTotal,
          shippingAddress: validatedData.shippingAddress,
          billingAddress: validatedData.billingAddress || validatedData.shippingAddress,
          notes: validatedData.notes,
          metadata: {
            couponCode: validatedData.couponCode,
            source: 'web',
            userAgent: request.headers.get('user-agent'),
          },
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
        },
      });

      // Create shipping record
      await tx.shipping.create({
        data: {
          orderId: newOrder.id,
          trackingNumber: `TRK-${newOrder.orderNumber}`,
          carrier: 'TBD',
          status: ShippingStatus.PENDING,
          estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          shippingAddress: validatedData.shippingAddress,
        },
      });

      // Update inventory for each product
      for (const item of cart.items) {
        if (item.product.salesDetails?.inventory) {
          const currentInventory = item.product.salesDetails.inventory as any;
          if (currentInventory.quantity !== undefined) {
            await tx.salesDetails.update({
              where: { id: item.product.salesDetails.id },
              data: {
                inventory: {
                  ...currentInventory,
                  quantity: Math.max(0, currentInventory.quantity - item.quantity),
                  lastUpdated: new Date().toISOString(),
                },
              },
            });
          }
        }

        // Create inventory log
        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            type: 'SALE',
            quantity: -item.quantity,
            reason: `Order ${newOrder.orderNumber}`,
            performedBy: userId,
            metadata: {
              orderId: newOrder.id,
              orderNumber: newOrder.orderNumber,
            },
          },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    // Send order confirmation email (async, don't wait)
    sendOrderConfirmationEmail(order, userId).catch(console.error);

    // Process payment if not COD
    if (validatedData.paymentMethod !== PaymentMethod.CASH_ON_DELIVERY) {
      // Initiate payment processing (async)
      initiatePayment(order).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
        items: order.items,
        createdAt: order.createdAt,
      },
      message: 'Order created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid order data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Order creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// GET /api/orders/[id] - Get specific order
export async function getOrder(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shipping: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if user owns this order or is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true },
    });

    if (order.userId !== userId && user?.userType !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// Helper function to send order confirmation email
async function sendOrderConfirmationEmail(order: any, userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true },
    });

    if (!user) return;

    // TODO: Implement actual email sending
    console.log('Sending order confirmation email to:', user.email);
    console.log('Order:', order.orderNumber);
  } catch (error) {
    console.error('Email send error:', error);
  }
}

// Helper function to initiate payment
async function initiatePayment(order: any) {
  try {
    // TODO: Implement actual payment processing
    console.log('Initiating payment for order:', order.orderNumber);
    console.log('Payment method:', order.paymentMethod);
    console.log('Amount:', order.total);
  } catch (error) {
    console.error('Payment initiation error:', error);
  }
}