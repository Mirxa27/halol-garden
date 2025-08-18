import { z } from 'zod';

// Common validation schemas
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces');

// User schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: nameSchema,
  lastName: nameSchema,
  userType: z.enum([
    'HEALTHCARE_PROVIDER',
    'EQUIPMENT_SUPPLIER',
    'MAINTENANCE_ENGINEER',
    'INDIVIDUAL_CUSTOMER',
  ]),
  phone: phoneSchema.optional(),
  organizationName: z.string().min(2).max(100).optional(),
  licenseNumber: z.string().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Product schemas
export const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  nameAr: z.string().min(3, 'Arabic name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  descriptionAr: z.string().min(10, 'Arabic description must be at least 10 characters'),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  category: z.enum([
    'DIAGNOSTIC',
    'SURGICAL',
    'MONITORING',
    'THERAPEUTIC',
    'LABORATORY',
    'EMERGENCY',
    'REHABILITATION',
    'DENTAL',
    'IMAGING',
    'OTHER',
  ]),
  price: z.number().min(0, 'Price must be positive'),
  compareAtPrice: z.number().min(0).optional(),
  quantity: z.number().int().min(0, 'Quantity must be non-negative'),
  images: z.array(z.string().url()).min(1, 'At least one image is required'),
  specifications: z.record(z.string()),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

// Order schemas
export const shippingAddressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: phoneSchema,
  email: emailSchema.optional(),
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State/Province is required'),
  postalCode: z.string().min(3, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
});

export const checkoutSchema = z.object({
  shippingAddress: shippingAddressSchema,
  billingAddress: shippingAddressSchema.optional(),
  sameAsShipping: z.boolean().default(true),
  paymentMethod: z.enum(['STRIPE', 'PAYPAL', 'MYFATOORAH', 'BANK_TRANSFER']),
  notes: z.string().optional(),
});

// Review schema
export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  comment: z.string().min(10, 'Comment must be at least 10 characters'),
  wouldRecommend: z.boolean(),
  verifiedPurchase: z.boolean().default(false),
});

// Contact schema
export const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: emailSchema,
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
  phone: phoneSchema.optional(),
  company: z.string().optional(),
});

// Maintenance request schema
export const maintenanceRequestSchema = z.object({
  equipmentId: z.string().uuid('Invalid equipment ID'),
  issueType: z.enum(['REPAIR', 'MAINTENANCE', 'INSPECTION', 'CALIBRATION', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  preferredDate: z.date().min(new Date(), 'Date must be in the future'),
  preferredTime: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME']),
  contactPerson: z.string().min(2),
  contactPhone: phoneSchema,
  location: z.object({
    address: z.string(),
    city: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
});

// Rental agreement schema
export const rentalAgreementSchema = z.object({
  equipmentId: z.string().uuid(),
  startDate: z.date().min(new Date(), 'Start date must be in the future'),
  endDate: z.date(),
  deliveryAddress: shippingAddressSchema,
  insuranceRequired: z.boolean(),
  depositAmount: z.number().min(0),
  dailyRate: z.number().min(0),
  terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the rental terms',
  }),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type MaintenanceRequestInput = z.infer<typeof maintenanceRequestSchema>;
export type RentalAgreementInput = z.infer<typeof rentalAgreementSchema>;

// Validation helper
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}