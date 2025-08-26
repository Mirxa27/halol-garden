import * as fs from 'fs/promises';
import * as path from 'path';
import handlebars from 'handlebars';

// Register Handlebars helpers
handlebars.registerHelper('formatCurrency', (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
});

handlebars.registerHelper('formatDate', (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
});

handlebars.registerHelper('formatDateTime', (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
});

// Template cache
const templateCache = new Map<string, handlebars.TemplateDelegate>();

/**
 * Get email template
 */
async function getTemplate(templateName: string): Promise<handlebars.TemplateDelegate> {
  // Check cache
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName)!;
  }

  // For now, return inline templates
  // In production, you'd load these from files
  const templates: Record<string, string> = {
    'order-confirmation': `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
    .order-summary { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .item-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .item-row:last-child { border-bottom: none; }
    .total-row { font-weight: bold; font-size: 1.2em; margin-top: 10px; padding-top: 10px; border-top: 2px solid #333; }
    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 0.875em; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Order Confirmed! 🎉</h1>
    <p>Thank you for your purchase</p>
  </div>
  
  <div class="content">
    <p>Hi {{user.firstName}},</p>
    
    <p>We're excited to confirm that we've received your order <strong>#{{order.orderNumber}}</strong> and it's being processed.</p>
    
    <div class="order-summary">
      <h3>Order Summary</h3>
      {{#each order.items}}
      <div class="item-row">
        <div>
          <strong>{{this.name}}</strong><br>
          Quantity: {{this.quantity}}
        </div>
        <div>{{formatCurrency this.total}}</div>
      </div>
      {{/each}}
      
      <div class="total-row">
        <div style="display: flex; justify-content: space-between;">
          <span>Total</span>
          <span>{{formatCurrency order.total}}</span>
        </div>
      </div>
    </div>
    
    <h3>Shipping Address</h3>
    <p>
      {{order.shippingAddress.street}}<br>
      {{order.shippingAddress.city}}, {{order.shippingAddress.state}} {{order.shippingAddress.postalCode}}<br>
      {{order.shippingAddress.country}}
    </p>
    
    <h3>Payment Method</h3>
    <p>{{order.paymentMethod}}</p>
    
    <div style="text-align: center;">
      <a href="{{@root.baseUrl}}/orders/{{order.orderNumber}}" class="button">View Order Details</a>
    </div>
    
    <p>You'll receive another email when your order ships. If you have any questions, please don't hesitate to contact us.</p>
  </div>
  
  <div class="footer">
    <p>© 2024 Medical Devices Marketplace. All rights reserved.</p>
    <p>This email was sent to {{user.email}} regarding order #{{order.orderNumber}}</p>
  </div>
</body>
</html>
    `,
    
    'welcome': `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
    .feature { display: flex; align-items: center; margin: 20px 0; }
    .feature-icon { font-size: 2em; margin-right: 15px; }
    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 0.875em; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to Medical Devices Marketplace! 🏥</h1>
    <p>Your trusted partner in healthcare procurement</p>
  </div>
  
  <div class="content">
    <p>Hi {{user.firstName}},</p>
    
    <p>Welcome aboard! We're thrilled to have you join our community of healthcare professionals and medical equipment suppliers.</p>
    
    <h3>What you can do now:</h3>
    
    <div class="feature">
      <span class="feature-icon">🔍</span>
      <div>
        <strong>Browse Products</strong><br>
        Explore our extensive catalog of medical devices and equipment
      </div>
    </div>
    
    <div class="feature">
      <span class="feature-icon">💼</span>
      <div>
        <strong>Complete Your Profile</strong><br>
        Add more details to unlock personalized recommendations
      </div>
    </div>
    
    <div class="feature">
      <span class="feature-icon">📊</span>
      <div>
        <strong>Access Your Dashboard</strong><br>
        Track orders, manage inventory, and view analytics
      </div>
    </div>
    
    <div style="text-align: center;">
      <a href="{{@root.baseUrl}}/dashboard" class="button">Go to Dashboard</a>
    </div>
    
    <p>If you have any questions or need assistance, our support team is here to help 24/7.</p>
    
    <p>Best regards,<br>The Medical Devices Team</p>
  </div>
  
  <div class="footer">
    <p>© 2024 Medical Devices Marketplace. All rights reserved.</p>
    <p>This email was sent to {{user.email}}</p>
  </div>
</body>
</html>
    `,
    
    'password-reset': `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 0.875em; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Password Reset Request</h1>
  </div>
  
  <div class="content">
    <p>Hi {{user.firstName}},</p>
    
    <p>We received a request to reset the password for your Medical Devices Marketplace account.</p>
    
    <div style="text-align: center;">
      <a href="{{resetUrl}}" class="button">Reset Password</a>
    </div>
    
    <div class="warning">
      <strong>⚠️ Important:</strong>
      <ul style="margin: 10px 0;">
        <li>This link will expire in {{expiresIn}}</li>
        <li>If you didn't request this, please ignore this email</li>
        <li>Your password won't change until you create a new one</li>
      </ul>
    </div>
    
    <p>For security reasons, this password reset link will only work once. If you need to reset your password again, please request a new link.</p>
    
    <p>If the button above doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #667eea;">{{resetUrl}}</p>
  </div>
  
  <div class="footer">
    <p>© 2024 Medical Devices Marketplace. All rights reserved.</p>
    <p>This is a security-related email sent to {{user.email}}</p>
  </div>
</body>
</html>
    `,
    
    'shipping-notification': `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Shipped</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
    .tracking-box { background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 10px; }
    .footer { text-align: center; color: #6b7280; font-size: 0.875em; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Your Order Has Been Shipped! 📦</h1>
  </div>
  
  <div class="content">
    <p>Hi {{user.firstName}},</p>
    
    <p>Great news! Your order <strong>#{{order.orderNumber}}</strong> has been shipped and is on its way to you.</p>
    
    <div class="tracking-box">
      <h3>Tracking Information</h3>
      <p style="font-size: 1.2em; margin: 10px 0;">
        <strong>Tracking Number:</strong> {{order.trackingNumber}}
      </p>
      <p>
        <strong>Carrier:</strong> {{order.carrier}}<br>
        <strong>Estimated Delivery:</strong> {{formatDate order.estimatedDelivery}}
      </p>
      <a href="{{order.trackingUrl}}" class="button">Track Package</a>
    </div>
    
    <h3>Delivery Tips:</h3>
    <ul>
      <li>Someone should be available to receive the package</li>
      <li>Check the tracking link for real-time updates</li>
      <li>Contact us if you need to change the delivery address</li>
    </ul>
    
    <p>If you have any questions about your shipment, please don't hesitate to contact our support team.</p>
  </div>
  
  <div class="footer">
    <p>© 2024 Medical Devices Marketplace. All rights reserved.</p>
    <p>Shipping notification for order #{{order.orderNumber}}</p>
  </div>
</body>
</html>
    `,
    
    'low-stock-alert': `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Low Stock Alert</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
    .alert-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 0.875em; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚠️ Low Stock Alert</h1>
  </div>
  
  <div class="content">
    <p>Dear {{supplier.companyName}},</p>
    
    <p>This is an automated alert to inform you that one of your products is running low on stock.</p>
    
    <div class="alert-box">
      <h3>Product Details</h3>
      <p>
        <strong>Product:</strong> {{product.name}}<br>
        <strong>SKU:</strong> {{product.sku}}<br>
        <strong>Current Stock:</strong> <span style="color: #dc2626; font-weight: bold;">{{product.currentStock}} units</span><br>
        <strong>Recommended Reorder:</strong> {{product.recommendedReorder}} units
      </p>
    </div>
    
    <p>To avoid stockouts and maintain customer satisfaction, we recommend restocking this product as soon as possible.</p>
    
    <div style="text-align: center;">
      <a href="{{@root.baseUrl}}/supplier/inventory" class="button">Manage Inventory</a>
    </div>
    
    <p>You can update your inventory levels directly from your supplier dashboard.</p>
  </div>
  
  <div class="footer">
    <p>© 2024 Medical Devices Marketplace. All rights reserved.</p>
    <p>This is an automated inventory alert</p>
  </div>
</body>
</html>
    `,
    
    'invoice': `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
    .invoice-box { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 0.875em; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Invoice</h1>
  </div>
  
  <div class="content">
    <p>Hi {{user.firstName}},</p>
    
    <p>Please find attached the invoice for your order <strong>#{{order.orderNumber}}</strong>.</p>
    
    <div class="invoice-box">
      <h3>Invoice Summary</h3>
      <p>
        <strong>Order Number:</strong> {{order.orderNumber}}<br>
        <strong>Order Date:</strong> {{formatDate order.createdAt}}<br>
        <strong>Total Amount:</strong> {{formatCurrency order.total}}
      </p>
    </div>
    
    <p>The detailed invoice is attached to this email as a PDF document. You can also download it from your account dashboard.</p>
    
    <div style="text-align: center;">
      <a href="{{@root.baseUrl}}/orders/{{order.orderNumber}}/invoice" class="button">View Invoice Online</a>
    </div>
    
    <p>Thank you for your business!</p>
  </div>
  
  <div class="footer">
    <p>© 2024 Medical Devices Marketplace. All rights reserved.</p>
    <p>Invoice for order #{{order.orderNumber}}</p>
  </div>
</body>
</html>
    `,
    
    'test': `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Test Email</title>
</head>
<body>
  <h1>Test Email</h1>
  <p>This is a test email from Medical Devices Marketplace.</p>
  <p>Timestamp: {{timestamp}}</p>
  <p>Configuration:</p>
  <ul>
    <li>Host: {{config.host}}</li>
    <li>Port: {{config.port}}</li>
    <li>From: {{config.from}}</li>
  </ul>
</body>
</html>
    `,
  };

  const templateSource = templates[templateName];
  if (!templateSource) {
    throw new Error(`Email template '${templateName}' not found`);
  }

  const compiled = handlebars.compile(templateSource);
  templateCache.set(templateName, compiled);
  
  return compiled;
}

/**
 * Render email template
 */
export async function renderEmailTemplate(
  templateName: string,
  data: any
): Promise<{ html: string; text: string }> {
  try {
    const template = await getTemplate(templateName);
    
    // Add base URL to data
    const enrichedData = {
      ...data,
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    };
    
    const html = template(enrichedData);
    
    // Simple HTML to text conversion
    const text = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return { html, text };
  } catch (error) {
    console.error(`Failed to render email template '${templateName}':`, error);
    throw error;
  }
}

export default { renderEmailTemplate };