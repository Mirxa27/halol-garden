import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { SessionManager } from '../config/redis';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    userType: string;
    sessionId: string;
  };
}

export class AuthMiddleware {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'secret';

  /**
   * Verify JWT token and attach user to request
   */
  static async authenticate(request: NextRequest): Promise<{
    authenticated: boolean;
    user?: any;
    error?: string;
  }> {
    try {
      // Get token from header
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { authenticated: false, error: 'No token provided' };
      }

      const token = authHeader.substring(7);

      // Verify token
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;

      // Check if session exists
      if (decoded.sessionId) {
        const session = await SessionManager.getSession(decoded.sessionId);
        if (!session) {
          return { authenticated: false, error: 'Session expired' };
        }
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          userType: true,
          status: true,
          verificationStatus: true,
          firstName: true,
          lastName: true,
        }
      });

      if (!user) {
        return { authenticated: false, error: 'User not found' };
      }

      if (user.status !== 'ACTIVE') {
        return { authenticated: false, error: 'Account not active' };
      }

      return {
        authenticated: true,
        user: {
          ...user,
          sessionId: decoded.sessionId
        }
      };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return { authenticated: false, error: 'Token expired' };
      }
      if (error.name === 'JsonWebTokenError') {
        return { authenticated: false, error: 'Invalid token' };
      }
      return { authenticated: false, error: 'Authentication failed' };
    }
  }

  /**
   * Check if user has required role
   */
  static hasRole(userType: string, allowedRoles: string[]): boolean {
    return allowedRoles.includes(userType);
  }

  /**
   * Middleware wrapper for API routes
   */
  static withAuth(
    handler: (req: NextRequest, context: any) => Promise<NextResponse>,
    options?: {
      roles?: string[];
      requireVerified?: boolean;
    }
  ) {
    return async (req: NextRequest, context: any) => {
      const authResult = await this.authenticate(req);

      if (!authResult.authenticated) {
        return NextResponse.json(
          { error: authResult.error || 'Unauthorized' },
          { status: 401 }
        );
      }

      // Check roles if specified
      if (options?.roles && !this.hasRole(authResult.user.userType, options.roles)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Check verification status if required
      if (options?.requireVerified && authResult.user.verificationStatus !== 'FULLY_VERIFIED') {
        return NextResponse.json(
          { error: 'Account verification required' },
          { status: 403 }
        );
      }

      // Attach user to request context
      (req as any).user = authResult.user;

      return handler(req, context);
    };
  }

  /**
   * Optional authentication - doesn't fail if no token
   */
  static withOptionalAuth(
    handler: (req: NextRequest, context: any) => Promise<NextResponse>
  ) {
    return async (req: NextRequest, context: any) => {
      const authResult = await this.authenticate(req);
      
      if (authResult.authenticated) {
        (req as any).user = authResult.user;
      }

      return handler(req, context);
    };
  }
}

export default AuthMiddleware;