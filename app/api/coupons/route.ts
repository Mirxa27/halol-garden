import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CouponService, CouponType, CouponStatus } from '@/lib/coupon/service';
import { requireAdmin, requireAuth } from '@/lib/auth/session';

// Validation schemas
const createCouponSchema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, hyphens, and underscores'),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  type: z.nativeEnum(CouponType),
  value: z.number().positive(),
  maxDiscount: z.number().positive().optional(),
  minimumAmount: z.number().min(0).optional(),
  maxUsage: z.number().positive().optional(),
  maxUsagePerUser: z.number().positive().optional(),
  validFrom: z.string().transform(str => new Date(str)),
  validUntil: z.string().transform(str => new Date(str)),
  applicableCategories: z.array(z.string()).optional(),
  applicableProducts: z.array(z.string()).optional(),
  excludedCategories: z.array(z.string()).optional(),
  excludedProducts: z.array(z.string()).optional(),
});

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

// GET /api/coupons - List all coupons (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const { searchParams } = new URL(request.url);
    
    const filters = {
      status: searchParams.get('status') as CouponStatus | undefined,
      type: searchParams.get('type') as CouponType | undefined,
      search: searchParams.get('search') || undefined,
    };

    const coupons = await CouponService.listCoupons(filters);

    return NextResponse.json({
      success: true,
      coupons,
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

// POST /api/coupons - Create new coupon (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    
    const validatedData = createCouponSchema.parse(body);
    
    const coupon = await CouponService.createCoupon({
      ...validatedData,
      createdBy: user.id,
    });

    return NextResponse.json({
      success: true,
      coupon,
      message: 'Coupon created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid coupon data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Coupon code already exists') {
      return NextResponse.json(
        { success: false, error: 'Coupon code already exists' },
        { status: 409 }
      );
    }

    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
}