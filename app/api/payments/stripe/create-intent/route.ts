import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { createPaymentIntent } from '@/lib/payment/stripe';
import { z } from 'zod';

const schema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('usd'),
  orderId: z.string(),
  metadata: z.record(z.string()).optional()
});

export const POST = withAuth(
  async (req: any) => {
    try {
      const body = await req.json();
      const validation = schema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Validation failed',
            errors: validation.error.flatten().fieldErrors
          },
          { status: 400 }
        );
      }
      
      const { amount, currency, orderId, metadata } = validation.data;
      
      // Create payment intent
      const paymentIntent = await createPaymentIntent(
        amount,
        currency,
        {
          ...metadata,
          orderId,
          userId: req.user.id
        }
      );
      
      return NextResponse.json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency
        }
      });
      
    } catch (error) {
      console.error('Create payment intent error:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to create payment intent',
          error: process.env.NODE_ENV === 'development' ? error : undefined
        },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);