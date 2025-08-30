import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import prisma from '@/lib/prisma';

// GET all email templates
export const GET = withAuth(
  async (req: any) => {
    try {
      const templates = await prisma.emailTemplate.findMany({
        orderBy: { name: 'asc' }
      });
      
      return NextResponse.json({
        success: true,
        data: templates
      });
      
    } catch (error) {
      console.error('Get templates error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch email templates' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true, allowedRoles: ['ADMIN'] }
);