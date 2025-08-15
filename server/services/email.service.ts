import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config();

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: any[];
}

// Create transporter
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const mailOptions = {
      from: options.from || process.env.EMAIL_FROM || 'Medical Marketplace <noreply@medicalmarketplace.com>',
      to: Array.isArray(options.to) ? options.to.join(',') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
      attachments: options.attachments,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Send bulk emails
 */
export async function sendBulkEmails(recipients: string[], subject: string, html: string): Promise<void> {
  const batchSize = 50;
  
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    await sendEmail({
      to: batch,
      subject,
      html,
    });
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

/**
 * Email templates
 */
export const EmailTemplates = {
  welcomeEmail: (name: string) => ({
    subject: 'Welcome to Medical Marketplace',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f4f4f4; }
            .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Medical Marketplace</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Welcome to the leading medical equipment marketplace in the region!</p>
              <p>You can now:</p>
              <ul>
                <li>Browse thousands of medical equipment products</li>
                <li>Connect with verified suppliers</li>
                <li>Request maintenance services</li>
                <li>Manage rentals and purchases</li>
              </ul>
              <p>Get started by completing your profile:</p>
              <a href="${process.env.CLIENT_URL}/profile" class="button">Complete Profile</a>
            </div>
            <div class="footer">
              <p>&copy; 2024 Medical Marketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  orderConfirmation: (orderNumber: string, total: number, currency: string) => ({
    subject: `Order Confirmation - ${orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f4f4f4; }
            .order-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmed!</h1>
            </div>
            <div class="content">
              <h2>Thank you for your order</h2>
              <div class="order-details">
                <p><strong>Order Number:</strong> ${orderNumber}</p>
                <p><strong>Total Amount:</strong> ${currency} ${total.toFixed(2)}</p>
              </div>
              <p>We'll send you an email when your order ships.</p>
              <a href="${process.env.CLIENT_URL}/orders/${orderNumber}" class="button">View Order</a>
            </div>
            <div class="footer">
              <p>&copy; 2024 Medical Marketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  maintenanceScheduled: (requestNumber: string, scheduledDate: Date, engineerName: string) => ({
    subject: `Maintenance Scheduled - ${requestNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #17a2b8; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f4f4f4; }
            .details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Maintenance Scheduled</h1>
            </div>
            <div class="content">
              <h2>Your maintenance request has been scheduled</h2>
              <div class="details">
                <p><strong>Request Number:</strong> ${requestNumber}</p>
                <p><strong>Scheduled Date:</strong> ${scheduledDate.toLocaleDateString()}</p>
                <p><strong>Engineer:</strong> ${engineerName}</p>
              </div>
              <p>The engineer will contact you before the visit.</p>
              <a href="${process.env.CLIENT_URL}/maintenance/${requestNumber}" class="button">View Details</a>
            </div>
            <div class="footer">
              <p>&copy; 2024 Medical Marketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  rentalReminder: (agreementNumber: string, endDate: Date, daysRemaining: number) => ({
    subject: `Rental Return Reminder - ${agreementNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #ffc107; color: #333; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f4f4f4; }
            .alert { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Rental Return Reminder</h1>
            </div>
            <div class="content">
              <div class="alert">
                <p><strong>Your rental period ends in ${daysRemaining} days!</strong></p>
                <p>Agreement Number: ${agreementNumber}</p>
                <p>Return Date: ${endDate.toLocaleDateString()}</p>
              </div>
              <p>Please arrange for the equipment return or extend your rental period.</p>
              <a href="${process.env.CLIENT_URL}/rentals/${agreementNumber}" class="button">Manage Rental</a>
            </div>
            <div class="footer">
              <p>&copy; 2024 Medical Marketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }),
};

export default {
  sendEmail,
  sendBulkEmails,
  EmailTemplates,
};