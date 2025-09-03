import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { 
  OrderStatus, 
  PaymentStatus, 
  PaymentMethod,
  ShippingStatus 
} from '@prisma/client';
import { getAuthenticatedUser, requireAuth } from '@/lib/auth/session';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { processStripePayment, createPaymentIntent } from '@/lib/payment/stripe';
import { createMyFatoorahPayment } from '@/lib/payment/myfatoorah';
import { CouponService } from '@/lib/coupon/service';

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
    const user = await requireAuth();
    
    if (!user) {
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
    const where: any = { userId: user.id };
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
          shippingInfo: true,
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
    const user = await requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
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
    let couponValid = false;
    let couponError = '';
    if (validatedData.couponCode) {
      const cartItemsForCoupon = cart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.salesDetails?.discountedPrice || item.product.salesDetails?.basePrice || 0,
        category: item.product.category,
      }));
      
      const couponResult = await CouponService.validateCoupon(
        validatedData.couponCode,
        total,
        user.id,
        cartItemsForCoupon
      );
      
      if (couponResult.valid) {
        discount = couponResult.discount;
        couponValid = true;
      } else {
        couponError = couponResult.error || 'Invalid coupon';
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
          userId: user.id,
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
          notes: validatedData.notes || null,
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
          address: validatedData.shippingAddress,
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
            performedBy: user.id,
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

    // Apply coupon if valid (mark as used)
    if (couponValid && validatedData.couponCode) {
      try {
        await CouponService.applyCoupon(validatedData.couponCode, user.id, order.id);
      } catch (error) {
        console.error('Error applying coupon:', error);
        // Don't fail the order creation if coupon application fails
      }
    }

    // Send order confirmation email (async, don't wait)
    sendOrderConfirmationEmailAsync(order, user).catch(console.error);

    // Process payment if not COD
    if (validatedData.paymentMethod !== PaymentMethod.CASH_ON_DELIVERY) {
      // Initiate payment processing (async)
      initiatePaymentAsync(order, validatedData.paymentMethod).catch(console.error);
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
    const user = await requireAuth();
    
    if (!user) {
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
        shippingInfo: true,
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
    if (order.userId !== user.id && !user.isAdmin) {
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
async function sendOrderConfirmationEmailAsync(order: any, user: any) {
  try {
    await sendOrderConfirmationEmail(user.email, {
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      totalAmount: order.total,
      status: order.status,
      items: order.items
    });
    console.log('Order confirmation email sent to:', user.email);
  } catch (error) {
    console.error('Email send error:', error);
  }
}

// Helper function to initiate payment
async function initiatePaymentAsync(order: any, paymentMethod: PaymentMethod) {
  try {
    let paymentResult;
    
    switch (paymentMethod) {
      case PaymentMethod.STRIPE:
        const paymentIntent = await createPaymentIntent(
          order.total,
          'usd',
          { orderId: order.id, orderNumber: order.orderNumber }
        );
        paymentResult = await processStripePayment(order.id, paymentIntent.id);
        break;
        
      case PaymentMethod.MYFATOORAH:
        paymentResult = await createMyFatoorahPayment({
          orderId: order.id,
          amount: order.total,
          customerEmail: order.user?.email || '',
          customerName: order.user?.name || '',
          description: `Order ${order.orderNumber}`
        });
        break;
        
      default:
        console.log('Payment method not implemented:', paymentMethod);
        return;
    }
    
    if (paymentResult?.success) {
      console.log('Payment initiated successfully for order:', order.orderNumber);
    } else {
      console.error('Payment initiation failed:', paymentResult?.error);
    }
  } catch (error) {
    console.error('Payment initiation error:', error);
  }
}

