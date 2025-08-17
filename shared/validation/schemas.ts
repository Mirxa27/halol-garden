/**
 * Comprehensive Data Validation Schemas using Zod
 * Provides type-safe validation for all API endpoints and data models
 */

import { z } from 'zod';

// ============== Common Schemas ==============

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .toLowerCase()
  .trim();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number and special character'
  );

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number format')
  .optional();

export const cuidSchema = z.string().regex(/^c[a-z0-9]{24}$/, 'Invalid ID format');

export const dateSchema = z.string().datetime();

export const urlSchema = z.string().url('Invalid URL format');

export const currencySchema = z.enum(['USD', 'EUR', 'GBP', 'SAR', 'AED']);

export const languageSchema = z.enum(['en', 'ar']);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// ============== User Schemas ==============

export const userTypeSchema = z.enum([
  'HEALTHCARE_PROVIDER',
  'EQUIPMENT_SUPPLIER',
  'MAINTENANCE_ENGINEER',
  'CUSTOMER_SERVICE',
  'ADMIN',
  'INDIVIDUAL_CUSTOMER',
]);

export const userStatusSchema = z.enum([
  'PENDING_VERIFICATION',
  'ACTIVE',
  'SUSPENDED',
  'INACTIVE',
]);

export const verificationStatusSchema = z.enum([
  'UNVERIFIED',
  'EMAIL_VERIFIED',
  'DOCUMENTS_VERIFIED',
  'FULLY_VERIFIED',
]);

export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  phoneNumber: phoneSchema,
  userType: userTypeSchema,
  preferredLanguage: languageSchema.default('en'),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
  // Additional fields based on user type
  organizationName: z.string().optional(),
  licenseNumber: z.string().optional(),
  taxRegistrationNumber: z.string().optional(),
  specializations: z.array(z.string()).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
  twoFactorCode: z.string().length(6).optional(),
});

export const userUpdateSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  phoneNumber: phoneSchema,
  profileImage: urlSchema.optional(),
  preferredLanguage: languageSchema.optional(),
  twoFactorEnabled: z.boolean().optional(),
});

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordResetSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ============== Product Schemas ==============

export const productCategorySchema = z.enum([
  'DIAGNOSTIC',
  'SURGICAL',
  'MONITORING',
  'THERAPEUTIC',
  'LABORATORY',
  'DENTAL',
  'EMERGENCY',
  'REHABILITATION',
]);

export const productConditionSchema = z.enum([
  'NEW',
  'REFURBISHED',
  'USED',
]);

export const productCreateSchema = z.object({
  name: z.string().min(3).max(200),
  nameAr: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000),
  descriptionAr: z.string().min(10).max(5000).optional(),
  category: productCategorySchema,
  subcategory: z.string().optional(),
  brand: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  sku: z.string().min(1).max(50),
  price: z.number().positive('Price must be positive'),
  currency: currencySchema.default('USD'),
  condition: productConditionSchema.default('NEW'),
  images: z.array(urlSchema).min(1, 'At least one image is required').max(10),
  specifications: z.record(z.string(), z.any()).optional(),
  certifications: z.array(z.string()).optional(),
  warrantyPeriod: z.number().int().min(0).optional(),
  stockQuantity: z.number().int().min(0).default(0),
  minOrderQuantity: z.number().int().min(1).default(1),
  maxOrderQuantity: z.number().int().optional(),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
});

export const productUpdateSchema = productCreateSchema.partial();

export const productSearchSchema = z.object({
  search: z.string().optional(),
  category: productCategorySchema.optional(),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  condition: productConditionSchema.optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  inStock: z.coerce.boolean().optional(),
  supplierId: cuidSchema.optional(),
  tags: z.array(z.string()).optional(),
  ...paginationSchema.shape,
});

// ============== Order Schemas ==============

export const orderStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]);

export const paymentStatusSchema = z.enum([
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
]);

export const paymentMethodSchema = z.enum([
  'CREDIT_CARD',
  'DEBIT_CARD',
  'PAYPAL',
  'MYFATOORAH',
  'BANK_TRANSFER',
  'CASH_ON_DELIVERY',
]);

export const addressSchema = z.object({
  street: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  country: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  phone: phoneSchema,
  isDefault: z.boolean().default(false),
});

