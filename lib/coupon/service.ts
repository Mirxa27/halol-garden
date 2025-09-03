import prisma from '@/lib/prisma';
import { z } from 'zod';

// Coupon types and interfaces
export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  FREE_SHIPPING = 'free_shipping',
  BUY_ONE_GET_ONE = 'bogo'
}

export enum CouponStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  USED_UP = 'used_up'
}

export interface CouponData {
  id: string;
  code: string;
  name: string;
  description: string;
  type: CouponType;
  value: number; // Percentage (1-100) or fixed amount
  maxDiscount?: number; // Maximum discount for percentage coupons
  minimumAmount?: number; // Minimum order amount
  maxUsage?: number; // Maximum total usage
  maxUsagePerUser?: number; // Maximum usage per user
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  status: CouponStatus;
  applicableCategories?: string[]; // Product categories
  applicableProducts?: string[]; // Specific product IDs
  excludedCategories?: string[];
  excludedProducts?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Validation schemas
const couponValidationSchema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, hyphens, and underscores'),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  type: z.nativeEnum(CouponType),
  value: z.number().positive(),
  maxDiscount: z.number().positive().optional(),
  minimumAmount: z.number().min(0).optional(),
  maxUsage: z.number().positive().optional(),
  maxUsagePerUser: z.number().positive().optional(),
  validFrom: z.date(),
  validUntil: z.date(),
  applicableCategories: z.array(z.string()).optional(),
  applicableProducts: z.array(z.string()).optional(),
  excludedCategories: z.array(z.string()).optional(),
  excludedProducts: z.array(z.string()).optional(),
});

