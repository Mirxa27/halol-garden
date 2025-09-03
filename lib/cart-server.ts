import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function getCartItems() {
  const session = await getSession();
  
  if (!session?.user) {
    // Return empty cart for unauthenticated users
    // In production, you might want to handle session-based carts
    return [];
  }

  const cart = await prisma.cart.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              supplier: true,
              salesDetails: true,
            },
          },
        },
      },
    },
  });

  if (!cart) {
    // Create cart if it doesn't exist
    await prisma.cart.create({
      data: {
        userId: session.user.id,
      },
    });
    return [];
  }

  // Transform cart items to match the expected format
  return cart.items.map(item => ({
    id: item.id,
    productId: item.productId,
    name: item.product.name,
    nameAr: item.product.nameAr,
    price: item.product.salesDetails?.discountedPrice || 
           item.product.salesDetails?.basePrice || 
           item.product.price,
    quantity: item.quantity,
    image: item.product.images[0] || '/images/product-placeholder.jpg',
    sku: item.product.sku,
    inStock: item.product.quantity > 0,
    supplier: item.product.supplier.companyName,
  }));
}

export async function getCartTotals(items: any[]) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 500 ? 0 : 50; // Free shipping over $500
  const tax = subtotal * 0.15; // 15% VAT
  const total = subtotal + shipping + tax;

  return {
    subtotal,
    shipping,
    tax,
    total,
  };
}