export const orderItemSchema = z.object({
  productId: cuidSchema,
  quantity: z.number().int().positive('Quantity must be positive'),
  price: z.number().positive().optional(), // Optional as it can be fetched from product
});

export const orderCreateSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  paymentMethod: paymentMethodSchema,
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
  preferredDeliveryDate: dateSchema.optional(),
});

export const orderUpdateSchema = z.object({
  status: orderStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  trackingNumber: z.string().optional(),
  shippingCarrier: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const orderFilterSchema = z.object({
  status: orderStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  paymentMethod: paymentMethodSchema.optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
  customerId: cuidSchema.optional(),
  ...paginationSchema.shape,
});

// ============== Rental Schemas ==============

export const rentalStatusSchema = z.enum([
  'DRAFT',
  'ACTIVE',
  'EXPIRED',
  'TERMINATED',
  'RENEWED',
]);

export const rentalPeriodSchema = z.enum([
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
]);

export const rentalCreateSchema = z.object({
  productId: cuidSchema,
  quantity: z.number().int().positive(),
  rentalPeriod: rentalPeriodSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  deliveryAddress: addressSchema,
  autoRenew: z.boolean().default(false),
  depositAmount: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
});

export const rentalUpdateSchema = z.object({
  status: rentalStatusSchema.optional(),
  endDate: dateSchema.optional(),
  autoRenew: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

// ============== Maintenance Schemas ==============

export const maintenanceTypeSchema = z.enum([
  'PREVENTIVE',
  'CORRECTIVE',
  'EMERGENCY',
  'CALIBRATION',
  'INSPECTION',
]);

export const maintenancePrioritySchema = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]);

export const maintenanceStatusSchema = z.enum([
  'REQUESTED',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

export const maintenanceRequestSchema = z.object({
  productId: cuidSchema,
  type: maintenanceTypeSchema,
  priority: maintenancePrioritySchema,
  description: z.string().min(10).max(2000),
  preferredDate: dateSchema.optional(),
  preferredTimeSlot: z.enum(['MORNING', 'AFTERNOON', 'EVENING']).optional(),
  location: addressSchema,
  attachments: z.array(urlSchema).max(5).optional(),
});

export const maintenanceUpdateSchema = z.object({
  status: maintenanceStatusSchema.optional(),
  scheduledDate: dateSchema.optional(),
  assignedEngineerId: cuidSchema.optional(),
  completionNotes: z.string().max(2000).optional(),
  partsUsed: z.array(z.object({
    name: z.string(),
    quantity: z.number().int().positive(),
    cost: z.number().positive(),
  })).optional(),
  laborHours: z.number().positive().optional(),
  totalCost: z.number().positive().optional(),
});

// ============== Review Schemas ==============

export const reviewCreateSchema = z.object({
  productId: cuidSchema,
  orderId: cuidSchema.optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3).max(100),
  comment: z.string().min(10).max(2000),
  pros: z.array(z.string()).max(5).optional(),
  cons: z.array(z.string()).max(5).optional(),
  images: z.array(urlSchema).max(5).optional(),
  wouldRecommend: z.boolean().optional(),
});

export const reviewUpdateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().min(3).max(100).optional(),
  comment: z.string().min(10).max(2000).optional(),
  pros: z.array(z.string()).max(5).optional(),
  cons: z.array(z.string()).max(5).optional(),
  images: z.array(urlSchema).max(5).optional(),
  wouldRecommend: z.boolean().optional(),
});

// ============== Chat/Message Schemas ==============

export const messageTypeSchema = z.enum([
  'TEXT',
  'IMAGE',
  'FILE',
  'PRODUCT_LINK',
  'ORDER_LINK',
]);

export const messageSendSchema = z.object({
  recipientId: cuidSchema,
  type: messageTypeSchema.default('TEXT'),
  content: z.string().min(1).max(5000),
  attachments: z.array(urlSchema).max(5).optional(),
  replyToId: cuidSchema.optional(),
});

export const chatFilterSchema = z.object({
  participantId: cuidSchema.optional(),
  unreadOnly: z.coerce.boolean().optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  ...paginationSchema.shape,
});

// ============== Notification Schemas ==============

export const notificationTypeSchema = z.enum([
  'ORDER_UPDATE',
  'PAYMENT_RECEIVED',
  'SHIPMENT_UPDATE',
  'MAINTENANCE_REMINDER',
  'RENTAL_EXPIRY',
  'NEW_MESSAGE',
  'PRICE_ALERT',
  'STOCK_ALERT',
  'SYSTEM_UPDATE',
]);

export const notificationPreferencesSchema = z.object({
  email: z.boolean().default(true),
  sms: z.boolean().default(false),
  push: z.boolean().default(true),
  inApp: z.boolean().default(true),
  types: z.array(notificationTypeSchema).optional(),
});

// ============== Analytics Schemas ==============

export const analyticsEventSchema = z.object({
  event: z.string().min(1).max(50),
  category: z.string().min(1).max(50),
  action: z.string().min(1).max(50),
  label: z.string().max(100).optional(),
  value: z.number().optional(),
  userId: cuidSchema.optional(),
  sessionId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const analyticsFilterSchema = z.object({
  event: z.string().optional(),
  category: z.string().optional(),
  userId: cuidSchema.optional(),
  startDate: dateSchema,
  endDate: dateSchema,
  groupBy: z.enum(['hour', 'day', 'week', 'month']).optional(),
  ...paginationSchema.shape,
});

// ============== Export Utility Types ==============

export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;

export type ProductCreate = z.infer<typeof productCreateSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;
export type ProductSearch = z.infer<typeof productSearchSchema>;

export type OrderCreate = z.infer<typeof orderCreateSchema>;
export type OrderUpdate = z.infer<typeof orderUpdateSchema>;
export type OrderFilter = z.infer<typeof orderFilterSchema>;

export type RentalCreate = z.infer<typeof rentalCreateSchema>;
export type RentalUpdate = z.infer<typeof rentalUpdateSchema>;

export type MaintenanceRequest = z.infer<typeof maintenanceRequestSchema>;
export type MaintenanceUpdate = z.infer<typeof maintenanceUpdateSchema>;

export type ReviewCreate = z.infer<typeof reviewCreateSchema>;
export type ReviewUpdate = z.infer<typeof reviewUpdateSchema>;

export type MessageSend = z.infer<typeof messageSendSchema>;
export type ChatFilter = z.infer<typeof chatFilterSchema>;

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;
export type AnalyticsFilter = z.infer<typeof analyticsFilterSchema>;

// ============== Validation Helpers ==============

export const validateSchema = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
};

export const validateAsync = async <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<T> => {
  return schema.parseAsync(data);
};

// Custom error formatter
export const formatZodError = (error: z.ZodError): Record<string, string[]> => {
  const formatted: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(err.message);
  });
  
  return formatted;
};

