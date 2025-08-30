import nodemailer from 'nodemailer';
import { prisma } from '../config/database';
import { renderEmailTemplate } from '../templates/email';
import { logger } from '@/lib/logger';

interface EmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  data: any;
  attachments?: Array<{
    filename: string;
    content?: Buffer;
    path?: string;
  }>;
}

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;
  private static readonly FROM_EMAIL = process.env.SMTP_FROM || 'noreply@medicaldevices.com';
  private static readonly FROM_NAME = process.env.SMTP_FROM_NAME || 'Medical Devices Marketplace';

  /**
   * Initialize email transporter
   */
  private static async initializeTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    const config: SMTPConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    // Create transporter
    this.transporter = nodemailer.createTransporter(config);

    // Verify connection
    try {
      await this.transporter.verify();
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Email service initialization failed:', error);
      // Fall back to console logging in development
      if (process.env.NODE_ENV === 'development') {
        this.transporter = {
          sendMail: async (options: any) => {
            console.log('📧 Email would be sent:', options);
            return { messageId: 'dev-' + Date.now() };
          },
        } as any;
      }
    }

    return this.transporter;
  }

  /**
   * Send email
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const transporter = await this.initializeTransporter();
      
      if (!transporter) {
        throw new Error('Email transporter not initialized');
      }

      // Render email template
      const { html, text } = await renderEmailTemplate(options.template, options.data);

      // Prepare email options
      const mailOptions = {
        from: `${this.FROM_NAME} <${this.FROM_EMAIL}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html,
        text,
        attachments: options.attachments,
      };

      // Send email
      const result = await transporter.sendMail(mailOptions);
      
      // Log email sent
      await this.logEmailSent({
        to: options.to,
        subject: options.subject,
        template: options.template,
        messageId: result.messageId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      
      // Log email failure
      await this.logEmailFailed({
        to: options.to,
        subject: options.subject,
        template: options.template,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Don't throw in production, just log
      if (process.env.NODE_ENV === 'production') {
        return false;
      }
      
      throw error;
    }
  }

  /**
   * Send order confirmation email
   */
  static async sendOrderConfirmation(orderId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      await this.sendEmail({
        to: order.user.email,
        subject: `Order Confirmation - ${order.orderNumber}`,
        template: 'order-confirmation',
        data: {
          user: {
            firstName: order.user.firstName,
            lastName: order.user.lastName,
          },
          order: {
            orderNumber: order.orderNumber,
            total: order.total,
            items: order.items.map(item => ({
              name: item.product.name,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
            })),
            shippingAddress: order.shippingAddress,
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to send order confirmation:', error);
    }
  }

  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      await this.sendEmail({
        to: user.email,
        subject: 'Welcome to Medical Devices Marketplace',
        template: 'welcome',
        data: {
          user: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            userType: user.userType,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string, resetToken: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return; // Don't reveal if user exists
      }

      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

      await this.sendEmail({
        to: email,
        subject: 'Password Reset Request',
        template: 'password-reset',
        data: {
          user: {
            firstName: user.firstName,
            lastName: user.lastName,
          },
          resetUrl,
          expiresIn: '1 hour',
        },
      });
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
    }
  }

  /**
   * Send shipping notification
   */
  static async sendShippingNotification(orderId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          shipping: true,
        },
      });

      if (!order || !order.shipping) {
        throw new Error('Order or shipping information not found');
      }

      await this.sendEmail({
        to: order.user.email,
        subject: `Your Order ${order.orderNumber} Has Been Shipped`,
        template: 'shipping-notification',
        data: {
          user: {
            firstName: order.user.firstName,
            lastName: order.user.lastName,
          },
          order: {
            orderNumber: order.orderNumber,
            trackingNumber: order.shipping.trackingNumber,
            carrier: order.shipping.carrier,
            estimatedDelivery: order.shipping.estimatedDelivery,
            trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/track/${order.shipping.trackingNumber}`,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to send shipping notification:', error);
    }
  }

  /**
   * Send low stock alert to supplier
   */
  static async sendLowStockAlert(productId: string) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          supplier: {
            include: {
              user: true,
            },
          },
          salesDetails: true,
        },
      });

      if (!product || !product.supplier) {
        throw new Error('Product or supplier not found');
      }

      const inventory = product.salesDetails?.inventory as any;
      const currentStock = inventory?.quantity || 0;

      await this.sendEmail({
        to: product.supplier.user.email,
        subject: `Low Stock Alert: ${product.name}`,
        template: 'low-stock-alert',
        data: {
          supplier: {
            companyName: product.supplier.companyName,
          },
          product: {
            name: product.name,
            sku: product.sku,
            currentStock,
            recommendedReorder: currentStock * 3, // Suggest 3x current stock
          },
        },
      });
    } catch (error) {
      logger.error('Failed to send low stock alert:', error);
    }
  }

  /**
   * Send invoice email
   */
  static async sendInvoice(orderId: string, invoicePdf?: Buffer) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      const attachments = invoicePdf ? [{
        filename: `invoice-${order.orderNumber}.pdf`,
        content: invoicePdf,
      }] : undefined;

      await this.sendEmail({
        to: order.user.email,
        subject: `Invoice for Order ${order.orderNumber}`,
        template: 'invoice',
        data: {
          user: {
            firstName: order.user.firstName,
            lastName: order.user.lastName,
          },
          order: {
            orderNumber: order.orderNumber,
            total: order.total,
            createdAt: order.createdAt,
          },
        },
        attachments,
      });
    } catch (error) {
      logger.error('Failed to send invoice:', error);
    }
  }

  /**
   * Send bulk email (for marketing)
   */
  static async sendBulkEmail(
    recipients: string[],
    subject: string,
    template: string,
    data: any
  ) {
    const results = [];
    
    // Send in batches to avoid overwhelming the SMTP server
    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(email => 
          this.sendEmail({
            to: email,
            subject,
            template,
            data: {
              ...data,
              unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${email}`,
            },
          })
        )
      );
      
      results.push(...batchResults);
      
      // Add delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    logger.info(`Bulk email sent: ${successful} successful, ${failed} failed`);
    
    return {
      total: recipients.length,
      successful,
      failed,
    };
  }

  /**
   * Log email sent
   */
  private static async logEmailSent(data: {
    to: string | string[];
    subject: string;
    template: string;
    messageId: string;
  }) {
    try {
      // Store in database for tracking
      // You might want to create an EmailLog model
      logger.info('Email sent:', {
        to: Array.isArray(data.to) ? data.to.join(', ') : data.to,
        subject: data.subject,
        template: data.template,
        messageId: data.messageId,
      });
    } catch (error) {
      logger.error('Failed to log email sent:', error);
    }
  }

  /**
   * Log email failure
   */
  private static async logEmailFailed(data: {
    to: string | string[];
    subject: string;
    template: string;
    error: string;
  }) {
    try {
      logger.error('Email failed:', {
        to: Array.isArray(data.to) ? data.to.join(', ') : data.to,
        subject: data.subject,
        template: data.template,
        error: data.error,
      });
    } catch (error) {
      logger.error('Failed to log email failure:', error);
    }
  }

  /**
   * Test email configuration
   */
  static async testEmailConfiguration(testEmail: string): Promise<boolean> {
    try {
      await this.sendEmail({
        to: testEmail,
        subject: 'Test Email - Medical Devices Marketplace',
        template: 'test',
        data: {
          timestamp: new Date().toISOString(),
          config: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            from: this.FROM_EMAIL,
          },
        },
      });
      
      return true;
    } catch (error) {
      logger.error('Email configuration test failed:', error);
      return false;
    }
  }
}

export default EmailService;