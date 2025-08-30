import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// Cart item validation schema
const cartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1),
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0),
});

// GET /api/cart - Get current user's cart
export async function GET(request: NextRequest) {
  try {
    // Get user from session or headers
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      // Try to get from session for anonymous users
      const sessionId = request.cookies.get('session-id')?.value;
      if (!sessionId) {
        return NextResponse.json({
          success: true,
          cart: {
            items: [],
            total: 0,
            itemCount: 0,
          },
        });
      }
      
      // For anonymous users, return session-based cart (implement later)
      return NextResponse.json({
        success: true,
        cart: {
          items: [],
          total: 0,
          itemCount: 0,
        },
      });
    }

    // Get or create cart for authenticated user
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                salesDetails: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  salesDetails: true,
                },
              },
            },
          },
        },
      });
    }

    // Calculate totals
    const cartWithTotals = {
      id: cart.id,
      items: cart.items.map(item => ({
        id: item.id,
        productId: item.productId,
        product: {
          id: item.product.id,
          name: item.product.name,
          nameAr: item.product.nameAr,
          image: item.product.images?.[0] || null,
          price: item.product.salesDetails?.basePrice || 0,
          discountedPrice: item.product.salesDetails?.discountedPrice,
          sku: item.product.sku,
          availability: item.product.availabilityType,
        },
        quantity: item.quantity,
        price: item.product.salesDetails?.discountedPrice || item.product.salesDetails?.basePrice || 0,
        subtotal: (item.product.salesDetails?.discountedPrice || item.product.salesDetails?.basePrice || 0) * item.quantity,
      })),
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0,
      itemCount: 0,
    };

    // Calculate totals
    cartWithTotals.items.forEach(item => {
      cartWithTotals.subtotal += item.subtotal;
      cartWithTotals.itemCount += item.quantity;
    });

    // Calculate tax (15% VAT for Saudi Arabia)
    cartWithTotals.tax = cartWithTotals.subtotal * 0.15;
    
    // Calculate shipping (free over 500 SAR, otherwise 50 SAR)
    cartWithTotals.shipping = cartWithTotals.subtotal > 500 ? 0 : 50;
    
    // Calculate total
    cartWithTotals.total = cartWithTotals.subtotal + cartWithTotals.tax + cartWithTotals.shipping;

    return NextResponse.json({
      success: true,
      cart: cartWithTotals,
    });
  } catch (error) {
    console.error('Cart fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = cartItemSchema.parse(body);
    
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if product exists and is available
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
      include: { salesDetails: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.status !== 'ACTIVE' || !product.isPublished) {
      return NextResponse.json(
        { success: false, error: 'Product is not available' },
        { status: 400 }
      );
    }

    // Check inventory
    if (product.salesDetails?.inventory?.quantity !== undefined) {
      if (product.salesDetails.inventory.quantity < validatedData.quantity) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Insufficient inventory',
            available: product.salesDetails.inventory.quantity,
          },
          { status: 400 }
        );
      }
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: validatedData.productId,
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + validatedData.quantity;
      
      // Check inventory for new quantity
      if (product.salesDetails?.inventory?.quantity !== undefined) {
        if (product.salesDetails.inventory.quantity < newQuantity) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Insufficient inventory for requested quantity',
              available: product.salesDetails.inventory.quantity,
            },
            { status: 400 }
          );
        }
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: validatedData.productId,
          quantity: validatedData.quantity,
        },
      });
    }

    // Return updated cart
    return GET(request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Cart add error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

// PUT /api/cart/[itemId] - Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    
    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateCartItemSchema.parse(body);
    
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        product: {
          include: { salesDetails: true },
        },
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { success: false, error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (cartItem.cart.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // If quantity is 0, remove item
    if (validatedData.quantity === 0) {
      await prisma.cartItem.delete({
        where: { id: itemId },
      });
    } else {
      // Check inventory
      if (cartItem.product.salesDetails?.inventory?.quantity !== undefined) {
        if (cartItem.product.salesDetails.inventory.quantity < validatedData.quantity) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Insufficient inventory',
              available: cartItem.product.salesDetails.inventory.quantity,
            },
            { status: 400 }
          );
        }
      }

      // Update quantity
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity: validatedData.quantity },
      });
    }

    // Return updated cart
    return GET(request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Cart update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart/[itemId] - Remove item from cart
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const clearAll = searchParams.get('clearAll') === 'true';
    
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (clearAll) {
      // Clear entire cart
      const cart = await prisma.cart.findUnique({
        where: { userId },
      });

      if (cart) {
        await prisma.cartItem.deleteMany({
          where: { cartId: cart.id },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Cart cleared successfully',
      });
    }

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Get cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!cartItem) {
      return NextResponse.json(
        { success: false, error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (cartItem.cart.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete item
    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    // Return updated cart
    return GET(request);
  } catch (error) {
    console.error('Cart delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove item from cart' },
      { status: 500 }
    );
  }
}