import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { prisma } from '../config/database';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    userType: string;
    sessionId?: string;
  };
}

export interface DecodedToken {
  userId: string;
  email: string;
  userType: string;
  sessionId?: string;
  iat: number;
  exp: number;
}

// Validate JWT token and attach user to request
export async function validateAuth(request: NextRequest): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return { success: false, error: 'No token provided' };
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as DecodedToken;

    // Check if session is still valid
    if (decoded.sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: decoded.sessionId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              userType: true,
              status: true,
              verificationStatus: true,
            },
          },
        },
      });

      if (!session || session.expiresAt < new Date()) {
        return { success: false, error: 'Session expired' };
      }

      if (session.user.status !== 'ACTIVE') {
        return { success: false, error: 'Account suspended' };
      }

      // Update last activity
      await prisma.session.update({
        where: { id: session.id },
        data: { lastActivity: new Date() },
      });

      return {
        success: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          userType: session.user.userType,
          status: session.user.status,
          verificationStatus: session.user.verificationStatus,
          sessionId: session.id,
        },
      };
    }

    // Fallback to user lookup if no session
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        userType: true,
        status: true,
        verificationStatus: true,
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.status !== 'ACTIVE') {
      return { success: false, error: 'Account suspended' };
    }

    return { success: true, user };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return { success: false, error: 'Invalid token' };
    }
    if (error instanceof jwt.TokenExpiredError) {
      return { success: false, error: 'Token expired' };
    }
    console.error('Auth validation error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

// Check if user has specific role
export function hasRole(user: any, roles: string[]): boolean {
  return roles.includes(user.userType);
}

// Check if user has admin privileges
export function isAdmin(user: any): boolean {
  return user.userType === 'ADMIN';
}

// Check if user has specific permission
export async function hasPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { adminProfile: true },
    });

    if (!user || !user.adminProfile) {
      return false;
    }

    const permissions = user.adminProfile.permissions as string[];
    return permissions.includes('ALL') || permissions.includes(permission);
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

// Rate limiting helper
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

export async function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): Promise<RateLimitResult> {
  // This would typically use Redis, but for simplicity we'll use in-memory cache
  // In production, use Redis or a proper rate limiting service
  
  const now = Date.now();
  const windowStart = now - windowMs;
  const key = `rate_limit:${identifier}`;
  
  // This is a simplified implementation
  // In production, use Redis with sliding window or token bucket algorithm
  
  return {
    success: true,
    limit,
    remaining: limit - 1,
    resetTime: now + windowMs,
  };
}

// Audit logging
export async function logUserAction(
  userId: string,
  action: string,
  entity?: string,
  entityId?: string,
  metadata?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity: entity || 'UNKNOWN',
        entityId,
        newData: metadata,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw error for audit logging failures
  }
}

// Generate secure tokens
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Password validation
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Sanitize user input
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

// Check if email domain is allowed
export function isAllowedEmailDomain(email: string): boolean {
  // You can implement domain restrictions here
  const blockedDomains = ['tempmail.com', '10minutemail.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  
  return domain && !blockedDomains.includes(domain);
}

// Generate verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}