import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../../server/config/database';

// System settings validation schema
const systemSettingSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  type: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON']),
  description: z.string().optional(),
});

const bulkSettingsSchema = z.array(systemSettingSchema);

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

// GET /api/admin/settings - Get all system settings
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

    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });

    // Group settings by category
    const groupedSettings: Record<string, any[]> = {};
    
    settings.forEach(setting => {
      const category = setting.key.split('_')[0];
      if (!groupedSettings[category]) {
        groupedSettings[category] = [];
      }
      groupedSettings[category].push({
        key: setting.key,
        value: setting.value,
        type: setting.type,
        description: setting.description,
        updatedAt: setting.updatedAt,
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        settings: groupedSettings,
        categories: Object.keys(groupedSettings),
      },
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings - Create or update settings
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await validateAdmin(userId);

    const body = await request.json();
    const validatedData = bulkSettingsSchema.parse(body);

    // Update settings in transaction
    const updatedSettings = await prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const setting of validatedData) {
        const result = await tx.systemSetting.upsert({
          where: { key: setting.key },
          update: {
            value: setting.value,
            type: setting.type,
            description: setting.description,
          },
          create: {
            key: setting.key,
            value: setting.value,
            type: setting.type,
            description: setting.description,
          },
        });
        results.push(result);
      }
      
      return results;
    });

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Settings update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid settings data', details: error.errors },
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
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}