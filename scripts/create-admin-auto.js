#!/usr/bin/env node
const { PrismaClient, UserType, UserStatus, VerificationStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');

(async () => {
  const prisma = new PrismaClient();
  try {
    const email = process.env.ADMIN_EMAIL || `admin+${Date.now()}@halol-garden.com`;
    const password = process.env.ADMIN_PASSWORD || Math.random().toString(36).slice(2) + Math.random().toString(36).toUpperCase().slice(2);
    const firstName = process.env.ADMIN_FIRST || 'Admin';
    const lastName = process.env.ADMIN_LAST || 'User';
    const phoneNumber = process.env.ADMIN_PHONE || '+966500000001';

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log(`User already exists: ${email}`);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phoneNumber,
        userType: UserType.ADMIN,
        status: UserStatus.ACTIVE,
        verificationStatus: VerificationStatus.FULLY_VERIFIED,
        emailVerifiedAt: new Date(),
        preferredLanguage: 'en',
        adminProfile: {
          create: {
            role: 'SUPER_ADMIN',
            permissions: [
              'users.create','users.read','users.update','users.delete',
              'products.create','products.read','products.update','products.delete',
              'orders.create','orders.read','orders.update','orders.delete',
              'payments.manage','settings.manage','reports.view','reports.export',
              'system.configure','system.maintenance','analytics.view','support.manage'
            ]
          }
        }
      }
    });

    console.log('ADMIN_CREATED');
    console.log(`ID:${user.id}`);
    console.log(`EMAIL:${email}`);
    console.log(`PASSWORD:${password}`);
  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
