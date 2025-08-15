#!/usr/bin/env tsx

/**
 * Script to create an initial admin user for the Medical Devices Marketplace
 * Usage: npx tsx scripts/create-admin.ts
 */

import { PrismaClient, UserType, UserStatus, VerificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function createAdminUser() {
  console.log('🏥 Medical Devices Marketplace - Admin User Creation');
  console.log('====================================================\n');

  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { userType: UserType.ADMIN }
    });

    if (existingAdmin) {
      console.log('⚠️  An admin user already exists.');
      const overwrite = await question('Do you want to create another admin? (y/n): ');
      
      if (overwrite.toLowerCase() !== 'y') {
        console.log('Exiting...');
        process.exit(0);
      }
    }

    // Collect user information
    console.log('\nPlease provide the following information:\n');
    
    const email = await question('Email address: ');
    const firstName = await question('First name: ');
    const lastName = await question('Last name: ');
    const phoneNumber = await question('Phone number: ');
    const password = await question('Password (min 8 characters): ');
    const employeeId = await question('Employee ID: ');
    const department = await question('Department (e.g., IT, Management): ');

    // Validate password
    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters long');
      process.exit(1);
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid email address');
      process.exit(1);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.error('❌ A user with this email already exists');
      process.exit(1);
    }

    console.log('\n🔄 Creating admin user...');

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and admin profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
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
          preferredLanguage: 'en'
        }
      });

      // Create admin profile
      const adminProfile = await tx.adminProfile.create({
        data: {
          userId: user.id,
          employeeId,
          department,
          accessLevel: 'SUPER_ADMIN',
          permissions: {
            users: ['create', 'read', 'update', 'delete'],
            products: ['create', 'read', 'update', 'delete'],
            orders: ['create', 'read', 'update', 'delete'],
            settings: ['create', 'read', 'update', 'delete'],
            analytics: ['read'],
            system: ['manage']
          },
          managedRegions: ['all'],
          managedCategories: ['all']
        }
      });

      return { user, adminProfile };
    });

    console.log('\n✅ Admin user created successfully!\n');
    console.log('📋 User Details:');
    console.log('================');
    console.log(`ID: ${result.user.id}`);
    console.log(`Email: ${result.user.email}`);
    console.log(`Name: ${result.user.firstName} ${result.user.lastName}`);
    console.log(`Type: ${result.user.userType}`);
    console.log(`Status: ${result.user.status}`);
    console.log(`Employee ID: ${result.adminProfile.employeeId}`);
    console.log(`Department: ${result.adminProfile.department}`);
    console.log(`Access Level: ${result.adminProfile.accessLevel}`);
    
    console.log('\n🔐 Login Credentials:');
    console.log('====================');
    console.log(`Email: ${email}`);
    console.log(`Password: [hidden]`);
    
    console.log('\n📝 Next Steps:');
    console.log('=============');
    console.log('1. Navigate to your application URL');
    console.log('2. Click on "Admin Login" or go to /admin');
    console.log('3. Use the credentials above to log in');
    console.log('4. Complete the environment configuration wizard');
    console.log('5. Set up additional admin users as needed');
    
    // Ask if user wants to create another admin
    const createAnother = await question('\nDo you want to create another admin user? (y/n): ');
    
    if (createAnother.toLowerCase() === 'y') {
      await createAdminUser();
    }

  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser().then(() => {
  console.log('\n👋 Goodbye!');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});