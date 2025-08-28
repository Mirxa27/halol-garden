import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractTokenFromHeader } from './jwt';
import prisma from '@/lib/prisma';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    userType: string;
    sessionId?: string;
  };
}

/**
 * Authentication middleware for API routes
 */
export async function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options?: {
    requireAuth?: boolean;
    allowedRoles?: string[];
    checkSession?: boolean;
  }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const { requireAuth = true, allowedRoles = [], checkSession = true } = options || {};
    
    try {
      // Extract token from Authorization header or cookies
      const authHeader = req.headers.get('authorization');
      const token = extractTokenFromHeader(authHeader) || 
                   req.cookies.get('access_token')?.value;
      
      if (!token) {
        if (requireAuth) {
          return NextResponse.json(
            { success: false, message: 'Authentication required' },
            { status: 401 }
          );
        }
        // If auth is not required, proceed without user context
        return handler(req as AuthenticatedRequest);
      }
      
      // Verify token
      const payload = verifyAccessToken(token);
      
      // Check session validity if required
      if (checkSession && payload.sessionId) {
        const session = await prisma.session.findUnique({
          where: { token: payload.sessionId }
        });
        
        if (!session || session.expiresAt < new Date()) {
          return NextResponse.json(
            { success: false, message: 'Session expired' },
            { status: 401 }
          );
        }
        
        // Update session last activity
        await prisma.session.update({
          where: { id: session.id },
          data: { lastActivity: new Date() }
        });
      }
      
      // Check user status
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          userType: true,
          status: true
        }
      });
      
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }
      
      if (user.status !== 'ACTIVE') {
        return NextResponse.json(
          { success: false, message: `Account is ${user.status.toLowerCase()}` },
          { status: 403 }
        );
      }
      
      // Check role-based access
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.userType)) {
        return NextResponse.json(
          { success: false, message: 'Insufficient permissions' },
          { status: 403 }
        );
      }
      
      // Attach user to request
      (req as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email,
        userType: user.userType,
        sessionId: payload.sessionId
      };
      
      return handler(req as AuthenticatedRequest);
      
    } catch (error) {
      console.error('Auth middleware error:', error);
      
      if (error instanceof Error && error.message.includes('expired')) {
        return NextResponse.json(
          { success: false, message: 'Token expired' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { success: false, message: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { adminProfile: true }
    });
    
    if (!user || !user.adminProfile) return false;
    
    const permissions = user.adminProfile.permissions as string[];
    return permissions.includes(permission) || permissions.includes('*');
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

/**
 * Rate limiting middleware
 */
const rateLimitMap = new Map<string, { count: number; resetTime: Date }>();

export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: {
    limit?: number;
    windowMs?: number;
    keyGenerator?: (req: NextRequest) => string;
  }
) {
  const { 
    limit = 100, 
    windowMs = 60 * 1000, // 1 minute
    keyGenerator = (req) => req.headers.get('x-forwarded-for') || 'unknown'
  } = options || {};
  
  return async (req: NextRequest): Promise<NextResponse> => {
    const key = keyGenerator(req);
    const now = new Date();
    
    const rateLimit = rateLimitMap.get(key);
    
    if (!rateLimit || rateLimit.resetTime < now) {
      // Create new rate limit window
      rateLimitMap.set(key, {
        count: 1,
        resetTime: new Date(now.getTime() + windowMs)
      });
    } else if (rateLimit.count >= limit) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((rateLimit.resetTime.getTime() - now.getTime()) / 1000);
      
      return NextResponse.json(
        {
          success: false,
          message: 'Too many requests',
          retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toISOString()
          }
        }
      );
    } else {
      // Increment counter
      rateLimit.count++;
    }
    
    // Add rate limit headers to response
    const response = await handler(req);
    const remaining = limit - (rateLimitMap.get(key)?.count || 0);
    const reset = rateLimitMap.get(key)?.resetTime || new Date();
    
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', reset.toISOString());
    
    return response;
  };
}

/**
 * CORS middleware
 */
export function withCORS(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: {
    origin?: string | string[] | ((origin: string) => boolean);
    methods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
  }
) {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    exposedHeaders = [],
    credentials = true,
    maxAge = 86400
  } = options || {};
  
  return async (req: NextRequest): Promise<NextResponse> => {
    const requestOrigin = req.headers.get('origin') || '';
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      
      // Set CORS headers
      if (typeof origin === 'function') {
        if (origin(requestOrigin)) {
          response.headers.set('Access-Control-Allow-Origin', requestOrigin);
        }
      } else if (Array.isArray(origin)) {
        if (origin.includes(requestOrigin)) {
          response.headers.set('Access-Control-Allow-Origin', requestOrigin);
        }
      } else {
        response.headers.set('Access-Control-Allow-Origin', origin);
      }
      
      response.headers.set('Access-Control-Allow-Methods', methods.join(', '));
      response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));
      
      if (exposedHeaders.length > 0) {
        response.headers.set('Access-Control-Expose-Headers', exposedHeaders.join(', '));
      }
      
      if (credentials) {
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }
      
      response.headers.set('Access-Control-Max-Age', maxAge.toString());
      
      return response;
    }
    
    // Handle actual requests
    const response = await handler(req);
    
    // Set CORS headers
    if (typeof origin === 'function') {
      if (origin(requestOrigin)) {
        response.headers.set('Access-Control-Allow-Origin', requestOrigin);
      }
    } else if (Array.isArray(origin)) {
      if (origin.includes(requestOrigin)) {
        response.headers.set('Access-Control-Allow-Origin', requestOrigin);
      }
    } else {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    if (credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    
    if (exposedHeaders.length > 0) {
      response.headers.set('Access-Control-Expose-Headers', exposedHeaders.join(', '));
    }
    
    return response;
  };
}