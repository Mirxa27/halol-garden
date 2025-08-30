import { prisma } from '../config/database';
import { CouponType, CouponStatus, UserType } from '@prisma/client';
import { CacheService } from '../config/redis';

interface ValidateCouponParams {
  code: string;
  userId: string;
  orderAmount: number;
  products?: Array<{ id: string; category: string; quantity: number; price: number }>;
}

interface CouponValidationResult {
  valid: boolean;
  coupon?: any;
  discountAmount?: number;
  error?: string;
}

export class CouponService {
  private static readonly CACHE_PREFIX = 'coupon:';
  private static readonly CACHE_TTL = 300; // 5 minutes

  /**
   * Validate a coupon code for a specific order
   */
  static async validateCoupon(params: ValidateCouponParams): Promise<CouponValidationResult> {
    const { code, userId, orderAmount, products = [] } = params;

    try {
      // Check cache first
      const cacheKey = `${this.CACHE_PREFIX}${code}`;
      const cached = await CacheService.get(cacheKey);
      
      let coupon;
      if (cached) {
        coupon = JSON.parse(cached);
      } else {
        // Fetch from database
        coupon = await prisma.coupon.findUnique({
          where: { code: code.toUpperCase() },
          include: {
            usages: {
              where: { userId },
            },
          },
        });

        if (coupon) {
          // Cache the coupon
          await CacheService.set(cacheKey, JSON.stringify(coupon), this.CACHE_TTL);
        }
      }

      if (!coupon) {
        return { valid: false, error: 'Invalid coupon code' };
      }

      // Check coupon status
      if (coupon.status !== CouponStatus.ACTIVE) {
        return { valid: false, error: 'Coupon is not active' };
      }

      // Check validity dates
      const now = new Date();
      if (coupon.validFrom > now) {
        return { valid: false, error: 'Coupon is not yet valid' };
      }
      if (coupon.validUntil && coupon.validUntil < now) {
        return { valid: false, error: 'Coupon has expired' };
      }

      // Check usage limits
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return { valid: false, error: 'Coupon usage limit reached' };
      }

      // Check user-specific usage limit
      if (coupon.usageLimitPerUser) {
        const userUsageCount = coupon.usages?.length || 0;
        if (userUsageCount >= coupon.usageLimitPerUser) {
          return { valid: false, error: 'You have already used this coupon the maximum number of times' };
        }
      }

      // Check minimum purchase requirement
      if (coupon.minimumPurchase && orderAmount < coupon.minimumPurchase) {
        return { 
          valid: false, 
          error: `Minimum purchase of $${coupon.minimumPurchase} required for this coupon` 
        };
      }

      // Check user type restrictions
      if (coupon.userTypes && coupon.userTypes.length > 0) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { userType: true },
        });

        if (!user || !coupon.userTypes.includes(user.userType)) {
          return { valid: false, error: 'This coupon is not available for your account type' };
        }
      }

      // Check product/category restrictions
      if (products.length > 0) {
        if (coupon.products && coupon.products.length > 0) {
          const eligibleProducts = products.filter(p => coupon.products.includes(p.id));
          if (eligibleProducts.length === 0) {
            return { valid: false, error: 'No eligible products in cart for this coupon' };
          }
        }

        if (coupon.categories && coupon.categories.length > 0) {
          const eligibleProducts = products.filter(p => coupon.categories.includes(p.category));
          if (eligibleProducts.length === 0) {
            return { valid: false, error: 'No products from eligible categories in cart' };
          }
        }
      }

      // Calculate discount amount
      let discountAmount = 0;
      switch (coupon.type) {
        case CouponType.PERCENTAGE:
          discountAmount = (orderAmount * coupon.value) / 100;
          if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) {
            discountAmount = coupon.maximumDiscount;
          }
          break;

        case CouponType.FIXED_AMOUNT:
          discountAmount = Math.min(coupon.value, orderAmount);
          break;

        case CouponType.FREE_SHIPPING:
          // This will be handled separately in the order calculation
          discountAmount = 0;
          break;

        case CouponType.BUY_X_GET_Y:
          // Complex logic for BOGO deals
          discountAmount = this.calculateBOGODiscount(coupon, products);
          break;
      }

      return {
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          description: coupon.description,
        },
        discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
      };
    } catch (error) {
      console.error('Coupon validation error:', error);
      return { valid: false, error: 'Failed to validate coupon' };
    }
  }

  /**
   * Apply a coupon to an order
   */
  static async applyCoupon(couponId: string, userId: string, orderId: string, discountAmount: number) {
    try {
      // Create usage record
      await prisma.couponUsage.create({
        data: {
          couponId,
          userId,
          orderId,
          discountAmount,
        },
      });

      // Update usage count
      await prisma.coupon.update({
        where: { id: couponId },
        data: {
          usageCount: { increment: 1 },
        },
      });

      // Invalidate cache
      const coupon = await prisma.coupon.findUnique({
        where: { id: couponId },
        select: { code: true },
      });
      if (coupon) {
        await CacheService.del(`${this.CACHE_PREFIX}${coupon.code}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to apply coupon:', error);
      throw new Error('Failed to apply coupon to order');
    }
  }

  /**
   * Create a new coupon
   */
  static async createCoupon(data: {
    code: string;
    type: CouponType;
    value: number;
    description?: string;
    minimumPurchase?: number;
    maximumDiscount?: number;
    usageLimit?: number;
    usageLimitPerUser?: number;
    validFrom?: Date;
    validUntil?: Date;
    categories?: string[];
    products?: string[];
    userTypes?: UserType[];
    createdBy?: string;
  }) {
    try {
      const coupon = await prisma.coupon.create({
        data: {
          ...data,
          code: data.code.toUpperCase(),
          status: CouponStatus.ACTIVE,
        },
      });

      return coupon;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('Coupon code already exists');
      }
      throw error;
    }
  }

  /**
   * Get all active coupons for admin
   */
  static async getAllCoupons(filters?: {
    status?: CouponStatus;
    type?: CouponType;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const coupons = await prisma.coupon.findMany({
      where,
      include: {
        _count: {
          select: { usages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return coupons;
  }

  /**
   * Update coupon status
   */
  static async updateCouponStatus(couponId: string, status: CouponStatus) {
    const coupon = await prisma.coupon.update({
      where: { id: couponId },
      data: { status },
    });

    // Invalidate cache
    await CacheService.del(`${this.CACHE_PREFIX}${coupon.code}`);

    return coupon;
  }

  /**
   * Get coupon statistics
   */
  static async getCouponStats(couponId: string) {
    const [coupon, usages, revenue] = await Promise.all([
      prisma.coupon.findUnique({
        where: { id: couponId },
      }),
      prisma.couponUsage.findMany({
        where: { couponId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          order: {
            select: {
              orderNumber: true,
              total: true,
              status: true,
            },
          },
        },
        orderBy: { usedAt: 'desc' },
      }),
      prisma.couponUsage.aggregate({
        where: { couponId },
        _sum: { discountAmount: true },
        _count: true,
      }),
    ]);

    return {
      coupon,
      usages,
      stats: {
        totalUsages: revenue._count,
        totalDiscountGiven: revenue._sum.discountAmount || 0,
        averageDiscount: revenue._count > 0 
          ? (revenue._sum.discountAmount || 0) / revenue._count 
          : 0,
      },
    };
  }

  /**
   * Calculate BOGO discount
   */
  private static calculateBOGODiscount(coupon: any, products: any[]): number {
    // Parse BOGO configuration from metadata
    const config = coupon.metadata || { buyQuantity: 1, getQuantity: 1, getPercentOff: 100 };
    
    let discount = 0;
    const eligibleProducts = products.filter(p => 
      (!coupon.products || coupon.products.length === 0 || coupon.products.includes(p.id)) &&
      (!coupon.categories || coupon.categories.length === 0 || coupon.categories.includes(p.category))
    );

    eligibleProducts.forEach(product => {
      const sets = Math.floor(product.quantity / (config.buyQuantity + config.getQuantity));
      const freeItems = sets * config.getQuantity;
      discount += freeItems * product.price * (config.getPercentOff / 100);
    });

    return discount;
  }

  /**
   * Expire outdated coupons (run as cron job)
   */
  static async expireOutdatedCoupons() {
    const now = new Date();
    
    const updated = await prisma.coupon.updateMany({
      where: {
        status: CouponStatus.ACTIVE,
        validUntil: {
          lt: now,
        },
      },
      data: {
        status: CouponStatus.EXPIRED,
      },
    });

    return updated.count;
  }

  /**
   * Get user's available coupons
   */
  static async getUserAvailableCoupons(userId: string, orderAmount?: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true },
    });

    if (!user) {
      return [];
    }

    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        status: CouponStatus.ACTIVE,
        validFrom: { lte: now },
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } },
        ],
        AND: [
          {
            OR: [
              { userTypes: { isEmpty: true } },
              { userTypes: { has: user.userType } },
            ],
          },
          {
            OR: [
              { minimumPurchase: null },
              { minimumPurchase: { lte: orderAmount || 0 } },
            ],
          },
        ],
      },
      include: {
        usages: {
          where: { userId },
        },
      },
    });

    // Filter out coupons that have reached usage limits
    return coupons.filter(coupon => {
      // Check global usage limit
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return false;
      }

      // Check user-specific usage limit
      if (coupon.usageLimitPerUser && coupon.usages.length >= coupon.usageLimitPerUser) {
        return false;
      }

      return true;
    });
  }
}

export default CouponService;