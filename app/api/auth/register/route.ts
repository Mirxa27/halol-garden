import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Validation schemas
const baseRegistrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 characters'),
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
  specializations: z.array(z.string()).min(1, 'At least one specialization is required'),
  accreditations: z.array(z.string()).optional(),
  contactPersons: z.array(z.object({
    name: z.string(),
    position: z.string(),
    email: z.string().email(),
    phone: z.string(),
  })).optional(),
  operatingHours: z.object({
    monday: z.object({ open: z.string(), close: z.string() }).optional(),
    tuesday: z.object({ open: z.string(), close: z.string() }).optional(),
    wednesday: z.object({ open: z.string(), close: z.string() }).optional(),
    thursday: z.object({ open: z.string(), close: z.string() }).optional(),
    friday: z.object({ open: z.string(), close: z.string() }).optional(),
    saturday: z.object({ open: z.string(), close: z.string() }).optional(),
    sunday: z.object({ open: z.string(), close: z.string() }).optional(),
  }).optional(),
});

const equipmentSupplierSchema = baseRegistrationSchema.extend({
  userType: z.literal('EQUIPMENT_SUPPLIER'),
  companyName: z.string().min(2, 'Company name is required'),
  businessRegistrationNumber: z.string().min(1, 'Business registration number is required'),
  taxRegistrationNumber: z.string().min(1, 'Tax registration number is required'),
  yearEstablished: z.number().positive('Year established must be positive'),
  returnPolicy: z.string().min(10, 'Return policy must be at least 10 characters'),
  warrantyTerms: z.string().min(10, 'Warranty terms must be at least 10 characters'),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State/Province is required'),
    country: z.string().min(1, 'Country is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
  }),
  warehouseLocations: z.array(z.object({
    name: z.string(),
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      country: z.string(),
      postalCode: z.string(),
    }),
  })).optional(),
  productCategories: z.array(z.string()).min(1, 'At least one product category is required'),
  brands: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  bankDetails: z.object({
    bankName: z.string(),
    accountNumber: z.string(),
    routingNumber: z.string().optional(),
    swiftCode: z.string().optional(),
  }).optional(),
  deliveryCapabilities: z.object({
    localDelivery: z.boolean().default(false),
    nationalDelivery: z.boolean().default(false),
    internationalDelivery: z.boolean().default(false),
    deliveryTime: z.string().optional(),
  }).optional(),
});

const maintenanceEngineerSchema = baseRegistrationSchema.extend({
  userType: z.literal('MAINTENANCE_ENGINEER'),
  companyName: z.string().optional(),
  isFreelancer: z.boolean().default(true),
  licenseNumber: z.string().min(1, 'License number is required'),
  experienceYears: z.number().positive('Experience years must be positive'),
  hourlyRate: z.number().positive().optional(),
  emergencyServiceAvailable: z.boolean().default(false),
  emergencyServiceSurcharge: z.number().positive().optional(),
  specializations: z.array(z.string()).min(1, 'At least one specialization is required'),
  certifications: z.array(z.string()).optional(),
  serviceAreas: z.array(z.object({
    city: z.string(),
    state: z.string(),
    country: z.string(),
    radius: z.number().positive().optional(),
  })).min(1, 'At least one service area is required'),
  availability: z.object({
    monday: z.object({ available: z.boolean(), hours: z.string().optional() }).optional(),
    tuesday: z.object({ available: z.boolean(), hours: z.string().optional() }).optional(),
    wednesday: z.object({ available: z.boolean(), hours: z.string().optional() }).optional(),
    thursday: z.object({ available: z.boolean(), hours: z.string().optional() }).optional(),
    friday: z.object({ available: z.boolean(), hours: z.string().optional() }).optional(),
    saturday: z.object({ available: z.boolean(), hours: z.string().optional() }).optional(),
    sunday: z.object({ available: z.boolean(), hours: z.string().optional() }).optional(),
  }).optional(),
  toolsAndEquipment: z.array(z.string()).optional(),
  insuranceCoverage: z.object({
    hasInsurance: z.boolean(),
    provider: z.string().optional(),
    policyNumber: z.string().optional(),
    coverageAmount: z.number().positive().optional(),
  }).optional(),
});

const individualCustomerSchema = baseRegistrationSchema.extend({
  userType: z.literal('INDIVIDUAL_CUSTOMER'),
  dateOfBirth: z.string().optional(),
  nationalId: z.string().optional(),
  medicalLicenseNumber: z.string().optional(),
  profession: z.string().optional(),
  preferredPaymentMethod: z.string().optional(),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State/Province is required'),
    country: z.string().min(1, 'Country is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
  }),
});

// Combined schema with discriminated union
const registrationSchema = z.discriminatedUnion('userType', [
  healthcareProviderSchema,
  equipmentSupplierSchema,
  maintenanceEngineerSchema,
  individualCustomerSchema,
]);

