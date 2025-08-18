import { PrismaClient, UserType, UserStatus, VerificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.productReview.deleteMany();
  await prisma.productAnswer.deleteMany();
  await prisma.productQuestion.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.rentalItem.deleteMany();
  await prisma.rentalAgreement.deleteMany();
  await prisma.rentalUnit.deleteMany();
  await prisma.rentalProduct.deleteMany();
  await prisma.salesProduct.deleteMany();
  await prisma.product.deleteMany();
  await prisma.individualCustomer.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.customerServiceProfile.deleteMany();
  await prisma.maintenanceEngineer.deleteMany();
  await prisma.equipmentSupplier.deleteMany();
  await prisma.healthcareProvider.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Data cleared successfully');

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminPasswordHash = await bcrypt.hash('Admin123!', 12);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@medical-devices.com',
      passwordHash: adminPasswordHash,
      firstName: 'System',
      lastName: 'Administrator',
      phoneNumber: '+971501234567',
      userType: UserType.ADMIN,
      status: UserStatus.ACTIVE,
      verificationStatus: VerificationStatus.FULLY_VERIFIED,
      preferredLanguage: 'en',
      emailVerifiedAt: new Date(),
      adminProfile: {
        create: {
          employeeId: 'ADM001',
          department: 'System Administration',
          accessLevel: 'SUPER_ADMIN',
          permissions: {
            users: ['read', 'write', 'delete'],
            products: ['read', 'write', 'delete', 'approve'],
            orders: ['read', 'write', 'delete'],
            analytics: ['read'],
            system: ['read', 'write'],
          },
          managedRegions: ['UAE', 'KSA', 'Qatar', 'Kuwait'],
          managedCategories: ['DIAGNOSTIC', 'SURGICAL', 'MONITORING', 'THERAPEUTIC'],
        },
      },
    },
  });
  console.log('✅ Admin user created:', adminUser.email);

  // Create healthcare providers
  console.log('🏥 Creating healthcare providers...');
  const healthcareProviders = [
    {
      email: 'hospital@example.com',
      firstName: 'Dr. Ahmed',
      lastName: 'Al Mansouri',
      phoneNumber: '+971501234568',
      organizationName: 'Al Ain Medical Center',
      organizationType: 'Private Hospital',
      licenseNumber: 'HOSP001',
      numberOfBeds: 150,
      yearEstablished: 2010,
    },
    {
      email: 'clinic@example.com',
      firstName: 'Dr. Fatima',
      lastName: 'Al Zahra',
      phoneNumber: '+971501234569',
      organizationName: 'Dubai Healthcare Clinic',
      organizationType: 'Medical Clinic',
      licenseNumber: 'CLIN001',
      numberOfBeds: 20,
      yearEstablished: 2015,
    },
  ];

  for (const provider of healthcareProviders) {
    const passwordHash = await bcrypt.hash('Password123!', 12);
    await prisma.user.create({
      data: {
        email: provider.email,
        passwordHash,
        firstName: provider.firstName,
        lastName: provider.lastName,
        phoneNumber: provider.phoneNumber,
        userType: UserType.HEALTHCARE_PROVIDER,
        status: UserStatus.ACTIVE,
        verificationStatus: VerificationStatus.FULLY_VERIFIED,
        preferredLanguage: 'en',
        emailVerifiedAt: new Date(),
        healthcareProfile: {
          create: {
            organizationName: provider.organizationName,
            organizationType: provider.organizationType,
            licenseNumber: provider.licenseNumber,
            numberOfBeds: provider.numberOfBeds,
            yearEstablished: provider.yearEstablished,
            address: {
              street: '123 Medical Street',
              city: 'Dubai',
              state: 'Dubai',
              country: 'UAE',
              postalCode: '12345',
            },
            specializations: ['Cardiology', 'Neurology', 'Orthopedics'],
            accreditations: ['JCI', 'ISO 9001'],
            contactPersons: [
              {
                name: 'Dr. Ahmed Al Mansouri',
                position: 'Medical Director',
                email: provider.email,
                phone: provider.phoneNumber,
              },
            ],
            operatingHours: {
              monday: { open: '08:00', close: '18:00' },
              tuesday: { open: '08:00', close: '18:00' },
              wednesday: { open: '08:00', close: '18:00' },
              thursday: { open: '08:00', close: '18:00' },
              friday: { open: '08:00', close: '16:00' },
            },
          },
        },
      },
    });
  }
  console.log('✅ Healthcare providers created');

  // Create equipment suppliers
  console.log('🏭 Creating equipment suppliers...');
  const suppliers = [
    {
      email: 'medtech@example.com',
      firstName: 'Mohammed',
      lastName: 'Al Rashid',
      phoneNumber: '+971501234570',
      companyName: 'MedTech Solutions UAE',
      businessRegistrationNumber: 'BR001',
      taxRegistrationNumber: 'TR001',
      yearEstablished: 2008,
    },
    {
      email: 'advanced@example.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phoneNumber: '+971501234571',
      companyName: 'Advanced Medical Systems',
      businessRegistrationNumber: 'BR002',
      taxRegistrationNumber: 'TR002',
      yearEstablished: 2012,
    },
  ];

  for (const supplier of suppliers) {
    const passwordHash = await bcrypt.hash('Password123!', 12);
    await prisma.user.create({
      data: {
        email: supplier.email,
        passwordHash,
        firstName: supplier.firstName,
        lastName: supplier.lastName,
        phoneNumber: supplier.phoneNumber,
        userType: UserType.EQUIPMENT_SUPPLIER,
        status: UserStatus.ACTIVE,
        verificationStatus: VerificationStatus.FULLY_VERIFIED,
        preferredLanguage: 'en',
        emailVerifiedAt: new Date(),
        supplierProfile: {
          create: {
            companyName: supplier.companyName,
            businessRegistrationNumber: supplier.businessRegistrationNumber,
            taxRegistrationNumber: supplier.taxRegistrationNumber,
            yearEstablished: supplier.yearEstablished,
            returnPolicy: '30-day return policy for unused items in original packaging',
            warrantyTerms: '2-year manufacturer warranty on all equipment',
            address: {
              street: '456 Industrial Avenue',
              city: 'Dubai',
              state: 'Dubai',
              country: 'UAE',
              postalCode: '54321',
            },
            warehouseLocations: [
              {
                name: 'Dubai Warehouse',
                address: {
                  street: '456 Industrial Avenue',
                  city: 'Dubai',
                  state: 'Dubai',
                  country: 'UAE',
                  postalCode: '54321',
                },
              },
            ],
            productCategories: ['DIAGNOSTIC', 'SURGICAL', 'MONITORING'],
            brands: ['Siemens', 'Philips', 'GE Healthcare'],
            certifications: ['ISO 13485', 'CE Mark', 'FDA'],
            bankDetails: {
              bankName: 'Emirates NBD',
              accountNumber: '1234567890',
              swiftCode: 'EBILAEAD',
            },
            deliveryCapabilities: {
              localDelivery: true,
              nationalDelivery: true,
              internationalDelivery: true,
              deliveryTime: '2-5 business days',
            },
          },
        },
      },
    });
  }
  console.log('✅ Equipment suppliers created');

  // Create maintenance engineers
  console.log('🔧 Creating maintenance engineers...');
  const engineers = [
    {
      email: 'engineer@example.com',
      firstName: 'Ali',
      lastName: 'Hassan',
      phoneNumber: '+971501234572',
      companyName: 'Hassan Medical Services',
      isFreelancer: true,
      licenseNumber: 'ENG001',
      experienceYears: 8,
      hourlyRate: 150,
    },
    {
      email: 'tech@example.com',
      firstName: 'Omar',
      lastName: 'Al Qahtani',
      phoneNumber: '+971501234573',
      companyName: 'Omar Technical Services',
      isFreelancer: false,
      licenseNumber: 'ENG002',
      experienceYears: 12,
      hourlyRate: 200,
    },
  ];

  for (const engineer of engineers) {
    const passwordHash = await bcrypt.hash('Password123!', 12);
    await prisma.user.create({
      data: {
        email: engineer.email,
        passwordHash,
        firstName: engineer.firstName,
        lastName: engineer.lastName,
        phoneNumber: engineer.phoneNumber,
        userType: UserType.MAINTENANCE_ENGINEER,
        status: UserStatus.ACTIVE,
        verificationStatus: VerificationStatus.FULLY_VERIFIED,
        preferredLanguage: 'en',
        emailVerifiedAt: new Date(),
        engineerProfile: {
          create: {
            companyName: engineer.companyName,
            isFreelancer: engineer.isFreelancer,
            licenseNumber: engineer.licenseNumber,
            experienceYears: engineer.experienceYears,
            hourlyRate: engineer.hourlyRate,
            emergencyServiceAvailable: true,
            emergencyServiceSurcharge: 50,
            specializations: ['MRI', 'CT Scanner', 'Ultrasound', 'X-Ray'],
            certifications: ['Biomedical Equipment Technician', 'ISO 13485'],
            serviceAreas: [
              {
                city: 'Dubai',
                state: 'Dubai',
                country: 'UAE',
                radius: 50,
              },
              {
                city: 'Abu Dhabi',
                state: 'Abu Dhabi',
                country: 'UAE',
                radius: 30,
              },
            ],
            availability: {
              monday: { available: true, hours: '09:00-18:00' },
              tuesday: { available: true, hours: '09:00-18:00' },
              wednesday: { available: true, hours: '09:00-18:00' },
              thursday: { available: true, hours: '09:00-18:00' },
              friday: { available: true, hours: '09:00-16:00' },
            },
            toolsAndEquipment: ['Calibration tools', 'Diagnostic software', 'Spare parts'],
            insuranceCoverage: {
              hasInsurance: true,
              provider: 'Emirates Insurance',
              policyNumber: 'POL001',
              coverageAmount: 1000000,
            },
          },
        },
      },
    });
  }
  console.log('✅ Maintenance engineers created');

  // Create individual customers
  console.log('👤 Creating individual customers...');
  const customers = [
    {
      email: 'doctor@example.com',
      firstName: 'Dr. Khalid',
      lastName: 'Al Otaibi',
      phoneNumber: '+971501234574',
      profession: 'Cardiologist',
      medicalLicenseNumber: 'MED001',
    },
    {
      email: 'nurse@example.com',
      firstName: 'Aisha',
      lastName: 'Al Suwaidi',
      phoneNumber: '+971501234575',
      profession: 'Registered Nurse',
      medicalLicenseNumber: 'NUR001',
    },
  ];

  for (const customer of customers) {
    const passwordHash = await bcrypt.hash('Password123!', 12);
    await prisma.user.create({
      data: {
        email: customer.email,
        passwordHash,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phoneNumber: customer.phoneNumber,
        userType: UserType.INDIVIDUAL_CUSTOMER,
        status: UserStatus.ACTIVE,
        verificationStatus: VerificationStatus.FULLY_VERIFIED,
        preferredLanguage: 'en',
        emailVerifiedAt: new Date(),
        individualProfile: {
          create: {
            profession: customer.profession,
            medicalLicenseNumber: customer.medicalLicenseNumber,
            preferredPaymentMethod: 'Credit Card',
            address: {
              street: '789 Residential Street',
              city: 'Dubai',
              state: 'Dubai',
              country: 'UAE',
              postalCode: '98765',
            },
          },
        },
      },
    });
  }
  console.log('✅ Individual customers created');

  // Get supplier IDs for product creation
  const suppliersData = await prisma.equipmentSupplier.findMany({
    select: { id: true, userId: true },
  });

  if (suppliersData.length === 0) {
    throw new Error('No suppliers found for product creation');
  }

  // Create products
  console.log('📦 Creating products...');
  const products = [
    {
      name: 'MRI Scanner ProMax 3.0T',
      nameAr: 'جهاز الرنين المغناطيسي بروماكس 3.0T',
      description: 'Advanced 3.0T MRI scanner with cutting-edge imaging technology for precise diagnostic imaging.',
      descriptionAr: 'جهاز رنين مغناطيسي متقدم 3.0T مع تقنية التصوير المتطورة للتصوير التشخيصي الدقيق.',
      category: 'DIAGNOSTIC',
      subcategory: 'MRI',
      brand: 'Siemens',
      model: 'ProMax 3.0T',
      manufacturerCountry: 'Germany',
      condition: 'NEW',
      availabilityType: 'BOTH',
      basePrice: 450000,
      dailyRate: 2500,
      weeklyRate: 15000,
      monthlyRate: 50000,
      securityDeposit: 50000,
      supplierId: suppliersData[0].id,
    },
    {
      name: 'Surgical Robot System Da Vinci Xi',
      nameAr: 'نظام الروبوت الجراحي دا فينشي Xi',
      description: 'Fourth-generation surgical robot system for minimally invasive procedures.',
      descriptionAr: 'نظام روبوت جراحي من الجيل الرابع للعمليات الجراحية طفيفة التوغل.',
      category: 'SURGICAL',
      subcategory: 'Robotic Surgery',
      brand: 'Intuitive Surgical',
      model: 'Da Vinci Xi',
      manufacturerCountry: 'USA',
      condition: 'NEW',
      availabilityType: 'BOTH',
      basePrice: 850000,
      dailyRate: 5000,
      weeklyRate: 30000,
      monthlyRate: 100000,
      securityDeposit: 100000,
      supplierId: suppliersData[0].id,
    },
    {
      name: 'Patient Monitor X500',
      nameAr: 'جهاز مراقبة المريض X500',
      description: 'Multi-parameter patient monitoring system with advanced alarm management.',
      descriptionAr: 'نظام مراقبة المريض متعدد المعاملات مع إدارة تنبيهات متقدمة.',
      category: 'MONITORING',
      subcategory: 'Patient Monitoring',
      brand: 'Philips',
      model: 'X500',
      manufacturerCountry: 'Netherlands',
      condition: 'NEW',
      availabilityType: 'SALE',
      basePrice: 12000,
      supplierId: suppliersData[1].id,
    },
    {
      name: 'Ultrasound System iU22',
      nameAr: 'نظام الموجات فوق الصوتية iU22',
      description: 'High-performance ultrasound system for comprehensive diagnostic imaging.',
      descriptionAr: 'نظام موجات فوق صوتية عالي الأداء للتصوير التشخيصي الشامل.',
      category: 'DIAGNOSTIC',
      subcategory: 'Ultrasound',
      brand: 'Philips',
      model: 'iU22',
      manufacturerCountry: 'Netherlands',
      condition: 'REFURBISHED',
      availabilityType: 'BOTH',
      basePrice: 85000,
      discountedPrice: 75000,
      dailyRate: 800,
      weeklyRate: 5000,
      monthlyRate: 18000,
      securityDeposit: 15000,
      supplierId: suppliersData[1].id,
    },
    {
      name: 'CT Scanner LightSpeed VCT',
      nameAr: 'جهاز التصوير المقطعي المحوسب LightSpeed VCT',
      description: '64-slice CT scanner with advanced cardiac imaging capabilities.',
      descriptionAr: 'جهاز تصوير مقطعي محوسب 64 شريحة مع قدرات تصوير قلبية متقدمة.',
      category: 'DIAGNOSTIC',
      subcategory: 'CT',
      brand: 'GE Healthcare',
      model: 'LightSpeed VCT',
      manufacturerCountry: 'USA',
      condition: 'USED_EXCELLENT',
      availabilityType: 'RENT',
      dailyRate: 3000,
      weeklyRate: 18000,
      monthlyRate: 60000,
      securityDeposit: 75000,
      supplierId: suppliersData[0].id,
    },
  ];

  for (const product of products) {
    const sku = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await prisma.product.create({
      data: {
        supplierId: product.supplierId,
        sku,
        name: product.name,
        nameAr: product.nameAr,
        description: product.description,
        descriptionAr: product.descriptionAr,
        category: product.category,
        subcategory: product.subcategory,
        brand: product.brand,
        model: product.model,
        manufacturerCountry: product.manufacturerCountry,
        condition: product.condition,
        availabilityType: product.availabilityType,
        status: 'ACTIVE',
        featured: Math.random() > 0.7, // 30% chance of being featured
        approvedAt: new Date(),
        approvedBy: adminUser.id,
        images: [
          'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800',
          'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800',
        ],
        specifications: {
          dimensions: { width: '200cm', height: '180cm', depth: '250cm' },
          weight: '1500kg',
          power: '15kW',
          voltage: '220-240V',
          frequency: '50-60Hz',
        },
        certifications: [
          { name: 'CE Mark', number: 'CE123456' },
          { name: 'FDA', number: 'FDA789012' },
          { name: 'ISO 13485', number: 'ISO345678' },
        ],
        warranty: {
          duration: '2 years',
          coverage: 'Parts and labor',
          conditions: 'Normal use and maintenance',
        },
        dimensions: {
          width: 200,
          height: 180,
          depth: 250,
          unit: 'cm',
        },
        weight: 1500,
        tags: [product.category.toLowerCase(), product.subcategory.toLowerCase(), product.brand.toLowerCase()],
        salesDetails: product.basePrice ? {
          create: {
            basePrice: product.basePrice,
            discountedPrice: product.discountedPrice,
            taxRate: 5,
            inventory: { quantity: Math.floor(Math.random() * 10) + 1 },
            shipping: {
              weight: 1500,
              dimensions: '200x180x250cm',
              shippingClass: 'Heavy Equipment',
            },
            bulkPricing: {
              '1-2': product.basePrice,
              '3-5': product.basePrice * 0.95,
              '6+': product.basePrice * 0.90,
            },
          },
        } : undefined,
        rentalDetails: product.dailyRate ? {
          create: {
            dailyRate: product.dailyRate,
            weeklyRate: product.weeklyRate,
            monthlyRate: product.monthlyRate,
            securityDeposit: product.securityDeposit,
            deliveryFee: 500,
            setupFee: 1000,
            minimumRentalPeriod: 1,
            maximumRentalPeriod: 365,
            inventory: { quantity: Math.floor(Math.random() * 5) + 1 },
            rentalTerms: {
              delivery: 'Included within 50km',
              setup: 'Professional installation included',
              maintenance: 'Scheduled maintenance included',
              insurance: 'Equipment insurance required',
            },
            maintenanceSchedule: {
              frequency: 'Monthly',
              included: true,
              cost: 'Included in rental',
            },
          },
        } : undefined,
      },
    });
  }
  console.log('✅ Products created');

  // Create rental units for rental products
  console.log('🔧 Creating rental units...');
  const rentalProducts = await prisma.rentalProduct.findMany({
    select: { id: true, product: { select: { name: true } } },
  });

  for (const rentalProduct of rentalProducts) {
    const unitCount = Math.floor(Math.random() * 3) + 1; // 1-3 units per product
    
    for (let i = 1; i <= unitCount; i++) {
      await prisma.rentalUnit.create({
        data: {
          rentalProductId: rentalProduct.id,
          serialNumber: `SN-${rentalProduct.product.name.replace(/\s+/g, '')}-${i}`,
          condition: 'EXCELLENT',
          status: Math.random() > 0.3 ? 'AVAILABLE' : 'IN_USE', // 70% available
          lastMaintenanceDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
          nextMaintenanceDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within next 30 days
          location: 'Dubai Warehouse',
          notes: `Unit ${i} of ${rentalProduct.product.name}`,
        },
      });
    }
  }
  console.log('✅ Rental units created');

  // Create some product reviews
  console.log('⭐ Creating product reviews...');
  const customersData = await prisma.user.findMany({
    where: { userType: 'INDIVIDUAL_CUSTOMER' },
    select: { id: true, firstName: true, lastName: true },
  });

  const productsData = await prisma.product.findMany({
    select: { id: true, name: true },
  });

  for (const product of productsData.slice(0, 3)) { // Review first 3 products
    const reviewCount = Math.floor(Math.random() * 5) + 2; // 2-6 reviews per product
    
    for (let i = 0; i < reviewCount; i++) {
      const customer = customersData[Math.floor(Math.random() * customersData.length)];
      const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
      
      await prisma.productReview.create({
        data: {
          productId: product.id,
          userId: customer.id,
          rating,
          title: `Great ${product.name}`,
          comment: `Excellent quality and performance. Highly recommended for medical facilities.`,
          verifiedPurchase: true,
          helpful: Math.floor(Math.random() * 10),
          notHelpful: Math.floor(Math.random() * 3),
          pros: ['High quality', 'Reliable', 'Easy to use'],
          cons: ['Expensive', 'Large footprint'],
        },
      });
    }
  }
  console.log('✅ Product reviews created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Admin users: 1`);
  console.log(`- Healthcare providers: ${healthcareProviders.length}`);
  console.log(`- Equipment suppliers: ${suppliers.length}`);
  console.log(`- Maintenance engineers: ${engineers.length}`);
  console.log(`- Individual customers: ${customers.length}`);
  console.log(`- Products: ${products.length}`);
  console.log(`- Rental units: ${rentalProducts.length * 2} (average)`);
  console.log(`- Reviews: ${productsData.slice(0, 3).length * 4} (average)`);
  
  console.log('\n🔑 Default login credentials:');
  console.log('Admin: admin@medical-devices.com / Admin123!');
  console.log('Supplier: medtech@example.com / Password123!');
  console.log('Customer: doctor@example.com / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });