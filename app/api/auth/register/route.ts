import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations';
import { sendVerificationEmail } from '@/lib/email';
import { apiHandler } from '@/lib/api-handler';
import { UserType } from '@prisma/client';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

// Extended validation schemas for different user types
const baseRegistrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
  userType: z.enum(['HEALTHCARE_PROVIDER', 'EQUIPMENT_SUPPLIER', 'MAINTENANCE_ENGINEER', 'INDIVIDUAL_CUSTOMER']),
  preferredLanguage: z.enum(['en', 'ar']).default('en'),
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  privacyAccepted: z.boolean().refine(val => val === true, 'You must accept the privacy policy'),
});

const healthcareProviderSchema = baseRegistrationSchema.extend({
  userType: z.literal('HEALTHCARE_PROVIDER'),
  organizationName: z.string().min(2, 'Organization name is required'),
  organizationType: z.string().min(2, 'Organization type is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  taxRegistrationNumber: z.string().optional(),
  numberOfBeds: z.number().positive().optional(),
  yearEstablished: z.number().positive().optional(),
  emergencyContact: z.string().optional(),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State/Province is required'),
    country: z.string().min(1, 'Country is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
  }),
  specializations: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
});

const equipmentSupplierSchema = baseRegistrationSchema.extend({
  userType: z.literal('EQUIPMENT_SUPPLIER'),
  companyName: z.string().min(2, 'Company name is required'),
  businessRegistrationNumber: z.string().min(1, 'Business registration number is required'),
  taxId: z.string().optional(),
  yearEstablished: z.number().positive().optional(),
  numberOfEmployees: z.number().positive().optional(),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State/Province is required'),
    country: z.string().min(1, 'Country is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
  }),
  productCategories: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  brands: z.array(z.string()).optional(),
});

const maintenanceEngineerSchema = baseRegistrationSchema.extend({
  userType: z.literal('MAINTENANCE_ENGINEER'),
  certificationNumber: z.string().min(1, 'Certification number is required'),
  experienceYears: z.number().positive('Experience years must be positive'),
  hourlyRate: z.number().positive().optional(),
  specializations: z.array(z.string()).min(1, 'At least one specialization is required'),
  certifications: z.array(z.string()).optional(),
  serviceAreas: z.array(z.string()).min(1, 'At least one service area is required'),
});

const individualCustomerSchema = baseRegistrationSchema.extend({
  userType: z.literal('INDIVIDUAL_CUSTOMER'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State/Province is required'),
    country: z.string().min(1, 'Country is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
  }).optional(),
});

// Combined schema that validates based on userType
const registrationSchema = z.discriminatedUnion('userType', [
  healthcareProviderSchema,
  equipmentSupplierSchema,
  maintenanceEngineerSchema,
  individualCustomerSchema,
]);

export const POST = apiHandler(async (request: NextRequest) => {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = registrationSchema.parse(body);
    
    // Check password confirmation
    if (validatedData.password !== validatedData.confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 12);

    // Prepare user data
    const userData: any = {
      email: validatedData.email,
      passwordHash: hashedPassword,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      phoneNumber: validatedData.phoneNumber || '',
      userType: validatedData.userType as UserType,
      status: 'PENDING_VERIFICATION',
      verificationStatus: 'UNVERIFIED',
      preferredLanguage: validatedData.preferredLanguage,
    };

    // Add type-specific profile data
    switch (validatedData.userType) {
      case 'HEALTHCARE_PROVIDER':
        userData.healthcareProfile = {
          create: {
            organizationName: validatedData.organizationName,
            organizationType: validatedData.organizationType,
            licenseNumber: validatedData.licenseNumber,
            taxRegistrationNumber: validatedData.taxRegistrationNumber,
            numberOfBeds: validatedData.numberOfBeds,
            yearEstablished: validatedData.yearEstablished,
            emergencyContact: validatedData.emergencyContact,
            address: validatedData.address,
            specializations: validatedData.specializations || [],
            certifications: validatedData.certifications || [],
          },
        };
        break;

      case 'EQUIPMENT_SUPPLIER':
        userData.supplierProfile = {
          create: {
            companyName: validatedData.companyName,
            businessRegistrationNumber: validatedData.businessRegistrationNumber,
            taxId: validatedData.taxId,
            yearEstablished: validatedData.yearEstablished,
            numberOfEmployees: validatedData.numberOfEmployees,
            address: validatedData.address,
            productCategories: validatedData.productCategories || [],
            certifications: validatedData.certifications || [],
            brands: validatedData.brands || [],
          },
        };
        break;

      case 'MAINTENANCE_ENGINEER':
        userData.engineerProfile = {
          create: {
            certificationNumber: validatedData.certificationNumber,
            experienceYears: validatedData.experienceYears,
            hourlyRate: validatedData.hourlyRate,
            specializations: validatedData.specializations,
            certifications: validatedData.certifications || [],
            serviceAreas: validatedData.serviceAreas,
          },
        };
        break;

      case 'INDIVIDUAL_CUSTOMER':
        if (validatedData.address || validatedData.dateOfBirth || validatedData.gender) {
          userData.individualProfile = {
            create: {
              dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : undefined,
              gender: validatedData.gender,
              address: validatedData.address || {},
            },
          };
        }
        break;
    }

    // Create user with profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create the user
      const newUser = await tx.user.create({
        data: userData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          userType: true,
          preferredLanguage: true,
        },
      });

      // Create verification token
      const verificationToken = await tx.verificationToken.create({
        data: {
          userId: newUser.id,
          token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
          type: 'EMAIL_VERIFICATION',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      // Send verification email
      await sendVerificationEmail(newUser.email, verificationToken.token);

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: newUser.id,
          action: 'USER_REGISTRATION',
          entity: 'User',
          entityId: newUser.id,
          newData: {
            email: newUser.email,
            userType: newUser.userType,
          },
        },
      });

      return newUser;
    });

    // Generate JWT token for immediate login (optional)
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        userType: user.userType 
      },
      process.env.JWT_SECRET || 'fallback-secret-change-in-production',
      { expiresIn: '7d' }
    );

    return NextResponse.json(
      {
        message: 'Registration successful! Please check your email to verify your account.',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
        },
        token, // Optional: include if you want auto-login after registration
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Check for specific database errors
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Registration failed. Please try again later.' },
      { status: 500 }
    );
  }
});