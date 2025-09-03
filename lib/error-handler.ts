/**
 * Comprehensive Error Handling System
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, true, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('Too many requests', 429, true, 'RATE_LIMIT_ERROR', { retryAfter });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: any) {
    super(
      `External service error: ${service}`,
      503,
      true,
      'EXTERNAL_SERVICE_ERROR',
      { service, originalError }
    );
  }
}

/**
 * Global error handler for API routes
 */
export function handleError(error: unknown): NextResponse {
  console.error('Error:', error);

  // Handle known errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          ...(process.env.NODE_ENV === 'development' && {
            details: error.details,
            stack: error.stack,
          }),
        },
      },
      { 
        status: error.statusCode,
        ...(error instanceof RateLimitError && error.details?.retryAfter && {
          headers: {
            'Retry-After': error.details.retryAfter.toString(),
          },
        }),
      }
    );
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        },
      },
      { status: 400 }
    );
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Unique constraint violation',
              code: 'DUPLICATE_ERROR',
              details: error.meta,
            },
          },
          { status: 409 }
        );

      case 'P2025':
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Record not found',
              code: 'NOT_FOUND',
            },
          },
          { status: 404 }
        );

      case 'P2003':
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Foreign key constraint violation',
              code: 'CONSTRAINT_ERROR',
              details: error.meta,
            },
          },
          { status: 400 }
        );

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Database error',
              code: 'DATABASE_ERROR',
              ...(process.env.NODE_ENV === 'development' && {
                details: { code: error.code, meta: error.meta },
              }),
            },
          },
          { status: 500 }
        );
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : error.message,
          code: 'INTERNAL_ERROR',
          ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack,
          }),
        },
      },
      { status: 500 }
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      },
    },
    { status: 500 }
  );
}

/**
 * Async error wrapper for API routes
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error);
    }
  }) as T;
}

/**
 * Client-side error handler
 */
export function handleClientError(error: unknown): {
  title: string;
  message: string;
  action?: string;
} {
  console.error('Client error:', error);

  if (error instanceof AppError) {
    return {
      title: getErrorTitle(error.code),
      message: error.message,
      action: getErrorAction(error.code),
    };
  }

  if (error instanceof Error) {
    return {
      title: 'Error',
      message: error.message,
    };
  }

  return {
    title: 'Unexpected Error',
    message: 'Something went wrong. Please try again.',
    action: 'Refresh the page',
  };
}

function getErrorTitle(code?: string): string {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 'Validation Error';
    case 'AUTHENTICATION_ERROR':
      return 'Authentication Required';
    case 'AUTHORIZATION_ERROR':
      return 'Access Denied';
    case 'NOT_FOUND':
      return 'Not Found';
    case 'CONFLICT_ERROR':
      return 'Conflict';
    case 'RATE_LIMIT_ERROR':
      return 'Too Many Requests';
    case 'EXTERNAL_SERVICE_ERROR':
      return 'Service Unavailable';
    default:
      return 'Error';
  }
}

function getErrorAction(code?: string): string | undefined {
  switch (code) {
    case 'AUTHENTICATION_ERROR':
      return 'Please log in to continue';
    case 'AUTHORIZATION_ERROR':
      return 'Contact support if you believe this is an error';
    case 'RATE_LIMIT_ERROR':
      return 'Please wait a moment before trying again';
    case 'EXTERNAL_SERVICE_ERROR':
      return 'Try again in a few minutes';
    default:
      return undefined;
  }
}

/**
 * Error boundary fallback component
 */
export function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  const { title, message, action } = handleClientError(error);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {message}
          </p>
          {action && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {action}
            </p>
          )}
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={resetErrorBoundary}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}