import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { UserType } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserType;
  isAdmin: boolean;
  isSupplier: boolean;
  isHealthcareProvider: boolean;
  isMaintenanceEngineer: boolean;
  profileId?: string;
}

/**
 * Get the current authenticated user from the session
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return null;
    }

    // Get full user details from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        adminProfile: true,
        supplierProfile: true,
        healthcareProfile: true,
        engineerProfile: true,
      }
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.userType,
      isAdmin: user.userType === UserType.ADMIN,
      isSupplier: user.userType === UserType.EQUIPMENT_SUPPLIER,
      isHealthcareProvider: user.userType === UserType.HEALTHCARE_PROVIDER,
      isMaintenanceEngineer: user.userType === UserType.MAINTENANCE_ENGINEER,
      profileId: user.supplierProfile?.id || user.healthcareProfile?.id || user.engineerProfile?.id || user.adminProfile?.id,
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Require authentication for API routes
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

/**
 * Require admin role for API routes
 */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  
  if (!user.isAdmin) {
    throw new Error('Admin access required');
  }
  
  return user;
}

/**
 * Require supplier role for API routes
 */
export async function requireSupplier(): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  
  if (!user.isSupplier) {
    throw new Error('Supplier access required');
  }
  
  return user;
}

/**
 * Check if user has permission to access resource
 */
export async function checkResourcePermission(
  resourceUserId: string,
  allowedRoles: UserType[] = []
): Promise<boolean> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    return false;
  }
  
  // Admin can access everything
  if (user.isAdmin) {
    return true;
  }
  
  // User can access their own resources
  if (user.id === resourceUserId) {
    return true;
  }
  
  // Check if user role is in allowed roles
  if (allowedRoles.includes(user.role)) {
    return true;
  }
  
  return false;
}

/**
 * Get user's supplier profile ID
 */
export async function getUserSupplierId(): Promise<string | null> {
  const user = await getAuthenticatedUser();
  
  if (!user || !user.isSupplier) {
    return null;
  }
  
  const supplier = await prisma.equipmentSupplier.findUnique({
    where: { userId: user.id }
  });
  
  return supplier?.id || null;
}

/**
 * Create authentication error response
 */
export function createAuthError(message: string = 'Authentication required') {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Create authorization error response
 */
export function createAuthorizationError(message: string = 'Access denied') {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { 
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Middleware wrapper for API routes with authentication
 */
export function withAuth<T extends any[]>(
  handler: (user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      const user = await requireAuth();
      return await handler(user, ...args);
    } catch (error) {
      if (error instanceof Error && error.message === 'Authentication required') {
        return createAuthError();
      }
      return new Response(
        JSON.stringify({ success: false, error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}

/**
 * Middleware wrapper for API routes with admin authentication
 */
export function withAdminAuth<T extends any[]>(
  handler: (user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      const user = await requireAdmin();
      return await handler(user, ...args);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Authentication required') {
          return createAuthError();
        }
        if (error.message === 'Admin access required') {
          return createAuthorizationError();
        }
      }
      return new Response(
        JSON.stringify({ success: false, error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}