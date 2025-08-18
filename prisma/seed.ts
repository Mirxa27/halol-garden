import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await cleanDatabase();

  // Create users
  const users = await createUsers();
  console.log('✅ Created users');

  // Create products
  const products = await createProducts(users.supplier);
  console.log('✅ Created products');

  // Create orders
  await createOrders(users.customer, products);
  console.log('✅ Created orders');

  // Create reviews
  await createReviews(users.customer, products);
  console.log('✅ Created reviews');

  // Create system settings
  await createSystemSettings();
  console.log('✅ Created system settings');

  // Create email templates
  await createEmailTemplates();
  console.log('✅ Created email templates');

  console.log('🎉 Database seed completed successfully!');
}

async function cleanDatabase() {
  // Delete in order of dependencies
  const deleteOperations = [
    prisma.auditLog.deleteMany(),
    prisma.session.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.passwordReset.deleteMany(),
    prisma.emailTemplate.deleteMany(),
    prisma.systemSetting.deleteMany(),
    prisma.priceHistory.deleteMany(),
    prisma.inventoryLog.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.supportTicket.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.chatMessage.deleteMany(),
    prisma.chatParticipant.deleteMany(),
    prisma.chatSession.deleteMany(),
    prisma.maintenanceRequest.deleteMany(),
    prisma.rentalPayment.deleteMany(),
    prisma.rentalItem.deleteMany(),
    prisma.rentalAgreement.deleteMany(),
    prisma.productAnswer.deleteMany(),
    prisma.productQuestion.deleteMany(),
    prisma.productReview.deleteMany(),
    prisma.wishlistItem.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.shipment.deleteMany(),
    prisma.refund.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.product.deleteMany(),
    prisma.individualCustomer.deleteMany(),
    prisma.adminProfile.deleteMany(),
    prisma.customerServiceProfile.deleteMany(),
    prisma.maintenanceEngineer.deleteMany(),
    prisma.equipmentSupplier.deleteMany(),
    prisma.healthcareProvider.deleteMany(),
    prisma.user.deleteMany(),
  ];

  await prisma.$transaction(deleteOperations);
  console.log('🧹 Cleaned existing data');
}

async function createUsers() {
  const passwordHash = await hash('Demo123!@#', 12);

  // Admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@medicaldevices.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      phoneNumber: '+1234567890',
      userType: 'ADMIN',
      status: 'ACTIVE',
      verificationStatus: 'FULLY_VERIFIED',
      emailVerifiedAt: new Date(),
      adminProfile: {
        create: {
          role: 'SUPER_ADMIN',
          permissions: ['ALL'],
        },
      },
    },
  });

  // Healthcare Provider
  const healthcare = await prisma.user.create({
    data: {
      email: 'hospital@demo.com',
      passwordHash,
      firstName: 'King',
      lastName: 'Faisal Hospital',
      phoneNumber: '+966501234567',
      userType: 'HEALTHCARE_PROVIDER',
      status: 'ACTIVE',
      verificationStatus: 'FULLY_VERIFIED',
      emailVerifiedAt: new Date(),
      healthcareProfile: {
        create: {
          organizationName: 'King Faisal Specialist Hospital',
          organizationType: 'Hospital',
          licenseNumber: 'KSA-HOSP-2024-001',
          numberOfBeds: 500,
          yearEstablished: 1975,
          website: 'https://kfshrc.edu.sa',
          address: {
            street: '123 Medical District',
            city: 'Riyadh',
            state: 'Riyadh Province',
            country: 'Saudi Arabia',
            postalCode: '11211',
          },
          specializations: ['Cardiology', 'Oncology', 'Neurology', 'Pediatrics'],
          certifications: ['JCI', 'ISO 9001', 'CBAHI'],
        },
      },
    },
  });

  // Equipment Supplier
  const supplier = await prisma.user.create({
    data: {
      email: 'supplier@medtech.com',
      passwordHash,
      firstName: 'MedTech',
      lastName: 'Solutions',
      phoneNumber: '+971501234567',
      userType: 'EQUIPMENT_SUPPLIER',
      status: 'ACTIVE',
      verificationStatus: 'FULLY_VERIFIED',
      emailVerifiedAt: new Date(),
      supplierProfile: {
        create: {
          companyName: 'MedTech Solutions International',
          businessRegistrationNumber: 'UAE-BUS-2024-001',
          yearEstablished: 2010,
          numberOfEmployees: 150,
          website: 'https://medtechsolutions.ae',
          verified: true,
          verifiedAt: new Date(),
          rating: 4.8,
          address: {
            street: '456 Healthcare City',
            city: 'Dubai',
            state: 'Dubai',
            country: 'United Arab Emirates',
            postalCode: '12345',
          },
          productCategories: ['DIAGNOSTIC', 'IMAGING', 'SURGICAL'],
          certifications: ['ISO 13485', 'CE Mark', 'FDA Registered'],
          brands: ['Siemens', 'GE Healthcare', 'Philips'],
        },
      },
    },
  });

  // Maintenance Engineer
  const engineer = await prisma.user.create({
    data: {
      email: 'engineer@service.com',
      passwordHash,
      firstName: 'Ahmed',
      lastName: 'Hassan',
      phoneNumber: '+201234567890',
      userType: 'MAINTENANCE_ENGINEER',
      status: 'ACTIVE',
      verificationStatus: 'FULLY_VERIFIED',
      emailVerifiedAt: new Date(),
      engineerProfile: {
        create: {
          certificationNumber: 'ENG-2024-001',
          experienceYears: 10,
          hourlyRate: 150,
          availability: 'AVAILABLE',
          rating: 4.9,
          completedJobs: 250,
          specializations: ['MRI', 'CT Scanner', 'X-Ray', 'Ultrasound'],
          certifications: ['Siemens Certified', 'GE Healthcare Certified'],
          serviceAreas: ['Dubai', 'Abu Dhabi', 'Sharjah'],
          workSchedule: {
            monday: '9:00-18:00',
            tuesday: '9:00-18:00',
            wednesday: '9:00-18:00',
            thursday: '9:00-18:00',
            friday: 'Off',
            saturday: '10:00-16:00',
            sunday: '10:00-16:00',
          },
        },
      },
    },
  });

  // Individual Customer
  const customer = await prisma.user.create({
    data: {
      email: 'customer@demo.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+1234567891',
      userType: 'INDIVIDUAL_CUSTOMER',
      status: 'ACTIVE',
      verificationStatus: 'EMAIL_VERIFIED',
      emailVerifiedAt: new Date(),
      individualProfile: {
        create: {
          dateOfBirth: new Date('1985-05-15'),
          gender: 'Male',
          address: {
            street: '789 Main Street',
            city: 'New York',
            state: 'NY',
            country: 'USA',
            postalCode: '10001',
          },
          preferences: {
            categories: ['MONITORING', 'DIAGNOSTIC'],
            notifications: true,
            newsletter: true,
          },
        },
      },
    },
  });

  // Customer Service
  const customerService = await prisma.user.create({
    data: {
      email: 'support@medicaldevices.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Johnson',
      phoneNumber: '+1234567892',
      userType: 'CUSTOMER_SERVICE',
      status: 'ACTIVE',
      verificationStatus: 'FULLY_VERIFIED',
      emailVerifiedAt: new Date(),
      customerServiceProfile: {
        create: {
          employeeId: 'EMP-CS-001',
          department: 'Customer Support',
          extensionNumber: '1234',
          shift: 'MORNING',
        },
      },
    },
  });

  return { admin, healthcare, supplier, engineer, customer, customerService };
}

async function createProducts(supplier: any) {
  const products = [];

  // MRI Scanner
  const mri = await prisma.product.create({
    data: {
      supplierId: supplier.supplierProfile.id,
      name: 'Advanced MRI Scanner ProMax 3000',
      nameAr: 'جهاز الرنين المغناطيسي المتقدم بروماكس 3000',
      description: 'State-of-the-art 3.0 Tesla MRI scanner with advanced imaging capabilities, AI-powered diagnostics, and exceptional patient comfort features.',
      descriptionAr: 'جهاز رنين مغناطيسي متطور 3.0 تسلا مع قدرات تصوير متقدمة وتشخيص مدعوم بالذكاء الاصطناعي',
      sku: 'MRI-PM-3000',
      barcode: '1234567890123',
      category: 'IMAGING',
      condition: 'NEW',
      status: 'ACTIVE',
      price: 450000,
      compareAtPrice: 500000,
      costPrice: 350000,
      quantity: 3,
      minOrderQuantity: 1,
      weight: 7000,
      dimensions: {
        length: 240,
        width: 240,
        height: 180,
        unit: 'cm',
      },
      images: [
        'https://example.com/mri-1.jpg',
        'https://example.com/mri-2.jpg',
        'https://example.com/mri-3.jpg',
      ],
      specifications: {
        'Field Strength': '3.0 Tesla',
        'Bore Diameter': '70 cm',
        'Gradient Strength': '45 mT/m',
        'Slew Rate': '200 T/m/s',
        'RF Channels': '32',
        'Patient Weight Capacity': '250 kg',
        'Power Requirements': '480V, 3-phase',
      },
      features: [
        'AI-powered image reconstruction',
        'Silent scan technology',
        'Wide bore design for patient comfort',
        'Advanced cardiac imaging',
        'Neurological imaging suite',
      ],
      certifications: ['FDA', 'CE Mark', 'ISO 13485'],
      warrantyPeriod: 24,
      isFeatured: true,
      isPublished: true,
      publishedAt: new Date(),
      rating: 4.8,
      salesCount: 15,
      views: 1250,
    },
  });
  products.push(mri);

  // CT Scanner
  const ct = await prisma.product.create({
    data: {
      supplierId: supplier.supplierProfile.id,
      name: 'Revolution CT Scanner 256-Slice',
      nameAr: 'جهاز الأشعة المقطعية ريفوليوشن 256 شريحة',
      description: 'High-resolution 256-slice CT scanner with advanced cardiac imaging, low-dose protocols, and rapid scanning capabilities.',
      descriptionAr: 'جهاز أشعة مقطعية عالي الدقة 256 شريحة مع تصوير قلبي متقدم',
      sku: 'CT-REV-256',
      category: 'IMAGING',
      condition: 'NEW',
      status: 'ACTIVE',
      price: 380000,
      compareAtPrice: 420000,
      costPrice: 300000,
      quantity: 2,
      images: ['https://example.com/ct-1.jpg'],
      specifications: {
        'Detector Rows': '256',
        'Rotation Time': '0.28 seconds',
        'Slice Thickness': '0.625 mm',
        'kV Range': '70-140',
        'mA Range': '10-800',
        'Gantry Aperture': '80 cm',
      },
      features: [
        'Cardiac imaging',
        'Dual-energy scanning',
        'Metal artifact reduction',
        'Pediatric protocols',
        'Dose optimization',
      ],
      certifications: ['FDA', 'CE Mark'],
      warrantyPeriod: 24,
      isPublished: true,
      publishedAt: new Date(),
      rating: 4.7,
    },
  });
  products.push(ct);

  // Ultrasound System
  const ultrasound = await prisma.product.create({
    data: {
      supplierId: supplier.supplierProfile.id,
      name: 'EPIQ Elite Ultrasound System',
      nameAr: 'نظام الموجات فوق الصوتية إيبيك إيليت',
      description: 'Premium ultrasound system with exceptional image quality, advanced quantification tools, and comprehensive clinical applications.',
      descriptionAr: 'نظام موجات فوق صوتية متميز مع جودة صورة استثنائية',
      sku: 'US-EPIQ-ELITE',
      category: 'DIAGNOSTIC',
      condition: 'NEW',
      status: 'ACTIVE',
      price: 75000,
      compareAtPrice: 85000,
      quantity: 8,
      images: ['https://example.com/ultrasound-1.jpg'],
      specifications: {
        'Monitor': '23-inch LED',
        'Transducers': '5 ports',
        'Imaging Modes': '2D, 3D, 4D, Doppler',
        'Storage': '1TB SSD',
        'Battery Backup': 'Yes',
      },
      features: [
        '3D/4D imaging',
        'Elastography',
        'Contrast imaging',
        'AI-assisted measurements',
        'Wireless connectivity',
      ],
      certifications: ['FDA', 'CE Mark'],
      warrantyPeriod: 12,
      isPublished: true,
      publishedAt: new Date(),
      rating: 4.6,
    },
  });
  products.push(ultrasound);

  // Patient Monitor
  const monitor = await prisma.product.create({
    data: {
      supplierId: supplier.supplierProfile.id,
      name: 'IntelliVue MX750 Patient Monitor',
      nameAr: 'جهاز مراقبة المريض إنتيليفيو MX750',
      description: 'Advanced bedside patient monitor with comprehensive vital signs monitoring and clinical decision support.',
      descriptionAr: 'جهاز مراقبة متقدم بجانب السرير مع مراقبة شاملة للعلامات الحيوية',
      sku: 'PM-MX750',
      category: 'MONITORING',
      condition: 'NEW',
      status: 'ACTIVE',
      price: 12000,
      compareAtPrice: 14000,
      quantity: 25,
      images: ['https://example.com/monitor-1.jpg'],
      specifications: {
        'Display': '15-inch touchscreen',
        'Parameters': 'ECG, SpO2, NIBP, Temp, IBP, CO2',
        'Battery Life': '4 hours',
        'Connectivity': 'Wi-Fi, Ethernet, HL7',
        'Alarms': 'Visual and audible',
      },
      features: [
        'Multi-parameter monitoring',
        'Touchscreen interface',
        'Clinical decision support',
        'EMR integration',
        'Remote monitoring',
      ],
      certifications: ['FDA', 'CE Mark', 'IEC 60601'],
      warrantyPeriod: 12,
      isFeatured: true,
      isPublished: true,
      publishedAt: new Date(),
      rating: 4.5,
      salesCount: 89,
    },
  });
  products.push(monitor);

  // Surgical Robot
  const robot = await prisma.product.create({
    data: {
      supplierId: supplier.supplierProfile.id,
      name: 'da Vinci Xi Surgical System',
      nameAr: 'نظام دافنشي Xi الجراحي',
      description: 'Robotic surgical system offering minimally invasive surgery with enhanced precision, control, and visualization.',
      descriptionAr: 'نظام جراحي روبوتي يوفر جراحة طفيفة التوغل مع دقة محسنة',
      sku: 'SR-DAVINCI-XI',
      category: 'SURGICAL',
      condition: 'NEW',
      status: 'ACTIVE',
      price: 2000000,
      compareAtPrice: 2200000,
      quantity: 1,
      images: ['https://example.com/robot-1.jpg'],
      specifications: {
        'Arms': '4 robotic arms',
        'Instruments': '40+ compatible',
        'Vision': '3D HD vision system',
        'Console': 'Ergonomic surgeon console',
        'Footprint': '2.5m x 2.5m',
      },
      features: [
        'Minimally invasive surgery',
        '3D HD visualization',
        'Tremor filtration',
        'Motion scaling',
        'Intuitive control',
      ],
      certifications: ['FDA', 'CE Mark'],
      warrantyPeriod: 24,
      isPublished: true,
      publishedAt: new Date(),
      rating: 4.9,
    },
  });
  products.push(robot);

  // Ventilator
  const ventilator = await prisma.product.create({
    data: {
      supplierId: supplier.supplierProfile.id,
      name: 'HAMILTON-G5 Ventilator',
      nameAr: 'جهاز التنفس الصناعي هاميلتون G5',
      description: 'Advanced ICU ventilator with intelligent ventilation modes and comprehensive patient monitoring.',
      descriptionAr: 'جهاز تنفس صناعي متقدم للعناية المركزة مع أوضاع تهوية ذكية',
      sku: 'VENT-HAM-G5',
      category: 'EMERGENCY',
      condition: 'NEW',
      status: 'ACTIVE',
      price: 35000,
      compareAtPrice: 40000,
      quantity: 15,
      images: ['https://example.com/ventilator-1.jpg'],
      specifications: {
        'Modes': 'CMV, SIMV, SPONT, DuoPAP, APRV',
        'Tidal Volume': '20-2000 ml',
        'PEEP': '0-50 cmH2O',
        'Display': '15-inch touchscreen',
        'Battery': '6 hours',
      },
      features: [
        'Adaptive Support Ventilation',
        'P/V Tool Pro',
        'IntelliSync+',
        'Transpulmonary pressure monitoring',
        'Neonatal to adult',
      ],
      certifications: ['FDA', 'CE Mark', 'ISO 13485'],
      warrantyPeriod: 12,
      isPublished: true,
      publishedAt: new Date(),
      rating: 4.7,
    },
  });
  products.push(ventilator);

  return products;
}

async function createOrders(customer: any, products: any[]) {
  // Create a cart first
  const cart = await prisma.cart.create({
    data: {
      userId: customer.id,
      items: {
        create: [
          {
            productId: products[3].id, // Patient Monitor
            quantity: 2,
          },
          {
            productId: products[2].id, // Ultrasound
            quantity: 1,
          },
        ],
      },
    },
  });

  // Create completed order
  const order1 = await prisma.order.create({
    data: {
      userId: customer.id,
      orderNumber: 'ORD-2024-001',
      status: 'DELIVERED',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'CREDIT_CARD',
      subtotal: 99000,
      tax: 14850,
      shipping: 500,
      total: 114350,
      shippingAddress: {
        name: 'John Doe',
        street: '789 Main Street',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postalCode: '10001',
        phone: '+1234567891',
      },
      billingAddress: {
        name: 'John Doe',
        street: '789 Main Street',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postalCode: '10001',
        phone: '+1234567891',
      },
      confirmedAt: new Date('2024-01-10'),
      shippedAt: new Date('2024-01-11'),
      deliveredAt: new Date('2024-01-15'),
      items: {
        create: [
          {
            productId: products[3].id,
            quantity: 2,
            price: 12000,
            total: 24000,
          },
          {
            productId: products[2].id,
            quantity: 1,
            price: 75000,
            total: 75000,
          },
        ],
      },
      payments: {
        create: {
          amount: 114350,
          method: 'CREDIT_CARD',
          status: 'COMPLETED',
          transactionId: 'TXN-2024-001',
          paidAt: new Date('2024-01-10'),
        },
      },
    },
  });

  // Create pending order
  const order2 = await prisma.order.create({
    data: {
      userId: customer.id,
      orderNumber: 'ORD-2024-002',
      status: 'PROCESSING',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'PAYPAL',
      subtotal: 380000,
      tax: 57000,
      shipping: 0,
      total: 437000,
      shippingAddress: {
        name: 'John Doe',
        street: '789 Main Street',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postalCode: '10001',
        phone: '+1234567891',
      },
      billingAddress: {
        name: 'John Doe',
        street: '789 Main Street',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postalCode: '10001',
        phone: '+1234567891',
      },
      confirmedAt: new Date(),
      items: {
        create: {
          productId: products[1].id, // CT Scanner
          quantity: 1,
          price: 380000,
          total: 380000,
        },
      },
    },
  });

  return [order1, order2];
}

async function createReviews(customer: any, products: any[]) {
  const reviews = [];

  // Review for Patient Monitor
  const review1 = await prisma.productReview.create({
    data: {
      productId: products[3].id,
      userId: customer.id,
      rating: 5,
      title: 'Excellent Patient Monitor',
      comment: 'We have been using these monitors in our ICU for 6 months now. The interface is intuitive, the measurements are accurate, and the integration with our EMR system works flawlessly. Highly recommended!',
      isVerified: true,
      helpful: 45,
      images: ['https://example.com/review-1.jpg'],
    },
  });
  reviews.push(review1);

  // Review for Ultrasound
  const review2 = await prisma.productReview.create({
    data: {
      productId: products[2].id,
      userId: customer.id,
      rating: 4,
      title: 'Great imaging quality',
      comment: 'The image quality is exceptional and the 3D/4D capabilities are impressive. The only minor issue is the learning curve for some of the advanced features. Overall, very satisfied with the purchase.',
      isVerified: true,
      helpful: 32,
    },
  });
  reviews.push(review2);

  // Question and Answer
  const question = await prisma.productQuestion.create({
    data: {
      productId: products[0].id, // MRI Scanner
      userId: customer.id,
      question: 'What is the installation time for this MRI scanner? Do you provide installation services?',
      answers: {
        create: {
          userId: customer.id,
          answer: 'Installation typically takes 4-6 weeks including site preparation. Yes, we provide complete installation services with certified engineers.',
          isOfficial: true,
          helpful: 15,
        },
      },
    },
  });

  return reviews;
}

