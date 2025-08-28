import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema
const templateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean()
});

// GET single template
export const GET = withAuth(
  async (req: any, { params }: { params: { id: string } }) => {
    try {
      const template = await prisma.emailTemplate.findUnique({
        where: { id: params.id }
      });
      
      if (!template) {
        return NextResponse.json(
          { success: false, message: 'Template not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: template
      });
      
    } catch (error) {
      console.error('Get template error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch template' },
        { status: 500 }
      );
    } finally {
      await prisma.$disconnect();
    }
  },
  { requireAuth: true, allowedRoles: ['ADMIN'] }
);

// UPDATE template
export const PUT = withAuth(
  async (req: any, { params }: { params: { id: string } }) => {
    try {
      const body = await req.json();
      const validation = templateSchema.safeParse(body);
      
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
      
      const template = await prisma.emailTemplate.update({
        where: { id: params.id },
        data: {
          ...validation.data,
          variables: validation.data.variables || []
        }
      });
      
      // Log the change
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'TEMPLATE_UPDATE',
          entity: 'EmailTemplate',
          entityId: template.id,
          newData: validation.data
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Template updated successfully',
        data: template
      });
      
    } catch (error) {
      console.error('Update template error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update template' },
        { status: 500 }
      );
    } finally {
      await prisma.$disconnect();
    }
  },
  { requireAuth: true, allowedRoles: ['ADMIN'] }
);