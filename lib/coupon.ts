import prisma from '@/lib/prisma';

export interface CouponValidation {
  isValid: boolean;
  discount: number;
  message?: string;
}

export async function validateCoupon(
  code: string, 
  userId: string, 
  subtotal: number
): Promise<CouponValidation> {
  if (!code) {
    return { isValid: false, discount: 0, message: 'No coupon provided' };
  }

  // Check for hardcoded promotional coupons
  const promotionalCoupons: Record<string, { discount: number, minOrder?: number }> = {
    'WELCOME10': { discount: 0.10, minOrder: 100 },
    'SAVE20': { discount: 0.20, minOrder: 500 },
    'BULK15': { discount: 0.15, minOrder: 1000 },
    'FIRSTORDER': { discount: 0.15 },
    'DEMO10': { discount: 0.10 }, // For testing
  };

  const upperCode = code.toUpperCase();
  
  if (promotionalCoupons[upperCode]) {
    const coupon = promotionalCoupons[upperCode];
    
    // Check minimum order requirement
    if (coupon.minOrder && subtotal < coupon.minOrder) {
      return { 
        isValid: false, 
        discount: 0, 
        message: `Minimum order of $${coupon.minOrder} required for this coupon` 
      };
    }

    // Check if it's a first-order coupon
    if (upperCode === 'FIRSTORDER') {
      const existingOrders = await prisma.order.count({
        where: { 
          userId,
          status: { not: 'CANCELLED' }
        }
      });

      if (existingOrders > 0) {
        return { 
          isValid: false, 
          discount: 0, 
          message: 'This coupon is only valid for first-time orders' 
        };
      }
    }

    return { 
      isValid: true, 
      discount: subtotal * coupon.discount,
      message: `${(coupon.discount * 100).toFixed(0)}% discount applied`
    };
  }

  // Check database for dynamic coupons (future implementation)
  // const dbCoupon = await prisma.coupon.findUnique({ where: { code: upperCode } });

  return { 
    isValid: false, 
    discount: 0, 
    message: 'Invalid coupon code' 
  };
}