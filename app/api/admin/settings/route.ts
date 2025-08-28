import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for settings
const settingSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  type: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON']),
  description: z.string().optional()
});

// GET all settings
export const GET = withAuth(
  async (req: any) => {
    try {
      const settings = await prisma.systemSetting.findMany({
        orderBy: { key: 'asc' }
      });
      
      return NextResponse.json({
        success: true,
        data: settings
      });
      
    } catch (error) {
      console.error('Get settings error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch settings' },
        { status: 500 }
      );
    } finally {
      await prisma.$disconnect();
    }
  },
  { requireAuth: true, allowedRoles: ['ADMIN'] }
);

// POST/UPDATE a setting
export const POST = withAuth(
  async (req: any) => {
    try {
      const body = await req.json();
      const validation = settingSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Validation failed',
            errors: validation.error.flatten().fieldErrors
          },
          { status: 400 }
        );
      }
      
      const { key, value, type, description } = validation.data;
      
      // Convert value based on type
      let processedValue = value;
      if (type === 'JSON' && typeof value !== 'object') {
        try {
          processedValue = JSON.parse(value);
        } catch {
          return NextResponse.json(
            { success: false, message: 'Invalid JSON value' },
            { status: 400 }
          );
        }
      } else if (type === 'NUMBER') {
        processedValue = Number(value);
        if (isNaN(processedValue)) {
          return NextResponse.json(
            { success: false, message: 'Invalid number value' },
            { status: 400 }
          );
        }
      } else if (type === 'BOOLEAN') {
        processedValue = Boolean(value);
      }
      
      // Upsert the setting
      const setting = await prisma.systemSetting.upsert({
        where: { key },
        update: { 
          value: type === 'JSON' ? processedValue : JSON.stringify(processedValue),
          type,
          description
        },
        create: {
          key,
          value: type === 'JSON' ? processedValue : JSON.stringify(processedValue),
          type,
          description
        }
      });
      
      // Log the change
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'SETTING_UPDATE',
          entity: 'SystemSetting',
          entityId: setting.id,
          newData: { key, value: processedValue, type }
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Setting saved successfully',
        data: setting
      });
      
    } catch (error) {
      console.error('Save setting error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to save setting' },
        { status: 500 }
      );
    } finally {
      await prisma.$disconnect();
    }
  },
  { requireAuth: true, allowedRoles: ['ADMIN'] }
);

// DELETE a setting
export const DELETE = withAuth(
  async (req: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const key = searchParams.get('key');
      
      if (!key) {
        return NextResponse.json(
          { success: false, message: 'Setting key is required' },
          { status: 400 }
        );
      }
      
      await prisma.systemSetting.delete({
        where: { key }
      });
      
      // Log the deletion
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'SETTING_DELETE',
          entity: 'SystemSetting',
          entityId: key,
          oldData: { key }
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Setting deleted successfully'
      });
      
    } catch (error) {
      console.error('Delete setting error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete setting' },
        { status: 500 }
      );
    } finally {
      await prisma.$disconnect();
    }
  },
  { requireAuth: true, allowedRoles: ['ADMIN'] }
);