// JWT token generation
function generateTokens(userId: string, userType: string) {
  const accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
  const refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  
  const accessToken = jwt.sign(
    { 
      userId, 
      userType,
      type: 'access'
    },
    process.env.JWT_SECRET!,
    { expiresIn: accessTokenExpiry }
  );

  const refreshToken = jwt.sign(
    { 
      userId, 
      userType,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: refreshTokenExpiry }
  );

  return { accessToken, refreshToken };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = registrationSchema.parse(body);
    
    // Check if passwords match
    if (validatedData.password !== validatedData.confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(validatedData.password, saltRounds);

    // Get client IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    // Create user with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create base user
      const user = await tx.user.create({
        data: {
          email: validatedData.email.toLowerCase(),
          passwordHash,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phoneNumber: validatedData.phoneNumber,
          userType: validatedData.userType,
          preferredLanguage: validatedData.preferredLanguage,
          status: 'PENDING_VERIFICATION',
          verificationStatus: 'UNVERIFIED',
        },
      });

      // Create profile based on user type
      switch (validatedData.userType) {
        case 'HEALTHCARE_PROVIDER':
          await tx.healthcareProvider.create({
            data: {
              userId: user.id,
              organizationName: validatedData.organizationName,
              organizationType: validatedData.organizationType,
              licenseNumber: validatedData.licenseNumber,
              taxRegistrationNumber: validatedData.taxRegistrationNumber,
              numberOfBeds: validatedData.numberOfBeds,
              yearEstablished: validatedData.yearEstablished,
              emergencyContact: validatedData.emergencyContact,
              address: validatedData.address,
              specializations: validatedData.specializations,
              accreditations: validatedData.accreditations || [],
              contactPersons: validatedData.contactPersons || [],
              operatingHours: validatedData.operatingHours || {},
            },
          });
          break;

        case 'EQUIPMENT_SUPPLIER':
          await tx.equipmentSupplier.create({
            data: {
              userId: user.id,
              companyName: validatedData.companyName,
              businessRegistrationNumber: validatedData.businessRegistrationNumber,
              taxRegistrationNumber: validatedData.taxRegistrationNumber,
              yearEstablished: validatedData.yearEstablished,
              returnPolicy: validatedData.returnPolicy,
              warrantyTerms: validatedData.warrantyTerms,
              address: validatedData.address,
              warehouseLocations: validatedData.warehouseLocations || [],
              productCategories: validatedData.productCategories,
              brands: validatedData.brands || [],
              certifications: validatedData.certifications || [],
              bankDetails: validatedData.bankDetails || {},
              deliveryCapabilities: validatedData.deliveryCapabilities || {},
            },
          });
          break;

        case 'MAINTENANCE_ENGINEER':
          await tx.maintenanceEngineer.create({
            data: {
              userId: user.id,
              companyName: validatedData.companyName,
              isFreelancer: validatedData.isFreelancer,
              licenseNumber: validatedData.licenseNumber,
              experienceYears: validatedData.experienceYears,
              hourlyRate: validatedData.hourlyRate,
              emergencyServiceAvailable: validatedData.emergencyServiceAvailable,
              emergencyServiceSurcharge: validatedData.emergencyServiceSurcharge,
              specializations: validatedData.specializations,
              certifications: validatedData.certifications || [],
              serviceAreas: validatedData.serviceAreas,
              availability: validatedData.availability || {},
              toolsAndEquipment: validatedData.toolsAndEquipment || [],
              insuranceCoverage: validatedData.insuranceCoverage || {},
            },
          });
          break;

        case 'INDIVIDUAL_CUSTOMER':
          await tx.individualCustomer.create({
            data: {
              userId: user.id,
              dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
              nationalId: validatedData.nationalId,
              medicalLicenseNumber: validatedData.medicalLicenseNumber,
              profession: validatedData.profession,
              preferredPaymentMethod: validatedData.preferredPaymentMethod,
              address: validatedData.address,
            },
          });
          break;
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'REGISTER',
          entityType: 'USER',
          entityId: user.id,
          ipAddress: clientIP,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      });

      return user;
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(result.id, result.userType);

    // Create session
    await prisma.session.create({
      data: {
        userId: result.id,
        token: accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: clientIP,
      },
    });

    // TODO: Send verification email
    // await sendVerificationEmail(result.email, result.id);

    // Prepare response data
    const userData = {
      id: result.id,
      email: result.email,
      firstName: result.firstName,
      lastName: result.lastName,
      userType: result.userType,
      status: result.status,
      verificationStatus: result.verificationStatus,
      preferredLanguage: result.preferredLanguage,
      createdAt: result.createdAt,
    };

    // Set secure cookies
    const response = NextResponse.json({
      success: true,
      message: 'Registration successful. Please check your email for verification.',
      data: {
        user: userData,
        accessToken,
        refreshToken,
      },
    }, { status: 201 });

    // Set HTTP-only cookies
    response.cookies.set('access-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    response.cookies.set('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}