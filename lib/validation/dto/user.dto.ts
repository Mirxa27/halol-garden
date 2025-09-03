import { z } from 'zod';
import { emailSchema, passwordSchema, phoneSchema, safeStringSchema } from '../index';
import { UserType, UserStatus, VerificationStatus } from '@prisma/client';

// User registration DTO
export const registerUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: safeStringSchema.min(2).max(50),
  lastName: safeStringSchema.min(2).max(50),
  phoneNumber: phoneSchema,
  userType: z.nativeEnum(UserType),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// User login DTO
export const loginUserSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  twoFactorCode: z.string().length(6).optional(),
  rememberMe: z.boolean().default(false),
});

// User update DTO
export const updateUserSchema = z.object({
  firstName: safeStringSchema.min(2).max(50).optional(),
  lastName: safeStringSchema.min(2).max(50).optional(),
  phoneNumber: phoneSchema.optional(),
  profileImage: z.string().url().optional(),
  preferredLanguage: z.enum(['en', 'ar']).optional(),
});

// Change password DTO
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Email verification DTO
export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

// Password reset request DTO
export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
});

// Password reset DTO
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Two-factor authentication DTOs
export const enableTwoFactorSchema = z.object({
  password: z.string().min(1),
});

export const verifyTwoFactorSchema = z.object({
  code: z.string().length(6),
});

export const disableTwoFactorSchema = z.object({
  password: z.string().min(1),
  code: z.string().length(6),
});

// User profile DTOs for different user types
export const healthcareProviderProfileSchema = z.object({
  organizationName: safeStringSchema.min(2).max(100),
  organizationType: safeStringSchema.min(2).max(50),
  licenseNumber: safeStringSchema.min(2).max(50),
  taxRegistrationNumber: safeStringSchema.max(50).optional(),
  numberOfBeds: z.number().int().positive().optional(),
  yearEstablished: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  emergencyContact: phoneSchema.optional(),
  website: z.string().url().optional(),
  address: z.object({
    street: safeStringSchema.min(1).max(255),
    city: safeStringSchema.min(1).max(100),
    state: safeStringSchema.min(1).max(100),
    country: safeStringSchema.min(1).max(100),
    postalCode: safeStringSchema.min(1).max(20),
  }),
  specializations: z.array(safeStringSchema).min(1),
  certifications: z.array(safeStringSchema),
});

export const equipmentSupplierProfileSchema = z.object({
  companyName: safeStringSchema.min(2).max(100),
  businessRegistrationNumber: safeStringSchema.min(2).max(50),
  taxId: safeStringSchema.max(50).optional(),
  yearEstablished: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  numberOfEmployees: z.number().int().positive().optional(),
  annualRevenue: z.number().positive().optional(),
  website: z.string().url().optional(),
  address: z.object({
    street: safeStringSchema.min(1).max(255),
    city: safeStringSchema.min(1).max(100),
    state: safeStringSchema.min(1).max(100),
    country: safeStringSchema.min(1).max(100),
    postalCode: safeStringSchema.min(1).max(20),
  }),
  productCategories: z.array(safeStringSchema).min(1),
  certifications: z.array(safeStringSchema),
  brands: z.array(safeStringSchema).optional(),
});

export const maintenanceEngineerProfileSchema = z.object({
  certificationNumber: safeStringSchema.min(2).max(50),
  experienceYears: z.number().int().min(0).max(50),
  hourlyRate: z.number().positive().optional(),
  availability: z.enum(['AVAILABLE', 'BUSY', 'OFF_DUTY']),
  specializations: z.array(safeStringSchema).min(1),
  certifications: z.array(safeStringSchema).min(1),
  serviceAreas: z.array(safeStringSchema).min(1),
  workSchedule: z.object({
    monday: z.object({ start: z.string(), end: z.string() }).optional(),
    tuesday: z.object({ start: z.string(), end: z.string() }).optional(),
    wednesday: z.object({ start: z.string(), end: z.string() }).optional(),
    thursday: z.object({ start: z.string(), end: z.string() }).optional(),
    friday: z.object({ start: z.string(), end: z.string() }).optional(),
    saturday: z.object({ start: z.string(), end: z.string() }).optional(),
    sunday: z.object({ start: z.string(), end: z.string() }).optional(),
  }).optional(),
});

export const individualCustomerProfileSchema = z.object({
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  address: z.object({
    street: safeStringSchema.min(1).max(255),
    city: safeStringSchema.min(1).max(100),
    state: safeStringSchema.min(1).max(100),
    country: safeStringSchema.min(1).max(100),
    postalCode: safeStringSchema.min(1).max(20),
  }),
  preferences: z.object({
    language: z.enum(['en', 'ar']).default('en'),
    currency: z.enum(['USD', 'SAR', 'AED', 'EUR']).default('USD'),
    notifications: z.boolean().default(true),
  }).optional(),
});

// Admin user management DTOs
export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
  reason: safeStringSchema.optional(),
});

export const updateVerificationStatusSchema = z.object({
  verificationStatus: z.nativeEnum(VerificationStatus),
  verifiedDocuments: z.array(safeStringSchema).optional(),
});

// User search DTO
export const searchUsersSchema = z.object({
  query: safeStringSchema.optional(),
  userType: z.nativeEnum(UserType).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  verificationStatus: z.nativeEnum(VerificationStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'email', 'firstName', 'lastName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});