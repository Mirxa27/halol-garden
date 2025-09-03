import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, AppError, ErrorCode } from '@/lib/error/handler';
import { logger } from '@/lib/logger';

// Request context interface
interface RequestContext {
  requestId: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
  method: string;
  url: string;
  startTime: number;
}

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Extract client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('x-vercel-forwarded-for');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || remoteAddr || 'unknown';
}

// Request logging middleware
export function withRequestLogging<T extends any[]>(
  handler: (request: NextRequest, context: RequestContext, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ip = getClientIP(request);
    
    const context: RequestContext = {
      requestId,
      userAgent,
      ip,
      method: request.method,
      url: request.url,
      startTime,
    };

    // Add request ID to headers for client tracking
    const responseHeaders = new Headers();
    responseHeaders.set('x-request-id', requestId);

    try {
      // Log incoming request
      logger.info('Incoming request', {
        requestId,
        method: request.method,
        url: request.url,
        userAgent,
        ip,
        headers: Object.fromEntries(request.headers.entries()),
      });

      // Execute handler
      const response = await handler(request, context, ...args);
      
      // Log successful response
      const duration = Date.now() - startTime;
      logger.info('Request completed', {
        requestId,
        method: request.method,
        url: request.url,
        statusCode: response.status,
        duration,
        ip,
      });

      // Add tracking headers to response
      const newResponse = new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'x-request-id': requestId,
        },
      });

      return newResponse;
      
    } catch (error) {
      // Log error with full context
      const duration = Date.now() - startTime;
      logger.error('Request failed', {
        requestId,
        method: request.method,
        url: request.url,
        duration,
        ip,
        userAgent,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : String(error),
      });

      // Handle error and return response
      const errorResponse = handleApiError(error, requestId, context.userId);
      
      // Add tracking headers to error response
      const headers = new Headers(errorResponse.headers);
      headers.set('x-request-id', requestId);
      
      return new NextResponse(errorResponse.body, {
        status: errorResponse.status,
        statusText: errorResponse.statusText,
        headers,
      });
    }
  };
}

// Authentication-aware error handling
export function withAuthenticatedErrorHandling<T extends any[]>(
  handler: (request: NextRequest, context: RequestContext & { userId: string }, ...args: T) => Promise<NextResponse>
) {
  return withRequestLogging(async (request: NextRequest, context: RequestContext, ...args: T) => {
    // Extract user ID from session or token
    const userId = await extractUserIdFromRequest(request);
    
    if (!userId) {
      throw new AppError('Authentication required', ErrorCode.UNAUTHORIZED, 401);
    }

    const authenticatedContext = { ...context, userId };
    
    return await handler(request, authenticatedContext, ...args);
  });
}

// Extract user ID from request (implement based on your auth system)
async function extractUserIdFromRequest(request: NextRequest): Promise<string | undefined> {
  try {
    // This would typically extract from JWT token, session, etc.
    // For now, return undefined to indicate no authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return undefined;
    }

    // Add your JWT validation logic here
    // const token = authHeader.replace('Bearer ', '');
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // return decoded.userId;
    
    return undefined;
  } catch (error) {
    logger.warn('Failed to extract user ID from request', {
      error: error instanceof Error ? error.message : String(error),
      url: request.url,
    });
    return undefined;
  }
}

// Rate limiting middleware
export function withRateLimit(
  limit: number,
  windowMs: number,
  keyGenerator?: (request: NextRequest) => string
) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return function <T extends any[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      const key = keyGenerator ? keyGenerator(request) : getClientIP(request);
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean up old entries
      for (const [k, v] of requests.entries()) {
        if (v.resetTime < now) {
          requests.delete(k);
        }
      }

      // Get current request count
      const current = requests.get(key);
      
      if (!current) {
        requests.set(key, { count: 1, resetTime: now + windowMs });
      } else if (current.count >= limit) {
        const retryAfter = Math.ceil((current.resetTime - now) / 1000);
        
        logger.warn('Rate limit exceeded', {
          key,
          limit,
          windowMs,
          retryAfter,
          ip: getClientIP(request),
          url: request.url,
        });

        return NextResponse.json(
          {
            success: false,
            error: {
              code: ErrorCode.RATE_LIMIT_EXCEEDED,
              message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
              timestamp: new Date().toISOString(),
            },
          },
          {
            status: 429,
            headers: {
              'Retry-After': retryAfter.toString(),
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': Math.ceil(current.resetTime / 1000).toString(),
            },
          }
        );
      } else {
        requests.set(key, { count: current.count + 1, resetTime: current.resetTime });
      }

      // Add rate limit headers to response
      const response = await handler(request, ...args);
      const remaining = Math.max(0, limit - (requests.get(key)?.count || 0));
      
      const headers = new Headers(response.headers);
      headers.set('X-RateLimit-Limit', limit.toString());
      headers.set('X-RateLimit-Remaining', remaining.toString());
      headers.set('X-RateLimit-Reset', Math.ceil((requests.get(key)?.resetTime || now) / 1000).toString());

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    };
  };
}

// Validation middleware
export function withValidation<T>(
  schema: { parse: (data: unknown) => T },
  source: 'body' | 'query' | 'params' = 'body'
) {
  return function <Args extends any[]>(
    handler: (request: NextRequest, data: T, ...args: Args) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: Args): Promise<NextResponse> => {
      try {
        let data: unknown;
        
        switch (source) {
          case 'body':
            data = await request.json();
            break;
          case 'query':
            data = Object.fromEntries(new URL(request.url).searchParams.entries());
            break;
          case 'params':
            // Extract params from args if available
            data = args[0];
            break;
          default:
            throw new Error(`Unsupported validation source: ${source}`);
        }

        const validatedData = schema.parse(data);
        return await handler(request, validatedData, ...args);
        
      } catch (error) {
        if (error && typeof error === 'object' && 'issues' in error) {
          // Zod validation error
          throw new AppError(
            'Validation failed',
            ErrorCode.VALIDATION_ERROR,
            400,
            true,
            { validationErrors: error }
          );
        }
        throw error;
      }
    };
  };
}

// CORS middleware
export function withCORS(
  options: {
    origin?: string | string[] | boolean;
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
  } = {}
) {
  const {
    origin = true,
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials = true,
  } = options;

  return function <T extends any[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': typeof origin === 'string' ? origin : '*',
            'Access-Control-Allow-Methods': methods.join(', '),
            'Access-Control-Allow-Headers': headers.join(', '),
            'Access-Control-Allow-Credentials': credentials.toString(),
            'Access-Control-Max-Age': '86400',
          },
        });
      }

      // Execute handler
      const response = await handler(request, ...args);

      // Add CORS headers to response
      const corsHeaders = new Headers(response.headers);
      corsHeaders.set('Access-Control-Allow-Origin', typeof origin === 'string' ? origin : '*');
      corsHeaders.set('Access-Control-Allow-Credentials', credentials.toString());

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: corsHeaders,
      });
    };
  };
}

// Health check middleware
export function withHealthCheck<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const url = new URL(request.url);
    
    if (url.pathname === '/health' || url.pathname === '/api/health') {
      return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.APP_VERSION || '1.0.0',
      });
    }

    return await handler(request, ...args);
  };
}