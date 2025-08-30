import { z } from 'zod';
import { ImageSchema, MoneySchema, PaginationSchema } from './common.dto';

// Product Condition
export const ProductConditionEnum = z.enum([
  'NEW',
  'REFURBISHED',
  'USED_EXCELLENT',
  'USED_GOOD',
  'USED_FAIR',
]);

// Availability Type
export const AvailabilityTypeEnum = z.enum(['SALE', 'RENT', 'BOTH']);

// Product Status
export const ProductStatusEnum = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'ACTIVE',
  'OUT_OF_STOCK',
  'DISCONTINUED',
  'ARCHIVED',
]);

// Specifications
export const SpecificationSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  unit: z.string().optional(),
  category: z.string().optional(),
});

// Certification
export const CertificationSchema = z.object({
  name: z.string().min(1),
  issuingBody: z.string().min(1),
  certificateNumber: z.string().min(1),
  issueDate: z.string().datetime().or(z.date()),
  expiryDate: z.string().datetime().or(z.date()).optional(),
  documentUrl: z.string().url().optional(),
});

// Warranty
export const WarrantySchema = z.object({
  type: z.enum(['MANUFACTURER', 'EXTENDED', 'THIRD_PARTY']),
  duration: z.number().positive(),
  durationUnit: z.enum(['days', 'months', 'years']),
  coverage: z.string().min(10),
  terms: z.string().optional(),
  provider: z.string().optional(),
});

// Dimensions
export const DimensionsSchema = z.object({
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  unit: z.enum(['mm', 'cm', 'm', 'in', 'ft']),
});

// Inventory
export const InventorySchema = z.object({
  quantity: z.number().int().nonnegative(),
  reserved: z.number().int().nonnegative().default(0),
  available: z.number().int().nonnegative(),
  warehouse: z.string().optional(),
  restockDate: z.string().datetime().or(z.date()).optional(),
  lowStockThreshold: z.number().int().positive().optional(),
});

// Shipping Details
export const ShippingDetailsSchema = z.object({
  weight: z.number().positive(),
  weightUnit: z.enum(['g', 'kg', 'lb', 'oz']),
  dimensions: DimensionsSchema,
  shippingClass: z.enum(['standard', 'expedited', 'freight', 'white_glove']),
  handlingTime: z.number().int().positive(),
  handlingTimeUnit: z.enum(['hours', 'days']),
  shippingRestrictions: z.array(z.string()).optional(),
});

// Create Product DTO
export const CreateProductSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  nameAr: z.string().optional(),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  descriptionAr: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  manufacturerCountry: z.string().length(2, 'Country code must be 2 characters'),
  condition: ProductConditionEnum,
  availabilityType: AvailabilityTypeEnum,
  images: z.array(ImageSchema).min(1, 'At least one image is required').max(10),
  specifications: z.array(SpecificationSchema).min(1),
  certifications: z.array(CertificationSchema).optional(),
  warranty: WarrantySchema.optional(),
  dimensions: DimensionsSchema.optional(),
  weight: z.number().positive(),
  weightUnit: z.enum(['g', 'kg', 'lb', 'oz']),
  tags: z.array(z.string()).max(10).optional(),
  
  // Sales Details
  basePrice: z.number().positive().optional(),
  discountedPrice: z.number().positive().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  currency: z.string().length(3).default('USD'),
  inventory: InventorySchema.optional(),
  
  // Rental Details
  dailyRate: z.number().positive().optional(),
  weeklyRate: z.number().positive().optional(),
  monthlyRate: z.number().positive().optional(),
  securityDeposit: z.number().nonnegative().optional(),
  minimumRentalPeriod: z.number().int().positive().optional(),
  maximumRentalPeriod: z.number().int().positive().optional(),
  
  // SEO
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
}).refine(data => {
  // Validate sales details if selling
  if (data.availabilityType === 'SALE' || data.availabilityType === 'BOTH') {
    return data.basePrice && data.basePrice > 0;
  }
  return true;
}, {
  message: 'Base price is required for products available for sale',
  path: ['basePrice'],
}).refine(data => {
  // Validate rental details if renting
  if (data.availabilityType === 'RENT' || data.availabilityType === 'BOTH') {
    return data.dailyRate && data.dailyRate > 0;
  }
  return true;
}, {
  message: 'Daily rate is required for products available for rent',
  path: ['dailyRate'],
}).refine(data => {
  // Validate discounted price
  if (data.discountedPrice && data.basePrice) {
    return data.discountedPrice < data.basePrice;
  }
  return true;
}, {
  message: 'Discounted price must be less than base price',
  path: ['discountedPrice'],
});

// Update Product DTO
export const UpdateProductSchema = CreateProductSchema.partial().extend({
  id: z.string().uuid(),
});

// Product Query DTO
export const ProductQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  condition: ProductConditionEnum.optional(),
  availabilityType: AvailabilityTypeEnum.optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().positive().optional(),
  inStock: z.boolean().optional(),
  supplierId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  minRating: z.number().min(1).max(5).optional(),
});

// Product Review DTO
export const CreateProductReviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  title: z.string().min(3).max(100),
  comment: z.string().min(10).max(2000),
  pros: z.array(z.string()).max(5).optional(),
  cons: z.array(z.string()).max(5).optional(),
  images: z.array(ImageSchema).max(5).optional(),
  wouldRecommend: z.boolean(),
  verifiedPurchase: z.boolean().default(false),
});

// Product Question DTO
export const CreateProductQuestionSchema = z.object({
  productId: z.string().uuid(),
  question: z.string().min(10).max(500),
});

// Product Answer DTO
export const CreateProductAnswerSchema = z.object({
  questionId: z.string().uuid(),
  answer: z.string().min(10).max(1000),
  isSupplierAnswer: z.boolean().default(false),
});

// Bulk Product Import
export const BulkProductImportSchema = z.object({
  products: z.array(CreateProductSchema).min(1).max(100),
  skipValidation: z.boolean().default(false),
  updateExisting: z.boolean().default(false),
});

// Product Comparison
export const ProductComparisonSchema = z.object({
  productIds: z.array(z.string().uuid()).min(2).max(4),
  attributes: z.array(z.string()).optional(),
});

// Types
export type ProductCondition = z.infer<typeof ProductConditionEnum>;
export type AvailabilityType = z.infer<typeof AvailabilityTypeEnum>;
export type ProductStatus = z.infer<typeof ProductStatusEnum>;
export type Specification = z.infer<typeof SpecificationSchema>;
export type Certification = z.infer<typeof CertificationSchema>;
export type Warranty = z.infer<typeof WarrantySchema>;
export type Dimensions = z.infer<typeof DimensionsSchema>;
export type Inventory = z.infer<typeof InventorySchema>;
export type ShippingDetails = z.infer<typeof ShippingDetailsSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ProductQuery = z.infer<typeof ProductQuerySchema>;
export type CreateProductReviewInput = z.infer<typeof CreateProductReviewSchema>;
export type CreateProductQuestionInput = z.infer<typeof CreateProductQuestionSchema>;
export type CreateProductAnswerInput = z.infer<typeof CreateProductAnswerSchema>;
export type BulkProductImportInput = z.infer<typeof BulkProductImportSchema>;
export type ProductComparisonInput = z.infer<typeof ProductComparisonSchema>;