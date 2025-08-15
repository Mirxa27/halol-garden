import { prisma } from '../config/database';
import { 
  CacheService, 
  CacheKeys, 
  CacheTTL 
} from '../config/redis';
import {
  ProductStatus,
  ProductCondition,
  AvailabilityType,
  Prisma
} from '@prisma/client';
import {
  getPaginationParams,
  createPaginatedResult,
  buildSearchQuery,
  PaginationParams
} from '../config/database';

interface CreateProductData {
  supplierId: string;
  sku: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  category: string;
  subcategory?: string;
  brand: string;
  model: string;
  condition: ProductCondition;
  availabilityType: AvailabilityType;
  images: any[];
  specifications: any[];
  certifications: any[];
  warranty: any;
  dimensions?: any;
  weight?: number;
  tags: string[];
  salesDetails?: {
    basePrice: number;
    discountedPrice?: number;
    taxRate?: number;
    inventory: any;
    shipping: any;
  };
  rentalDetails?: {
    dailyRate: number;
    weeklyRate: number;
    monthlyRate: number;
    securityDeposit: number;
    minimumRentalPeriod: number;
    rentalTerms: any;
  };
}

interface ProductSearchParams extends PaginationParams {
  query?: string;
  category?: string;
  subcategory?: string;
  brands?: string[];
  conditions?: ProductCondition[];
  availabilityType?: AvailabilityType;
  minPrice?: number;
  maxPrice?: number;
  supplierId?: string;
  inStock?: boolean;
  featured?: boolean;
  location?: string;
  radius?: number;
}

export class ProductService {
  /**
   * Create a new product
   */
  static async createProduct(data: CreateProductData) {
    const product = await prisma.$transaction(async (tx) => {
      // Create base product
      const newProduct = await tx.product.create({
        data: {
          supplierId: data.supplierId,
          sku: data.sku,
          name: data.name,
          nameAr: data.nameAr,
          description: data.description,
          descriptionAr: data.descriptionAr,
          category: data.category,
          subcategory: data.subcategory,
          brand: data.brand,
          model: data.model,
          condition: data.condition,
          availabilityType: data.availabilityType,
          status: ProductStatus.PENDING_APPROVAL,
          images: data.images,
          specifications: data.specifications,
          certifications: data.certifications,
          warranty: data.warranty,
          dimensions: data.dimensions,
          weight: data.weight,
          tags: data.tags,
          featured: false,
        }
      });

      // Create sales details if product is for sale
      if (data.availabilityType !== AvailabilityType.RENT && data.salesDetails) {
        await tx.salesProduct.create({
          data: {
            productId: newProduct.id,
            basePrice: data.salesDetails.basePrice,
            discountedPrice: data.salesDetails.discountedPrice,
            taxRate: data.salesDetails.taxRate,
            inventory: data.salesDetails.inventory,
            shipping: data.salesDetails.shipping,
          }
        });
      }

      // Create rental details if product is for rent
      if (data.availabilityType !== AvailabilityType.SALE && data.rentalDetails) {
        await tx.rentalProduct.create({
          data: {
            productId: newProduct.id,
            dailyRate: data.rentalDetails.dailyRate,
            weeklyRate: data.rentalDetails.weeklyRate,
            monthlyRate: data.rentalDetails.monthlyRate,
            securityDeposit: data.rentalDetails.securityDeposit,
            minimumRentalPeriod: data.rentalDetails.minimumRentalPeriod,
            maximumRentalPeriod: data.rentalDetails.maximumRentalPeriod,
            inventory: data.rentalDetails.inventory,
            rentalTerms: data.rentalDetails.rentalTerms,
            maintenanceSchedule: data.rentalDetails.maintenanceSchedule,
          }
        });
      }

      return newProduct;
    });

    // Clear cache
    await CacheService.deletePattern(`${CacheKeys.PRODUCT}*`);

    return product;
  }

