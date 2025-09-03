import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CouponService } from '@/lib/coupon/service';
import { requireAuth } from '@/lib/auth/session';

const validateCouponSchema = z.object({
  code: z.string().min(1),
  orderTotal: z.number().positive(),
  cartItems: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
    price: z.number().positive(),
    category: z.string().optional(),
  })).optional(),
});

// POST /api/coupons/validate - Validate a coupon code
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    
    const validatedData = validateCouponSchema.parse(body);
    
    const result = await CouponService.validateCoupon(
      validatedData.code,
      validatedData.orderTotal,
      user.id,
      validatedData.cartItems
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}