// Express middleware for validation
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: formatZodError(result.error),
      });
    }

    req.validated = result.data;
    next();
  };
};

export default {
  // User schemas
  userRegistration: userRegistrationSchema,
  userLogin: userLoginSchema,
  userUpdate: userUpdateSchema,
  passwordResetRequest: passwordResetRequestSchema,
  passwordReset: passwordResetSchema,
  
  // Product schemas
  productCreate: productCreateSchema,
  productUpdate: productUpdateSchema,
  productSearch: productSearchSchema,
  
  // Order schemas
  orderCreate: orderCreateSchema,
  orderUpdate: orderUpdateSchema,
  orderFilter: orderFilterSchema,
  
  // Rental schemas
  rentalCreate: rentalCreateSchema,
  rentalUpdate: rentalUpdateSchema,
  
  // Maintenance schemas
  maintenanceRequest: maintenanceRequestSchema,
  maintenanceUpdate: maintenanceUpdateSchema,
  
  // Review schemas
  reviewCreate: reviewCreateSchema,
  reviewUpdate: reviewUpdateSchema,
  
  // Message schemas
  messageSend: messageSendSchema,
  chatFilter: chatFilterSchema,
  
  // Notification schemas
  notificationPreferences: notificationPreferencesSchema,
  
  // Analytics schemas
  analyticsEvent: analyticsEventSchema,
  analyticsFilter: analyticsFilterSchema,
  
  // Helpers
  validate: validateSchema,
  validateAsync,
  formatError: formatZodError,
  middleware: validateRequest,
};