  /**
   * Update product
   */
  static async updateProduct(productId: string, supplierId: string, data: Partial<CreateProductData>) {
    // Verify ownership
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        supplierId: supplierId
      }
    });

    if (!existingProduct) {
      throw new Error('Product not found or unauthorized');
    }

    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Update base product
      const product = await tx.product.update({
        where: { id: productId },
        data: {
          name: data.name,
          nameAr: data.nameAr,
          description: data.description,
          descriptionAr: data.descriptionAr,
          category: data.category,
          subcategory: data.subcategory,
          brand: data.brand,
          model: data.model,
          condition: data.condition,
          images: data.images,
          specifications: data.specifications,
          certifications: data.certifications,
          warranty: data.warranty,
          dimensions: data.dimensions,
          weight: data.weight,
          tags: data.tags,
          updatedAt: new Date(),
        }
      });

      // Update sales details if provided
      if (data.salesDetails) {
        await tx.salesProduct.upsert({
          where: { productId },
          create: {
            productId,
            ...data.salesDetails
          },
          update: data.salesDetails
        });
      }

      // Update rental details if provided
      if (data.rentalDetails) {
        await tx.rentalProduct.upsert({
          where: { productId },
          create: {
            productId,
            ...data.rentalDetails
          },
          update: data.rentalDetails
        });
      }

      return product;
    });

    // Clear cache
    await CacheService.delete(`${CacheKeys.PRODUCT}${productId}`);
    await CacheService.deletePattern(`${CacheKeys.SEARCH}*`);

    return updatedProduct;
  }

  /**
   * Search products with advanced filtering
   */
  static async searchProducts(params: ProductSearchParams) {
    const cacheKey = `${CacheKeys.SEARCH}${JSON.stringify(params)}`;
    
    // Check cache
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const { page, limit, skip } = getPaginationParams(params);

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      ...(params.query && {
        OR: [
          { name: { contains: params.query, mode: 'insensitive' } },
          { nameAr: { contains: params.query, mode: 'insensitive' } },
          { description: { contains: params.query, mode: 'insensitive' } },
          { brand: { contains: params.query, mode: 'insensitive' } },
          { model: { contains: params.query, mode: 'insensitive' } },
        ]
      }),
      ...(params.category && { category: params.category }),
      ...(params.subcategory && { subcategory: params.subcategory }),
      ...(params.brands && { brand: { in: params.brands } }),
      ...(params.conditions && { condition: { in: params.conditions } }),
      ...(params.availabilityType && { availabilityType: params.availabilityType }),
      ...(params.supplierId && { supplierId: params.supplierId }),
      ...(params.featured && { featured: params.featured }),
    };

    // Add price filtering if applicable
    if (params.minPrice || params.maxPrice) {
      where.OR = [
        {
          salesDetails: {
            basePrice: {
              ...(params.minPrice && { gte: params.minPrice }),
              ...(params.maxPrice && { lte: params.maxPrice }),
            }
          }
        },
        {
          rentalDetails: {
            monthlyRate: {
              ...(params.minPrice && { gte: params.minPrice }),
              ...(params.maxPrice && { lte: params.maxPrice }),
            }
          }
        }
      ];
    }

    // Add stock filtering
    if (params.inStock) {
      where.OR = [
        {
          salesDetails: {
            inventory: {
              path: '$.availableStock',
              gte: 1
            }
          }
        },
        {
          rentalDetails: {
            inventory: {
              path: '$.availableUnits',
              gte: 1
            }
          }
        }
      ];
    }

    // Get products with count
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          salesDetails: true,
          rentalDetails: true,
          supplier: {
            select: {
              companyName: true,
              address: true,
              certifications: true,
            }
          },
          reviews: {
            select: {
              rating: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: this.getOrderBy(params.sortBy),
      }),
      prisma.product.count({ where })
    ]);

    // Calculate average ratings
    const productsWithRatings = products.map(product => ({
      ...product,
      averageRating: product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0,
      reviewCount: product.reviews.length,
    }));

    const result = createPaginatedResult(productsWithRatings, total, params);

    // Cache result
    await CacheService.set(cacheKey, result, CacheTTL.SHORT);

    return result;
  }

  /**
   * Get product by ID
   */
  static async getProductById(productId: string) {
    const cacheKey = `${CacheKeys.PRODUCT}${productId}`;
    
    // Check cache
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        salesDetails: true,
        rentalDetails: {
          include: {
            rentalUnits: {
              where: { status: 'available' }
            }
          }
        },
        supplier: {
          select: {
            id: true,
            companyName: true,
            address: true,
            certifications: true,
            yearEstablished: true,
            deliveryCapabilities: true,
            returnPolicy: true,
            warrantyTerms: true,
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                userType: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        questions: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              }
            },
            answers: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    userType: true,
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Increment view count
    await prisma.product.update({
      where: { id: productId },
      data: {
        views: { increment: 1 }
      }
    });

    // Cache result
    await CacheService.set(cacheKey, product, CacheTTL.MEDIUM);

    return product;
  }

  /**
   * Get similar products
   */
  static async getSimilarProducts(productId: string, limit: number = 6) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        category: true,
        brand: true,
        tags: true,
      }
    });

    if (!product) {
      return [];
    }

    const similarProducts = await prisma.product.findMany({
      where: {
        id: { not: productId },
        status: ProductStatus.ACTIVE,
        OR: [
          { category: product.category },
          { brand: product.brand },
        ]
      },
      include: {
        salesDetails: true,
        rentalDetails: true,
        reviews: {
          select: { rating: true }
        }
      },
      take: limit,
    });

    return similarProducts;
  }

  /**
   * Update inventory
   */
  static async updateInventory(
    productId: string, 
    quantity: number, 
    operation: 'increment' | 'decrement' | 'set'
  ) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        salesDetails: true,
      }
    });

    if (!product || !product.salesDetails) {
      throw new Error('Product not found or not available for sale');
    }

    const currentInventory = product.salesDetails.inventory as any;
    let newAvailableStock = currentInventory.availableStock;

    switch (operation) {
      case 'increment':
        newAvailableStock += quantity;
        break;
      case 'decrement':
        newAvailableStock = Math.max(0, newAvailableStock - quantity);
        break;
      case 'set':
        newAvailableStock = quantity;
        break;
    }

    const updatedInventory = {
      ...currentInventory,
      availableStock: newAvailableStock,
      totalStock: operation === 'set' ? quantity : currentInventory.totalStock,
    };

    await prisma.salesProduct.update({
      where: { productId },
      data: {
        inventory: updatedInventory
      }
    });

    // Update product status if out of stock
    if (newAvailableStock === 0) {
      await prisma.product.update({
        where: { id: productId },
        data: { status: ProductStatus.OUT_OF_STOCK }
      });
    } else if (product.status === ProductStatus.OUT_OF_STOCK) {
      await prisma.product.update({
        where: { id: productId },
        data: { status: ProductStatus.ACTIVE }
      });
    }

    // Clear cache
    await CacheService.delete(`${CacheKeys.PRODUCT}${productId}`);

    return updatedInventory;
  }

  /**
   * Add product review
   */
  static async addReview(
    productId: string,
    userId: string,
    data: {
      rating: number;
      title?: string;
      comment: string;
      pros?: string[];
      cons?: string[];
      images?: string[];
    }
  ) {
    // Check if user has purchased the product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          customerId: userId,
          status: 'COMPLETED'
        }
      }
    });

    const review = await prisma.productReview.create({
      data: {
        productId,
        userId,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        pros: data.pros || [],
        cons: data.cons || [],
        images: data.images || [],
        verifiedPurchase: !!hasPurchased,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            userType: true,
          }
        }
      }
    });

    // Clear cache
    await CacheService.delete(`${CacheKeys.PRODUCT}${productId}`);

    return review;
  }

  /**
   * Get featured products
   */
  static async getFeaturedProducts(limit: number = 8) {
    const cacheKey = `${CacheKeys.PRODUCT}featured`;
    
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const products = await prisma.product.findMany({
      where: {
        featured: true,
        status: ProductStatus.ACTIVE,
      },
      include: {
        salesDetails: true,
        rentalDetails: true,
        reviews: {
          select: { rating: true }
        }
      },
      take: limit,
      orderBy: { updatedAt: 'desc' }
    });

    await CacheService.set(cacheKey, products, CacheTTL.MEDIUM);

    return products;
  }

  /**
   * Get trending products
   */
  static async getTrendingProducts(limit: number = 8) {
    const cacheKey = `${CacheKeys.PRODUCT}trending`;
    
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get products with most orders in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendingProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _count: {
        productId: true,
      },
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: {
        _count: {
          productId: 'desc'
        }
      },
      take: limit
    });

    const productIds = trendingProducts.map(p => p.productId);

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        status: ProductStatus.ACTIVE,
      },
      include: {
        salesDetails: true,
        rentalDetails: true,
        reviews: {
          select: { rating: true }
        }
      }
    });

    await CacheService.set(cacheKey, products, CacheTTL.SHORT);

    return products;
  }

  /**
   * Helper method to get order by clause
   */
  private static getOrderBy(sortBy?: string): Prisma.ProductOrderByWithRelationInput {
    switch (sortBy) {
      case 'price_asc':
        return { salesDetails: { basePrice: 'asc' } };
      case 'price_desc':
        return { salesDetails: { basePrice: 'desc' } };
      case 'newest':
        return { createdAt: 'desc' };
      case 'rating':
        return { reviews: { _count: 'desc' } };
      case 'popularity':
        return { views: 'desc' };
      default:
        return { createdAt: 'desc' };
    }
  }

  /**
   * Bulk import products
   */
  static async bulkImportProducts(supplierId: string, products: any[]) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const productData of products) {
      try {
        await this.createProduct({
          ...productData,
          supplierId
        });
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          sku: productData.sku,
          error: error.message
        });
      }
    }

    return results;
  }
}

export default ProductService;