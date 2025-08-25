import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').optional(),
  nameAr: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  descriptionAr: z.string().optional(),
  category: z.string().min(1, 'Category is required').optional(),
  subcategory: z.string().optional(),
  brand: z.string().min(1, 'Brand is required').optional(),
  model: z.string().min(1, 'Model is required').optional(),
  manufacturerCountry: z.string().optional(),
  condition: z.enum(['NEW', 'REFURBISHED', 'USED_EXCELLENT', 'USED_GOOD', 'USED_FAIR']).optional(),
  availabilityType: z.enum(['SALE', 'RENT', 'BOTH']).optional(),
  images: z.array(z.string().url()).min(1, 'At least one image is required').optional(),
  specifications: z.record(z.any()).optional(),
  certifications: z.array(z.record(z.any())).optional(),
  warranty: z.record(z.any()).optional(),
  dimensions: z.record(z.any()).optional(),
  weight: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED', 'PENDING_APPROVAL']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate product ID
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Fetch product with all related data
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            companyName: true,
            yearEstablished: true,
            certifications: true,
            address: true,
          },
        },
        salesDetails: true,
        rentalDetails: {
          include: {
            rentalUnits: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        questions: {
          include: {
            answers: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profileImage: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        wishlistItems: {
          select: { userId: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Calculate average rating
    const avgRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0;

    // Format response
    const formattedProduct = {
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
      manufacturerCountry: product.manufacturerCountry,
      condition: product.condition,
      availabilityType: product.availabilityType,
      status: product.status,
      featured: product.featured,
      images: product.images,
      specifications: product.specifications,
      certifications: product.certifications,
      warranty: product.warranty,
      dimensions: product.dimensions,
      weight: product.weight,
      tags: product.tags,
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: product.reviews.length,
      questionCount: product.questions.length,
      supplier: {
        id: product.supplier.id,
        name: product.supplier.companyName,
        yearEstablished: product.supplier.yearEstablished,
        certifications: product.supplier.certifications,
        address: product.supplier.address,
      },
      pricing: {
        basePrice: product.salesDetails?.basePrice,
        discountedPrice: product.salesDetails?.discountedPrice,
        taxRate: product.salesDetails?.taxRate,
        dailyRate: product.rentalDetails?.dailyRate,
        weeklyRate: product.rentalDetails?.weeklyRate,
        monthlyRate: product.rentalDetails?.monthlyRate,
        securityDeposit: product.rentalDetails?.securityDeposit,
        deliveryFee: product.rentalDetails?.deliveryFee,
        setupFee: product.rentalDetails?.setupFee,
        minimumRentalPeriod: product.rentalDetails?.minimumRentalPeriod,
        maximumRentalPeriod: product.rentalDetails?.maximumRentalPeriod,
      },
      inventory: {
        sales: product.salesDetails?.inventory,
        rental: {
          total: product.rentalDetails?.rentalUnits.length || 0,
          available: product.rentalDetails?.rentalUnits.filter(unit => unit.status === 'AVAILABLE').length || 0,
          units: product.rentalDetails?.rentalUnits.map(unit => ({
            id: unit.id,
            serialNumber: unit.serialNumber,
            condition: unit.condition,
            status: unit.status,
            location: unit.location,
          })) || [],
        },
      },
      reviews: product.reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        verifiedPurchase: review.verifiedPurchase,
        helpful: review.helpful,
        notHelpful: review.notHelpful,
        user: {
          id: review.user.id,
          name: `${review.user.firstName} ${review.user.lastName}`,
          avatar: review.user.profileImage,
        },
        createdAt: review.createdAt,
      })),
      questions: product.questions.map(question => ({
        id: question.id,
        question: question.question,
        user: {
          id: question.user.id,
          name: `${question.user.firstName} ${question.user.lastName}`,
          avatar: question.user.profileImage,
        },
        answers: question.answers.map(answer => ({
          id: answer.id,
          answer: answer.answer,
          isSupplierAnswer: answer.isSupplierAnswer,
          helpful: answer.helpful,
          user: {
            id: answer.user.id,
            name: `${answer.user.firstName} ${answer.user.lastName}`,
            avatar: answer.user.profileImage,
          },
          createdAt: answer.createdAt,
        })),
        createdAt: question.createdAt,
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: formattedProduct,
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        supplier: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check user permissions
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has permission to update this product
    const canUpdate = await checkProductUpdatePermission(
      userId,
      userType || '',
      existingProduct.supplierId,
      existingProduct.supplier?.userId
    );

    if (!canUpdate) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to update this product' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: {
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
        certifications: validatedData.certifications,
        warranty: validatedData.warranty,
        dimensions: validatedData.dimensions,
        weight: validatedData.weight,
        tags: validatedData.tags,
        featured: validatedData.featured,
        status: validatedData.status,
      },
      include: {
        supplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedProduct.id,
        sku: updatedProduct.sku,
        name: updatedProduct.name,
        message: 'Product updated successfully',
      },
    });

  } catch (error) {
    console.error('Error updating product:', error);
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate product ID
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // TODO: Check if user has permission to delete this product
    // For now, allowing all deletions

    // Soft delete by setting status to DISCONTINUED
    await prisma.product.update({
      where: { id },
      data: { status: 'DISCONTINUED' },
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to check product update permissions
async function checkProductUpdatePermission(
  userId: string,
  userType: string,
  productSupplierId: string,
  supplierUserId?: string
): Promise<boolean> {
  // Admins can update any product
  if (userType === 'ADMIN') {
    return true;
  }

  // Suppliers can only update their own products
  if (userType === 'EQUIPMENT_SUPPLIER') {
    // Check if the user is the supplier of this product
    if (supplierUserId === userId) {
      return true;
    }

    // Also check by supplier profile
    const supplierProfile = await prisma.equipmentSupplier.findFirst({
      where: {
        userId: userId,
        id: productSupplierId,
      },
    });

    return !!supplierProfile;
  }

  // Customer service can update certain fields (like status)
  if (userType === 'CUSTOMER_SERVICE') {
    return true; // Allow CS to make limited updates
  }

  // Other user types cannot update products
  return false;
}