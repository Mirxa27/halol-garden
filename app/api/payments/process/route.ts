import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Stripe from 'stripe';

// Payment validation schema
const paymentSchema = z.object({
  paymentMethod: z.string(),
  amount: z.number().min(0.01),
  currency: z.string().default('USD'),
  customerEmail: z.string().email().optional(),
  description: z.string().optional(),
});

// Initialize Stripe
const stripe = new Stripe(process.env['STRIPE_SECRET_KEY'] || '', {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = paymentSchema.parse(body);

    const { paymentMethod, amount, currency, customerEmail, description } = validatedData;

    // Process payment based on method
    switch (paymentMethod) {
      case 'credit_card':
      case 'stripe': {
        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toLowerCase(),
          customer_email: customerEmail,
          description: description || 'Medical Device Purchase',
          automatic_payment_methods: {
            enabled: true,
          },
        });

        return NextResponse.json({
          success: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        });
      }

      case 'myfatoorah': {
        // MyFatoorah integration for Middle East payments
        const myFatoorahResponse = await processMyFatoorahPayment({
          amount,
          currency,
          customerEmail,
          description,
        });

        return NextResponse.json({
          success: true,
          redirectUrl: myFatoorahResponse.redirectUrl,
          paymentId: myFatoorahResponse.paymentId,
        });
      }

      case 'bank_transfer': {
        // Handle bank transfer
        return NextResponse.json({
          success: true,
          message: 'Bank transfer instructions sent to your email',
          bankDetails: {
            accountNumber: 'IBAN-XXXX-XXXX-XXXX',
            bankName: 'Medical Devices Bank',
            reference: `PAY-${Date.now()}`,
          },
        });
      }

      case 'cash_on_delivery': {
        // Handle COD
        return NextResponse.json({
          success: true,
          message: 'Order confirmed for cash on delivery',
          orderNumber: `COD-${Date.now()}`,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported payment method' },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Handle Stripe errors
      if (error.message.includes('stripe')) {
        return NextResponse.json(
          { success: false, error: 'Payment gateway error' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}

// MyFatoorah payment processing
async function processMyFatoorahPayment(data: {
  amount: number;
  currency: string;
  customerEmail?: string;
  description?: string;
}) {
  const apiKey = process.env['MYFATOORAH_API_KEY'];
  const apiUrl = 'https://apitest.myfatoorah.com/v2/ExecutePayment'; // Use production URL in production

  if (!apiKey) {
    throw new Error('MyFatoorah API key not configured');
  }

  const paymentData = {
    PaymentMethodId: 2, // Credit card
    InvoiceValue: data.amount,
    CurrencyIso: data.currency,
    CustomerName: data.customerEmail?.split('@')[0] || 'Customer',
    CustomerEmail: data.customerEmail,
    InvoiceItems: [
      {
        ItemName: data.description || 'Medical Device',
        Quantity: 1,
        UnitPrice: data.amount,
      },
    ],
    CallBackUrl: `${process.env['NEXT_PUBLIC_APP_URL']}/payment/callback`,
    ErrorUrl: `${process.env['NEXT_PUBLIC_APP_URL']}/payment/error`,
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(paymentData),
  });

  if (!response.ok) {
    throw new Error('MyFatoorah payment creation failed');
  }

  const result = await response.json();

  return {
    redirectUrl: result.Data.InvoiceURL,
    paymentId: result.Data.InvoiceId,
  };
}

// PayPal integration would go here
async function processPayPalPayment(data: {
  amount: number;
  currency: string;
  description?: string;
}) {
  // PayPal SDK integration
  // This would require PayPal's REST API implementation
  throw new Error('PayPal integration not yet implemented');
}