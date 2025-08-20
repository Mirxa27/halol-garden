import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional().default(false),
});

// JWT token generation
function generateTokens(userId: string, userType: string) {
  const accessTokenExpiry = process.env['JWT_ACCESS_EXPIRY'] || '15m';
  const refreshTokenExpiry = process.env['JWT_REFRESH_EXPIRY'] || '7d';
  const jwtSecret = process.env['JWT_SECRET'] || 'fallback-secret-change-in-production';
  const jwtRefreshSecret = process.env['JWT_REFRESH_SECRET'] || 'fallback-refresh-secret-change-in-production';
  
  const accessToken = jwt.sign(
    { 
      userId, 
      userType,
      type: 'access'
    },
    jwtSecret,
    { expiresIn: accessTokenExpiry }
  );

  const refreshToken = jwt.sign(
    { 
      userId, 
      userType,
      type: 'refresh'
    },
    jwtRefreshSecret,
    { expiresIn: refreshTokenExpiry }
  );

  return { accessToken, refreshToken };
}

// Rate limiting (simple in-memory store - use Redis in production)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier);
  
  if (!attempts) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }

  // Reset if more than 15 minutes have passed
  if (now - attempts.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }

  // Allow max 5 attempts per 15 minutes
  if (attempts.count >= 5) {
    return false;
  }

  attempts.count++;
  attempts.lastAttempt = now;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = loginSchema.parse(body);
    
    // Check rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many login attempts. Please try again in 15 minutes.' 
        },
        { status: 429 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
      include: {
        healthcareProfile: true,
        supplierProfile: true,
        engineerProfile: true,
        customerServiceProfile: true,
        adminProfile: true,
        individualProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Account is ${user.status.toLowerCase().replace('_', ' ')}. Please contact support.` 
        },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.passwordHash);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.userType);

    // Create or update session
    const sessionExpiry = validatedData.rememberMe 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.session.upsert({
      where: { userId: user.id },
      update: {
        token: accessToken,
        refreshToken,
        expiresAt: sessionExpiry,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: clientIP,
      },
      create: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        expiresAt: sessionExpiry,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: clientIP,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'USER',
        entityId: user.id,
        ipAddress: clientIP,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    // Prepare user data for response
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      status: user.status,
      verificationStatus: user.verificationStatus,
      profileImage: user.profileImage,
      preferredLanguage: user.preferredLanguage,
      twoFactorEnabled: user.twoFactorEnabled,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      // Include profile data based on user type
      profile: user.healthcareProfile || 
               user.supplierProfile || 
               user.engineerProfile || 
               user.customerServiceProfile || 
               user.adminProfile || 
               user.individualProfile,
    };

    // Set secure cookies
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        accessToken,
        refreshToken,
      },
    });

    // Set HTTP-only cookies
    response.cookies.set('access-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: validatedData.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days or 24 hours
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
    console.error('Login error:', error);
    
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