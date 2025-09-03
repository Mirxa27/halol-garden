import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // Business Logic
  INSUFFICIENT_INVENTORY = 'INSUFFICIENT_INVENTORY',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  ORDER_CANNOT_BE_CANCELLED = 'ORDER_CANNOT_BE_CANCELLED',
  COUPON_EXPIRED = 'COUPON_EXPIRED',
  COUPON_USAGE_LIMIT_EXCEEDED = 'COUPON_USAGE_LIMIT_EXCEEDED',
  
  // System
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  
  // Generic
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    
    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, true, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: Record<string, any>) {
    super(message, ErrorCode.UNAUTHORIZED, 401, true, context);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', context?: Record<string, any>) {
    super(message, ErrorCode.FORBIDDEN, 403, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', context?: Record<string, any>) {
    super(`${resource} not found`, ErrorCode.NOT_FOUND, 404, true, context);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.ALREADY_EXISTS, 409, true, context);
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string, code: ErrorCode, context?: Record<string, any>) {
    super(message, code, 422, true, context);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error, context?: Record<string, any>) {
    super(
      `External service error: ${service}`,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      503,
      true,
      { ...context, originalError: originalError?.message }
    );
  }
}

// Error response interface
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
    context?: Record<string, any>;
    timestamp: string;
    requestId?: string;
  };
}

// Global error handler for API routes
export function handleApiError(
  error: unknown,
  requestId?: string,
  userId?: string
): NextResponse<ErrorResponse> {
  let appError: AppError;

  // Convert different error types to AppError
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof ZodError) {
    appError = new ValidationError(
      'Invalid input data',
      { validationErrors: error.errors }
    );
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    appError = handlePrismaError(error);
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    appError = new ValidationError('Database validation error');
  } else if (error instanceof Error) {
    // Unknown error - treat as internal server error
    appError = new AppError(
      process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
      ErrorCode.INTERNAL_SERVER_ERROR,
      500,
      false,
      { originalMessage: error.message }
    );
  } else {
    // Non-Error object thrown
    appError = new AppError(
      'An unexpected error occurred',
      ErrorCode.INTERNAL_SERVER_ERROR,
      500,
      false,
      { error: String(error) }
    );
  }

  // Log the error
  logger.error('API Error', {
    error: {
      code: appError.code,
      message: appError.message,
      statusCode: appError.statusCode,
      isOperational: appError.isOperational,
      context: appError.context,
      stack: appError.stack,
    },
    requestId,
    userId,
  });

  // Create error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  // Add details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.details = appError.context;
    if (!appError.isOperational) {
      errorResponse.error.context = { stack: appError.stack };
    }
  }

  return NextResponse.json(errorResponse, { status: appError.statusCode });
}

// Handle Prisma-specific errors
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const field = error.meta?.target as string[] | undefined;
      return new ConflictError(
        `Resource with this ${field?.[0] || 'field'} already exists`,
        { prismaCode: error.code, field }
      );
    
    case 'P2025':
      // Record not found
      return new NotFoundError('Record', { prismaCode: error.code });
    
    case 'P2003':
      // Foreign key constraint violation
      return new ValidationError(
        'Referenced resource does not exist',
        { prismaCode: error.code }
      );
    
    case 'P2021':
      // Table does not exist
      return new AppError(
        'Database configuration error',
        ErrorCode.DATABASE_ERROR,
        500,
        false,
        { prismaCode: error.code }
      );
    
    case 'P1008':
      // Connection timeout
      return new AppError(
        'Database connection timeout',
        ErrorCode.DATABASE_ERROR,
        503,
        true,
        { prismaCode: error.code }
      );
    
    default:
      return new AppError(
        'Database operation failed',
        ErrorCode.DATABASE_ERROR,
        500,
        true,
        { prismaCode: error.code, prismaMessage: error.message }
      );
  }
}

// Middleware wrapper for API routes with error handling
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Extract request ID if available
      const request = args[0];
      const requestId = request?.headers?.get?.('x-request-id') || undefined;
      
      return handleApiError(error, requestId);
    }
  };
}

// Async operation wrapper with error handling
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback?: T,
  errorHandler?: (error: unknown) => void
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    } else {
      logger.error('Safe async operation failed', { error });
    }
    return fallback;
  }
}

// Validation helper
export function validateRequired<T>(
  value: T | undefined | null,
  fieldName: string
): T {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }
  return value;
}

// Business logic assertion
export function assert(
  condition: boolean,
  message: string,
  code: ErrorCode = ErrorCode.BAD_REQUEST,
  context?: Record<string, any>
): asserts condition {
  if (!condition) {
    throw new BusinessLogicError(message, code, context);
  }
}

// Rate limiting error
export function createRateLimitError(
  limit: number,
  window: string,
  retryAfter?: number
): AppError {
  return new AppError(
    `Rate limit exceeded: ${limit} requests per ${window}`,
    ErrorCode.RATE_LIMIT_EXCEEDED,
    429,
    true,
    { limit, window, retryAfter }
  );
}

// File upload error
export function createFileUploadError(
  reason: string,
  context?: Record<string, any>
): AppError {
  return new AppError(
    `File upload failed: ${reason}`,
    ErrorCode.FILE_UPLOAD_ERROR,
    400,
    true,
    context
  );
}

// Payment error
export function createPaymentError(
  message: string,
  context?: Record<string, any>
): AppError {
  return new BusinessLogicError(message, ErrorCode.PAYMENT_FAILED, context);
}

// Inventory error
export function createInventoryError(
  productName: string,
  requested: number,
  available: number
): AppError {
  return new BusinessLogicError(
    `Insufficient inventory for ${productName}. Requested: ${requested}, Available: ${available}`,
    ErrorCode.INSUFFICIENT_INVENTORY,
    { productName, requested, available }
  );
}