export class CouponService {
  /**
   * Create a new coupon
   */
  static async createCoupon(data: Omit<CouponData, 'id' | 'usedCount' | 'status' | 'createdAt' | 'updatedAt'>): Promise<CouponData> {
    // Validate input
    const validatedData = couponValidationSchema.parse(data);
    
    // Check if code already exists
    const existingCoupon = await this.getCouponByCode(data.code);
    if (existingCoupon) {
      throw new Error('Coupon code already exists');
    }

    // Store in database as system setting
    const couponData: CouponData = {
      id: `coupon_${Date.now()}`,
      ...validatedData,
      usedCount: 0,
      status: CouponStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await prisma.systemSetting.create({
      data: {
        key: `coupon_${data.code.toLowerCase()}`,
        value: couponData as any,
        type: 'JSON',
        description: `Coupon: ${data.name}`,
      }
    });

    return couponData;
  }

  /**
   * Get coupon by code
   */
  static async getCouponByCode(code: string): Promise<CouponData | null> {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: `coupon_${code.toLowerCase()}` }
      });
      
      if (!setting) {
        return null;
      }
      
      return setting.value as CouponData;
    } catch (error) {
      console.error('Error fetching coupon:', error);
      return null;
    }
  }

  /**
   * Validate coupon for a specific order
   */
  static async validateCoupon(
    code: string, 
    orderTotal: number, 
    userId: string,
    cartItems?: Array<{ productId: string; quantity: number; price: number; category?: string }>
  ): Promise<{
    valid: boolean;
    discount: number;
    discountType: 'amount' | 'percentage' | 'free_shipping';
    error?: string;
    coupon?: CouponData;
  }> {
    try {
      const coupon = await this.getCouponByCode(code);
      
      if (!coupon) {
        return { valid: false, discount: 0, discountType: 'amount', error: 'Invalid coupon code' };
      }

      // Check if coupon is active
      if (coupon.status !== CouponStatus.ACTIVE) {
        return { valid: false, discount: 0, discountType: 'amount', error: 'Coupon is no longer active' };
      }

      // Check validity dates
      const now = new Date();
      if (now < coupon.validFrom) {
        return { valid: false, discount: 0, discountType: 'amount', error: 'Coupon is not yet valid' };
      }
      
      if (now > coupon.validUntil) {
        return { valid: false, discount: 0, discountType: 'amount', error: 'Coupon has expired' };
      }

      // Check minimum order amount
      if (coupon.minimumAmount && orderTotal < coupon.minimumAmount) {
        return { 
          valid: false, 
          discount: 0, 
          discountType: 'amount', 
          error: `Minimum order amount of $${coupon.minimumAmount.toFixed(2)} required` 
        };
      }

      // Check maximum usage
      if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) {
        return { valid: false, discount: 0, discountType: 'amount', error: 'Coupon usage limit exceeded' };
      }

      // Check usage per user
      if (coupon.maxUsagePerUser) {
        const userUsageCount = await this.getUserCouponUsage(userId, code);
        if (userUsageCount >= coupon.maxUsagePerUser) {
          return { valid: false, discount: 0, discountType: 'amount', error: 'You have reached the usage limit for this coupon' };
        }
      }

      // Check product/category restrictions
      if (cartItems && (coupon.applicableCategories || coupon.applicableProducts || coupon.excludedCategories || coupon.excludedProducts)) {
        const isApplicable = this.checkProductApplicability(cartItems, coupon);
        if (!isApplicable) {
          return { valid: false, discount: 0, discountType: 'amount', error: 'This coupon is not applicable to items in your cart' };
        }
      }

      // Calculate discount
      const discountResult = this.calculateDiscount(coupon, orderTotal, cartItems);
      
      return {
        valid: true,
        discount: discountResult.discount,
        discountType: discountResult.type,
        coupon
      };
    } catch (error) {
      console.error('Coupon validation error:', error);
      return { valid: false, discount: 0, discountType: 'amount', error: 'Failed to validate coupon' };
    }
  }

  /**
   * Apply coupon to order (mark as used)
   */
  static async applyCoupon(code: string, userId: string, orderId: string): Promise<void> {
    const coupon = await this.getCouponByCode(code);
    if (!coupon) {
      throw new Error('Coupon not found');
    }

    // Increment usage count
    coupon.usedCount += 1;
    coupon.updatedAt = new Date();

    // Update status if max usage reached
    if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) {
      coupon.status = CouponStatus.USED_UP;
    }

    // Update in database
    await prisma.systemSetting.update({
      where: { key: `coupon_${code.toLowerCase()}` },
      data: { 
        value: coupon as any,
      }
    });

    // Create usage record
    await prisma.systemSetting.create({
      data: {
        key: `coupon_usage_${userId}_${code}_${orderId}`,
        value: {
          userId,
          couponCode: code,
          orderId,
          usedAt: new Date(),
        } as any,
        type: 'JSON',
        description: `Coupon usage record`,
      }
    });
  }

  /**
   * Get user's coupon usage count
   */
  static async getUserCouponUsage(userId: string, couponCode: string): Promise<number> {
    try {
      const usageRecords = await prisma.systemSetting.findMany({
        where: {
          key: {
            startsWith: `coupon_usage_${userId}_${couponCode}_`
          }
        }
      });
      
      return usageRecords.length;
    } catch (error) {
      console.error('Error getting user coupon usage:', error);
      return 0;
    }
  }

  /**
   * List all coupons
   */
  static async listCoupons(filters?: {
    status?: CouponStatus;
    type?: CouponType;
    search?: string;
  }): Promise<CouponData[]> {
    try {
      const settings = await prisma.systemSetting.findMany({
        where: {
          key: {
            startsWith: 'coupon_'
          },
          NOT: {
            key: {
              startsWith: 'coupon_usage_'
            }
          }
        }
      });

      let coupons: CouponData[] = settings.map(setting => setting.value as CouponData);

      // Apply filters
      if (filters?.status) {
        coupons = coupons.filter(coupon => coupon.status === filters.status);
      }
      
      if (filters?.type) {
        coupons = coupons.filter(coupon => coupon.type === filters.type);
      }
      
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        coupons = coupons.filter(coupon => 
          coupon.code.toLowerCase().includes(search) ||
          coupon.name.toLowerCase().includes(search) ||
          coupon.description.toLowerCase().includes(search)
        );
      }

      return coupons.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error listing coupons:', error);
      return [];
    }
  }

  /**
   * Update coupon
   */
  static async updateCoupon(code: string, updates: Partial<CouponData>): Promise<CouponData | null> {
    const coupon = await this.getCouponByCode(code);
    if (!coupon) {
      return null;
    }

    const updatedCoupon = {
      ...coupon,
      ...updates,
      updatedAt: new Date(),
    };

    await prisma.systemSetting.update({
      where: { key: `coupon_${code.toLowerCase()}` },
      data: { 
        value: updatedCoupon as any,
      }
    });

    return updatedCoupon;
  }

  /**
   * Delete coupon
   */
  static async deleteCoupon(code: string): Promise<boolean> {
    try {
      await prisma.systemSetting.delete({
        where: { key: `coupon_${code.toLowerCase()}` }
      });
      return true;
    } catch (error) {
      console.error('Error deleting coupon:', error);
      return false;
    }
  }

  /**
   * Check if coupon is applicable to cart items
   */
  private static checkProductApplicability(
    cartItems: Array<{ productId: string; quantity: number; price: number; category?: string }>,
    coupon: CouponData
  ): boolean {
    // If specific products are specified, check if any cart item matches
    if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      const hasApplicableProduct = cartItems.some(item => 
        coupon.applicableProducts!.includes(item.productId)
      );
      if (!hasApplicableProduct) return false;
    }

    // If categories are specified, check if any cart item matches
    if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
      const hasApplicableCategory = cartItems.some(item => 
        item.category && coupon.applicableCategories!.includes(item.category)
      );
      if (!hasApplicableCategory) return false;
    }

    // Check excluded products
    if (coupon.excludedProducts && coupon.excludedProducts.length > 0) {
      const hasExcludedProduct = cartItems.some(item => 
        coupon.excludedProducts!.includes(item.productId)
      );
      if (hasExcludedProduct) return false;
    }

    // Check excluded categories
    if (coupon.excludedCategories && coupon.excludedCategories.length > 0) {
      const hasExcludedCategory = cartItems.some(item => 
        item.category && coupon.excludedCategories!.includes(item.category)
      );
      if (hasExcludedCategory) return false;
    }

    return true;
  }

  /**
   * Calculate discount amount
   */
  private static calculateDiscount(
    coupon: CouponData, 
    orderTotal: number,
    cartItems?: Array<{ productId: string; quantity: number; price: number; category?: string }>
  ): { discount: number; type: 'amount' | 'percentage' | 'free_shipping' } {
    switch (coupon.type) {
      case CouponType.PERCENTAGE:
        let discount = orderTotal * (coupon.value / 100);
        if (coupon.maxDiscount) {
          discount = Math.min(discount, coupon.maxDiscount);
        }
        return { discount, type: 'percentage' };

      case CouponType.FIXED:
        return { 
          discount: Math.min(coupon.value, orderTotal), 
          type: 'amount' 
        };

      case CouponType.FREE_SHIPPING:
        // This would need to be handled in the shipping calculation
        return { discount: 0, type: 'free_shipping' };

      case CouponType.BUY_ONE_GET_ONE:
        // Implement BOGO logic based on cart items
        if (!cartItems) return { discount: 0, type: 'amount' };
        
        // Simple BOGO: get cheapest item free for every 2 items
        const applicableItems = cartItems.filter(item => 
          !coupon.applicableProducts || coupon.applicableProducts.includes(item.productId)
        );
        
        let bogoDiscount = 0;
        for (const item of applicableItems) {
          const freeItems = Math.floor(item.quantity / 2);
          bogoDiscount += freeItems * item.price;
        }
        
        return { discount: bogoDiscount, type: 'amount' };

      default:
        return { discount: 0, type: 'amount' };
    }
  }

  /**
   * Create default coupons for demo
   */
  static async createDefaultCoupons(adminUserId: string): Promise<void> {
    const defaultCoupons = [
      {
        code: 'WELCOME10',
        name: 'Welcome Discount',
        description: '10% off your first order',
        type: CouponType.PERCENTAGE,
        value: 10,
        maxDiscount: 100,
        minimumAmount: 50,
        maxUsagePerUser: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        createdBy: adminUserId,
      },
      {
        code: 'SAVE20',
        name: 'Save $20',
        description: '$20 off orders over $200',
        type: CouponType.FIXED,
        value: 20,
        minimumAmount: 200,
        maxUsage: 1000,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        createdBy: adminUserId,
      },
      {
        code: 'FREESHIP',
        name: 'Free Shipping',
        description: 'Free shipping on all orders',
        type: CouponType.FREE_SHIPPING,
        value: 0,
        minimumAmount: 100,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdBy: adminUserId,
      }
    ];

    for (const couponData of defaultCoupons) {
      try {
        const existing = await this.getCouponByCode(couponData.code);
        if (!existing) {
          await this.createCoupon(couponData);
          console.log(`Created default coupon: ${couponData.code}`);
        }
      } catch (error) {
        console.error(`Error creating default coupon ${couponData.code}:`, error);
      }
    }
  }
}