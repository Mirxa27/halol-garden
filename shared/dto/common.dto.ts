import { z } from 'zod';

// Pagination
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Search
export const SearchSchema = z.object({
  query: z.string().min(1).max(200),
  filters: z.record(z.any()).optional(),
});

// Date Range
export const DateRangeSchema = z.object({
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
}).refine(data => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start <= end;
}, {
  message: 'Start date must be before or equal to end date',
  path: ['endDate'],
});

// Price Range
export const PriceRangeSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().positive(),
}).refine(data => data.min <= data.max, {
  message: 'Minimum price must be less than or equal to maximum price',
  path: ['max'],
});

// Address
export const AddressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  street2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State/Province is required'),
  country: z.string().min(2, 'Country is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
});

// Contact Information
export const ContactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  role: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

// File Upload
export const FileUploadSchema = z.object({
  filename: z.string().min(1),
  mimetype: z.string().min(1),
  size: z.number().positive().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  url: z.string().url(),
  uploadedAt: z.string().datetime().or(z.date()),
});

// Image
export const ImageSchema = z.object({
  url: z.string().url('Invalid image URL'),
  alt: z.string().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  thumbnail: z.string().url().optional(),
});

// Money
export const MoneySchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.string().length(3, 'Currency code must be 3 characters'),
});

// Percentage
export const PercentageSchema = z.number().min(0).max(100);

// Rating
export const RatingSchema = z.number().min(1).max(5);

// Status Enums
export const StatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'ARCHIVED']);
export const OrderStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]);

// API Response
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    details: z.any().optional(),
    timestamp: z.string().datetime().or(z.date()),
  });

// Paginated Response
export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    success: z.boolean(),
    data: z.object({
      items: z.array(itemSchema),
      pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
      }),
    }),
    timestamp: z.string().datetime().or(z.date()),
  });

// Batch Operation
export const BatchOperationSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
  operation: z.enum(['delete', 'archive', 'activate', 'deactivate']),
  reason: z.string().optional(),
});

// Audit Log
export const AuditLogSchema = z.object({
  userId: z.string().uuid(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  changes: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
  timestamp: z.string().datetime().or(z.date()),
});

// Error Response
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.any().optional(),
  timestamp: z.string().datetime().or(z.date()),
});

// Types
export type Pagination = z.infer<typeof PaginationSchema>;
export type Search = z.infer<typeof SearchSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
export type PriceRange = z.infer<typeof PriceRangeSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type FileUpload = z.infer<typeof FileUploadSchema>;
export type Image = z.infer<typeof ImageSchema>;
export type Money = z.infer<typeof MoneySchema>;
export type Rating = z.infer<typeof RatingSchema>;
export type Status = z.infer<typeof StatusEnum>;
export type OrderStatus = z.infer<typeof OrderStatusEnum>;
export type BatchOperation = z.infer<typeof BatchOperationSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;