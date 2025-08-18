import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Email templates
const emailTemplates = {
  verification: (token: string) => ({
    subject: 'Verify Your Email - Medical Devices Marketplace',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f4f4f4; }
            .button { display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Medical Devices Marketplace</h1>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Thank you for registering! Please click the button below to verify your email address:</p>
              <p style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}" class="button">
                  Verify Email
                </a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all;">
                ${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}
              </p>
              <p>This link will expire in 24 hours.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Medical Devices Marketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
  
  passwordReset: (token: string) => ({
    subject: 'Password Reset Request - Medical Devices Marketplace',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f4f4f4; }
            .button { display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <p style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}" class="button">
                  Reset Password
                </a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all;">
                ${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}
              </p>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Medical Devices Marketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
  
  orderConfirmation: (order: any) => ({
    subject: `Order Confirmation #${order.orderNumber} - Medical Devices Marketplace`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f4f4f4; }
            .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmation</h1>
            </div>
            <div class="content">
              <h2>Thank you for your order!</h2>
              <div class="order-details">
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
                <p><strong>Status:</strong> ${order.status}</p>
              </div>
              <p>We'll send you another email when your order ships.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Medical Devices Marketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

// Send email function
export async function sendEmail(to: string, subject: string, html: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email (dev mode):', { to, subject });
    return { success: true, messageId: 'dev-mode' };
  }
  
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Medical Devices Marketplace" <noreply@medicaldevices.com>',
      to,
      subject,
      html,
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

// Specific email functions
export async function sendVerificationEmail(email: string, token: string) {
  const template = emailTemplates.verification(token);
  return sendEmail(email, template.subject, template.html);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const template = emailTemplates.passwordReset(token);
  return sendEmail(email, template.subject, template.html);
}

export async function sendOrderConfirmationEmail(email: string, order: any) {
  const template = emailTemplates.orderConfirmation(order);
  return sendEmail(email, template.subject, template.html);
}

// Queue email for sending (for production with job queue)
export async function queueEmail(data: {
  to: string;
  subject: string;
  html: string;
  priority?: 'high' | 'normal' | 'low';
}) {
  // In production, this would add to a job queue (Bull, BullMQ, etc.)
  // For now, send directly
  return sendEmail(data.to, data.subject, data.html);
}