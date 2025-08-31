import { NextRequest, NextResponse } from 'next/server';
// import { withAuth } from '@/lib/auth/middleware';
import { z } from 'zod';
import prisma from '@/lib/prisma';

// Validation schema
const templateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean()
});

// GET single template
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
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
  }
}

// UPDATE template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
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
  }
}