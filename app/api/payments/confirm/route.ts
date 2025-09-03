import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { confirmPayment } from '@/lib/payment';

const confirmPaymentSchema = z.object({
  paymentIntentId: z.string(),
  orderId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = confirmPaymentSchema.parse(body);

    // Confirm payment
    const success = await confirmPayment(
      validatedData.paymentIntentId,
      validatedData.orderId
    );

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Payment confirmation failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment confirmed successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Payment confirmation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}