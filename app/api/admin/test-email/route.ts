import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/email';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email()
});

export const POST = withAuth(
  async (req: any) => {
    try {
      const body = await req.json();
      const validation = schema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Invalid email address'
          },
          { status: 400 }
        );
      }
      
      // Send test email
      await sendEmail(
        validation.data.email,
        'Test Email - Medical Devices Marketplace',
        'welcomeEmail',
        {
          name: 'Test User',
          loginUrl: process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000'
        }
      );
      const success = true;
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Test email sent successfully'
        });
      } else {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Failed to send test email. Please check your SMTP configuration.'
          },
          { status: 500 }
        );
      }
      
    } catch (error) {
      console.error('Test email error:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to send test email',
          error: process.env.NODE_ENV === 'development' ? error : undefined
        },
        { status: 500 }
      );
    }
  },
  { requireAuth: true, allowedRoles: ['ADMIN'] }
);