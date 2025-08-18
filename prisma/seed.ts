import { PrismaClient, UserType, UserStatus, VerificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ----- USERS -----
  const passwordHash = await bcrypt.hash('password123', 10);

  // Admin user
  await prisma.user.upsert({
    where: { email: 'admin@medical-devices.com' },
    update: {},
    create: {
      email: 'admin@medical-devices.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      phoneNumber: '+1234567890',
      userType: UserType.ADMIN,
      status: UserStatus.ACTIVE,
      verificationStatus: VerificationStatus.FULLY_VERIFIED,
      adminProfile: {
        create: {
          jobTitle: 'Super Admin',
        },
      },
    },
  });

  // Equipment supplier user
  await prisma.user.upsert({
    where: { email: 'supplier@medical-devices.com' },
    update: {},
    create: {
      email: 'supplier@medical-devices.com',
      passwordHash,
      firstName: 'Supplier',
      lastName: 'User',
      phoneNumber: '+1234567891',
      userType: UserType.EQUIPMENT_SUPPLIER,
      status: UserStatus.ACTIVE,
      verificationStatus: VerificationStatus.EMAIL_VERIFIED,
      supplierProfile: {
        create: {
          companyName: 'Acme Medical Supplies',
          businessRegistrationNumber: 'ACME-REG-001',
          taxRegistrationNumber: 'ACME-TAX-001',
          yearEstablished: 2010,
          returnPolicy: '30-day returns',
          warrantyTerms: '1-year standard warranty',
          address: {
            street: 'King Fahd Road',
            city: 'Riyadh',
            country: 'Saudi Arabia',
          },
        },
      },
    },
  });

  // Basic product category & product example (keep minimal)
  const imagingCategory = await prisma.productCategory.upsert({
    where: { slug: 'imaging' },
    update: {},
    create: {
      name: 'Imaging',
      slug: 'imaging',
      description: 'Radiology & imaging equipment',
    },
  });

  await prisma.product.upsert({
    where: { slug: 'portable-ultrasound' },
    update: {},
    create: {
      name: 'Portable Ultrasound Machine',
      slug: 'portable-ultrasound',
      description: 'Compact ultrasound device for bedside diagnostics',
      price: 15000,
      currency: 'USD',
      stockQuantity: 10,
      supplierId: (await prisma.user.findFirst({ where: { email: 'supplier@medical-devices.com' } }))!.id,
      categories: {
        connect: { id: imagingCategory.id },
      },
    },
  });

  console.log('Seed data inserted successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });