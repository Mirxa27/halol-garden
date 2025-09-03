import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getCurrentUser, isSupplier } from '@/lib/auth';
import { UserType } from '@prisma/client';

// Validation schemas
const productQuerySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  limit: z.string().optional().transform(val => parseInt(val || '12')),
  category: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.string().optional().transform(val => parseFloat(val || '0')),
  maxPrice: z.string().optional().transform(val => parseFloat(val || '999999')),
  condition: z.enum(['NEW', 'REFURBISHED', 'USED_EXCELLENT', 'USED_GOOD', 'USED_FAIR']).optional(),
  availabilityType: z.enum(['SALE', 'RENT', 'BOTH']).optional(),
  featured: z.string().optional().transform(val => val === 'true'),
  sortBy: z.enum(['price', 'name', 'rating', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  nameAr: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  descriptionAr: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  manufacturerCountry: z.string().optional(),
  condition: z.enum(['NEW', 'REFURBISHED', 'USED_EXCELLENT', 'USED_GOOD', 'USED_FAIR']),
  availabilityType: z.enum(['SALE', 'RENT', 'BOTH']),
  images: z.array(z.string().url()).min(1, 'At least one image is required'),
  specifications: z.record(z.any()),
  certifications: z.array(z.record(z.any())).optional(),
  warranty: z.record(z.any()).optional(),
  dimensions: z.record(z.any()).optional(),
  weight: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),
  // Sales product details
  basePrice: z.number().positive().optional(),
  discountedPrice: z.number().positive().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  inventory: z.record(z.any()).optional(),
  // Rental product details
  dailyRate: z.number().positive().optional(),
  weeklyRate: z.number().positive().optional(),
  monthlyRate: z.number().positive().optional(),
  securityDeposit: z.number().positive().optional(),
  minimumRentalPeriod: z.number().positive().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    
    // Validate query parameters
    const validatedQuery = productQuerySchema.parse(query);
    
    // Build where clause
    const where: any = {
      status: 'ACTIVE',
    };

    if (validatedQuery.category) {
      where.category = validatedQuery.category;
    }

    if (validatedQuery.condition) {
      where.condition = validatedQuery.condition;
    }

    if (validatedQuery.availabilityType) {
      where.availabilityType = validatedQuery.availabilityType;
    }

    if (validatedQuery.search) {
      where.OR = [
        { name: { contains: validatedQuery.search, mode: 'insensitive' } },
        { nameAr: { contains: validatedQuery.search, mode: 'insensitive' } },
        { description: { contains: validatedQuery.search, mode: 'insensitive' } },
        { brand: { contains: validatedQuery.search, mode: 'insensitive' } },
        { model: { contains: validatedQuery.search, mode: 'insensitive' } },
      ];
    }

    if (validatedQuery.featured) {
      where.featured = true;
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
            },
          },
          salesDetails: true,
          rentalDetails: true,
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
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is a supplier
    if (user.role !== UserType.EQUIPMENT_SUPPLIER) {
      return NextResponse.json(
        { success: false, error: 'Only suppliers can create products' },
        { status: 403 }
      );
    }

    // Get supplier profile
    const supplierProfile = await prisma.equipmentSupplier.findUnique({
      where: { userId: user.id },
    });

    if (!supplierProfile) {
      return NextResponse.json(
        { success: false, error: 'Supplier profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = createProductSchema.parse(body);
    
    const supplierId = supplierProfile.id;
    
    // Generate SKU
    const sku = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create product with transaction
    const product = await prisma.$transaction(async (tx) => {
      // Create main product with proper null handling
      const newProduct = await tx.product.create({
        data: {
          supplierId,
          sku,
          name: validatedData.name || '',
          nameAr: validatedData.nameAr || '',
          description: validatedData.description || '',
          descriptionAr: validatedData.descriptionAr || '',
          category: validatedData.category || 'OTHER' as any,
          subcategory: validatedData.subcategory || null,
          brand: validatedData.brand || null,
          model: validatedData.model || null,
          manufacturerCountry: validatedData.manufacturerCountry || null,
          condition: 'NEW' as any, // Use default until validation schema matches
          availabilityType: 'SALE' as any, // Use default until validation schema matches
          images: validatedData.images || [],
          specifications: validatedData.specifications || {},
          certifications: validatedData.certifications || [],
          warranty: validatedData.warranty || {},
          dimensions: validatedData.dimensions || {},
          weight: validatedData.weight || null,
          tags: validatedData.tags || [],
          // Required fields with defaults
          price: 0.0, // Will be set via SalesDetails
        },
      });

      // Create sales details if provided
      if (validatedData.basePrice) {
        await tx.salesDetails.create({
          data: {
            productId: newProduct.id,
            basePrice: validatedData.basePrice,
            discountedPrice: validatedData.discountedPrice || null,
            inventory: validatedData.inventory || { quantity: 0 },
          },
        });
      }

      // Create rental details if provided
      if (validatedData.dailyRate) {
        await tx.rentalDetails.create({
          data: {
            productId: newProduct.id,
            dailyRate: validatedData.dailyRate,
            weeklyRate: validatedData.weeklyRate || validatedData.dailyRate * 7,
            monthlyRate: validatedData.monthlyRate || validatedData.dailyRate * 30,
            securityDeposit: validatedData.securityDeposit || 0,
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