import { NextRequest, NextResponse } from 'next/server';
import { UserType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { generateTokenPair, generateSecureToken } from '@/lib/auth/jwt';
import { sendWelcomeEmail } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';

// Validation schemas for different user types
const baseUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  userType: z.nativeEnum(UserType),
  preferredLanguage: z.enum(['en', 'ar']).optional().default('en'),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
});

const healthcareProviderSchema = baseUserSchema.extend({
  organizationName: z.string().min(3),
  organizationType: z.string().min(3),
  licenseNumber: z.string().min(5),
  taxRegistrationNumber: z.string().optional(),
  numberOfBeds: z.number().int().positive().optional(),
  yearEstablished: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  emergencyContact: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.object({
    street: z.string().min(3),
    city: z.string().min(2),
    state: z.string().min(2),
    country: z.string().min(2),
    postalCode: z.string().min(3)
  }),
  specializations: z.array(z.string()).optional(),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    year: z.number()
  })).optional()
});

const equipmentSupplierSchema = baseUserSchema.extend({
  companyName: z.string().min(3),
  businessRegistrationNumber: z.string().min(5),
  taxId: z.string().optional(),
  yearEstablished: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  numberOfEmployees: z.number().int().positive().optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.object({
    street: z.string().min(3),
    city: z.string().min(2),
    state: z.string().min(2),
    country: z.string().min(2),
    postalCode: z.string().min(3)
  }),
  productCategories: z.array(z.string()),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    year: z.number()
  })).optional(),
  brands: z.array(z.string()).optional()
});

const maintenanceEngineerSchema = baseUserSchema.extend({
  certificationNumber: z.string().min(5),
  experienceYears: z.number().int().min(0),
  hourlyRate: z.number().positive().optional(),
  specializations: z.array(z.string()),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    year: z.number()
  })).optional(),
  serviceAreas: z.array(z.string())
});

const individualCustomerSchema = baseUserSchema.extend({
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.object({
    street: z.string().min(3),
    city: z.string().min(2),
    state: z.string().min(2),
    country: z.string().min(2),
    postalCode: z.string().min(3)
  })
});

function getValidationSchema(userType: UserType) {
  switch (userType) {
    case 'HEALTHCARE_PROVIDER':
      return healthcareProviderSchema;
    case 'EQUIPMENT_SUPPLIER':
      return equipmentSupplierSchema;
    case 'MAINTENANCE_ENGINEER':
      return maintenanceEngineerSchema;
    case 'INDIVIDUAL_CUSTOMER':
      return individualCustomerSchema;
    default:
      return baseUserSchema;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate user type first
    if (!body.userType || !Object.values(UserType).includes(body.userType)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid user type'
        },
        { status: 400 }
      );
    }
    
    // Get appropriate validation schema
    const schema = getValidationSchema(body.userType as UserType);
    const validationResult = schema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    
    // Check password confirmation
    if (data.password !== data.confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'Passwords do not match'
        },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    });
    
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email already registered'
        },
        { status: 409 }
      );
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);
    
    // Prepare user data
    const userData: any = {
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      userType: data.userType,
      preferredLanguage: data.preferredLanguage,
      status: 'PENDING_VERIFICATION',
      verificationStatus: 'UNVERIFIED'
    };
    
    // Add profile data based on user type
    switch (data.userType) {
      case 'HEALTHCARE_PROVIDER':
        const hcData = data as z.infer<typeof healthcareProviderSchema>;
        userData.healthcareProfile = {
          create: {
            organizationName: hcData.organizationName,
            organizationType: hcData.organizationType,
            licenseNumber: hcData.licenseNumber,
            taxRegistrationNumber: hcData.taxRegistrationNumber,
            numberOfBeds: hcData.numberOfBeds,
            yearEstablished: hcData.yearEstablished,
            emergencyContact: hcData.emergencyContact,
            website: hcData.website,
            address: hcData.address,
            specializations: hcData.specializations || [],
            certifications: hcData.certifications || [],
            operatingHours: {}
          }
        };
        break;
        
      case 'EQUIPMENT_SUPPLIER':
        const esData = data as z.infer<typeof equipmentSupplierSchema>;
        userData.supplierProfile = {
          create: {
            companyName: esData.companyName,
            businessRegistrationNumber: esData.businessRegistrationNumber,
            taxId: esData.taxId,
            yearEstablished: esData.yearEstablished,
            numberOfEmployees: esData.numberOfEmployees,
            website: esData.website,
            address: esData.address,
            productCategories: esData.productCategories,
            certifications: esData.certifications || [],
            brands: esData.brands || []
          }
        };
        break;
        
      case 'MAINTENANCE_ENGINEER':
        const meData = data as z.infer<typeof maintenanceEngineerSchema>;
        userData.engineerProfile = {
          create: {
            certificationNumber: meData.certificationNumber,
            experienceYears: meData.experienceYears,
            hourlyRate: meData.hourlyRate,
            specializations: meData.specializations,
            certifications: meData.certifications || [],
            serviceAreas: meData.serviceAreas,
            availability: 'AVAILABLE'
          }
        };
        break;
        
      case 'INDIVIDUAL_CUSTOMER':
        const icData = data as z.infer<typeof individualCustomerSchema>;
        userData.individualProfile = {
          create: {
            dateOfBirth: icData.dateOfBirth ? new Date(icData.dateOfBirth) : undefined,
            gender: icData.gender,
            address: icData.address,
            preferences: {}
          }
        };
        break;
    }
    
    // Create user with profile
    const user = await prisma.user.create({
      data: userData,
      include: {
        healthcareProfile: true,
        supplierProfile: true,
        engineerProfile: true,
        individualProfile: true
      }
    });
    
    // Create cart for the user
    await prisma.cart.create({
      data: {
        userId: user.id
      }
    });
    
    // Generate email verification token
    const verificationToken = generateSecureToken(32);
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        type: 'EMAIL_VERIFICATION',
        expiresAt: tokenExpiry
      }
    });
    
    // Send welcome email
    await sendWelcomeEmail(user);
    
    // Create session
    const sessionId = uuidv4();
    await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });
    
    // Generate JWT tokens
    const tokens = generateTokenPair(user, sessionId);
    
    // Log registration
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        entity: 'User',
        entityId: user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || null,
        newData: { userType: user.userType, email: user.email }
      }
    });
    
    // Prepare response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            userType: user.userType,
            status: user.status,
            verificationStatus: user.verificationStatus,
            preferredLanguage: user.preferredLanguage
          },
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn
          },
          sessionId
        }
      },
      { status: 201 }
    );
    
    // Set secure HTTP-only cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/'
    };
    
    response.cookies.set('access_token', tokens.accessToken, {
      ...cookieOptions,
      maxAge: tokens.expiresIn
    });
    
    response.cookies.set('refresh_token', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60
    });
    
    response.cookies.set('session_id', sessionId, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60
    });
    
    return response;
    
  } catch (error) {
    console.error('Registration error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during registration. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}