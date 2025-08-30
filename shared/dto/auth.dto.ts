import { z } from 'zod';

// User types enum
export const UserTypeEnum = z.enum([
  'HEALTHCARE_PROVIDER',
  'EQUIPMENT_SUPPLIER',
  'MAINTENANCE_ENGINEER',
  'CUSTOMER_SERVICE',
  'ADMIN',
  'INDIVIDUAL_CUSTOMER',
]);

// Password validation
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Phone validation
const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

// Registration DTOs
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phoneNumber: phoneSchema,
  userType: UserTypeEnum,
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Healthcare Provider Registration
export const HealthcareProviderRegistrationSchema = RegisterSchema.extend({
  organizationName: z.string().min(2, 'Organization name is required'),
  organizationType: z.enum(['hospital', 'clinic', 'diagnostic_center', 'pharmacy', 'other']),
  licenseNumber: z.string().min(5, 'License number is required'),
  taxRegistrationNumber: z.string().optional(),
  numberOfBeds: z.number().int().positive().optional(),
  specializations: z.array(z.string()).optional(),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    country: z.string().min(1),
    postalCode: z.string().min(1),
  }),
});

// Equipment Supplier Registration
export const EquipmentSupplierRegistrationSchema = RegisterSchema.extend({
  companyName: z.string().min(2, 'Company name is required'),
  businessRegistrationNumber: z.string().min(5, 'Business registration is required'),
  taxRegistrationNumber: z.string().min(5, 'Tax registration is required'),
  yearEstablished: z.number().int().min(1900).max(new Date().getFullYear()),
  productCategories: z.array(z.string()).min(1, 'Select at least one product category'),
  brands: z.array(z.string()).optional(),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    country: z.string().min(1),
    postalCode: z.string().min(1),
  }),
});

// Login DTO
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

// Two-Factor Authentication
export const TwoFactorSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must be numeric'),
});

// Password Reset
export const RequestPasswordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Change Password
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine(data => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ['newPassword'],
});

// Session Management
export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Email Verification
export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const ResendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Types
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type HealthcareProviderRegistrationInput = z.infer<typeof HealthcareProviderRegistrationSchema>;
export type EquipmentSupplierRegistrationInput = z.infer<typeof EquipmentSupplierRegistrationSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type TwoFactorInput = z.infer<typeof TwoFactorSchema>;
export type RequestPasswordResetInput = z.infer<typeof RequestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>;
export type UserType = z.infer<typeof UserTypeEnum>;