import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    } finally {
      await prisma.$disconnect();
    }
  },
  { requireAuth: true, allowedRoles: ['ADMIN'] }
);