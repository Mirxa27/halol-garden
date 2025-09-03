import { z } from 'zod';
import { moneySchema, safeStringSchema, uuidSchema } from '../index';
import { ProductCategory, ProductCondition, ProductStatus, AvailabilityType } from '@prisma/client';

// Product creation DTO
export const createProductSchema = z.object({
  name: safeStringSchema.min(3).max(200),
  nameAr: safeStringSchema.min(3).max(200),
  description: safeStringSchema.min(10).max(5000),
  descriptionAr: safeStringSchema.min(10).max(5000),
  category: z.nativeEnum(ProductCategory),
  subcategory: safeStringSchema.max(100).optional(),
  brand: safeStringSchema.max(100).optional(),
  model: safeStringSchema.max(100).optional(),
  manufacturerCountry: safeStringSchema.max(100).optional(),
  condition: z.nativeEnum(ProductCondition).default('NEW'),
  availabilityType: z.nativeEnum(AvailabilityType).default('SALE'),
  
  // Pricing
  price: moneySchema,
  compareAtPrice: moneySchema.optional(),
  costPrice: moneySchema.optional(),
  currency: z.enum(['USD', 'SAR', 'AED', 'EUR']).default('USD'),
  
  // Inventory
  quantity: z.number().int().min(0).default(0),
  minOrderQuantity: z.number().int().positive().default(1),
  maxOrderQuantity: z.number().int().positive().optional(),
  
  // Physical attributes
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.enum(['cm', 'inch']).default('cm'),
  }).optional(),
  
  // Rich content
  images: z.array(z.string().url()).min(1).max(10),
  specifications: z.record(z.string(), z.any()),
  features: z.array(safeStringSchema).optional(),
  certifications: z.array(safeStringSchema).optional(),
  documents: z.array(z.object({
    name: safeStringSchema,
    url: z.string().url(),
    type: z.enum(['manual', 'datasheet', 'certificate', 'other']),
  })).optional(),
  tags: z.array(safeStringSchema.max(50)).max(20).optional(),
  
  // Warranty and returns
  warrantyPeriod: z.number().int().min(0).optional(),
  returnPeriod: z.number().int().min(0).default(30),
  
  // Publishing
  isPublished: z.boolean().default(false),
  featured: z.boolean().default(false),
  
  // Sales details (if applicable)
  salesDetails: z.object({
    basePrice: moneySchema,
    discountedPrice: moneySchema.optional(),
    minOrderQuantity: z.number().int().positive().default(1),
    maxOrderQuantity: z.number().int().positive().optional(),
  }).optional(),
  
  // Rental details (if applicable)
  rentalDetails: z.object({
    dailyRate: moneySchema,
    weeklyRate: moneySchema.optional(),
    monthlyRate: moneySchema.optional(),
    securityDeposit: moneySchema,
    minimumRentalPeriod: z.number().int().positive().default(1),
    maximumRentalPeriod: z.number().int().positive().optional(),
  }).optional(),
}).refine(data => {
  if (data.availabilityType === 'SALE' && !data.salesDetails) {
    return false;
  }
  if (data.availabilityType === 'RENT' && !data.rentalDetails) {
    return false;
  }
  if (data.availabilityType === 'BOTH' && (!data.salesDetails || !data.rentalDetails)) {
    return false;
  }
  return true;
}, {
  message: 'Sales/rental details are required based on availability type',
});

// Product update DTO
export const updateProductSchema = createProductSchema.partial().extend({
  id: uuidSchema,
  status: z.nativeEnum(ProductStatus).optional(),
});

// Product search DTO
export const searchProductsSchema = z.object({
  query: safeStringSchema.optional(),
  category: z.nativeEnum(ProductCategory).optional(),
  subcategory: safeStringSchema.optional(),
  brand: safeStringSchema.optional(),
  condition: z.nativeEnum(ProductCondition).optional(),
  availabilityType: z.nativeEnum(AvailabilityType).optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
  supplierId: uuidSchema.optional(),
  tags: z.array(safeStringSchema).optional(),
  sortBy: z.enum(['price', 'name', 'createdAt', 'rating', 'salesCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Product review DTO
export const createProductReviewSchema = z.object({
  productId: uuidSchema,
  rating: z.number().int().min(1).max(5),
  title: safeStringSchema.min(3).max(100),
  comment: safeStringSchema.min(10).max(1000),
  images: z.array(z.string().url()).max(5).optional(),
});

// Product question DTO
export const createProductQuestionSchema = z.object({
  productId: uuidSchema,
  question: safeStringSchema.min(10).max(500),
});

// Product answer DTO
export const createProductAnswerSchema = z.object({
  questionId: uuidSchema,
  answer: safeStringSchema.min(10).max(1000),
  isOfficial: z.boolean().default(false),
});

// Inventory update DTO
export const updateInventorySchema = z.object({
  productId: uuidSchema,
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RETURN', 'SALE']),
  quantity: z.number().int(),
  reason: safeStringSchema.optional(),
  reference: safeStringSchema.optional(),
});

// Price update DTO
export const updatePriceSchema = z.object({
  productId: uuidSchema,
  price: moneySchema,
  compareAtPrice: moneySchema.optional(),
  reason: safeStringSchema.optional(),
});

// Bulk operations DTOs
export const bulkUpdateStatusSchema = z.object({
  productIds: z.array(uuidSchema).min(1),
  status: z.nativeEnum(ProductStatus),
  reason: safeStringSchema.optional(),
});

export const bulkUpdateInventorySchema = z.object({
  updates: z.array(z.object({
    productId: uuidSchema,
    quantity: z.number().int(),
  })).min(1),
  type: z.enum(['RESTOCK', 'ADJUSTMENT']),
  reason: safeStringSchema.optional(),
});

// Product import/export DTOs
export const importProductsSchema = z.object({
  products: z.array(createProductSchema).min(1).max(1000),
  updateExisting: z.boolean().default(false),
});

export const exportProductsSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'json']).default('csv'),
  fields: z.array(z.string()).optional(),
  filters: searchProductsSchema.shape,
});