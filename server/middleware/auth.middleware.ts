import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { CacheService, CacheKeys, CacheTTL } from '../config/redis';

// Define types from schema
type UserType = 'HEALTHCARE_PROVIDER' | 'EQUIPMENT_SUPPLIER' | 'MAINTENANCE_ENGINEER' | 'CUSTOMER_SERVICE' | 'ADMIN' | 'INDIVIDUAL_CUSTOMER';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        userType: UserType;
        sessionId?: string;
      };
    }
  }
}

const JWT_SECRET = process.env['JWT_SECRET'] || 'secret';

/**
 * Verify JWT token
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Check if user exists and is active
    let user = await CacheService.get(`${CacheKeys.USER}${decoded.userId}`);
    
    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          userType: true,
          status: true,
        }
      });

      if (user) {
        await CacheService.set(`${CacheKeys.USER}${decoded.userId}`, user, CacheTTL.MEDIUM);
      }
    }

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      userType: decoded.userType,
      sessionId: decoded.sessionId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Check if user has required role
 */
export function requireRole(...allowedRoles: UserType[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.userType)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

/**
 * Check if user owns the resource
 */
export function requireOwnership(resourceField: string = 'userId') {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const resourceId = req.params.id;
    const userId = req.user.id;

    // Admin can access any resource
    if (req.user.userType === UserType.ADMIN) {
      return next();
    }

    // Check ownership based on the resource type
    // This is a simplified version - you'd need to check specific models
    const resource = req.params[resourceField] || resourceId;
    
    if (resource !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        userType: decoded.userType,
        sessionId: decoded.sessionId,
      };
    }
  } catch (error) {
    // Ignore errors for optional auth
  }

  next();
}

/**
 * Verify email is confirmed
 */
export async function requireEmailVerification(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { emailVerifiedAt: true }
  });

  if (!user?.emailVerifiedAt) {
    return res.status(403).json({ error: 'Email verification required' });
  }

  next();
}

/**
 * Rate limiting per user
 */
export function userRateLimit(limit: number = 100, window: number = 900000) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next();
    }

    const key = `rate_limit:${req.user.id}:${req.path}`;
    const current = await CacheService.increment(key);

    if (current === 1) {
      await CacheService.set(key, 1, window / 1000);
    }

    if (current > limit) {
      return res.status(429).json({ 
        error: 'Too many requests',
        retryAfter: window / 1000 
      });
    }

    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current).toString());

    next();
  };
}

/**
 * Check user permissions for specific actions
 */
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin has all permissions
    if (req.user.userType === UserType.ADMIN) {
      return next();
    }

    // Check specific permissions based on user type
    const userPermissions = await getUserPermissions(req.user.id, req.user.userType);

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    next();
  };
}

/**
 * Get user permissions based on role
 */
async function getUserPermissions(userId: string, userType: UserType): Promise<string[]> {
  const permissions: string[] = [];

  switch (userType) {
    case UserType.HEALTHCARE_PROVIDER:
      permissions.push(
        'view_products',
        'create_orders',
        'create_rentals',
        'request_maintenance',
        'manage_own_orders',
        'manage_own_rentals'
      );
      break;

    case UserType.EQUIPMENT_SUPPLIER:
      permissions.push(
        'manage_products',
        'view_orders',
        'manage_inventory',
        'view_analytics',
        'manage_rentals'
      );
      break;

    case UserType.MAINTENANCE_ENGINEER:
      permissions.push(
        'view_maintenance_requests',
        'accept_jobs',
        'create_work_orders',
        'manage_schedule'
      );
      break;

    case UserType.CUSTOMER_SERVICE:
      permissions.push(
        'view_all_tickets',
        'manage_tickets',
        'view_users',
        'view_orders',
        'create_support_notes'
      );
      break;

    case UserType.ADMIN:
      // Admin has all permissions
      permissions.push('*');
      break;

    case UserType.INDIVIDUAL_CUSTOMER:
      permissions.push(
        'view_products',
        'create_orders',
        'manage_own_orders'
      );
      break;
  }

  return permissions;
}

export default {
  authenticateToken,
  requireRole,
  requireOwnership,
  optionalAuth,
  requireEmailVerification,
  userRateLimit,
  requirePermission,
};