import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../../server/config/database';

// Email template validation schema
const emailTemplateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  variables: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

const createTemplateSchema = emailTemplateSchema;
const updateTemplateSchema = emailTemplateSchema.partial();

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

// GET /api/admin/email-templates - Get all email templates
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
    const activeOnly = searchParams.get('active') === 'true';
    
    const where = activeOnly ? { isActive: true } : {};
    
    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Email templates fetch error:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch email templates' },
      { status: 500 }
    );
  }
}

// POST /api/admin/email-templates - Create email template
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
    const validatedData = createTemplateSchema.parse(body);

    // Check if template name already exists
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { name: validatedData.name },
    });

    if (existingTemplate) {
      return NextResponse.json(
        { success: false, error: 'Template with this name already exists' },
        { status: 400 }
      );
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name: validatedData.name,
        subject: validatedData.subject,
        body: validatedData.body,
        variables: validatedData.variables,
        isActive: validatedData.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      data: template,
      message: 'Email template created successfully',
    });
  } catch (error) {
    console.error('Email template creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid template data', details: error.errors },
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
      { success: false, error: 'Failed to create email template' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/email-templates - Initialize default email templates
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await validateAdmin(userId);
    
    // Only super admin can initialize templates
    if (user.adminProfile?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Super admin access required' },
        { status: 403 }
      );
    }

    // Default email templates
    const defaultTemplates = [
      {
        name: 'welcome_email',
        subject: 'Welcome to {{siteName}} - Your Medical Equipment Marketplace',
        body: `
<!DOCTYPE html>
<html dir="{{textDirection}}" lang="{{language}}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to {{siteName}}</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0; 
      padding: 0; 
      background-color: #f4f6f9;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: white; 
      border-radius: 8px; 
      overflow: hidden; 
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 40px 30px; 
      text-align: center; 
    }
    .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
    .content { padding: 40px 30px; }
    .content h2 { color: #667eea; margin-top: 0; }
    .features { 
      background-color: #f8f9ff; 
      padding: 20px; 
      border-radius: 6px; 
      margin: 20px 0; 
    }
    .features ul { margin: 0; padding-left: 20px; }
    .features li { margin: 8px 0; }
    .button { 
      display: inline-block; 
      padding: 15px 30px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      text-decoration: none; 
      border-radius: 25px; 
      font-weight: 500;
      margin: 20px 0;
    }
    .footer { 
      background-color: #f8f9ff; 
      text-align: center; 
      padding: 30px; 
      color: #666; 
      font-size: 14px; 
    }
    .footer a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{siteName}}</h1>
      <p>Welcome to the Future of Medical Equipment Trading</p>
    </div>
    <div class="content">
      <h2>Hello {{firstName}} {{lastName}},</h2>
      <p>Welcome to <strong>{{siteName}}</strong> - the premier marketplace for medical equipment in the Arabic-speaking healthcare market!</p>
      
      <div class="features">
        <p><strong>What you can do now:</strong></p>
        <ul>
          <li>🏥 Browse thousands of certified medical equipment</li>
          <li>🔍 Connect with verified suppliers and manufacturers</li>
          <li>🛠️ Request professional maintenance services</li>
          <li>📊 Manage your orders and track deliveries</li>
          <li>💬 Get instant support through our live chat</li>
          <li>📈 Access detailed analytics and reports</li>
        </ul>
      </div>
      
      <p>Your account type: <strong>{{userType}}</strong></p>
      
      <p style="text-align: center;">
        <a href="{{dashboardUrl}}" class="button">Access Your Dashboard</a>
      </p>
      
      <p>If you have any questions, our support team is here to help 24/7.</p>
      
      <p>Best regards,<br>
      The {{siteName}} Team</p>
    </div>
    <div class="footer">
      <p>© {{currentYear}} {{siteName}}. All rights reserved.</p>
      <p>
        <a href="{{unsubscribeUrl}}">Unsubscribe</a> | 
        <a href="{{supportUrl}}">Support</a> | 
        <a href="{{privacyUrl}}">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`,
        variables: ['siteName', 'firstName', 'lastName', 'userType', 'dashboardUrl', 'currentYear', 'unsubscribeUrl', 'supportUrl', 'privacyUrl', 'textDirection', 'language'],
        isActive: true,
      },
      
      {
        name: 'email_verification',
        subject: 'Verify Your Email Address - {{siteName}}',
        body: `
<!DOCTYPE html>
<html dir="{{textDirection}}" lang="{{language}}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f6f9; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
    .content { padding: 40px 30px; text-align: center; }
    .verification-code { background-color: #f8f9ff; padding: 20px; border-radius: 6px; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 3px; color: #28a745; }
    .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; text-decoration: none; border-radius: 25px; font-weight: 500; margin: 20px 0; }
    .footer { background-color: #f8f9ff; text-align: center; padding: 30px; color: #666; font-size: 14px; }
    .expire-note { background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Email Verification</h1>
      <p>Please verify your email address</p>
    </div>
    <div class="content">
      <h2>Hello {{firstName}},</h2>
      <p>Thank you for registering with {{siteName}}. To complete your registration, please verify your email address.</p>
      
      <div class="verification-code">{{verificationCode}}</div>
      
      <p>Or click the button below to verify automatically:</p>
      
      <a href="{{verificationUrl}}" class="button">Verify Email Address</a>
      
      <div class="expire-note">
        <strong>Important:</strong> This verification link will expire in {{expirationTime}} hours.
      </div>
      
      <p>If you didn't create an account with {{siteName}}, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>© {{currentYear}} {{siteName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
        variables: ['siteName', 'firstName', 'verificationCode', 'verificationUrl', 'expirationTime', 'currentYear', 'textDirection', 'language'],
        isActive: true,
      },
      
      {
        name: 'password_reset',
        subject: 'Reset Your Password - {{siteName}}',
        body: `
<!DOCTYPE html>
<html dir="{{textDirection}}" lang="{{language}}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f6f9; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
    .content { padding: 40px 30px; }
    .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; text-decoration: none; border-radius: 25px; font-weight: 500; margin: 20px 0; }
    .footer { background-color: #f8f9ff; text-align: center; padding: 30px; color: #666; font-size: 14px; }
    .security-note { background-color: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset</h1>
      <p>Reset your account password</p>
    </div>
    <div class="content">
      <h2>Hello {{firstName}},</h2>
      <p>We received a request to reset the password for your {{siteName}} account.</p>
      
      <p style="text-align: center;">
        <a href="{{resetUrl}}" class="button">Reset Password</a>
      </p>
      
      <div class="security-note">
        <strong>Security Notice:</strong>
        <ul>
          <li>This link will expire in {{expirationTime}} hours</li>
          <li>If you didn't request this reset, please ignore this email</li>
          <li>For security, this link can only be used once</li>
        </ul>
      </div>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">{{resetUrl}}</p>
      
      <p>If you need additional help, please contact our support team.</p>
      
      <p>Best regards,<br>
      The {{siteName}} Security Team</p>
    </div>
    <div class="footer">
      <p>© {{currentYear}} {{siteName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
        variables: ['siteName', 'firstName', 'resetUrl', 'expirationTime', 'currentYear', 'textDirection', 'language'],
        isActive: true,
      },
      
      {
        name: 'order_confirmation',
        subject: 'Order Confirmation #{{orderNumber}} - {{siteName}}',
        body: `
<!DOCTYPE html>
<html dir="{{textDirection}}" lang="{{language}}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f6f9; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #007bff 0%, #6610f2 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
    .content { padding: 40px 30px; }
    .order-details { background-color: #f8f9ff; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .order-items { margin: 20px 0; }
    .item { border-bottom: 1px solid #eee; padding: 15px 0; }
    .item:last-child { border-bottom: none; }
    .total-section { background-color: #e9ecef; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #007bff 0%, #6610f2 100%); color: white; text-decoration: none; border-radius: 25px; font-weight: 500; margin: 20px 0; }
    .footer { background-color: #f8f9ff; text-align: center; padding: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmed!</h1>
      <p>Thank you for your purchase</p>
    </div>
    <div class="content">
      <h2>Hello {{customerName}},</h2>
      <p>Your order has been confirmed and is being processed.</p>
      
      <div class="order-details">
        <h3>Order Details</h3>
        <p><strong>Order Number:</strong> {{orderNumber}}</p>
        <p><strong>Order Date:</strong> {{orderDate}}</p>
        <p><strong>Payment Method:</strong> {{paymentMethod}}</p>
        <p><strong>Delivery Address:</strong><br>{{shippingAddress}}</p>
      </div>
      
      <div class="order-items">
        <h3>Items Ordered</h3>
        {{#each items}}
        <div class="item">
          <strong>{{name}}</strong><br>
          <span>Quantity: {{quantity}} × {{price}} = {{total}}</span>
        </div>
        {{/each}}
      </div>
      
      <div class="total-section">
        <p><strong>Subtotal:</strong> {{subtotal}}</p>
        <p><strong>Tax:</strong> {{tax}}</p>
        <p><strong>Shipping:</strong> {{shipping}}</p>
        <h3><strong>Total: {{total}}</strong></h3>
      </div>
      
      <p style="text-align: center;">
        <a href="{{trackingUrl}}" class="button">Track Your Order</a>
      </p>
      
      <p>We'll send you shipping updates as your order progresses.</p>
      
      <p>Thank you for choosing {{siteName}}!</p>
    </div>
    <div class="footer">
      <p>© {{currentYear}} {{siteName}}. All rights reserved.</p>
      <p>Need help? Contact us at {{supportEmail}} or {{supportPhone}}</p>
    </div>
  </div>
</body>
</html>`,
        variables: ['siteName', 'customerName', 'orderNumber', 'orderDate', 'paymentMethod', 'shippingAddress', 'items', 'subtotal', 'tax', 'shipping', 'total', 'trackingUrl', 'currentYear', 'supportEmail', 'supportPhone', 'textDirection', 'language'],
        isActive: true,
      },
    ];

    // Create templates in transaction
    await prisma.$transaction(async (tx) => {
      for (const template of defaultTemplates) {
        await tx.emailTemplate.upsert({
          where: { name: template.name },
          update: {
            subject: template.subject,
            body: template.body,
            variables: template.variables,
            isActive: template.isActive,
          },
          create: template,
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: { templatesCount: defaultTemplates.length },
      message: 'Default email templates initialized successfully',
    });
  } catch (error) {
    console.error('Email templates initialization error:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to initialize email templates' },
      { status: 500 }
    );
  }
}