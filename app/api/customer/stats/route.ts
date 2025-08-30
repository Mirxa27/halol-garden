import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch various stats in parallel
    const [
      totalOrders,
      pendingOrders,
      orderTotals,
      wishlistCount,
      cart,
      recentOrders
    ] = await Promise.all([
      // Total orders count
      prisma.order.count({
        where: { userId },
      }),
      
      // Pending orders count
      prisma.order.count({
        where: {
          userId,
          status: {
            in: ['PENDING', 'CONFIRMED', 'PROCESSING'],
          },
        },
      }),
      
      // Total spent
      prisma.order.aggregate({
        where: {
          userId,
          paymentStatus: 'COMPLETED',
        },
        _sum: {
          total: true,
        },
      }),
      
      // Wishlist count
      prisma.wishlistItem.count({
        where: { userId },
      }),
      
      // Cart items count
      prisma.cart.findUnique({
        where: { userId },
        include: {
          items: true,
        },
      }),
      
      // Recent orders for activity
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    // Build recent activity from orders
    const recentActivity = recentOrders.map(order => ({
      type: 'order',
      description: `Order ${order.orderNumber} is ${order.status.toLowerCase()}`,
      timestamp: order.createdAt.toISOString(),
    }));

    // Calculate cart count
    const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

    const stats = {
      totalOrders,
      pendingOrders,
      totalSpent: orderTotals._sum.total || 0,
      wishlistCount,
      cartCount,
      recentActivity,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}