import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import prisma from '@/lib/prisma';

// Create email transporter
const createTransporter = () => {
  // Use environment variables for production
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // For development, use Ethereal Email or local SMTP
  return nodemailer.createTransporter({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: process.env.SMTP_USER || 'ethereal.user',
      pass: process.env.SMTP_PASS || 'ethereal.pass',
    },
  });
};

// Email templates
const emailTemplates = {
  orderConfirmation: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .order-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .item { border-bottom: 1px solid #e5e7eb; padding: 10px 0; }
        .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmation</h1>
        </div>
        <div class="content">
          <p>Hello {{customerName}},</p>
          <p>Thank you for your order! We're pleased to confirm that we've received your order and it's being processed.</p>
          
          <div class="order-details">
            <h2>Order Details</h2>
            <p><strong>Order Number:</strong> {{orderNumber}}</p>
            <p><strong>Order Date:</strong> {{orderDate}}</p>
            <p><strong>Payment Method:</strong> {{paymentMethod}}</p>
            
            <h3>Items Ordered:</h3>
            {{#each items}}
            <div class="item">
              <p><strong>{{this.name}}</strong></p>
              <p>Quantity: {{this.quantity}} x ${{this.price}}</p>
              <p>Subtotal: ${{this.subtotal}}</p>
            </div>
            {{/each}}
            
            <div class="total">
              <p>Subtotal: ${{subtotal}}</p>
              <p>Tax: ${{tax}}</p>
              <p>Shipping: ${{shipping}}</p>
              {{#if discount}}
              <p>Discount: -${{discount}}</p>
              {{/if}}
              <p><strong>Total: ${{total}}</strong></p>
            </div>
            
            <h3>Shipping Address:</h3>
            <p>{{shippingAddress.recipientName}}</p>
            <p>{{shippingAddress.street}}</p>
            <p>{{shippingAddress.city}}, {{shippingAddress.state}} {{shippingAddress.postalCode}}</p>
            <p>{{shippingAddress.country}}</p>
          </div>
          
          <p>We'll send you another email when your order ships.</p>
          <p>If you have any questions, please don't hesitate to contact our customer service team.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Medical Devices Marketplace. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  
  welcomeEmail: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Medical Devices Marketplace!</h1>
        </div>
        <div class="content">
          <p>Hello {{name}},</p>
          <p>Welcome to the Medical Devices Marketplace! We're excited to have you as part of our community.</p>
          
          <p>Your account has been successfully created. You can now:</p>
          <ul>
            <li>Browse our extensive catalog of medical devices</li>
            <li>Compare products and prices from multiple suppliers</li>
            <li>Track your orders and manage your purchases</li>
            <li>Access exclusive deals and promotions</li>
          </ul>
          
          <p style="text-align: center;">
            <a href="{{loginUrl}}" class="button">Login to Your Account</a>
          </p>
          
          <p>If you have any questions or need assistance, our customer support team is here to help.</p>
          
          <p>Best regards,<br>The Medical Devices Marketplace Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Medical Devices Marketplace. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  
  passwordReset: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello {{name}},</p>
          <p>We received a request to reset the password for your Medical Devices Marketplace account.</p>
          
          <p>Click the button below to reset your password:</p>
          
          <p style="text-align: center;">
            <a href="{{resetUrl}}" class="button">Reset Password</a>
          </p>
          
          <p>This link will expire in 1 hour for security reasons.</p>
          
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          
          <p>Best regards,<br>The Medical Devices Marketplace Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Medical Devices Marketplace. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
};

// Send email function
export async function sendEmail(
  to: string,
  subject: string,
  template: keyof typeof emailTemplates,
  data: Record<string, any>
) {
  try {
    const transporter = createTransporter();
    const compiledTemplate = handlebars.compile(emailTemplates[template]);
    const html = compiledTemplate(data);

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Medical Devices Marketplace" <noreply@medicaldevices.com>',
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Specific email functions
export async function sendOrderConfirmationEmail(order: any, user: any) {
  const items = order.items.map((item: any) => ({
    name: item.metadata?.productName || 'Product',
    quantity: item.quantity,
    price: item.price.toFixed(2),
    subtotal: (item.quantity * item.price).toFixed(2),
  }));

  const emailData = {
    customerName: `${user.firstName} ${user.lastName}`,
    orderNumber: order.orderNumber,
    orderDate: new Date(order.createdAt).toLocaleDateString(),
    paymentMethod: order.paymentMethod,
    items,
    subtotal: order.subtotal.toFixed(2),
    tax: order.tax.toFixed(2),
    shipping: order.shipping.toFixed(2),
    discount: order.discount > 0 ? order.discount.toFixed(2) : null,
    total: order.total.toFixed(2),
    shippingAddress: order.shippingAddress,
  };

  return sendEmail(
    user.email,
    `Order Confirmation - ${order.orderNumber}`,
    'orderConfirmation',
    emailData
  );
}

export async function sendWelcomeEmail(user: any) {
  const emailData = {
    name: `${user.firstName} ${user.lastName}`,
    loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
  };

  return sendEmail(
    user.email,
    'Welcome to Medical Devices Marketplace!',
    'welcomeEmail',
    emailData
  );
}

export async function sendPasswordResetEmail(user: any, resetToken: string) {
  const emailData = {
    name: `${user.firstName} ${user.lastName}`,
    resetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`,
  };

  return sendEmail(
    user.email,
    'Password Reset Request',
    'passwordReset',
    emailData
  );
}