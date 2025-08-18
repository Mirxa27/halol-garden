import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  userType: z.enum([
    'HEALTHCARE_PROVIDER', 
    'EQUIPMENT_SUPPLIER', 
    'MAINTENANCE_ENGINEER',
    'INDIVIDUAL_CUSTOMER'
  ]),
  organizationName: z.string().optional(),
  phone: z.string().optional(),
  licenseNumber: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      userType, 
      organizationName, 
      phone,
      licenseNumber 
    } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user with appropriate profile based on userType
    let userData: any = {
      email,
      passwordHash: hashedPassword,
      firstName,
      lastName,
      phoneNumber: phone || '',
      userType,
    };

    // Add profile based on user type
    if (userType === 'HEALTHCARE_PROVIDER' && organizationName) {
      userData.healthcareProfile = {
        create: {
          organizationName,
          organizationType: 'HOSPITAL', // Default, should be provided by form
          licenseNumber: licenseNumber || '',
          address: {}, // Should be provided by form
          specializations: [],
        },
      };
    } else if (userType === 'EQUIPMENT_SUPPLIER' && organizationName) {
      userData.supplierProfile = {
        create: {
          companyName: organizationName,
          businessRegistrationNumber: licenseNumber || '',
          address: {}, // Should be provided by form
          productCategories: [],
          certifications: [],
        },
      };
    } else if (userType === 'MAINTENANCE_ENGINEER') {
      userData.engineerProfile = {
        create: {
          certificationNumber: licenseNumber || '',
          specializations: [],
          experienceYears: 0,
          serviceAreas: [],
        },
      };
    } else if (userType === 'INDIVIDUAL_CUSTOMER') {
      userData.individualProfile = {
        create: {
          dateOfBirth: null,
          address: {},
        },
      };
    }

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        createdAt: true,
      },
    });

    // Send verification email (implement this)
    // await sendVerificationEmail(user.email);

    return NextResponse.json(
      {
        message: 'User created successfully. Please check your email for verification.',
        user: {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          userType: user.userType,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}