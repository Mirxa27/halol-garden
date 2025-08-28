import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../../server/config/database';
import { hash } from 'bcryptjs';

// User management validation schemas
const userQuerySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  limit: z.string().optional().transform(val => parseInt(val || '20')),
  search: z.string().optional(),
  userType: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.enum(['createdAt', 'firstName', 'lastName', 'email']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phoneNumber: z.string().min(1),
  userType: z.enum(['HEALTHCARE_PROVIDER', 'EQUIPMENT_SUPPLIER', 'MAINTENANCE_ENGINEER', 'CUSTOMER_SERVICE', 'ADMIN', 'INDIVIDUAL_CUSTOMER']),
  profileData: z.any().optional(),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phoneNumber: z.string().min(1).optional(),
  status: z.enum(['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
  verificationStatus: z.enum(['UNVERIFIED', 'EMAIL_VERIFIED', 'DOCUMENTS_VERIFIED', 'FULLY_VERIFIED']).optional(),
  profileData: z.any().optional(),
});

// Helper function to validate admin access
async function validateAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { adminProfile: true },
  });

  if (!user || !user.adminProfile) {
    throw new Error('Unauthorized: Admin access required');
  }

  return user;
}

// GET /api/admin/users - List users with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await validateAdmin(userId);

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    
    const validatedQuery = userQuerySchema.parse(query);

    // Build where clause
    const where: any = {};

    if (validatedQuery.search) {
      where.OR = [
        { firstName: { contains: validatedQuery.search, mode: 'insensitive' } },
        { lastName: { contains: validatedQuery.search, mode: 'insensitive' } },
        { email: { contains: validatedQuery.search, mode: 'insensitive' } },
        { phoneNumber: { contains: validatedQuery.search, mode: 'insensitive' } },
      ];
    }

    if (validatedQuery.userType) {
      where.userType = validatedQuery.userType;
    }

    if (validatedQuery.status) {
      where.status = validatedQuery.status;
    }

    // Calculate pagination
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;
    const take = validatedQuery.limit;

    // Build order by
    const orderBy: any = {};
    orderBy[validatedQuery.sortBy] = validatedQuery.sortOrder;

    // Fetch users with related data
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          healthcareProfile: {
            select: {
              organizationName: true,
              organizationType: true,
              licenseNumber: true,
            },
          },
          supplierProfile: {
            select: {
              companyName: true,
              businessRegistrationNumber: true,
              verified: true,
              rating: true,
            },
          },
          engineerProfile: {
            select: {
              certificationNumber: true,
              experienceYears: true,
              rating: true,
            },
          },
          adminProfile: {
            select: {
              role: true,
              permissions: true,
            },
          },
          individualProfile: true,
          customerServiceProfile: {
            select: {
              department: true,
              employeeId: true,
            },
          },
          _count: {
            select: {
              orders: true,
              reviews: true,
              supportTickets: true,
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    // Format user data
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      userType: user.userType,
      status: user.status,
      verificationStatus: user.verificationStatus,
      profileImage: user.profileImage,
      preferredLanguage: user.preferredLanguage,
      twoFactorEnabled: user.twoFactorEnabled,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: getProfileData(user),
      stats: {
        ordersCount: user._count.orders,
        reviewsCount: user._count.reviews,
        supportTicketsCount: user._count.supportTickets,
      },
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / validatedQuery.limit);
    const hasNextPage = validatedQuery.page < totalPages;
    const hasPreviousPage = validatedQuery.page > 1;

    return NextResponse.json({
      success: true,
      data: formattedUsers,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });

  } catch (error) {
    console.error('Users fetch error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await validateAdmin(userId);

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hash(validatedData.password, 12);

    // Create user with transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create base user
      const newUser = await tx.user.create({
        data: {
          email: validatedData.email.toLowerCase(),
          passwordHash,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phoneNumber: validatedData.phoneNumber,
          userType: validatedData.userType,
          status: 'ACTIVE',
          verificationStatus: 'EMAIL_VERIFIED',
          emailVerifiedAt: new Date(),
        },
      });

      // Create role-specific profile
      await createUserProfile(tx, newUser.id, validatedData.userType, validatedData.profileData);

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: userId,
          action: 'USER_CREATED_BY_ADMIN',
          entity: 'USER',
          entityId: newUser.id,
          newData: {
            userType: validatedData.userType,
            email: validatedData.email,
            createdBy: userId,
          },
        },
      });

      return newUser;
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
      },
      message: 'User created successfully',
    });

  } catch (error) {
    console.error('User creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid user data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

async function createUserProfile(tx: any, userId: string, userType: string, profileData?: any) {
  switch (userType) {
    case 'HEALTHCARE_PROVIDER':
      await tx.healthcareProvider.create({
        data: {
          userId,
          organizationName: profileData?.organizationName || '',
          organizationType: profileData?.organizationType || 'Hospital',
          licenseNumber: profileData?.licenseNumber || '',
          address: profileData?.address || {},
          specializations: profileData?.specializations || [],
          certifications: profileData?.certifications || [],
        },
      });
      break;

    case 'EQUIPMENT_SUPPLIER':
      await tx.equipmentSupplier.create({
        data: {
          userId,
          companyName: profileData?.companyName || '',
          businessRegistrationNumber: profileData?.businessRegistrationNumber || '',
          address: profileData?.address || {},
          productCategories: profileData?.productCategories || [],
          certifications: profileData?.certifications || [],
        },
      });
      break;

    case 'MAINTENANCE_ENGINEER':
      await tx.maintenanceEngineer.create({
        data: {
          userId,
          certificationNumber: profileData?.certificationNumber || '',
          experienceYears: profileData?.experienceYears || 0,
          specializations: profileData?.specializations || [],
          certifications: profileData?.certifications || [],
          serviceAreas: profileData?.serviceAreas || [],
        },
      });
      break;

    case 'CUSTOMER_SERVICE':
      await tx.customerServiceProfile.create({
        data: {
          userId,
          employeeId: profileData?.employeeId || `CS-${Date.now()}`,
          department: profileData?.department || 'General Support',
          shift: profileData?.shift || 'MORNING',
        },
      });
      break;

    case 'ADMIN':
      await tx.adminProfile.create({
        data: {
          userId,
          role: profileData?.role || 'ADMIN',
          permissions: profileData?.permissions || ['USER_MANAGEMENT', 'PRODUCT_MANAGEMENT'],
        },
      });
      break;

    case 'INDIVIDUAL_CUSTOMER':
      await tx.individualCustomer.create({
        data: {
          userId,
          address: profileData?.address || {},
          preferences: profileData?.preferences || {},
        },
      });
      break;
  }
}

function getProfileData(user: any) {
  if (user.healthcareProfile) {
    return {
      type: 'healthcare',
      organizationName: user.healthcareProfile.organizationName,
      organizationType: user.healthcareProfile.organizationType,
      licenseNumber: user.healthcareProfile.licenseNumber,
    };
  }

  if (user.supplierProfile) {
    return {
      type: 'supplier',
      companyName: user.supplierProfile.companyName,
      businessRegistrationNumber: user.supplierProfile.businessRegistrationNumber,
      verified: user.supplierProfile.verified,
      rating: user.supplierProfile.rating,
    };
  }

  if (user.engineerProfile) {
    return {
      type: 'engineer',
      certificationNumber: user.engineerProfile.certificationNumber,
      experienceYears: user.engineerProfile.experienceYears,
      rating: user.engineerProfile.rating,
    };
  }

  if (user.adminProfile) {
    return {
      type: 'admin',
      role: user.adminProfile.role,
      permissions: user.adminProfile.permissions,
    };
  }

  if (user.customerServiceProfile) {
    return {
      type: 'customerService',
      department: user.customerServiceProfile.department,
      employeeId: user.customerServiceProfile.employeeId,
    };
  }

  if (user.individualProfile) {
    return {
      type: 'individual',
    };
  }

  return null;
}