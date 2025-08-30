import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { AuthMiddleware } from '@/server/middleware/auth.middleware';

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
    const searchParams = request.nextUrl.searchParams;
    const queryParams: any = {};
    
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // Validate query parameters
    const validatedParams = productQuerySchema.parse(queryParams);
    
    // Build where clause
    const where: any = {};
    
    if (validatedParams.category) {
      where.category = validatedParams.category;
    }
    
    if (validatedParams.condition) {
      where.condition = validatedParams.condition;
    }
    
    if (validatedParams.availabilityType) {
      where.availabilityType = validatedParams.availabilityType;
    }
    
    if (validatedParams.search) {
      where.OR = [
        { name: { contains: validatedParams.search, mode: 'insensitive' } },
        { nameAr: { contains: validatedParams.search, mode: 'insensitive' } },
        { description: { contains: validatedParams.search, mode: 'insensitive' } },
        { brand: { contains: validatedParams.search, mode: 'insensitive' } },
        { model: { contains: validatedParams.search, mode: 'insensitive' } },
      ];
    }

    // Add status filter to only show active products
    where.status = 'ACTIVE';

    // Calculate pagination
    const skip = (validatedParams.page - 1) * validatedParams.limit;
    const take = validatedParams.limit;

    // Build orderBy
    const orderBy: any = {};
    if (validatedParams.sortBy === 'price') {
      orderBy.salesDetails = { basePrice: validatedParams.sortOrder };
    } else {
      orderBy[validatedParams.sortBy] = validatedParams.sortOrder;
    }

    // Fetch products with related data
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          salesDetails: true,
          rentalDetails: true,
          supplier: {
            select: {
              id: true,
              companyName: true,
              rating: true,
              verificationStatus: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate average ratings
    const productsWithRatings = products.map(product => {
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0;
      
      // Filter price based on availability type
      let price = null;
      if (product.availabilityType === 'SALE' || product.availabilityType === 'BOTH') {
        price = product.salesDetails?.discountedPrice || product.salesDetails?.basePrice;
      } else if (product.availabilityType === 'RENT') {
        price = product.rentalDetails?.dailyRate;
      }

      // Apply price filter
      if (validatedParams.minPrice && price && price < validatedParams.minPrice) {
        return null;
      }
      if (validatedParams.maxPrice && price && price > validatedParams.maxPrice) {
        return null;
      }

      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        nameAr: product.nameAr,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory,
        brand: product.brand,
        model: product.model,
        condition: product.condition,
        availabilityType: product.availabilityType,
        images: product.images,
        price,
        rating: avgRating,
        reviewCount: product.reviews.length,
        supplier: product.supplier,
        inStock: product.salesDetails?.inventory?.quantity > 0 || 
                 product.rentalDetails?.inventory?.available > 0,
      };
    }).filter(Boolean);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / validatedParams.limit);
    const hasNextPage = validatedParams.page < totalPages;
    const hasPreviousPage = validatedParams.page > 1;

    return NextResponse.json({
      success: true,
      data: {
        products: productsWithRatings,
        pagination: {
          page: validatedParams.page,
          limit: validatedParams.limit,
          total: totalCount,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
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

async function createProductHandler(request: NextRequest) {
  try {
    // Get authenticated user
    const user = (request as any).user;
    
    // Verify user is a supplier or admin
    if (user.userType !== 'EQUIPMENT_SUPPLIER' && user.userType !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only suppliers can create products' },
        { status: 403 }
      );
    }
    
    // Get supplier profile
    const supplierProfile = await prisma.equipmentSupplier.findUnique({
      where: { userId: user.id }
    });
    
    if (!supplierProfile && user.userType === 'EQUIPMENT_SUPPLIER') {
      return NextResponse.json(
        { success: false, error: 'Supplier profile not found' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    
    // Validate request body
    const validatedData = createProductSchema.parse(body);
    
    // Use supplier ID from profile or admin override
    const supplierId = supplierProfile?.id || body.supplierId;
    
    if (!supplierId) {
      return NextResponse.json(
        { success: false, error: 'Supplier ID is required' },
        { status: 400 }
      );
    }
    
    // Generate unique SKU
    const sku = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
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
          status: 'ACTIVE',
        },
      });

      // Create sales details if product is for sale
      if (validatedData.availabilityType === 'SALE' || validatedData.availabilityType === 'BOTH') {
        if (!validatedData.basePrice) {
          throw new Error('Base price is required for sales products');
        }
        
        await tx.salesProduct.create({
          data: {
            productId: newProduct.id,
            basePrice: validatedData.basePrice,
            discountedPrice: validatedData.discountedPrice,
            taxRate: validatedData.taxRate || 0,
            currency: 'USD',
            inventory: validatedData.inventory || { 
              quantity: 0,
              reserved: 0,
              available: 0,
              warehouse: 'main'
            },
            shippingDetails: {
              weight: validatedData.weight,
              dimensions: validatedData.dimensions,
              shippingClass: 'standard'
            },
          },
        });
      }

      // Create rental details if product is for rent
      if (validatedData.availabilityType === 'RENT' || validatedData.availabilityType === 'BOTH') {
        if (!validatedData.dailyRate) {
          throw new Error('Daily rate is required for rental products');
        }
        
        await tx.rentalProduct.create({
          data: {
            productId: newProduct.id,
            dailyRate: validatedData.dailyRate,
            weeklyRate: validatedData.weeklyRate || validatedData.dailyRate * 6,
            monthlyRate: validatedData.monthlyRate || validatedData.dailyRate * 25,
            securityDeposit: validatedData.securityDeposit || validatedData.dailyRate * 10,
            currency: 'USD',
            minimumRentalPeriod: validatedData.minimumRentalPeriod || 1,
            maximumRentalPeriod: 365,
            inventory: { 
              total: 1,
              available: 1,
              rented: 0,
              maintenance: 0
            },
            rentalTerms: {
              cancellation: 'Free cancellation up to 24 hours before rental',
              damage: 'Customer responsible for damage beyond normal wear',
              late: 'Late fee of 150% daily rate per day'
            },
            maintenanceSchedule: {
              lastMaintenance: new Date().toISOString(),
              nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
              frequency: 'quarterly'
            },
          },
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'PRODUCT_CREATED',
          entityType: 'PRODUCT',
          entityId: newProduct.id,
          changes: {
            name: validatedData.name,
            category: validatedData.category,
            supplierId,
            sku: newProduct.sku,
          },
        },
      });

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

  } catch (error: any) {
    console.error('Error creating product:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    if (error.message) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// Export the POST handler with authentication
export const POST = AuthMiddleware.withAuth(createProductHandler, {
  roles: ['EQUIPMENT_SUPPLIER', 'ADMIN']
});