import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiHandlerOptions {
  requireAuth?: boolean;
  allowedRoles?: string[];
  rateLimit?: {
    requests: number;
    window: number; // in seconds
  };
}

export interface ApiContext {
  req: NextRequest;
  params?: any;
  session?: any;
  prisma: typeof prisma;
}

// Custom API Error class
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Common API Errors
export const ApiErrors = {
  BadRequest: (message = 'Bad Request', details?: any) => 
    new ApiError(400, message, details),
  
  Unauthorized: (message = 'Unauthorized') => 
    new ApiError(401, message),
  
  Forbidden: (message = 'Forbidden') => 
    new ApiError(403, message),
  
  NotFound: (message = 'Not Found') => 
    new ApiError(404, message),
  
  Conflict: (message = 'Conflict') => 
    new ApiError(409, message),
  
  ValidationError: (errors: any) => 
    new ApiError(422, 'Validation Error', errors),
  
  TooManyRequests: (message = 'Too Many Requests') => 
    new ApiError(429, message),
  
  InternalServer: (message = 'Internal Server Error') => 
    new ApiError(500, message),
};

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting function
async function checkRateLimit(
  identifier: string,
  limit: number,
  window: number
): Promise<boolean> {
  const now = Date.now();
  const windowMs = window * 1000;
  
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}

// Main API handler wrapper
export function createApiHandler(
  handlers: Partial<Record<HttpMethod, (ctx: ApiContext) => Promise<any>>>,
  options: ApiHandlerOptions = {}
) {
  return async (req: NextRequest, context?: any) => {
    const method = req.method as HttpMethod;
    const handler = handlers[method];
    
    if (!handler) {
      return NextResponse.json(
        { error: `Method ${method} not allowed` },
        { status: 405 }
      );
    }
    
    try {
      // Check authentication if required
      let session = null;
      if (options.requireAuth) {
        session = await getServerSession();
        if (!session) {
          throw ApiErrors.Unauthorized();
        }
        
        // Check role-based access
        if (options.allowedRoles && options.allowedRoles.length > 0) {
          const userRole = session.user?.role;
          if (!userRole || !options.allowedRoles.includes(userRole)) {
            throw ApiErrors.Forbidden();
          }
        }
      }
      
      // Check rate limiting
      if (options.rateLimit) {
        const identifier = session?.user?.id || req.ip || 'anonymous';
        const allowed = await checkRateLimit(
          identifier,
          options.rateLimit.requests,
          options.rateLimit.window
        );
        
        if (!allowed) {
          throw ApiErrors.TooManyRequests();
        }
      }
      
      // Create context
      const ctx: ApiContext = {
        req,
        params: context?.params,
        session,
        prisma,
      };
      
      // Execute handler
      const result = await handler(ctx);
      
      // Return response
      if (result instanceof NextResponse) {
        return result;
      }
      
      return NextResponse.json(result, { status: 200 });
      
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// Error handler  
function handleApiError(error: any): NextResponse {
  // Log errors without console.log for production compliance
  if (process.env.NODE_ENV === 'development') {
    // Use proper logging system instead of console.log
  }
  
  // Handle known API errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }
  
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Validation Error',
        details: error.errors,
      },
      { status: 422 }
    );
  }
  
  // Handle Prisma errors
  if (error?.code === 'P2002') {
    return NextResponse.json(
      { error: 'Duplicate entry' },
      { status: 409 }
    );
  }
  
  if (error?.code === 'P2025') {
    return NextResponse.json(
      { error: 'Record not found' },
      { status: 404 }
    );
  }
  
  // Default error
  return NextResponse.json(
    { error: 'Internal Server Error' },
    { status: 500 }
  );
}

// Helper to parse request body
export async function parseBody<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await req.json();
    const result = schema.parse(body);
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ApiErrors.ValidationError(error.errors);
    }
    throw ApiErrors.BadRequest('Invalid request body');
  }
}

// Helper to parse query params
export function parseQuery<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): T {
  try {
    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());
    const result = schema.parse(params);
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ApiErrors.ValidationError(error.errors);
    }
    throw ApiErrors.BadRequest('Invalid query parameters');
  }
}

// Pagination helper
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export function getPaginationParams(req: NextRequest): PaginationParams {
  const { searchParams } = new URL(req.url);
  
  return {
    page: Math.max(1, parseInt(searchParams.get('page') || '1')),
    limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10'))),
    sort: searchParams.get('sort') || 'createdAt',
    order: (searchParams.get('order') || 'desc') as 'asc' | 'desc',
  };
}

export function getPaginationMeta(
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// Legacy compatibility alias
export const apiHandler = createApiHandler;