import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import prisma from '@/lib/prisma';

export const GET = withAuth(
  async (_req: any) => {
    try {
      // Get various statistics
      const [
        totalUsers,
        activeUsers,
        totalProducts,
        activeProducts,
        totalOrders,
        completedOrders,
        pendingVerifications,
        totalSuppliers,
        totalProviders
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.product.count(),
        prisma.product.count({ where: { status: 'ACTIVE' } }),
        prisma.order.count(),
        prisma.order.count({ where: { status: 'DELIVERED' } }),
        prisma.user.count({ where: { verificationStatus: 'UNVERIFIED' } }),
        prisma.equipmentSupplier.count(),
        prisma.healthcareProvider.count()
      ]);
      
      // Calculate revenue
      const revenue = await prisma.order.aggregate({
        where: { paymentStatus: 'COMPLETED' },
        _sum: { total: true }
      });
      
      // Get recent activity counts (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const [
        recentUsers,
        recentOrders,
        recentProducts
      ] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.product.count({ where: { createdAt: { gte: thirtyDaysAgo } } })
      ]);
      
      return NextResponse.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          totalProducts,
          activeProducts,
          totalOrders,
          completedOrders,
          revenue: revenue._sum.total || 0,
          pendingVerifications,
          totalSuppliers,
          totalProviders,
          recentActivity: {
            users: recentUsers,
            orders: recentOrders,
            products: recentProducts
          }
        }
      });
      
    } catch (error) {
      console.error('Stats error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch statistics' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true, allowedRoles: ['ADMIN'] }
);