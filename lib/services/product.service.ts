import prisma from '@/lib/prisma';
import { 
  ProductStatus,
  ProductCategory,
  Prisma,
  Product
} from '@prisma/client';
import { AppError, ValidationError, ConflictError, NotFoundError } from '@/lib/error-handler';
import { cache } from '@/lib/cache';
import { searchProductsSchema } from '@/lib/validation/dto/product.dto';

export class ProductService {
  private static readonly CACHE_TTL = 300; // 5 minutes
  private static readonly CACHE_KEYS = {
    FEATURED: 'products:featured',
    CATEGORIES: 'products:categories',
    PRODUCT: (id: string) => `product:${id}`,
    SEARCH: (hash: string) => `products:search:${hash}`,
  };

  /**
   * Advanced product search with filtering, sorting, and caching
   */
  static async searchProducts(params: any) {
    // Validate search parameters
    const validated = searchProductsSchema.parse(params);
    
    // Generate cache key
    const cacheKey = this.CACHE_KEYS.SEARCH(
      Buffer.from(JSON.stringify(validated)).toString('base64')
    );

    // Check cache
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    // Build query
    const where: Prisma.ProductWhereInput = {
      isPublished: true,
      status: ProductStatus.ACTIVE,
    };

    // Text search
    if (validated.query) {
      where.OR = [
        { name: { contains: validated.query, mode: 'insensitive' } },
        { nameAr: { contains: validated.query, mode: 'insensitive' } },
        { description: { contains: validated.query, mode: 'insensitive' } },
        { sku: { contains: validated.query, mode: 'insensitive' } },
        { tags: { has: validated.query } },
      ];
    }

    // Category filter
    if (validated.category) {
      where.category = validated.category;
    }

    // Subcategory filter
    if (validated.subcategory) {
      where.subcategory = validated.subcategory;
    }

    // Brand filter
    if (validated.brand) {
      where.brand = validated.brand;
    }

    // Condition filter
    if (validated.condition) {
      where.condition = validated.condition;
    }

    // Availability filter
    if (validated.availabilityType) {
      where.availabilityType = validated.availabilityType;
    }

    // Stock filter
    if (validated.inStock !== undefined) {
      where.quantity = validated.inStock ? { gt: 0 } : 0;
    }

    // Featured filter
    if (validated.featured !== undefined) {
      where.featured = validated.featured;
    }

    // Supplier filter
    if (validated.supplierId) {
      where.supplierId = validated.supplierId;
    }

    // Price range filter
    const priceFilters: Prisma.ProductWhereInput[] = [];
    if (validated.minPrice !== undefined) {
      priceFilters.push({
        OR: [
          { price: { gte: validated.minPrice } },
          { salesDetails: { basePrice: { gte: validated.minPrice } } },
        ],
      });
    }
    if (validated.maxPrice !== undefined) {
      priceFilters.push({
        OR: [
          { price: { lte: validated.maxPrice } },
          { salesDetails: { basePrice: { lte: validated.maxPrice } } },
        ],
      });
    }
    if (priceFilters.length > 0) {
      where.AND = priceFilters;
    }

    // Tag filter
    if (validated.tags && validated.tags.length > 0) {
      where.tags = { hasEvery: validated.tags };
    }

    // Sorting
    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    switch (validated.sortBy) {
      case 'price':
        orderBy.price = validated.sortOrder;
        break;
      case 'name':
        orderBy.name = validated.sortOrder;
        break;
      case 'rating':
        orderBy.rating = validated.sortOrder;
        break;
      case 'salesCount':
        orderBy.salesCount = validated.sortOrder;
        break;
      default:
        orderBy.createdAt = validated.sortOrder;
    }

    // Execute query with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (validated.page - 1) * validated.limit,
        take: validated.limit,
        include: {
          supplier: {
            select: {
              id: true,
              companyName: true,
              rating: true,
              verified: true,
            },
          },
          salesDetails: true,
          rentalDetails: true,
          _count: {
            select: {
              reviews: true,
              questions: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate aggregations
    const aggregations = await this.getSearchAggregations(where);

    const result = {
      products,
      pagination: {
        page: validated.page,
        limit: validated.limit,
        total,
        totalPages: Math.ceil(total / validated.limit),
      },
      aggregations,
    };

    // Cache result
    await cache.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  /**
   * Get product details with related data
   */
  static async getProductDetails(productId: string, userId?: string) {
    const cacheKey = this.CACHE_KEYS.PRODUCT(productId);
    
    // Check cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      // Still increment view count
      await this.incrementViewCount(productId);
      return cached;
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        supplier: {
          include: {
            _count: {
              select: { products: true },
            },
          },
        },
        salesDetails: true,
        rentalDetails: {
          include: {
            rentalUnits: {
              where: { status: 'AVAILABLE' },
            },
          },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
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
        questions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            answers: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    userType: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            reviews: true,
            questions: true,
            orderItems: true,
            wishlistItems: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundError('Product');
    }

    // Check if product is viewable
    if (!product.isPublished || product.status !== ProductStatus.ACTIVE) {
      // Only supplier and admin can view unpublished products
      if (!userId || !(await this.canManageProduct(userId, product))) {
        throw new NotFoundError('Product');
      }
    }

    // Get related products
    const relatedProducts = await this.getRelatedProducts(product);

    // Get price history
    const priceHistory = await prisma.priceHistory.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Check if in user's wishlist
    const inWishlist = userId ? await this.isInWishlist(userId, productId) : false;

    // Calculate availability
    const availability = this.calculateAvailability(product);

    const result = {
      ...product,
      relatedProducts,
      priceHistory,
      inWishlist,
      availability,
    };

    // Cache result
    await cache.set(cacheKey, result, this.CACHE_TTL);

    // Increment view count
    await this.incrementViewCount(productId);

    return result;
  }

  /**
   * Create or update product with validation
   */
  static async upsertProduct(
    supplierId: string,
    productData: any,
    productId?: string
  ) {
    // Validate supplier
    const supplier = await prisma.equipmentSupplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      throw new ValidationError('Invalid supplier');
    }

    if (!supplier.verified) {
      throw new ValidationError('Supplier must be verified to add products');
    }

    // Generate SKU if not provided
    if (!productData.sku && !productId) {
      productData.sku = await this.generateSKU(productData.category);
    }

    // Validate images
    if (productData.images && productData.images.length > 0) {
      productData.images = await this.validateImages(productData.images);
    }

    // Start transaction
    return await prisma.$transaction(async (tx) => {
      let product: Product;

      if (productId) {
        // Update existing product
        const existing = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!existing) {
          throw new NotFoundError('Product');
        }

        if (existing.supplierId !== supplierId) {
          throw new ValidationError('Unauthorized to update this product');
        }

        product = await tx.product.update({
          where: { id: productId },
          data: {
            ...productData,
            updatedAt: new Date(),
          },
        });

        // Log price change
        if (productData.price && productData.price !== existing.price) {
          await tx.priceHistory.create({
            data: {
              productId,
              oldPrice: existing.price,
              newPrice: productData.price,
              reason: productData.priceChangeReason,
              changedBy: supplierId,
            },
          });
        }
      } else {
        // Create new product
        product = await tx.product.create({
          data: {
            ...productData,
            supplierId,
            views: 0,
            salesCount: 0,
            rating: 0,
          },
        });
      }

      // Handle sales details
      if (productData.salesDetails) {
        await tx.salesDetails.upsert({
          where: { productId: product.id },
          create: {
            productId: product.id,
            ...productData.salesDetails,
          },
          update: productData.salesDetails,
        });
      }

      // Handle rental details
      if (productData.rentalDetails) {
        await tx.rentalDetails.upsert({
          where: { productId: product.id },
          create: {
            productId: product.id,
            ...productData.rentalDetails,
          },
          update: productData.rentalDetails,
        });

        // Create rental units if new product
        if (!productId && productData.rentalDetails.units) {
          for (let i = 0; i < productData.rentalDetails.units; i++) {
            await tx.rentalUnit.create({
              data: {
                rentalDetailsId: product.id,
                serialNumber: `${product.sku}-${i + 1}`,
                status: 'AVAILABLE',
              },
            });
          }
        }
      }

      // Clear related caches
      await this.clearProductCaches(product.id);

      return product;
    });
  }

  /**
   * Bulk update products
   */
  static async bulkUpdateProducts(
    supplierId: string,
    updates: Array<{ productId: string; data: any }>
  ) {
    // Validate all products belong to supplier
    const productIds = updates.map(u => u.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        supplierId,
      },
    });

    if (products.length !== productIds.length) {
      throw new ValidationError('Some products not found or unauthorized');
    }

    // Execute updates in transaction
    const results = await prisma.$transaction(
      updates.map(({ productId, data }) =>
        prisma.product.update({
          where: { id: productId },
          data,
        })
      )
    );

    // Clear caches
    await Promise.all(productIds.map(id => this.clearProductCaches(id)));

    return results;
  }

  // Helper methods

  private static async getSearchAggregations(where: Prisma.ProductWhereInput) {
    const [categories, brands, priceRange] = await Promise.all([
      // Category counts
      prisma.product.groupBy({
        by: ['category'],
        where,
        _count: true,
      }),
      // Brand counts
      prisma.product.groupBy({
        by: ['brand'],
        where: { ...where, brand: { not: null } },
        _count: true,
      }),
      // Price range
      prisma.product.aggregate({
        where,
        _min: { price: true },
        _max: { price: true },
        _avg: { price: true },
      }),
    ]);

    return {
      categories: categories.map(c => ({
        category: c.category,
        count: c._count,
      })),
      brands: brands.map(b => ({
        brand: b.brand!,
        count: b._count,
      })),
      priceRange: {
        min: priceRange._min.price || 0,
        max: priceRange._max.price || 0,
        avg: priceRange._avg.price || 0,
      },
    };
  }

  private static async getRelatedProducts(product: Product) {
    return await prisma.product.findMany({
      where: {
        OR: [
          { category: product.category },
          { brand: product.brand },
          { tags: { hasSome: product.tags as string[] } },
        ],
        id: { not: product.id },
        isPublished: true,
        status: ProductStatus.ACTIVE,
      },
      take: 6,
      orderBy: [
        { rating: 'desc' },
        { salesCount: 'desc' },
      ],
      include: {
        supplier: {
          select: {
            id: true,
            companyName: true,
            rating: true,
          },
        },
      },
    });
  }

  private static calculateAvailability(product: any) {
    const inStock = product.quantity > 0;
    const lowStock = product.quantity > 0 && product.quantity <= 5;
    const availableForRent = product.rentalDetails?.rentalUnits?.length > 0;

    return {
      inStock,
      lowStock,
      availableForRent,
      quantity: product.quantity,
      nextRestockDate: product.nextRestockDate,
      estimatedDelivery: inStock ? this.calculateDeliveryDate() : null,
    };
  }

  private static calculateDeliveryDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 3); // 3 days standard delivery
    return date;
  }

  private static async incrementViewCount(productId: string) {
    await prisma.product.update({
      where: { id: productId },
      data: { views: { increment: 1 } },
    });
  }

  private static async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const item = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
    return !!item;
  }

  private static async canManageProduct(userId: string, product: Product): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        userType: true,
        supplierProfile: {
          select: { id: true },
        },
      },
    });

    if (!user) return false;
    
    if (user.userType === 'ADMIN') return true;
    
    if (user.userType === 'EQUIPMENT_SUPPLIER' && user.supplierProfile?.id === product.supplierId) {
      return true;
    }

    return false;
  }

  private static async generateSKU(category: ProductCategory): Promise<string> {
    const prefix = category.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  private static async validateImages(images: string[]): Promise<string[]> {
    // Validate image URLs and check accessibility
    const validatedImages = [];
    
    for (const image of images) {
      try {
        const url = new URL(image);
        // In production, you might want to actually fetch headers to verify
        validatedImages.push(image);
      } catch {
        console.warn(`Invalid image URL: ${image}`);
      }
    }

    if (validatedImages.length === 0) {
      throw new ValidationError('At least one valid image is required');
    }

    return validatedImages;
  }

  private static async clearProductCaches(productId: string) {
    await Promise.all([
      cache.del(this.CACHE_KEYS.PRODUCT(productId)),
      cache.del(this.CACHE_KEYS.FEATURED),
      // Clear search caches
      cache.delPattern(this.CACHE_KEYS.SEARCH('*')),
    ]);
  }
}