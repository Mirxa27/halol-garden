import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';

// Configuration for super admin
const SUPER_ADMIN_CONFIG = {
  email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@medical-devices.com',
  password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@2024!',
  firstName: 'Super',
  lastName: 'Admin',
  phoneNumber: '+966500000000'
};

// System settings defaults
const DEFAULT_SYSTEM_SETTINGS = [
  {
    key: 'site_name',
    value: JSON.stringify('Medical Devices Marketplace'),
    type: 'STRING',
    description: 'Site name displayed across the platform'
  },
  {
    key: 'site_url',
    value: JSON.stringify(process.env.NEXT_PUBLIC_APP_URL || 'https://medical-devices.com'),
    type: 'STRING',
    description: 'Main site URL'
  },
  {
    key: 'support_email',
    value: JSON.stringify('support@medical-devices.com'),
    type: 'STRING',
    description: 'Support email address'
  },
  {
    key: 'default_currency',
    value: JSON.stringify('USD'),
    type: 'STRING',
    description: 'Default currency for the platform'
  },
  {
    key: 'tax_rate',
    value: JSON.stringify(0.15),
    type: 'NUMBER',
    description: 'Default tax rate (15% VAT)'
  },
  {
    key: 'shipping_base_rate',
    value: JSON.stringify(25),
    type: 'NUMBER',
    description: 'Base shipping rate in default currency'
  },
  {
    key: 'free_shipping_threshold',
    value: JSON.stringify(500),
    type: 'NUMBER',
    description: 'Order amount for free shipping'
  },
  {
    key: 'order_cancellation_window',
    value: JSON.stringify(24),
    type: 'NUMBER',
    description: 'Hours allowed for order cancellation'
  },
  {
    key: 'return_window',
    value: JSON.stringify(30),
    type: 'NUMBER',
    description: 'Days allowed for product returns'
  },
  {
    key: 'commission_rate',
    value: JSON.stringify(0.10),
    type: 'NUMBER',
    description: 'Platform commission rate (10%)'
  },
  {
    key: 'maintenance_mode',
    value: JSON.stringify(false),
    type: 'BOOLEAN',
    description: 'Enable/disable maintenance mode'
  },
  {
    key: 'allowed_file_types',
    value: JSON.stringify(['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']),
    type: 'JSON',
    description: 'Allowed file types for uploads'
  },
  {
    key: 'max_file_size',
    value: JSON.stringify(10485760), // 10MB in bytes
    type: 'NUMBER',
    description: 'Maximum file size for uploads (in bytes)'
  },
  {
    key: 'smtp_config',
    value: JSON.stringify({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    }),
    type: 'JSON',
    description: 'SMTP configuration for email sending'
  },
  {
    key: 'payment_gateways',
    value: JSON.stringify({
      stripe: {
        enabled: true,
        publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '',
        secretKey: process.env.STRIPE_SECRET_KEY || ''
      },
      myfatoorah: {
        enabled: true,
        apiKey: process.env.MYFATOORAH_API_KEY || '',
        baseUrl: process.env.MYFATOORAH_BASE_URL || 'https://api.myfatoorah.com'
      },
      paypal: {
        enabled: false,
        clientId: process.env.PAYPAL_CLIENT_ID || '',
        clientSecret: process.env.PAYPAL_CLIENT_SECRET || ''
      }
    }),
    type: 'JSON',
    description: 'Payment gateway configurations'
  },
  {
    key: 'redis_config',
    value: JSON.stringify({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || ''
    }),
    type: 'JSON',
    description: 'Redis configuration for caching'
  },
  {
    key: 'aws_s3_config',
    value: JSON.stringify({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET || 'medical-devices-uploads'
    }),
    type: 'JSON',
    description: 'AWS S3 configuration for file storage'
  },
  {
    key: 'notification_channels',
    value: JSON.stringify({
      email: true,
      sms: false,
      push: true,
      inApp: true
    }),
    type: 'JSON',
    description: 'Enabled notification channels'
  },
  {
    key: 'language_settings',
    value: JSON.stringify({
      default: 'en',
      supported: ['en', 'ar'],
      rtlLanguages: ['ar']
    }),
    type: 'JSON',
    description: 'Language configuration'
  },
  {
    key: 'security_settings',
    value: JSON.stringify({
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSpecialChars: true,
      maxLoginAttempts: 5,
      lockoutDuration: 30, // minutes
      sessionTimeout: 1440, // minutes (24 hours)
      requireEmailVerification: true,
      require2FA: false
    }),
    type: 'JSON',
    description: 'Security configuration settings'
  }
];

