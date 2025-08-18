import { hash } from 'bcryptjs';
import { createApiHandler, ApiErrors, parseBody } from '@/lib/api-handler';
import { registerSchema } from '@/lib/validations';
import { sendVerificationEmail } from '@/lib/email';

export const POST = createApiHandler({
  POST: async ({ req, prisma }) => {
    // Parse and validate request body
    const data = await parseBody(req, registerSchema);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    
    if (existingUser) {
      throw ApiErrors.Conflict('User with this email already exists');
    }
    
    // Hash password
    const passwordHash = await hash(data.password, 12);
    
    // Prepare user data
    const userData: any = {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phone || '',
      userType: data.userType,
      status: 'PENDING_VERIFICATION',
    };
    
    // Add profile based on user type
    switch (data.userType) {
      case 'HEALTHCARE_PROVIDER':
        if (data.organizationName) {
          userData.healthcareProfile = {
            create: {
              organizationName: data.organizationName,
              organizationType: 'HOSPITAL',
              licenseNumber: data.licenseNumber || '',
              address: {},
              specializations: [],
            },
          };
        }
        break;
        
      case 'EQUIPMENT_SUPPLIER':
        if (data.organizationName) {
          userData.supplierProfile = {
            create: {
              companyName: data.organizationName,
              businessRegistrationNumber: data.licenseNumber || '',
              address: {},
              productCategories: [],
              certifications: [],
            },
          };
        }
        break;
        
      case 'MAINTENANCE_ENGINEER':
        userData.engineerProfile = {
          create: {
            certificationNumber: data.licenseNumber || '',
            specializations: [],
            experienceYears: 0,
            serviceAreas: [],
          },
        };
        break;
        
      case 'INDIVIDUAL_CUSTOMER':
        userData.individualProfile = {
          create: {
            dateOfBirth: null,
            address: {},
          },
        };
        break;
    }
    
    // Create user in transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
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
      
      // Create verification token
      const verificationToken = await tx.verificationToken.create({
        data: {
          userId: newUser.id,
          token: generateToken(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });
      
      // Send verification email (async, don't await)
      sendVerificationEmail(newUser.email, verificationToken.token).catch(
        (error) => console.error('Failed to send verification email:', error)
      );
      
      return newUser;
    });
    
    return {
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        userType: user.userType,
      },
    };
  },
});

// Helper function to generate verification token
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}