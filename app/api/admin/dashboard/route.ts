import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

// Dashboard query validation
const dashboardQuerySchema = z.object({
  timeframe: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      timeframe: searchParams.get('timeframe') || 'month',
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    };

    const validatedParams = dashboardQuerySchema.parse(queryParams);

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (validatedParams.timeframe) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Use custom dates if provided
    if (validatedParams.startDate) {
      startDate = new Date(validatedParams.startDate);
    }
    if (validatedParams.endDate) {
      endDate = new Date(validatedParams.endDate);
    }

    // Fetch dashboard statistics
    const [
      totalUsers,
      totalOrders,
      totalRevenue,
      totalProducts,
      newUsers,
      newOrders,
      recentOrders,
      topProducts,
      usersByType,
      ordersByStatus,
      monthlyRevenue,
      systemAlerts
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Total orders
      prisma.order.count(),
      
      // Total revenue
      prisma.order.aggregate({
        _sum: { total: true },
        where: { 
          status: { in: ['DELIVERED', 'COMPLETED'] },
          paymentStatus: 'COMPLETED'
        }
      }),
      
      // Total products
      prisma.product.count({ where: { isPublished: true } }),
      
      // New users in timeframe
      prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      
      // New orders in timeframe
      prisma.order.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      
      // Recent orders
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  nameAr: true,
                }
              }
            }
          }
        }
      }),
      
      // Top selling products
      prisma.product.findMany({
        take: 10,
        orderBy: { salesCount: 'desc' },
        select: {
          id: true,
          name: true,
          nameAr: true,
          price: true,
          salesCount: true,
          rating: true,
          images: true,
        }
      }),
      
      // Users by type
      prisma.user.groupBy({
        by: ['userType'],
        _count: { id: true }
      }),
      
      // Orders by status
      prisma.order.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      
      // Monthly revenue (last 12 months)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          SUM(total) as revenue,
          COUNT(*) as orders
        FROM "Order" 
        WHERE 
          "createdAt" >= NOW() - INTERVAL '12 months'
          AND "paymentStatus" = 'COMPLETED'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month ASC
      `,
      
      // System alerts (critical issues)
      Promise.resolve([
        // You can add real system monitoring here
        // For now, return empty array
      ])
    ]);

    // Calculate growth percentages
    const previousPeriodStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
    
    const [previousUsers, previousOrders, previousRevenue] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: { gte: previousPeriodStart, lt: startDate }
        }
      }),
      
      prisma.order.count({
        where: {
          createdAt: { gte: previousPeriodStart, lt: startDate }
        }
      }),
      
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: previousPeriodStart, lt: startDate },
          status: { in: ['DELIVERED', 'COMPLETED'] },
          paymentStatus: 'COMPLETED'
        }
      })
    ]);

    // Calculate growth rates
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const userGrowth = calculateGrowth(newUsers, previousUsers);
    const orderGrowth = calculateGrowth(newOrders, previousOrders);
    const revenueGrowth = calculateGrowth(
      totalRevenue._sum.total || 0, 
      previousRevenue._sum.total || 0
    );

    // Format dashboard data
    const dashboardData = {
      overview: {
        totalUsers: {
          value: totalUsers,
          change: userGrowth,
          trend: userGrowth >= 0 ? 'up' : 'down'
        },
        totalOrders: {
          value: totalOrders,
          change: orderGrowth,
          trend: orderGrowth >= 0 ? 'up' : 'down'
        },
        totalRevenue: {
          value: totalRevenue._sum.total || 0,
          change: revenueGrowth,
          trend: revenueGrowth >= 0 ? 'up' : 'down'
        },
        totalProducts: {
          value: totalProducts,
          change: 0, // Calculate if needed
          trend: 'up'
        }
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: `${order.user.firstName} ${order.user.lastName}`,
        email: order.user.email,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        itemCount: order.items.length,
        items: order.items.map(item => ({
          productName: item.product.name,
          productNameAr: item.product.nameAr,
          quantity: item.quantity,
          price: item.price,
        }))
      })),
      topProducts: topProducts.map(product => ({
        id: product.id,
        name: product.name,
        nameAr: product.nameAr,
        price: product.price,
        salesCount: product.salesCount,
        rating: product.rating,
        image: Array.isArray(product.images) && product.images.length > 0 
          ? (product.images as string[])[0] 
          : null,
      })),
      analytics: {
        usersByType: usersByType.map(item => ({
          type: item.userType,
          count: item._count.id,
          percentage: (item._count.id / totalUsers) * 100
        })),
        ordersByStatus: ordersByStatus.map(item => ({
          status: item.status,
          count: item._count.id,
          percentage: (item._count.id / totalOrders) * 100
        })),
        monthlyRevenue: monthlyRevenue as any[]
      },
      systemAlerts: systemAlerts,
      timeframe: validatedParams.timeframe,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}