// Email templates
const EMAIL_TEMPLATES = [
  {
    name: 'welcome',
    subject: 'Welcome to Medical Devices Marketplace',
    body: `
      <h2>Welcome {{firstName}}!</h2>
      <p>Thank you for joining Medical Devices Marketplace.</p>
      <p>Your account has been successfully created with the email: {{email}}</p>
      <p>Please verify your email by clicking the link below:</p>
      <a href="{{verificationUrl}}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>If you have any questions, please contact our support team.</p>
      <p>Best regards,<br>Medical Devices Marketplace Team</p>
    `,
    variables: JSON.stringify(['firstName', 'email', 'verificationUrl']),
    isActive: true
  },
  {
    name: 'password_reset',
    subject: 'Password Reset Request',
    body: `
      <h2>Password Reset Request</h2>
      <p>Hi {{firstName}},</p>
      <p>We received a request to reset your password. Click the link below to reset it:</p>
      <a href="{{resetUrl}}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>Medical Devices Marketplace Team</p>
    `,
    variables: JSON.stringify(['firstName', 'resetUrl']),
    isActive: true
  },
  {
    name: 'order_confirmation',
    subject: 'Order Confirmation - #{{orderNumber}}',
    body: `
      <h2>Order Confirmation</h2>
      <p>Hi {{firstName}},</p>
      <p>Thank you for your order! Your order #{{orderNumber}} has been confirmed.</p>
      <div style="border: 1px solid #ddd; padding: 15px; margin: 20px 0;">
        <h3>Order Details:</h3>
        <p>Order Number: {{orderNumber}}</p>
        <p>Order Date: {{orderDate}}</p>
        <p>Total Amount: {{totalAmount}} {{currency}}</p>
      </div>
      <p>We'll send you another email when your order ships.</p>
      <a href="{{orderUrl}}" style="background-color: #FF9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order</a>
      <p>Best regards,<br>Medical Devices Marketplace Team</p>
    `,
    variables: JSON.stringify(['firstName', 'orderNumber', 'orderDate', 'totalAmount', 'currency', 'orderUrl']),
    isActive: true
  },
  {
    name: 'order_shipped',
    subject: 'Your Order Has Been Shipped - #{{orderNumber}}',
    body: `
      <h2>Order Shipped</h2>
      <p>Hi {{firstName}},</p>
      <p>Great news! Your order #{{orderNumber}} has been shipped.</p>
      <div style="border: 1px solid #ddd; padding: 15px; margin: 20px 0;">
        <h3>Shipping Details:</h3>
        <p>Tracking Number: {{trackingNumber}}</p>
        <p>Carrier: {{carrier}}</p>
        <p>Estimated Delivery: {{estimatedDelivery}}</p>
      </div>
      <a href="{{trackingUrl}}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Track Package</a>
      <p>Best regards,<br>Medical Devices Marketplace Team</p>
    `,
    variables: JSON.stringify(['firstName', 'orderNumber', 'trackingNumber', 'carrier', 'estimatedDelivery', 'trackingUrl']),
    isActive: true
  },
  {
    name: 'maintenance_scheduled',
    subject: 'Maintenance Scheduled - Request #{{requestNumber}}',
    body: `
      <h2>Maintenance Scheduled</h2>
      <p>Hi {{firstName}},</p>
      <p>Your maintenance request #{{requestNumber}} has been scheduled.</p>
      <div style="border: 1px solid #ddd; padding: 15px; margin: 20px 0;">
        <h3>Appointment Details:</h3>
        <p>Date: {{scheduledDate}}</p>
        <p>Time: {{scheduledTime}}</p>
        <p>Engineer: {{engineerName}}</p>
        <p>Equipment: {{equipmentName}}</p>
      </div>
      <p>Please ensure the equipment is accessible at the scheduled time.</p>
      <p>Best regards,<br>Medical Devices Marketplace Team</p>
    `,
    variables: JSON.stringify(['firstName', 'requestNumber', 'scheduledDate', 'scheduledTime', 'engineerName', 'equipmentName']),
    isActive: true
  }
];

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Clean existing data in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('🧹 Cleaning existing data...');
      await prisma.$transaction([
        prisma.emailTemplate.deleteMany(),
        prisma.systemSetting.deleteMany(),
        prisma.adminProfile.deleteMany(),
        prisma.user.deleteMany(),
      ]);
    }

    // Create Super Admin
    console.log('👤 Creating Super Admin...');
    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_CONFIG.password, 12);
    
    const superAdmin = await prisma.user.create({
      data: {
        email: SUPER_ADMIN_CONFIG.email,
        passwordHash: hashedPassword,
        firstName: SUPER_ADMIN_CONFIG.firstName,
        lastName: SUPER_ADMIN_CONFIG.lastName,
        phoneNumber: SUPER_ADMIN_CONFIG.phoneNumber,
        userType: 'ADMIN',
        status: 'ACTIVE',
        verificationStatus: 'FULLY_VERIFIED',
        emailVerifiedAt: new Date(),
        adminProfile: {
          create: {
            role: 'SUPER_ADMIN',
            permissions: [
              'users.create',
              'users.read',
              'users.update',
              'users.delete',
              'products.create',
              'products.read',
              'products.update',
              'products.delete',
              'orders.create',
              'orders.read',
              'orders.update',
              'orders.delete',
              'payments.manage',
              'settings.manage',
              'reports.view',
              'reports.export',
              'system.configure',
              'system.maintenance',
              'analytics.view',
              'support.manage',
              'notifications.send',
              'emails.manage',
              'cache.manage',
              'logs.view',
              'audit.view',
              'backup.manage'
            ]
          }
        }
      },
      include: {
        adminProfile: true
      }
    });

    console.log(`✅ Super Admin created: ${superAdmin.email}`);

    // Create System Settings
    console.log('⚙️ Creating system settings...');
    for (const setting of DEFAULT_SYSTEM_SETTINGS) {
      await prisma.systemSetting.create({
        data: setting
      });
    }
    console.log(`✅ Created ${DEFAULT_SYSTEM_SETTINGS.length} system settings`);

    // Create Email Templates
    console.log('📧 Creating email templates...');
    for (const template of EMAIL_TEMPLATES) {
      await prisma.emailTemplate.create({
        data: template
      });
    }
    console.log(`✅ Created ${EMAIL_TEMPLATES.length} email templates`);

    // Create demo data in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('🎭 Creating demo data...');
      
      // Create demo supplier
      const demoSupplierPassword = await bcrypt.hash('Demo@2024!', 12);
      const demoSupplier = await prisma.user.create({
        data: {
          email: 'supplier@demo.com',
          passwordHash: demoSupplierPassword,
          firstName: 'Demo',
          lastName: 'Supplier',
          phoneNumber: '+966501234567',
          userType: 'EQUIPMENT_SUPPLIER',
          status: 'ACTIVE',
          verificationStatus: 'FULLY_VERIFIED',
          emailVerifiedAt: new Date(),
          supplierProfile: {
            create: {
              companyName: 'MedTech Solutions',
              businessRegistrationNumber: 'CR123456789',
              taxId: 'TAX123456',
              yearEstablished: 2015,
              numberOfEmployees: 50,
              website: 'https://medtech-solutions.com',
              address: {
                street: '123 Medical District',
                city: 'Riyadh',
                state: 'Riyadh Province',
                country: 'Saudi Arabia',
                postalCode: '11564'
              },
              productCategories: ['DIAGNOSTIC', 'MONITORING', 'SURGICAL'],
              certifications: [
                { name: 'ISO 13485', issuer: 'ISO', year: 2020 },
                { name: 'CE Mark', issuer: 'EU', year: 2021 }
              ],
              brands: ['Siemens', 'GE Healthcare', 'Philips'],
              verified: true,
              verifiedAt: new Date(),
              rating: 4.5
            }
          }
        },
        include: {
          supplierProfile: true
        }
      });

      // Create demo products
      const productData = [
        {
          supplierId: demoSupplier.supplierProfile!.id,
          name: 'Digital X-Ray System',
          nameAr: 'نظام الأشعة السينية الرقمي',
          description: 'High-resolution digital X-ray system with advanced imaging capabilities. Features include automated exposure control, image enhancement software, and DICOM compatibility.',
          descriptionAr: 'نظام أشعة سينية رقمي عالي الدقة مع قدرات تصوير متقدمة',
          sku: 'DXR-2024-001',
          barcode: '1234567890123',
          category: 'IMAGING',
          condition: 'NEW',
          status: 'ACTIVE',
          price: 45000,
          compareAtPrice: 50000,
          costPrice: 35000,
          currency: 'USD',
          quantity: 5,
          minOrderQuantity: 1,
          weight: 250,
          dimensions: { length: 200, width: 150, height: 180 },
          images: [
            '/images/products/xray-system-1.jpg',
            '/images/products/xray-system-2.jpg'
          ],
          specifications: {
            'Power Requirements': '220V, 50/60Hz',
            'Detector Size': '43cm x 43cm',
            'Resolution': '3.5 lp/mm',
            'Exposure Range': '40-150 kVp'
          },
          features: [
            'Automated exposure control',
            'Touch screen interface',
            'DICOM 3.0 compatible',
            'Wireless detector option'
          ],
          certifications: ['FDA', 'CE', 'SFDA'],
          warrantyPeriod: 24,
          isFeatured: true,
          isPublished: true,
          publishedAt: new Date()
        },
        {
          supplierId: demoSupplier.supplierProfile!.id,
          name: 'Patient Monitor Pro',
          nameAr: 'جهاز مراقبة المريض الاحترافي',
          description: 'Multi-parameter patient monitor with ECG, SpO2, NIBP, temperature, and respiration monitoring. 15-inch touchscreen display with customizable alarms.',
          descriptionAr: 'جهاز مراقبة المريض متعدد المعايير',
          sku: 'PMO-2024-002',
          barcode: '1234567890124',
          category: 'MONITORING',
          condition: 'NEW',
          status: 'ACTIVE',
          price: 8500,
          compareAtPrice: 9500,
          costPrice: 6500,
          currency: 'USD',
          quantity: 15,
          minOrderQuantity: 1,
          weight: 8.5,
          dimensions: { length: 40, width: 35, height: 45 },
          images: [
            '/images/products/patient-monitor-1.jpg',
            '/images/products/patient-monitor-2.jpg'
          ],
          specifications: {
            'Display': '15-inch TFT touchscreen',
            'Parameters': 'ECG, SpO2, NIBP, Temp, Resp',
            'Battery Life': '4 hours',
            'Data Storage': '72 hours trending'
          },
          features: [
            'Multi-parameter monitoring',
            'Touchscreen interface',
            'Wireless connectivity',
            'Central monitoring compatible'
          ],
          certifications: ['FDA', 'CE', 'SFDA'],
          warrantyPeriod: 12,
          isFeatured: true,
          isPublished: true,
          publishedAt: new Date()
        },
        {
          supplierId: demoSupplier.supplierProfile!.id,
          name: 'Surgical LED Light',
          nameAr: 'مصباح جراحي LED',
          description: 'Advanced LED surgical light with adjustable intensity and color temperature. Shadow-free illumination with excellent color rendering.',
          descriptionAr: 'مصباح جراحي LED متقدم',
          sku: 'SLL-2024-003',
          barcode: '1234567890125',
          category: 'SURGICAL',
          condition: 'NEW',
          status: 'ACTIVE',
          price: 12000,
          compareAtPrice: 14000,
          costPrice: 9000,
          currency: 'USD',
          quantity: 8,
          minOrderQuantity: 1,
          weight: 85,
          dimensions: { length: 70, width: 70, height: 200 },
          images: [
            '/images/products/surgical-light-1.jpg',
            '/images/products/surgical-light-2.jpg'
          ],
          specifications: {
            'Light Intensity': '160,000 Lux',
            'Color Temperature': '3500-5000K',
            'CRI': '>95',
            'LED Life': '60,000 hours'
          },
          features: [
            'Shadow-free illumination',
            'Adjustable color temperature',
            'Sterile handle covers',
            'Camera integration ready'
          ],
          certifications: ['FDA', 'CE', 'IEC 60601'],
          warrantyPeriod: 36,
          isPublished: true,
          publishedAt: new Date()
        }
      ];

      for (const product of productData) {
        await prisma.product.create({ data: product });
      }
      console.log(`✅ Created ${productData.length} demo products`);

      // Create demo healthcare provider
      const demoProviderPassword = await bcrypt.hash('Demo@2024!', 12);
      await prisma.user.create({
        data: {
          email: 'hospital@demo.com',
          passwordHash: demoProviderPassword,
          firstName: 'King',
          lastName: 'Hospital',
          phoneNumber: '+966502345678',
          userType: 'HEALTHCARE_PROVIDER',
          status: 'ACTIVE',
          verificationStatus: 'FULLY_VERIFIED',
          emailVerifiedAt: new Date(),
          healthcareProfile: {
            create: {
              organizationName: 'King Medical Center',
              organizationType: 'Hospital',
              licenseNumber: 'HLC987654321',
              taxRegistrationNumber: 'TAX987654',
              numberOfBeds: 500,
              yearEstablished: 1990,
              emergencyContact: '+966509999999',
              website: 'https://king-medical.sa',
              address: {
                street: '456 Healthcare Avenue',
                city: 'Jeddah',
                state: 'Makkah Province',
                country: 'Saudi Arabia',
                postalCode: '21589'
              },
              specializations: [
                'Cardiology',
                'Neurology',
                'Orthopedics',
                'Emergency Medicine'
              ],
              certifications: [
                { name: 'JCI Accreditation', issuer: 'JCI', year: 2022 },
                { name: 'CBAHI', issuer: 'CBAHI', year: 2023 }
              ],
              operatingHours: {
                monday: { open: '00:00', close: '23:59' },
                tuesday: { open: '00:00', close: '23:59' },
                wednesday: { open: '00:00', close: '23:59' },
                thursday: { open: '00:00', close: '23:59' },
                friday: { open: '00:00', close: '23:59' },
                saturday: { open: '00:00', close: '23:59' },
                sunday: { open: '00:00', close: '23:59' }
              }
            }
          }
        }
      });

      console.log('✅ Demo data created successfully');
    }

    console.log('🎉 Database seed completed successfully!');
    console.log('\n📝 Super Admin Credentials:');
    console.log(`   Email: ${SUPER_ADMIN_CONFIG.email}`);
    console.log(`   Password: ${SUPER_ADMIN_CONFIG.password}`);
    console.log('\n⚠️  Please change the super admin password after first login!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });