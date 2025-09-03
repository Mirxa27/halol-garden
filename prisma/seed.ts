import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.$transaction([
    prisma.chatMessage.deleteMany(),
    prisma.chatParticipant.deleteMany(),
    prisma.chatSession.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.wishlistItem.deleteMany(),
    prisma.productAnswer.deleteMany(),
    prisma.productQuestion.deleteMany(),
    prisma.productReview.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.refund.deleteMany(),
    prisma.shipment.deleteMany(),
    prisma.shipping.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.order.deleteMany(),
    prisma.rentalItem.deleteMany(),
    prisma.rentalPayment.deleteMany(),
    prisma.rentalAgreement.deleteMany(),
    prisma.maintenanceRequest.deleteMany(),
    prisma.supportTicket.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.inventoryLog.deleteMany(),
    prisma.priceHistory.deleteMany(),
    prisma.rentalUnit.deleteMany(),
    prisma.rentalDetails.deleteMany(),
    prisma.salesDetails.deleteMany(),
    prisma.product.deleteMany(),
    prisma.uploadedFile.deleteMany(),
    prisma.session.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.passwordReset.deleteMany(),
    prisma.adminProfile.deleteMany(),
    prisma.customerServiceProfile.deleteMany(),
    prisma.maintenanceEngineer.deleteMany(),
    prisma.individualCustomer.deleteMany(),
    prisma.healthcareProvider.deleteMany(),
    prisma.equipmentSupplier.deleteMany(),
    prisma.user.deleteMany(),
    prisma.systemSetting.deleteMany(),
    prisma.emailTemplate.deleteMany(),
  ]);

  // Create users
  console.log('👥 Creating users...');
  
  // Admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@medicaldevices.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      firstName: 'Admin',
      lastName: 'User',
      phoneNumber: '+966501234567',
      userType: 'ADMIN',
      status: 'ACTIVE',
      verificationStatus: 'FULLY_VERIFIED',
      emailVerifiedAt: new Date(),
      adminProfile: {
        create: {
          permissions: ['all'],
          role: 'SUPER_ADMIN',
        },
      },
    },
  });

  // Healthcare provider user
  const healthcareUser = await prisma.user.create({
    data: {
      email: 'hospital@example.com',
      passwordHash: await bcrypt.hash('hospital123', 10),
      firstName: 'King Faisal',
      lastName: 'Hospital',
      phoneNumber: '+966502345678',
      userType: 'HEALTHCARE_PROVIDER',
      status: 'ACTIVE',
      verificationStatus: 'FULLY_VERIFIED',
      emailVerifiedAt: new Date(),
      healthcareProfile: {
        create: {
          organizationName: 'King Faisal Specialist Hospital',
          organizationType: 'Hospital',
          licenseNumber: 'KSA-HOSP-2024-001',
          taxRegistrationNumber: 'TAX123456789',
          numberOfBeds: 500,
          yearEstablished: 1975,
          address: {
            street: '123 Medical District',
            city: 'Riyadh',
            state: 'Riyadh Province',
            country: 'Saudi Arabia',
            postalCode: '11211',
          },
          specializations: ['Cardiology', 'Oncology', 'Neurology', 'Pediatrics'],
          certifications: ['JCI Accredited', 'ISO 9001:2015'],
        },
      },
    },
  });

  // Equipment supplier users
  const supplier1 = await prisma.user.create({
    data: {
      email: 'supplier1@example.com',
      passwordHash: await bcrypt.hash('supplier123', 10),
      firstName: 'MedTech',
      lastName: 'Solutions',
      phoneNumber: '+966503456789',
      userType: 'EQUIPMENT_SUPPLIER',
      status: 'ACTIVE',
      verificationStatus: 'FULLY_VERIFIED',
      emailVerifiedAt: new Date(),
      supplierProfile: {
        create: {
          companyName: 'MedTech Solutions Ltd',
          businessRegistrationNumber: 'CR-2024-001',
          taxId: 'TAX987654321',
          yearEstablished: 2010,
          numberOfEmployees: 150,
          address: {
            street: '456 Business Park',
            city: 'Jeddah',
            state: 'Makkah Province',
            country: 'Saudi Arabia',
            postalCode: '21442',
          },
          productCategories: ['DIAGNOSTIC', 'MONITORING', 'IMAGING'],
          certifications: ['ISO 13485:2016', 'FDA Registered'],
          brands: ['Siemens', 'GE Healthcare', 'Philips'],
          verified: true,
          verifiedAt: new Date(),
          rating: 4.5,
        },
      },
    },
  });

  const supplier2 = await prisma.user.create({
    data: {
      email: 'supplier2@example.com',
      passwordHash: await bcrypt.hash('supplier123', 10),
      firstName: 'Saudi Medical',
      lastName: 'Equipment',
      phoneNumber: '+966504567890',
      userType: 'EQUIPMENT_SUPPLIER',
      status: 'ACTIVE',
      verificationStatus: 'FULLY_VERIFIED',
      emailVerifiedAt: new Date(),
      supplierProfile: {
        create: {
          companyName: 'Saudi Medical Equipment Co',
          businessRegistrationNumber: 'CR-2024-002',
          taxId: 'TAX456789123',
          yearEstablished: 2015,
          numberOfEmployees: 75,
          address: {
            street: '789 Industrial Area',
            city: 'Dammam',
            state: 'Eastern Province',
            country: 'Saudi Arabia',
            postalCode: '31441',
          },
          productCategories: ['SURGICAL', 'EMERGENCY', 'LABORATORY'],
          certifications: ['ISO 9001:2015', 'CE Marked'],
          brands: ['3M', 'Johnson & Johnson', 'Medtronic'],
          verified: true,
          verifiedAt: new Date(),
          rating: 4.2,
        },
      },
    },
  });

  // Individual customer
  const customerUser = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      passwordHash: await bcrypt.hash('customer123', 10),
      firstName: 'Ahmed',
      lastName: 'Al-Rashid',
      phoneNumber: '+966505678901',
      userType: 'INDIVIDUAL_CUSTOMER',
      status: 'ACTIVE',
      verificationStatus: 'EMAIL_VERIFIED',
      emailVerifiedAt: new Date(),
      individualProfile: {
        create: {
          dateOfBirth: new Date('1985-06-15'),
          gender: 'Male',
          address: {
            street: '321 Residential St',
            city: 'Riyadh',
            state: 'Riyadh Province',
            country: 'Saudi Arabia',
            postalCode: '11564',
          },
          preferences: {
            language: 'ar',
            currency: 'SAR',
            notifications: true,
          },
        },
      },
    },
  });

  // Maintenance engineer
  const engineerUser = await prisma.user.create({
    data: {
      email: 'engineer@example.com',
      passwordHash: await bcrypt.hash('engineer123', 10),
      firstName: 'Mohammed',
      lastName: 'Al-Engineer',
      phoneNumber: '+966506789012',
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
          specializations: ['MRI Machines', 'CT Scanners', 'X-Ray Equipment'],
          certifications: ['Siemens Certified', 'GE Healthcare Certified'],
          serviceAreas: ['Riyadh', 'Jeddah', 'Dammam'],
          rating: 4.8,
          completedJobs: 245,
        },
      },
    },
  });

  // Customer service representative
  const csUser = await prisma.user.create({
    data: {
      email: 'support@medicaldevices.com',
      passwordHash: await bcrypt.hash('support123', 10),
      firstName: 'Support',
      lastName: 'Team',
      phoneNumber: '+966507890123',
      userType: 'CUSTOMER_SERVICE',
      status: 'ACTIVE',
      verificationStatus: 'FULLY_VERIFIED',
      emailVerifiedAt: new Date(),
      customerServiceProfile: {
        create: {
          employeeId: 'CS-001',
          department: 'Customer Support',
          extensionNumber: '1234',
          shift: 'MORNING',
        },
      },
    },
  });

  console.log('✅ Users created');

  // Get supplier profiles
  const supplierProfiles = await prisma.equipmentSupplier.findMany();
  const [supplierProfile1, supplierProfile2] = supplierProfiles;

  // Create products
  console.log('📦 Creating products...');
  
  const products = [
    // Diagnostic Equipment
    {
      supplierId: supplierProfile1.id,
      name: 'Digital Blood Pressure Monitor',
      nameAr: 'جهاز قياس ضغط الدم الرقمي',
      description: 'Professional-grade digital blood pressure monitor with advanced accuracy and connectivity features. Suitable for clinical and home use.',
      descriptionAr: 'جهاز قياس ضغط الدم الرقمي بدقة متقدمة وميزات الاتصال. مناسب للاستخدام السريري والمنزلي.',
      sku: `BP-MON-${Date.now()}-001`,
      barcode: '1234567890123',
      category: 'DIAGNOSTIC',
      subcategory: 'Vital Signs Monitors',
      brand: 'Omron',
      model: 'HEM-7361T',
      condition: 'NEW',
      status: 'ACTIVE',
      availabilityType: 'SALE',
      price: 299.99,
      compareAtPrice: 399.99,
      quantity: 50,
      images: [
        'https://images.unsplash.com/photo-1584515933487-779824d29309?w=400',
        'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=400',
      ],
      specifications: {
        dimensions: '105 x 152 x 87 mm',
        weight: '250g',
        powerSupply: '4 AA batteries or AC adapter',
        memoryCapacity: '100 readings x 2 users',
        connectivity: 'Bluetooth 5.0',
        cuffSize: '22-42 cm',
      },
      features: [
        'Irregular heartbeat detection',
        'Average of last 3 readings',
        'Morning hypertension indicator',
        'Body movement detection',
        'Cuff wrap guide',
      ],
      certifications: ['FDA Approved', 'CE Marked', 'ISO 13485'],
      warrantyPeriod: 24,
      isPublished: true,
      publishedAt: new Date(),
      featured: true,
    },
    {
      supplierId: supplierProfile1.id,
      name: 'Portable ECG Machine',
      nameAr: 'جهاز تخطيط القلب المحمول',
      description: '12-lead portable ECG machine with advanced interpretation software and wireless connectivity.',
      descriptionAr: 'جهاز تخطيط القلب المحمول بـ 12 قناة مع برامج تفسير متقدمة واتصال لاسلكي.',
      sku: `ECG-${Date.now()}-002`,
      category: 'DIAGNOSTIC',
      subcategory: 'Cardiac Equipment',
      brand: 'GE Healthcare',
      model: 'MAC 2000',
      condition: 'NEW',
      status: 'ACTIVE',
      availabilityType: 'BOTH',
      price: 4999.99,
      compareAtPrice: 5999.99,
      quantity: 15,
      images: [
        'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400',
      ],
      specifications: {
        channels: '12-lead',
        display: '7" color touchscreen',
        battery: 'Lithium-ion, 4 hours continuous',
        connectivity: 'WiFi, Ethernet, USB',
        storage: '200 ECG records',
      },
      features: [
        'Automatic interpretation',
        'Pediatric and adult algorithms',
        'Wireless data transmission',
        'EMR integration',
      ],
      certifications: ['FDA Approved', 'CE Marked'],
      warrantyPeriod: 36,
      isPublished: true,
      publishedAt: new Date(),
    },
    // Surgical Equipment
    {
      supplierId: supplierProfile2.id,
      name: 'Surgical LED Light System',
      nameAr: 'نظام إضاءة جراحي LED',
      description: 'Advanced surgical LED light system with shadow management technology and adjustable color temperature.',
      descriptionAr: 'نظام إضاءة جراحي متقدم LED مع تقنية إدارة الظلال ودرجة حرارة لون قابلة للتعديل.',
      sku: `LED-SURG-${Date.now()}-003`,
      category: 'SURGICAL',
      subcategory: 'Operating Room Lights',
      brand: 'Stryker',
      model: 'Visum LED',
      condition: 'NEW',
      status: 'ACTIVE',
      availabilityType: 'SALE',
      price: 15999.99,
      quantity: 8,
      images: [
        'https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=400',
      ],
      specifications: {
        illuminance: '160,000 lux',
        colorTemperature: '3500K - 5000K adjustable',
        colorRenderingIndex: 'Ra ≥ 95',
        fieldDiameter: '14-28 cm adjustable',
        serviceLife: '60,000 hours',
      },
      features: [
        'Shadow dilution technology',
        'Touchless control',
        'Integrated HD camera option',
        'Emergency battery backup',
      ],
      certifications: ['FDA Approved', 'CE Marked', 'IEC 60601'],
      warrantyPeriod: 60,
      isPublished: true,
      publishedAt: new Date(),
    },
    // Imaging Equipment
    {
      supplierId: supplierProfile1.id,
      name: 'Portable Ultrasound System',
      nameAr: 'نظام الموجات فوق الصوتية المحمول',
      description: 'Compact, portable ultrasound system with advanced imaging capabilities for point-of-care diagnostics.',
      descriptionAr: 'نظام محمول مدمج للموجات فوق الصوتية مع قدرات تصوير متقدمة للتشخيص في نقطة الرعاية.',
      sku: `US-PORT-${Date.now()}-004`,
      category: 'IMAGING',
      subcategory: 'Ultrasound',
      brand: 'Philips',
      model: 'Lumify',
      condition: 'NEW',
      status: 'ACTIVE',
      availabilityType: 'BOTH',
      price: 7999.99,
      quantity: 20,
      images: [
        'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400',
      ],
      specifications: {
        probes: 'Linear, Curved, Phased array',
        display: 'Compatible with tablets/smartphones',
        battery: '3 hours continuous scanning',
        connectivity: 'WiFi, USB-C',
        weight: '390g per probe',
      },
      features: [
        'Real-time image sharing',
        'Cloud storage',
        'AI-assisted measurements',
        'Telemedicine ready',
      ],
      certifications: ['FDA Approved', 'CE Marked'],
      warrantyPeriod: 24,
      isPublished: true,
      publishedAt: new Date(),
      featured: true,
    },
    // Laboratory Equipment
    {
      supplierId: supplierProfile2.id,
      name: 'Automated Blood Analyzer',
      nameAr: 'محلل دم آلي',
      description: 'High-throughput automated hematology analyzer with 5-part differential and advanced flagging capabilities.',
      descriptionAr: 'محلل دم آلي عالي الإنتاجية مع تفريق 5 أجزاء وقدرات وضع علامات متقدمة.',
      sku: `HEMA-${Date.now()}-005`,
      category: 'LABORATORY',
      subcategory: 'Hematology',
      brand: 'Sysmex',
      model: 'XN-550',
      condition: 'NEW',
      status: 'ACTIVE',
      availabilityType: 'SALE',
      price: 45999.99,
      quantity: 5,
      images: [
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400',
      ],
      specifications: {
        throughput: '60 samples/hour',
        parameters: '31 reportable + 51 research',
        sampleVolume: '20 μL',
        methodology: 'Fluorescence flow cytometry',
        connectivity: 'LIS ready, bidirectional',
      },
      features: [
        'Body fluid mode',
        'Low WBC mode',
        'Automated quality control',
        'Reflex testing capability',
      ],
      certifications: ['FDA Approved', 'CE-IVD Marked'],
      warrantyPeriod: 24,
      isPublished: true,
      publishedAt: new Date(),
    },
    // Emergency Equipment
    {
      supplierId: supplierProfile2.id,
      name: 'Automated External Defibrillator',
      nameAr: 'جهاز مزيل الرجفان الخارجي الآلي',
      description: 'Compact AED with real-time CPR feedback and clear voice instructions for emergency cardiac care.',
      descriptionAr: 'جهاز AED مدمج مع ملاحظات CPR في الوقت الفعلي وتعليمات صوتية واضحة لرعاية القلب الطارئة.',
      sku: `AED-${Date.now()}-006`,
      category: 'EMERGENCY',
      subcategory: 'Resuscitation',
      brand: 'ZOLL',
      model: 'AED Plus',
      condition: 'NEW',
      status: 'ACTIVE',
      availabilityType: 'SALE',
      price: 1499.99,
      compareAtPrice: 1899.99,
      quantity: 30,
      images: [
        'https://images.unsplash.com/photo-1563213126-a4273aed2016?w=400',
      ],
      specifications: {
        waveform: 'Rectilinear Biphasic',
        energySequence: '120J, 150J, 200J',
        chargingTime: '<10 seconds',
        batteryLife: '5 years standby',
        weight: '3.1 kg',
      },
      features: [
        'Real CPR Help technology',
        'Pediatric capability',
        'Self-test function',
        'IP55 dust/water resistant',
      ],
      certifications: ['FDA Approved', 'CE Marked'],
      warrantyPeriod: 60,
      isPublished: true,
      publishedAt: new Date(),
      featured: true,
    },
  ];

  for (const productData of products) {
    const product = await prisma.product.create({
      data: {
        ...productData,
        salesDetails: {
          create: {
            basePrice: productData.price,
            discountedPrice: productData.compareAtPrice ? productData.price : null,
            minOrderQuantity: 1,
            isActive: true,
          },
        },
        ...(productData.availabilityType === 'BOTH' || productData.availabilityType === 'RENT' ? {
          rentalDetails: {
            create: {
              dailyRate: Math.round(productData.price * 0.05),
              weeklyRate: Math.round(productData.price * 0.25),
              monthlyRate: Math.round(productData.price * 0.80),
              securityDeposit: Math.round(productData.price * 0.50),
              minimumRentalPeriod: 1,
              isAvailable: true,
            },
          },
        } : {}),
      },
    });

    // Create initial inventory log
    await prisma.inventoryLog.create({
      data: {
        productId: product.id,
        type: 'IN',
        quantity: product.quantity,
        balance: product.quantity,
        reason: 'Initial stock',
        performedBy: adminUser.id,
      },
    });
  }

  console.log('✅ Products created');

  // Create carts for users
  console.log('🛒 Creating carts...');
  
  await prisma.cart.create({
    data: {
      userId: healthcareUser.id,
    },
  });

  await prisma.cart.create({
    data: {
      userId: customerUser.id,
    },
  });

  console.log('✅ Carts created');

  // Create system settings
  console.log('⚙️ Creating system settings...');
  
  const settings = [
    {
      key: 'site.name',
      value: { en: 'Medical Devices Marketplace', ar: 'سوق الأجهزة الطبية' },
      type: 'JSON',
      description: 'Site name in multiple languages',
    },
    {
      key: 'site.currency',
      value: { default: 'USD', supported: ['USD', 'SAR', 'AED', 'EUR'] },
      type: 'JSON',
      description: 'Currency settings',
    },
    {
      key: 'shipping.free.threshold',
      value: { amount: 500 },
      type: 'JSON',
      description: 'Free shipping threshold',
    },
    {
      key: 'tax.rate',
      value: { rate: 0.15 },
      type: 'JSON',
      description: 'Default tax rate (15% VAT)',
    },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.create({ data: setting });
  }

  console.log('✅ System settings created');

  // Create email templates
  console.log('📧 Creating email templates...');
  
  await prisma.emailTemplate.create({
    data: {
      name: 'order_confirmation',
      subject: 'Order Confirmation - {{orderNumber}}',
      body: 'Thank you for your order!',
      variables: ['orderNumber', 'customerName', 'items', 'total'],
      isActive: true,
    },
  });

  await prisma.emailTemplate.create({
    data: {
      name: 'welcome_email',
      subject: 'Welcome to Medical Devices Marketplace',
      body: 'Welcome {{name}}!',
      variables: ['name', 'email'],
      isActive: true,
    },
  });

  console.log('✅ Email templates created');

  console.log('✨ Database seed completed successfully!');
  
  // Print login credentials
  console.log('\n📝 Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:');
  console.log('  Email: admin@medicaldevices.com');
  console.log('  Password: admin123');
  console.log('\nHealthcare Provider:');
  console.log('  Email: hospital@example.com');
  console.log('  Password: hospital123');
  console.log('\nSupplier 1:');
  console.log('  Email: supplier1@example.com');
  console.log('  Password: supplier123');
  console.log('\nSupplier 2:');
  console.log('  Email: supplier2@example.com');
  console.log('  Password: supplier123');
  console.log('\nCustomer:');
  console.log('  Email: customer@example.com');
  console.log('  Password: customer123');
  console.log('\nMaintenance Engineer:');
  console.log('  Email: engineer@example.com');
  console.log('  Password: engineer123');
  console.log('\nCustomer Service:');
  console.log('  Email: support@medicaldevices.com');
  console.log('  Password: support123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });