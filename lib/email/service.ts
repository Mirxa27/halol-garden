import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import handlebars from 'handlebars';

const prisma = new PrismaClient();

// Email configuration interface
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Email options interface
export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  html?: string;
  text?: string;
  data?: Record<string, any>;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
  }>;
}

// Get SMTP configuration from environment or database
async function getEmailConfig(): Promise<EmailConfig> {
  try {
    // Try to get from database first
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'smtp_config' }
    });
    
    if (setting && setting.value) {
      return setting.value as EmailConfig;
    }
  } catch (error) {
    console.error('Error fetching SMTP config from database:', error);
  }
  
  // Fallback to environment variables
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  };
}

// Create nodemailer transporter
let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (!transporter) {
    const config = await getEmailConfig();
    
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      }
    });
    
    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log('Email transporter verified successfully');
    } catch (error) {
      console.error('Email transporter verification failed:', error);
      throw new Error('Failed to initialize email service');
    }
  }
  
  return transporter;
}

// Compile template with Handlebars
async function compileTemplate(templateName: string, data: Record<string, any>): Promise<string> {
  try {
    // Get template from database
    const template = await prisma.emailTemplate.findUnique({
      where: { name: templateName }
    });
    
    if (!template || !template.isActive) {
      throw new Error(`Email template '${templateName}' not found or inactive`);
    }
    
    // Register Handlebars helpers
    handlebars.registerHelper('formatDate', (date: Date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    });
    
    handlebars.registerHelper('formatCurrency', (amount: number, currency: string = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency
      }).format(amount);
    });
    
    handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
    handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    handlebars.registerHelper('gte', (a: number, b: number) => a >= b);
    handlebars.registerHelper('lt', (a: number, b: number) => a < b);
    handlebars.registerHelper('lte', (a: number, b: number) => a <= b);
    
    // Compile template
    const compiledTemplate = handlebars.compile(template.body);
    const compiledSubject = handlebars.compile(template.subject);
    
    // Add base URL and other common data
    const templateData = {
      ...data,
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      year: new Date().getFullYear(),
      companyName: 'Medical Devices Marketplace',
      supportEmail: 'support@medical-devices.com'
    };
    
    // Return compiled HTML with subject
    return wrapEmailTemplate(compiledTemplate(templateData), compiledSubject(templateData));
  } catch (error) {
    console.error('Template compilation error:', error);
    throw error;
  }
}

// Wrap email content in base template
function wrapEmailTemplate(content: string, subject: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .email-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 40px;
          margin: 20px auto;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #f0f0f0;
        }
        .logo {
          max-width: 200px;
          height: auto;
        }
        h1, h2, h3 {
          color: #2c3e50;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #3498db;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .button:hover {
          background-color: #2980b9;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          color: #666;
          font-size: 14px;
        }
        .social-links {
          margin: 20px 0;
        }
        .social-links a {
          margin: 0 10px;
          color: #3498db;
          text-decoration: none;
        }
        @media (max-width: 600px) {
          body {
            padding: 10px;
          }
          .email-container {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 style="color: #3498db; margin: 0;">Medical Devices Marketplace</h1>
        </div>
        ${content}
        <div class="footer">
          <p>© ${new Date().getFullYear()} Medical Devices Marketplace. All rights reserved.</p>
          <p>
            This email was sent to you because you have an account with us.
            <br>
            If you have any questions, please contact our support team.
          </p>
          <div class="social-links">
            <a href="#">Facebook</a>
            <a href="#">Twitter</a>
            <a href="#">LinkedIn</a>
          </div>
          <p style="font-size: 12px; color: #999;">
            Medical Devices Marketplace<br>
            123 Medical District, Riyadh, Saudi Arabia
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Main email sending function
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = await getTransporter();
    
    // Prepare email content
    let htmlContent: string;
    let subject = options.subject;
    
    if (options.template && options.data) {
      // Use template
      const compiled = await compileTemplate(options.template, options.data);
      htmlContent = compiled;
      
      // Extract subject from template if it contains variables
      const template = await prisma.emailTemplate.findUnique({
        where: { name: options.template }
      });
      if (template) {
        const compiledSubject = handlebars.compile(template.subject);
        subject = compiledSubject(options.data);
      }
    } else if (options.html) {
      // Use provided HTML
      htmlContent = wrapEmailTemplate(options.html, subject);
    } else {
      // Use plain text
      htmlContent = wrapEmailTemplate(`<p>${options.text || ''}</p>`, subject);
    }
    
    // Prepare recipients
    const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    const cc = options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined;
    const bcc = options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined;
    
    // Send email
    const info = await transporter.sendMail({
      from: `"Medical Devices Marketplace" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      cc,
      bcc,
      subject,
      html: htmlContent,
      text: options.text || htmlToText(htmlContent),
      attachments: options.attachments
    });
    
    console.log('Email sent successfully:', info.messageId);
    
    // Log email sending (optional)
    if (process.env.LOG_EMAILS === 'true') {
      await logEmailSent({
        to,
        subject,
        template: options.template,
        messageId: info.messageId,
        status: 'sent'
      });
    }
    
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    
    // Log failed email
    if (process.env.LOG_EMAILS === 'true') {
      await logEmailSent({
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        template: options.template,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    throw error;
  }
}

// Convert HTML to plain text (basic implementation)
function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Log email sending (for audit purposes)
async function logEmailSent(data: {
  to: string;
  subject: string;
  template?: string;
  messageId?: string;
  status: 'sent' | 'failed';
  error?: string;
}): Promise<void> {
  try {
    // You can implement email logging to database here if needed
    console.log('Email log:', data);
  } catch (error) {
    console.error('Failed to log email:', error);
  }
}

// Send bulk emails with rate limiting
export async function sendBulkEmails(
  recipients: string[],
  options: Omit<EmailOptions, 'to'>,
  batchSize: number = 50,
  delayMs: number = 1000
): Promise<{ sent: string[]; failed: string[] }> {
  const sent: string[] = [];
  const failed: string[] = [];
  
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (recipient) => {
        try {
          await sendEmail({ ...options, to: recipient });
          sent.push(recipient);
        } catch (error) {
          console.error(`Failed to send email to ${recipient}:`, error);
          failed.push(recipient);
        }
      })
    );
    
    // Delay between batches
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return { sent, failed };
}

// Queue email for sending (can be integrated with job queue like Bull)
export async function queueEmail(options: EmailOptions): Promise<void> {
  // For now, send immediately
  // In production, you might want to use a job queue
  await sendEmail(options);
}

// Test email configuration
export async function testEmailConfiguration(testEmail: string): Promise<boolean> {
  try {
    await sendEmail({
      to: testEmail,
      subject: 'Test Email - Medical Devices Marketplace',
      html: `
        <h2>Test Email Successful!</h2>
        <p>This is a test email from Medical Devices Marketplace.</p>
        <p>If you received this email, your email configuration is working correctly.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `
    });
    return true;
  } catch (error) {
    console.error('Test email failed:', error);
    return false;
  }
}