async function createSystemSettings() {
  const settings = [
    {
      key: 'site_name',
      value: { en: 'Medical Devices Marketplace', ar: 'سوق الأجهزة الطبية' },
      type: 'JSON',
      description: 'Site name in multiple languages',
    },
    {
      key: 'tax_rate',
      value: 0.15,
      type: 'NUMBER',
      description: 'Default tax rate (15% VAT)',
    },
    {
      key: 'free_shipping_threshold',
      value: 500,
      type: 'NUMBER',
      description: 'Minimum order amount for free shipping',
    },
    {
      key: 'currency',
      value: 'USD',
      type: 'STRING',
      description: 'Default currency',
    },
    {
      key: 'maintenance_mode',
      value: false,
      type: 'BOOLEAN',
      description: 'Site maintenance mode',
    },
    {
      key: 'supported_languages',
      value: ['en', 'ar'],
      type: 'JSON',
      description: 'Supported languages',
    },
    {
      key: 'order_number_prefix',
      value: 'ORD',
      type: 'STRING',
      description: 'Prefix for order numbers',
    },
    {
      key: 'pagination_limit',
      value: 20,
      type: 'NUMBER',
      description: 'Default pagination limit',
    },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.create({
      data: setting as any,
    });
  }
}

async function createEmailTemplates() {
  const templates = [
    {
      name: 'welcome',
      subject: 'Welcome to Medical Devices Marketplace',
      body: `
        <h1>Welcome {{firstName}}!</h1>
        <p>Thank you for joining Medical Devices Marketplace.</p>
        <p>Your account has been created successfully.</p>
        <p>Click <a href="{{verificationLink}}">here</a> to verify your email.</p>
      `,
      variables: ['firstName', 'verificationLink'],
      isActive: true,
    },
    {
      name: 'order_confirmation',
      subject: 'Order Confirmation #{{orderNumber}}',
      body: `
        <h1>Order Confirmed!</h1>
        <p>Dear {{customerName}},</p>
        <p>Your order #{{orderNumber}} has been confirmed.</p>
        <p>Total: {{total}}</p>
        <p>We will notify you when your order ships.</p>
      `,
      variables: ['customerName', 'orderNumber', 'total'],
      isActive: true,
    },
    {
      name: 'password_reset',
      subject: 'Password Reset Request',
      body: `
        <h1>Password Reset</h1>
        <p>Hi {{firstName}},</p>
        <p>You requested to reset your password.</p>
        <p>Click <a href="{{resetLink}}">here</a> to reset your password.</p>
        <p>This link will expire in 1 hour.</p>
      `,
      variables: ['firstName', 'resetLink'],
      isActive: true,
    },
    {
      name: 'shipping_notification',
      subject: 'Your Order Has Shipped!',
      body: `
        <h1>Order Shipped!</h1>
        <p>Dear {{customerName}},</p>
        <p>Your order #{{orderNumber}} has been shipped.</p>
        <p>Tracking Number: {{trackingNumber}}</p>
        <p>Estimated Delivery: {{estimatedDelivery}}</p>
      `,
      variables: ['customerName', 'orderNumber', 'trackingNumber', 'estimatedDelivery'],
      isActive: true,
    },
  ];

  for (const template of templates) {
    await prisma.emailTemplate.create({
      data: template as any,
    });
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });