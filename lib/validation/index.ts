/**
 * Comprehensive Validation System with DTOs
 */

import { z } from 'zod';

// Common validation schemas
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(5, 'Email too short')
  .max(255, 'Email too long')
  .toLowerCase()
  .trim();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .transform(val => val.replace(/\s/g, ''));

export const uuidSchema = z.string().uuid('Invalid ID format');

export const dateSchema = z.string().datetime('Invalid date format');

export const urlSchema = z.string().url('Invalid URL format');

export const currencySchema = z.enum(['USD', 'SAR', 'AED', 'EUR']);

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Address schema
export const addressSchema = z.object({
  street: z.string().min(1, 'Street is required').max(255),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  country: z.string().min(1, 'Country is required').max(100),
  postalCode: z.string().min(1, 'Postal code is required').max(20),
  phone: phoneSchema.optional(),
  recipientName: z.string().min(1).max(100).optional(),
});

// Money schema with validation
export const moneySchema = z
  .number()
  .positive('Amount must be positive')
  .multipleOf(0.01, 'Amount must have at most 2 decimal places')
  .max(999999999.99, 'Amount too large');

// Safe string schema to prevent XSS
export const safeStringSchema = z
  .string()
  .transform(val => val.trim())
  .refine(val => !/<[^>]*>/g.test(val), 'HTML tags are not allowed');

// File upload schema
export const fileUploadSchema = z.object({
  name: z.string().max(255),
  type: z.string().regex(/^[a-zA-Z0-9]+\/[a-zA-Z0-9\-\+\.]+$/, 'Invalid MIME type'),
  size: z.number().positive().max(10 * 1024 * 1024, 'File too large (max 10MB)'),
});

// Search query schema
export const searchSchema = z.object({
  query: safeStringSchema.min(1).max(100),
  filters: z.record(z.string(), z.any()).optional(),
  ...paginationSchema.shape,
});

/**
 * Create a validated API handler
 */
export function createValidatedHandler<TParams, TQuery, TBody>(
  schemas: {
    params?: z.ZodSchema<TParams>;
    query?: z.ZodSchema<TQuery>;
    body?: z.ZodSchema<TBody>;
  },
  handler: (data: {
    params?: TParams;
    query?: TQuery;
    body?: TBody;
  }) => Promise<any>
) {
  return async (request: Request, context?: any) => {
    try {
      const data: any = {};

      // Validate params
      if (schemas.params && context?.params) {
        data.params = await schemas.params.parseAsync(context.params);
      }

      // Validate query
      if (schemas.query) {
        const url = new URL(request.url);
        const query = Object.fromEntries(url.searchParams);
        data.query = await schemas.query.parseAsync(query);
      }

      // Validate body
      if (schemas.body && request.method !== 'GET') {
        const body = await request.json();
        data.body = await schemas.body.parseAsync(body);
      }

      return handler(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Validation failed',
            details: error.errors,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      throw error;
    }
  };
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potential XSS vectors
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * Validate and sanitize pagination parameters
 */
export function validatePagination(query: any) {
  const { page = 1, limit = 20, sortBy, sortOrder = 'desc' } = query;
  
  const validatedPage = Math.max(1, parseInt(page));
  const validatedLimit = Math.min(100, Math.max(1, parseInt(limit)));
  const validatedSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';
  
  return {
    page: validatedPage,
    limit: validatedLimit,
    skip: (validatedPage - 1) * validatedLimit,
    sortBy: sortBy ? String(sortBy) : undefined,
    sortOrder: validatedSortOrder as 'asc' | 'desc',
  };
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: File, options?: {
  maxSize?: number;
  allowedTypes?: string[];
}) {
  const maxSize = options?.maxSize || 10 * 1024 * 1024; // 10MB default
  const allowedTypes = options?.allowedTypes || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ];
  
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  // Additional security checks
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];
  
  if (!fileExtension || !validExtensions.includes(fileExtension)) {
    throw new Error('Invalid file extension');
  }
  
  return true;
}