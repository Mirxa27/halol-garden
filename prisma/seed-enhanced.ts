import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';

async function createEnhancedDemoData() {
  console.log('🎭 Creating enhanced demo data...');

  // Get existing demo supplier
  const demoSupplier = await prisma.user.findUnique({
    where: { email: 'supplier@demo.com' },
    include: { supplierProfile: true }
  });

  if (!demoSupplier || !demoSupplier.supplierProfile) {
    console.error('Demo supplier not found. Please run the basic seed first.');
    return;
  }

  // Create demo maintenance engineer
  const demoEngineerPassword = await bcrypt.hash('Demo@2024!', 12);
  const demoEngineer = await prisma.user.create({
    data: {
      email: 'engineer@demo.com',
      passwordHash: demoEngineerPassword,
      firstName: 'Ahmed',
      lastName: 'Al-Rashid',
      phoneNumber: '+966503456789',
      userType: 'MAINTENANCE_ENGINEER',
      status: 'ACTIVE',
      verificationStatus: 'FULLY_VERIFIED',
      emailVerifiedAt: new Date(),
      engineerProfile: {
        create: {
          certificationNumber: 'CERT123456',
          experienceYears: 8,
          hourlyRate: 150,
          availability: 'AVAILABLE',
          specializations: [
            'X-Ray Systems',
            'Patient Monitors',
            'Surgical Equipment',
            'Laboratory Equipment'
          ],
          certifications: [
            { name: 'Biomedical Equipment Technician', issuer: 'AAMI', year: 2018 },
            { name: 'Medical Equipment Specialist', issuer: 'ACCE', year: 2020 }
          ],
          serviceAreas: [
            'Riyadh',
            'Eastern Province',
            'Qassim'
          ],
          workSchedule: {
            monday: { start: '08:00', end: '17:00' },
            tuesday: { start: '08:00', end: '17:00' },
            wednesday: { start: '08:00', end: '17:00' },
            thursday: { start: '08:00', end: '17:00' },
            friday: { start: '13:00', end: '17:00' },
            saturday: { start: '09:00', end: '15:00' },
            sunday: { start: 'off', end: 'off' }
          },
          rating: 4.8,
          completedJobs: 127
        }
      }
    },
    include: {
      engineerProfile: true
    }
  });

  // Create demo individual customers
  const customerPasswords = await Promise.all([
    bcrypt.hash('Customer@2024!', 12),
    bcrypt.hash('Customer@2024!', 12),
    bcrypt.hash('Customer@2024!', 12)
  ]);

  const customers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'customer1@demo.com',
        passwordHash: customerPasswords[0],
        firstName: 'Sarah',
        lastName: 'Al-Mahmoud',
        phoneNumber: '+966504567890',
        userType: 'INDIVIDUAL_CUSTOMER',
        status: 'ACTIVE',
        verificationStatus: 'EMAIL_VERIFIED',
        emailVerifiedAt: new Date(),
        individualProfile: {
          create: {
            dateOfBirth: new Date('1985-06-15'),
            gender: 'Female',
            address: {
              street: '789 Residential Street',
              city: 'Riyadh',
              state: 'Riyadh Province',
              country: 'Saudi Arabia',
              postalCode: '11432'
            },
            preferences: {
              language: 'ar',
              currency: 'SAR',
              notifications: {
                email: true,
                sms: false,
                push: true
              }
            }
          }
        }
      },
      include: { individualProfile: true }
    }),
    prisma.user.create({
      data: {
        email: 'customer2@demo.com',
        passwordHash: customerPasswords[1],
        firstName: 'Mohammed',
        lastName: 'Al-Otaibi',
        phoneNumber: '+966505678901',
        userType: 'INDIVIDUAL_CUSTOMER',
        status: 'ACTIVE',
        verificationStatus: 'FULLY_VERIFIED',
        emailVerifiedAt: new Date(),
        individualProfile: {
          create: {
            dateOfBirth: new Date('1978-12-03'),
            gender: 'Male',
            address: {
              street: '321 Home District',
              city: 'Dammam',
              state: 'Eastern Province',
              country: 'Saudi Arabia',
              postalCode: '31441'
            },
            preferences: {
              language: 'en',
              currency: 'USD',
              notifications: {
                email: true,
                sms: true,
                push: true
              }
            }
          }
        }
      },
      include: { individualProfile: true }
    }),
    prisma.user.create({
      data: {
        email: 'customer3@demo.com',
        passwordHash: customerPasswords[2],
        firstName: 'Fatima',
        lastName: 'Al-Zahra',
        phoneNumber: '+966506789012',
        userType: 'INDIVIDUAL_CUSTOMER',
        status: 'ACTIVE',
        verificationStatus: 'EMAIL_VERIFIED',
        emailVerifiedAt: new Date(),
        individualProfile: {
          create: {
            dateOfBirth: new Date('1992-03-22'),
            gender: 'Female',
            address: {
              street: '654 Medical Quarter',
              city: 'Jeddah',
              state: 'Makkah Province',
              country: 'Saudi Arabia',
              postalCode: '21564'
            },
            preferences: {
              language: 'ar',
              currency: 'SAR',
              notifications: {
                email: true,
                sms: false,
                push: false
              }
            }
          }
        }
      },
      include: { individualProfile: true }
    })
  ]);

  // Create demo orders
  const products = await prisma.product.findMany({
    where: { supplierId: demoSupplier.supplierProfile.id }
  });

  const orderData = [
    {
      userId: customers[0].id,
      orderNumber: `ORD-${new Date().getFullYear()}-000001`,
      status: 'DELIVERED',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'STRIPE',
      subtotal: 8500,
      tax: 1275,
      shipping: 0,
      discount: 0,
      total: 9775,
      shippingAddress: customers[0].individualProfile!.address,
      billingAddress: customers[0].individualProfile!.address,
      confirmedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      shippedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            productId: products[1].id, // Patient Monitor Pro
            quantity: 1,
            price: 8500,
            discount: 0,
            tax: 1275,
            total: 9775,
            metadata: {
              productName: 'Patient Monitor Pro',
              sku: 'PMO-2024-002'
            }
          }
        ]
      }
    },
    {
      userId: customers[1].id,
      orderNumber: `ORD-${new Date().getFullYear()}-000002`,
      status: 'SHIPPED',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'MYFATOORAH',
      subtotal: 12000,
      tax: 1800,
      shipping: 50,
      discount: 1200,
      total: 12650,
      shippingAddress: customers[1].individualProfile!.address,
      billingAddress: customers[1].individualProfile!.address,
      confirmedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      shippedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            productId: products[2].id, // Surgical LED Light
            quantity: 1,
            price: 12000,
            discount: 1200,
            tax: 1800,
            total: 12650,
            metadata: {
              productName: 'Surgical LED Light',
              sku: 'SLL-2024-003'
            }
          }
        ]
      }
    },
    {
      userId: customers[2].id,
      orderNumber: `ORD-${new Date().getFullYear()}-000003`,
      status: 'PROCESSING',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'STRIPE',
      subtotal: 45000,
      tax: 6750,
      shipping: 0,
      discount: 2250,
      total: 49500,
      shippingAddress: customers[2].individualProfile!.address,
      billingAddress: customers[2].individualProfile!.address,
      confirmedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            productId: products[0].id, // Digital X-Ray System
            quantity: 1,
            price: 45000,
            discount: 2250,
            tax: 6750,
            total: 49500,
            metadata: {
              productName: 'Digital X-Ray System',
              sku: 'DXR-2024-001'
            }
          }
        ]
      }
    }
  ];

  const orders = [];
  for (const order of orderData) {
    const createdOrder = await prisma.order.create({ data: order, include: { items: true } });
    orders.push(createdOrder);
  }

  // Create product reviews
  const reviewData = [
    {
      productId: products[1].id,
      userId: customers[0].id,
      rating: 5,
      title: 'Excellent patient monitor',
      comment: 'This monitor has exceeded our expectations. The display is crystal clear and the alarms are very reliable. Great investment for our clinic.',
      isVerified: true,
      helpful: 12
    },
    {
      productId: products[1].id,
      userId: customers[1].id,
      rating: 4,
      title: 'Good quality but expensive',
      comment: 'The monitor works well and has all the features we needed. However, it is quite expensive compared to similar products.',
      isVerified: true,
      helpful: 8
    },
    {
      productId: products[2].id,
      userId: customers[1].id,
      rating: 5,
      title: 'Perfect surgical lighting',
      comment: 'Amazing light quality with no shadows. The adjustable color temperature is very helpful during different procedures.',
      isVerified: true,
      helpful: 15
    },
    {
      productId: products[0].id,
      userId: customers[2].id,
      rating: 5,
      title: 'State-of-the-art X-ray system',
      comment: 'This X-ray system has transformed our diagnostic capabilities. The image quality is outstanding and the workflow is much more efficient.',
      isVerified: true,
      helpful: 22
    }
  ];

  for (const review of reviewData) {
    await prisma.productReview.create({ data: review });
  }

  // Update product ratings based on reviews
  for (const product of products) {
    const reviews = await prisma.productReview.findMany({
      where: { productId: product.id }
    });
    
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      await prisma.product.update({
        where: { id: product.id },
        data: { rating: avgRating }
      });
    }
  }

  // Create maintenance requests
  const maintenanceData = [
    {
      userId: customers[0].id,
      engineerId: demoEngineer.engineerProfile!.id,
      productId: products[1].id,
      requestNumber: `MNT-${new Date().getFullYear()}-000001`,
      status: 'COMPLETED',
      priority: 'NORMAL',
      issueType: 'MAINTENANCE',
      description: 'Routine maintenance and calibration of patient monitor. Display flickering occasionally.',
      scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      completedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      estimatedCost: 200,
      actualCost: 180,
      location: {
        facility: 'Home Clinic',
        address: '789 Residential Street, Riyadh',
        contactPerson: 'Sarah Al-Mahmoud',
        phone: '+966504567890'
      },
      workPerformed: {
        tasks: [
          'Cleaned internal components',
          'Calibrated sensors',
          'Updated firmware',
          'Replaced display cable'
        ],
        timeSpent: 4,
        notes: 'All systems functioning normally after maintenance'
      },
      partsUsed: [
        { name: 'Display Cable', partNumber: 'DC-001', quantity: 1, cost: 50 }
      ],
      rating: 5,
      feedback: 'Excellent service. The engineer was professional and fixed the issue quickly.'
    },
    {
      userId: customers[1].id,
      engineerId: demoEngineer.engineerProfile!.id,
      productId: products[2].id,
      requestNumber: `MNT-${new Date().getFullYear()}-000002`,
      status: 'SCHEDULED',
      priority: 'HIGH',
      issueType: 'REPAIR',
      description: 'Surgical light intensity is decreasing and some LEDs appear to be failing.',
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      estimatedCost: 500,
      location: {
        facility: 'Al-Otaibi Medical Center',
        address: '321 Home District, Dammam',
        contactPerson: 'Mohammed Al-Otaibi',
        phone: '+966505678901'
      }
    }
  ];

  for (const maintenance of maintenanceData) {
    await prisma.maintenanceRequest.create({ data: maintenance });
  }

  // Create default coupons using the coupon service
  try {
    const superAdmin = await prisma.user.findFirst({
      where: { userType: 'ADMIN' }
    });

    if (superAdmin) {
      const { CouponService } = await import('../lib/coupon/service');
      await CouponService.createDefaultCoupons(superAdmin.id);
      console.log('✅ Default coupons created');
    }
  } catch (error) {
    console.warn('⚠️ Could not create default coupons:', error);
  }

  console.log('✅ Enhanced demo data created successfully');
  console.log(`   - ${customers.length} demo customers`);
  console.log(`   - ${orders.length} demo orders`);
  console.log(`   - ${reviewData.length} product reviews`);
  console.log(`   - ${maintenanceData.length} maintenance requests`);
  console.log(`   - 1 maintenance engineer`);
}

async function main() {
  try {
    await createEnhancedDemoData();
  } catch (error) {
    console.error('❌ Error creating enhanced demo data:', error);
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