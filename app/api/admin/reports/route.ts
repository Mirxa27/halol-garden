import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../../server/config/database';

// Report validation schema
const reportQuerySchema = z.object({
  type: z.enum(['sales', 'users', 'products', 'payments', 'inventory', 'performance']),
  period: z.enum(['day', 'week', 'month', 'quarter', 'year', 'custom']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
  filters: z.object({
    category: z.string().optional(),
    userType: z.string().optional(),
    status: z.string().optional(),
    supplierId: z.string().optional(),
  }).optional(),
});

// Helper function to validate admin access
async function validateAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { adminProfile: true },
  });

  if (!user || !user.adminProfile) {
    throw new Error('Unauthorized: Admin access required');
  }

  return user;
}

// GET /api/admin/reports - Generate reports
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await validateAdmin(userId);

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    
    const validatedQuery = reportQuerySchema.parse({
      ...query,
      filters: query.filters ? JSON.parse(query.filters) : undefined,
    });

    // Calculate date range
    const { startDate, endDate } = calculateDateRange(
      validatedQuery.period,
      validatedQuery.startDate,
      validatedQuery.endDate
    );

    let reportData;

    switch (validatedQuery.type) {
      case 'sales':
        reportData = await generateSalesReport(startDate, endDate, validatedQuery.filters);
        break;
      case 'users':
        reportData = await generateUsersReport(startDate, endDate, validatedQuery.filters);
        break;
      case 'products':
        reportData = await generateProductsReport(startDate, endDate, validatedQuery.filters);
        break;
      case 'payments':
        reportData = await generatePaymentsReport(startDate, endDate, validatedQuery.filters);
        break;
      case 'inventory':
        reportData = await generateInventoryReport(validatedQuery.filters);
        break;
      case 'performance':
        reportData = await generatePerformanceReport(startDate, endDate);
        break;
      default:
        throw new Error('Invalid report type');
    }

    // Format response based on requested format
    if (validatedQuery.format === 'csv') {
      const csv = convertToCSV(reportData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${validatedQuery.type}-report.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        type: validatedQuery.type,
        period: validatedQuery.period,
        dateRange: { startDate, endDate },
        generatedAt: new Date().toISOString(),
        ...reportData,
      },
    });

  } catch (error) {
    console.error('Report generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid report parameters', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

function calculateDateRange(period: string, startDate?: string, endDate?: string) {
  const now = new Date();
  let start: Date;
  let end: Date = now;

  if (period === 'custom' && startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    switch (period) {
      case 'day':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  return { startDate: start, endDate: end };
}

async function generateSalesReport(startDate: Date, endDate: Date, filters?: any) {
  const whereClause: any = {
    createdAt: { gte: startDate, lte: endDate },
    status: { in: ['DELIVERED', 'COMPLETED'] },
    paymentStatus: 'COMPLETED',
  };

  if (filters?.supplierId) {
    whereClause.items = {
      some: {
        product: {
          supplierId: filters.supplierId,
        },
      },
    };
  }

  const [orders, totalRevenue, avgOrderValue] = await Promise.all([
    prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              select: {
                category: true,
                supplier: {
                  select: {
                    companyName: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            userType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    
    prisma.order.aggregate({
      where: whereClause,
      _sum: { total: true },
    }),
    
    prisma.order.aggregate({
      where: whereClause,
      _avg: { total: true },
    }),
  ]);

  // Group by category
  const salesByCategory: Record<string, { count: number; revenue: number }> = {};
  const salesBySupplier: Record<string, { count: number; revenue: number }> = {};
  const salesByCustomerType: Record<string, { count: number; revenue: number }> = {};

  orders.forEach(order => {
    order.items.forEach(item => {
      const category = item.product.category;
      const supplier = item.product.supplier.companyName;
      const customerType = order.user.userType;

      // By category
      if (!salesByCategory[category]) {
        salesByCategory[category] = { count: 0, revenue: 0 };
      }
      salesByCategory[category].count += item.quantity;
      salesByCategory[category].revenue += item.total;

      // By supplier
      if (!salesBySupplier[supplier]) {
        salesBySupplier[supplier] = { count: 0, revenue: 0 };
      }
      salesBySupplier[supplier].count += item.quantity;
      salesBySupplier[supplier].revenue += item.total;

      // By customer type
      if (!salesByCustomerType[customerType]) {
        salesByCustomerType[customerType] = { count: 0, revenue: 0 };
      }
      salesByCustomerType[customerType].count += item.quantity;
      salesByCustomerType[customerType].revenue += item.total;
    });
  });

  // Daily breakdown
  const dailySales = await prisma.$queryRaw`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as orders,
      SUM(total) as revenue
    FROM "Order" 
    WHERE 
      created_at >= ${startDate} 
      AND created_at <= ${endDate}
      AND status IN ('DELIVERED', 'COMPLETED')
      AND payment_status = 'COMPLETED'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;

  return {
    summary: {
      totalOrders: orders.length,
      totalRevenue: totalRevenue._sum.total || 0,
      averageOrderValue: avgOrderValue._avg.total || 0,
    },
    breakdown: {
      byCategory: salesByCategory,
      bySupplier: salesBySupplier,
      byCustomerType: salesByCustomerType,
    },
    dailySales,
    orders: orders.slice(0, 100), // Limit for performance
  };
}

async function generateUsersReport(startDate: Date, endDate: Date, filters?: any) {
  const whereClause: any = {
    createdAt: { gte: startDate, lte: endDate },
  };

  if (filters?.userType) {
    whereClause.userType = filters.userType;
  }

  if (filters?.status) {
    whereClause.status = filters.status;
  }

  const [users, usersByType, usersByStatus, dailySignups] = await Promise.all([
    prisma.user.count({ where: whereClause }),
    
    prisma.user.groupBy({
      by: ['userType'],
      where: whereClause,
      _count: { id: true },
    }),
    
    prisma.user.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { id: true },
    }),
    
    prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as signups
      FROM "User" 
      WHERE 
        created_at >= ${startDate} 
        AND created_at <= ${endDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
  ]);

  return {
    summary: {
      totalUsers: users,
    },
    breakdown: {
      byType: usersByType.reduce((acc, item) => {
        acc[item.userType] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      byStatus: usersByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
    },
    dailySignups,
  };
}

async function generateProductsReport(startDate: Date, endDate: Date, filters?: any) {
  const whereClause: any = {
    createdAt: { gte: startDate, lte: endDate },
  };

  if (filters?.category) {
    whereClause.category = filters.category;
  }

  if (filters?.supplierId) {
    whereClause.supplierId = filters.supplierId;
  }

  const [
    totalProducts,
    productsByCategory,
    productsByStatus,
    topSellingProducts,
  ] = await Promise.all([
    prisma.product.count({ where: whereClause }),
    
    prisma.product.groupBy({
      by: ['category'],
      where: whereClause,
      _count: { id: true },
    }),
    
    prisma.product.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { id: true },
    }),
    
    prisma.product.findMany({
      where: {
        ...whereClause,
        salesCount: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        nameAr: true,
        salesCount: true,
        price: true,
        supplier: {
          select: {
            companyName: true,
          },
        },
      },
      orderBy: { salesCount: 'desc' },
      take: 20,
    }),
  ]);

  return {
    summary: {
      totalProducts,
    },
    breakdown: {
      byCategory: productsByCategory.reduce((acc, item) => {
        acc[item.category] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      byStatus: productsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
    },
    topSellingProducts,
  };
}

async function generatePaymentsReport(startDate: Date, endDate: Date, filters?: any) {
  const whereClause: any = {
    createdAt: { gte: startDate, lte: endDate },
  };

  const [
    totalPayments,
    paymentsByMethod,
    paymentsByStatus,
    dailyPayments,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: whereClause,
      _sum: { amount: true },
      _count: { id: true },
    }),
    
    prisma.payment.groupBy({
      by: ['method'],
      where: whereClause,
      _sum: { amount: true },
      _count: { id: true },
    }),
    
    prisma.payment.groupBy({
      by: ['status'],
      where: whereClause,
      _sum: { amount: true },
      _count: { id: true },
    }),
    
    prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as transactions,
        SUM(amount) as volume
      FROM "Payment" 
      WHERE 
        created_at >= ${startDate} 
        AND created_at <= ${endDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
  ]);

  return {
    summary: {
      totalVolume: totalPayments._sum.amount || 0,
      totalTransactions: totalPayments._count.id,
    },
    breakdown: {
      byMethod: paymentsByMethod.reduce((acc, item) => {
        acc[item.method] = {
          volume: item._sum.amount || 0,
          count: item._count.id,
        };
        return acc;
      }, {} as Record<string, { volume: number; count: number }>),
      byStatus: paymentsByStatus.reduce((acc, item) => {
        acc[item.status] = {
          volume: item._sum.amount || 0,
          count: item._count.id,
        };
        return acc;
      }, {} as Record<string, { volume: number; count: number }>),
    },
    dailyPayments,
  };
}

async function generateInventoryReport(filters?: any) {
  const whereClause: any = {};

  if (filters?.category) {
    whereClause.category = filters.category;
  }

  if (filters?.supplierId) {
    whereClause.supplierId = filters.supplierId;
  }

  const [lowStockProducts, outOfStockProducts, inventoryByCategory] = await Promise.all([
    prisma.product.findMany({
      where: {
        ...whereClause,
        quantity: { lt: 10 },
        quantity: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        nameAr: true,
        quantity: true,
        price: true,
        supplier: {
          select: {
            companyName: true,
          },
        },
      },
      orderBy: { quantity: 'asc' },
    }),
    
    prisma.product.findMany({
      where: {
        ...whereClause,
        quantity: 0,
      },
      select: {
        id: true,
        name: true,
        nameAr: true,
        price: true,
        supplier: {
          select: {
            companyName: true,
          },
        },
      },
    }),
    
    prisma.product.groupBy({
      by: ['category'],
      where: whereClause,
      _sum: { quantity: true },
      _count: { id: true },
    }),
  ]);

  return {
    summary: {
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
    },
    lowStockProducts,
    outOfStockProducts,
    inventoryByCategory: inventoryByCategory.reduce((acc, item) => {
      acc[item.category] = {
        totalQuantity: item._sum.quantity || 0,
        productCount: item._count.id,
      };
      return acc;
    }, {} as Record<string, { totalQuantity: number; productCount: number }>),
  };
}

async function generatePerformanceReport(startDate: Date, endDate: Date) {
  // System performance metrics
  const [
    averageOrderProcessingTime,
    totalApiRequests,
    errorRate,
  ] = await Promise.all([
    // Calculate average time from order creation to confirmation
    prisma.$queryRaw`
      SELECT AVG(EXTRACT(EPOCH FROM (confirmed_at - created_at))) as avg_processing_time
      FROM "Order" 
      WHERE 
        confirmed_at IS NOT NULL
        AND created_at >= ${startDate} 
        AND created_at <= ${endDate}
    `,
    
    // Mock API request count (implement with actual monitoring)
    Promise.resolve(12500),
    
    // Mock error rate (implement with actual monitoring)
    Promise.resolve(0.02),
  ]);

  return {
    performance: {
      averageOrderProcessingTime: (averageOrderProcessingTime as any)[0]?.avg_processing_time || 0,
      totalApiRequests,
      errorRate,
      uptime: 99.9, // Mock uptime
    },
  };
}

function convertToCSV(data: any): string {
  // Simple CSV conversion - enhance based on data structure
  const headers = Object.keys(data.summary || {});
  const rows = [headers.join(',')];
  
  if (data.summary) {
    const values = headers.map(h => data.summary[h]);
    rows.push(values.join(','));
  }
  
  return rows.join('\n');
}