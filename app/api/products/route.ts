import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../server/config/database';
import { z } from 'zod';
import { ProductCondition, ProductCategory, ProductStatus } from '@prisma/client';

// Validation schemas
const productQuerySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  limit: z.string().optional().transform(val => parseInt(val || '12')),
  category: z.nativeEnum(ProductCategory).optional(),
  search: z.string().optional(),
  minPrice: z.string().optional().transform(val => parseFloat(val || '0')),
  maxPrice: z.string().optional().transform(val => parseFloat(val || '999999')),
  condition: z.nativeEnum(ProductCondition).optional(),
  sortBy: z.enum(['price', 'name', 'rating', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  nameAr: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  descriptionAr: z.string().optional(),
  category: z.nativeEnum(ProductCategory),
  subcategory: z.string().optional(),
  condition: z.nativeEnum(ProductCondition),
  price: z.number().positive('Price must be positive'),
  compareAtPrice: z.number().positive().optional(),
  quantity: z.number().int().min(0).default(0),
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
  }).optional(),
  images: z.array(z.string().url()).min(1, 'At least one image is required'),
  specifications: z.record(z.any()),
  features: z.array(z.string()).optional(),
  certifications: z.array(z.record(z.any())).optional(),
  tags: z.array(z.string()).optional(),
  warrantyPeriod: z.number().int().min(0).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    
    // Validate query parameters
    const validatedQuery = productQuerySchema.parse(query);
    
    // Build where clause
    const where: any = {
      status: ProductStatus.ACTIVE,
      isPublished: true,
    };

    if (validatedQuery.category) {
      where.category = validatedQuery.category;
    }

    if (validatedQuery.condition) {
      where.condition = validatedQuery.condition;
    }

    if (validatedQuery.minPrice || validatedQuery.maxPrice) {
      where.price = {
        gte: validatedQuery.minPrice,
        lte: validatedQuery.maxPrice,
      };
    }

    if (validatedQuery.search) {
      where.OR = [
        { name: { contains: validatedQuery.search, mode: 'insensitive' } },
        { nameAr: { contains: validatedQuery.search, mode: 'insensitive' } },
        { description: { contains: validatedQuery.search, mode: 'insensitive' } },
      ];
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[validatedQuery.sortBy] = validatedQuery.sortOrder;

    // Calculate pagination
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;
    const take = validatedQuery.limit;

    // Fetch products with related data
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          supplier: {
            select: {
              id: true,
              companyName: true,
              rating: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate average ratings and format response
    const formattedProducts = products.map(product => {
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0;

      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        nameAr: product.nameAr,
        description: product.description,
        descriptionAr: product.descriptionAr,
        category: product.category,
        subcategory: product.subcategory,
        brand: product.brand,
        model: product.model,
        condition: product.condition,
        availabilityType: product.availabilityType,
        images: product.images,
        specifications: product.specifications,
        certifications: product.certifications,
        warranty: product.warranty,
        dimensions: product.dimensions,
        weight: product.weight,
        tags: product.tags,
        featured: product.featured,
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: product.reviews.length,
        supplier: {
          id: product.supplier.id,
          name: product.supplier.companyName,
        },
        pricing: {
          basePrice: product.salesDetails?.basePrice,
          discountedPrice: product.salesDetails?.discountedPrice,
          dailyRate: product.rentalDetails?.dailyRate,
          weeklyRate: product.rentalDetails?.weeklyRate,
          monthlyRate: product.rentalDetails?.monthlyRate,
          securityDeposit: product.rentalDetails?.securityDeposit,
        },
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / validatedQuery.limit);
    const hasNextPage = validatedQuery.page < totalPages;
    const hasPreviousPage = validatedQuery.page > 1;

    return NextResponse.json({
      success: true,
      data: formattedProducts,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = createProductSchema.parse(body);
    
    // TODO: Get supplier ID from authenticated user
    // For now, using a placeholder
    const supplierId = 'supplier-placeholder-id';
    
    // Generate SKU
    const sku = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create product with transaction
    const product = await prisma.$transaction(async (tx) => {
      // Create main product
      const newProduct = await tx.product.create({
        data: {
          supplierId,
          sku,
          name: validatedData.name,
          nameAr: validatedData.nameAr,
          description: validatedData.description,
          descriptionAr: validatedData.descriptionAr,
          category: validatedData.category,
          subcategory: validatedData.subcategory,
          brand: validatedData.brand,
          model: validatedData.model,
          manufacturerCountry: validatedData.manufacturerCountry,
          condition: validatedData.condition,
          availabilityType: validatedData.availabilityType,
          images: validatedData.images,
          specifications: validatedData.specifications,
          certifications: validatedData.certifications || [],
          warranty: validatedData.warranty || {},
          dimensions: validatedData.dimensions || {},
          weight: validatedData.weight,
          tags: validatedData.tags || [],
        },
      });

      // Create sales details if provided
      if (validatedData.basePrice) {
        await tx.salesProduct.create({
          data: {
            productId: newProduct.id,
            basePrice: validatedData.basePrice,
            discountedPrice: validatedData.discountedPrice,
            taxRate: validatedData.taxRate || 0,
            inventory: validatedData.inventory || { quantity: 0 },
            shipping: {},
            bulkPricing: {},
          },
        });
      }

      // Create rental details if provided
      if (validatedData.dailyRate) {
        await tx.rentalProduct.create({
          data: {
            productId: newProduct.id,
            dailyRate: validatedData.dailyRate,
            weeklyRate: validatedData.weeklyRate || validatedData.dailyRate * 7,
            monthlyRate: validatedData.monthlyRate || validatedData.dailyRate * 30,
            securityDeposit: validatedData.securityDeposit || 0,
            deliveryFee: 0,
            setupFee: 0,
            minimumRentalPeriod: validatedData.minimumRentalPeriod || 1,
            maximumRentalPeriod: 365,
            inventory: { quantity: 0 },
            rentalTerms: {},
            maintenanceSchedule: {},
          },
        });
      }

      return newProduct;
    });

    return NextResponse.json({
      success: true,
      data: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        message: 'Product created successfully',
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}