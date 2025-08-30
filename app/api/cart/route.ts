import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/server/middleware/auth.middleware';
import { z } from 'zod';
import { InventoryService } from '@/server/services/inventory.service';

// Validation schemas
const AddToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(100),
  metadata: z.record(z.any()).optional()
});

const UpdateCartItemSchema = z.object({
  quantity: z.number().int().positive().max(100)
});

// GET - Fetch user's cart
async function getCartHandler(request: NextRequest) {
  try {
    const user = (request as any).user;
    
    // Get cart items with product details
    const cart = await prisma.cart.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            salesDetails: true,
            supplier: {
              select: {
                id: true,
                companyName: true,
                rating: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Check availability and format response
    const cartItems = await Promise.all(
      cart.map(async (item) => {
        const available = await InventoryService.checkAvailability(
          item.productId,
          item.quantity
        );

        const price = item.product.salesDetails?.discountedPrice || 
                     item.product.salesDetails?.basePrice || 0;
        
        return {
          id: item.id,
          productId: item.productId,
          product: {
            id: item.product.id,
            sku: item.product.sku,
            name: item.product.name,
            nameAr: item.product.nameAr,
            images: item.product.images,
            price,
            originalPrice: item.product.salesDetails?.basePrice,
            discount: item.product.salesDetails?.discountedPrice 
              ? Math.round(((item.product.salesDetails.basePrice - item.product.salesDetails.discountedPrice) / item.product.salesDetails.basePrice) * 100)
              : 0,
            supplier: item.product.supplier,
            condition: item.product.condition,
            warranty: item.product.warranty
          },
          quantity: item.quantity,
          available,
          subtotal: price * item.quantity,
          metadata: item.metadata,
          addedAt: item.createdAt,
          updatedAt: item.updatedAt
        };
      })
    );

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    const taxRate = 0.15; // 15% VAT
    const tax = subtotal * taxRate;
    const shipping = subtotal > 500 ? 0 : 25; // Free shipping over $500
    const total = subtotal + tax + shipping;

    return NextResponse.json({
      success: true,
      data: {
        items: cartItems,
        summary: {
          itemCount: cartItems.length,
          subtotal,
          tax,
          taxRate,
          shipping,
          total,
          currency: 'USD'
        }
      }
    });

  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// POST - Add item to cart
async function addToCartHandler(request: NextRequest) {
  try {
    const user = (request as any).user;
    const body = await request.json();
    
    // Validate input
    const validatedData = AddToCartSchema.parse(body);
    
    // Check if product exists and is available for sale
    const product = await prisma.product.findUnique({
      where: { 
        id: validatedData.productId,
        status: 'ACTIVE',
        availabilityType: { in: ['SALE', 'BOTH'] }
      },
      include: { salesDetails: true }
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found or not available for sale' },
        { status: 404 }
      );
    }

    // Check inventory availability
    const isAvailable = await InventoryService.checkAvailability(
      validatedData.productId,
      validatedData.quantity
    );

    if (!isAvailable) {
      return NextResponse.json(
        { success: false, error: 'Insufficient inventory' },
        { status: 400 }
      );
    }

    // Check if item already in cart
    const existingItem = await prisma.cart.findFirst({
      where: {
        userId: user.id,
        productId: validatedData.productId
      }
    });

    let cartItem;
    
    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + validatedData.quantity;
      
      // Check availability for new quantity
      const isNewQuantityAvailable = await InventoryService.checkAvailability(
        validatedData.productId,
        newQuantity
      );

      if (!isNewQuantityAvailable) {
        return NextResponse.json(
          { success: false, error: 'Cannot add more items. Insufficient inventory' },
          { status: 400 }
        );
      }

      cartItem = await prisma.cart.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          metadata: {
            ...existingItem.metadata,
            ...validatedData.metadata
          }
        },
        include: {
          product: {
            include: {
              salesDetails: true,
              supplier: true
            }
          }
        }
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cart.create({
        data: {
          userId: user.id,
          productId: validatedData.productId,
          quantity: validatedData.quantity,
          metadata: validatedData.metadata || {}
        },
        include: {
          product: {
            include: {
              salesDetails: true,
              supplier: true
            }
          }
        }
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CART_ITEM_ADDED',
        entityType: 'CART',
        entityId: cartItem.id,
        changes: {
          productId: validatedData.productId,
          quantity: validatedData.quantity,
          productName: product.name
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: cartItem.id,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        product: {
          name: cartItem.product.name,
          price: cartItem.product.salesDetails?.discountedPrice || 
                 cartItem.product.salesDetails?.basePrice || 0
        },
        message: existingItem ? 'Cart updated successfully' : 'Item added to cart'
      }
    }, { status: existingItem ? 200 : 201 });

  } catch (error) {
    console.error('Error adding to cart:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

// PUT - Update cart item quantity
async function updateCartHandler(request: NextRequest) {
  try {
    const user = (request as any).user;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    
    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = UpdateCartItemSchema.parse(body);
    
    // Get cart item
    const cartItem = await prisma.cart.findFirst({
      where: {
        id: itemId,
        userId: user.id
      }
    });

    if (!cartItem) {
      return NextResponse.json(
        { success: false, error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // Check inventory availability for new quantity
    const isAvailable = await InventoryService.checkAvailability(
      cartItem.productId,
      validatedData.quantity
    );

    if (!isAvailable) {
      return NextResponse.json(
        { success: false, error: 'Insufficient inventory for requested quantity' },
        { status: 400 }
      );
    }

    // Update cart item
    const updatedItem = await prisma.cart.update({
      where: { id: itemId },
      data: {
        quantity: validatedData.quantity,
        updatedAt: new Date()
      },
      include: {
        product: {
          include: {
            salesDetails: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedItem.id,
        quantity: updatedItem.quantity,
        subtotal: updatedItem.quantity * (
          updatedItem.product.salesDetails?.discountedPrice ||
          updatedItem.product.salesDetails?.basePrice || 0
        ),
        message: 'Cart updated successfully'
      }
    });

  } catch (error) {
    console.error('Error updating cart:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update cart' },
      { status: 500 }
    );
  }
}

// DELETE - Remove item from cart or clear cart
async function deleteCartHandler(request: NextRequest) {
  try {
    const user = (request as any).user;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const clearAll = searchParams.get('clearAll') === 'true';
    
    if (clearAll) {
      // Clear entire cart
      await prisma.cart.deleteMany({
        where: { userId: user.id }
      });

      return NextResponse.json({
        success: true,
        message: 'Cart cleared successfully'
      });
    }

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Delete specific item
    const deleted = await prisma.cart.deleteMany({
      where: {
        id: itemId,
        userId: user.id
      }
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart'
    });

  } catch (error) {
    console.error('Error deleting from cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove item from cart' },
      { status: 500 }
    );
  }
}

// Export authenticated handlers
export const GET = AuthMiddleware.withAuth(getCartHandler);
export const POST = AuthMiddleware.withAuth(addToCartHandler);
export const PUT = AuthMiddleware.withAuth(updateCartHandler);
export const DELETE = AuthMiddleware.withAuth(deleteCartHandler);