import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { generateTokenPair } from '@/lib/auth/jwt';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional().default(false)
});

// Rate limiting storage (in production, use Redis)
const loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

function checkRateLimit(identifier: string): { allowed: boolean; remainingAttempts?: number; lockoutTime?: Date } {
  const attempts = loginAttempts.get(identifier);
  
  if (!attempts) {
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS };
  }
  
  const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
  
  // Reset if lockout period has passed
  if (timeSinceLastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(identifier);
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS };
  }
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const lockoutTime = new Date(attempts.lastAttempt.getTime() + LOCKOUT_DURATION);
    return { allowed: false, lockoutTime };
  }
  
  return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - attempts.count };
}

function recordLoginAttempt(identifier: string, success: boolean) {
  if (success) {
    loginAttempts.delete(identifier);
    return;
  }
  
  const attempts = loginAttempts.get(identifier) || { count: 0, lastAttempt: new Date() };
  attempts.count++;
  attempts.lastAttempt = new Date();
  loginAttempts.set(identifier, attempts);
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);
    
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
    
    const { email, password, rememberMe } = validationResult.data;
    
    // Check rate limiting by IP and email
    const ipRateLimit = checkRateLimit(`ip:${clientIp}`);
    const emailRateLimit = checkRateLimit(`email:${email.toLowerCase()}`);
    
    if (!ipRateLimit.allowed || !emailRateLimit.allowed) {
      const lockoutTime = ipRateLimit.lockoutTime || emailRateLimit.lockoutTime;
      return NextResponse.json(
        {
          success: false,
          message: 'Too many login attempts. Please try again later.',
          lockoutUntil: lockoutTime
        },
        { status: 429 }
      );
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { 
        email: email.toLowerCase() 
      },
      include: {
        adminProfile: true,
        supplierProfile: true,
        healthcareProfile: true,
        engineerProfile: true,
        customerServiceProfile: true,
        individualProfile: true
      }
    });
    
    if (!user) {
      recordLoginAttempt(`ip:${clientIp}`, false);
      recordLoginAttempt(`email:${email.toLowerCase()}`, false);
      
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password',
          remainingAttempts: Math.min(
            ipRateLimit.remainingAttempts! - 1,
            emailRateLimit.remainingAttempts! - 1
          )
        },
        { status: 401 }
      );
    }
    
    // Check if user account is active
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          message: `Account is ${user.status.toLowerCase()}. Please contact support.`,
          accountStatus: user.status
        },
        { status: 403 }
      );
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      recordLoginAttempt(`ip:${clientIp}`, false);
      recordLoginAttempt(`email:${email.toLowerCase()}`, false);
      
      // Log failed attempt
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_FAILED',
          entity: 'User',
          entityId: user.id,
          ipAddress: clientIp,
          userAgent: request.headers.get('user-agent') || undefined,
          newData: { reason: 'Invalid password' }
        }
      });
      
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password',
          remainingAttempts: Math.min(
            ipRateLimit.remainingAttempts! - 1,
            emailRateLimit.remainingAttempts! - 1
          )
        },
        { status: 401 }
      );
    }
    
    // Clear rate limiting on successful login
    recordLoginAttempt(`ip:${clientIp}`, true);
    recordLoginAttempt(`email:${email.toLowerCase()}`, true);
    
    // Create session
    const sessionId = uuidv4();
    const sessionExpiry = rememberMe 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionId,
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent') || undefined,
        expiresAt: sessionExpiry
      }
    });
    
    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
    
    // Log successful login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        entity: 'User',
        entityId: user.id,
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent') || undefined,
        newData: { sessionId, rememberMe }
      }
    });
    
    // Generate JWT tokens
    const tokens = generateTokenPair(user, sessionId);
    
    // Prepare user profile based on user type
    let profile = null;
    switch (user.userType) {
      case 'ADMIN':
        profile = user.adminProfile;
        break;
      case 'EQUIPMENT_SUPPLIER':
        profile = user.supplierProfile;
        break;
      case 'HEALTHCARE_PROVIDER':
        profile = user.healthcareProfile;
        break;
      case 'MAINTENANCE_ENGINEER':
        profile = user.engineerProfile;
        break;
      case 'CUSTOMER_SERVICE':
        profile = user.customerServiceProfile;
        break;
      case 'INDIVIDUAL_CUSTOMER':
        profile = user.individualProfile;
        break;
    }
    
    // Prepare response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
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
            profileImage: user.profileImage,
            preferredLanguage: user.preferredLanguage,
            twoFactorEnabled: user.twoFactorEnabled,
            emailVerifiedAt: user.emailVerifiedAt,
            profile
          },
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn
          },
          sessionId
        }
      },
      { status: 200 }
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
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60 // 30 days or 7 days
    });
    
    response.cookies.set('session_id', sessionId, {
      ...cookieOptions,
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60
    });
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during login. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}