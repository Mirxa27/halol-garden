import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import prisma from '@/lib/prisma';

export const GET = withAuth(
  async (req: any) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      // Verify user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { AdminProfile: true }
      });
      
      if (!user || user.userType !== 'ADMIN' || !user.AdminProfile) {
        return NextResponse.json(
          { success: false, message: 'Admin access required' },
          { status: 403 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: {
          isAdmin: true,
          role: user.AdminProfile.role,
          permissions: user.AdminProfile.permissions
        }
      });
      
    } catch (error) {
      console.error('Admin verify error:', error);
      return NextResponse.json(
        { success: false, message: 'Verification failed' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true, allowedRoles: ['ADMIN'] }
);