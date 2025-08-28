import Stripe from 'stripe';
import { PrismaClient, PaymentMethod, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Stripe
let stripe: Stripe | null = null;

async function getStripe(): Promise<Stripe> {
  if (!stripe) {
    // Try to get from database settings first
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'payment_gateways' }
      });
      
      if (setting && setting.value) {
        const config = setting.value as any;
        if (config.stripe?.secretKey) {
          stripe = new Stripe(config.stripe.secretKey, {
            apiVersion: '2024-12-18.acacia'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching Stripe config from database:', error);
    }
    
    // Fallback to environment variable
    if (!stripe) {
      const secretKey = process.env.STRIPE_SECRET_KEY;
      if (!secretKey) {
        throw new Error('Stripe secret key not configured');
      }
      stripe = new Stripe(secretKey, {
        apiVersion: '2024-12-18.acacia'
      });
    }
  }
  
  return stripe;
}

// Create payment intent
export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  const stripe = await getStripe();
  
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: currency.toLowerCase(),
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: metadata || {}
  });
}

// Create checkout session
export async function createCheckoutSession(
  orderId: string,
  items: Array<{
    name: string;
    description?: string;
    amount: number;
    quantity: number;
    images?: string[];
  }>,
  successUrl: string,
  cancelUrl: string,
  customerEmail?: string
): Promise<Stripe.Checkout.Session> {
  const stripe = await getStripe();
  
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(item => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.name,
        description: item.description,
        images: item.images
      },
      unit_amount: Math.round(item.amount * 100)
    },
    quantity: item.quantity
  }));
  
  return await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
    metadata: {
      orderId
    }
  });
}

// Process payment
export async function processStripePayment(
  orderId: string,
  paymentIntentId: string
): Promise<{
  success: boolean;
  paymentId?: string;
  error?: string;
}> {
  try {
    const stripe = await getStripe();
    
    // Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return {
        success: false,
        error: `Payment not successful. Status: ${paymentIntent.status}`
      };
    }
    
    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        orderId,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        method: PaymentMethod.STRIPE,
        status: PaymentStatus.COMPLETED,
        transactionId: paymentIntent.id,
        gatewayResponse: paymentIntent as any,
        paidAt: new Date()
      }
    });
    
    // Update order payment status
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        paymentStatus: PaymentStatus.COMPLETED,
        status: 'CONFIRMED'
      }
    });
    
    return {
      success: true,
      paymentId: payment.id
    };
    
  } catch (error) {
    console.error('Stripe payment processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed'
    };
  }
}

// Create refund
export async function createStripeRefund(
  paymentId: string,
  amount?: number,
  reason?: string
): Promise<{
  success: boolean;
  refundId?: string;
  error?: string;
}> {
  try {
    const stripe = await getStripe();
    
    // Get payment details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });
    
    if (!payment || !payment.transactionId) {
      return {
        success: false,
        error: 'Payment not found'
      };
    }
    
    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.transactionId,
      amount: amount ? Math.round(amount * 100) : undefined, // Partial refund if amount specified
      reason: reason as Stripe.RefundCreateParams.Reason || 'requested_by_customer'
    });
    
    // Create refund record
    const refundRecord = await prisma.refund.create({
      data: {
        orderId: payment.orderId,
        amount: refund.amount / 100,
        reason: reason || 'Customer requested refund',
        status: 'COMPLETED',
        processedAt: new Date(),
        metadata: refund as any
      }
    });
    
    // Update payment status
    const newStatus = amount && amount < payment.amount 
      ? PaymentStatus.PARTIALLY_REFUNDED 
      : PaymentStatus.REFUNDED;
    
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: newStatus }
    });
    
    // Update order status if fully refunded
    if (newStatus === PaymentStatus.REFUNDED) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { 
          status: 'REFUNDED',
          paymentStatus: PaymentStatus.REFUNDED
        }
      });
    }
    
    return {
      success: true,
      refundId: refundRecord.id
    };
    
  } catch (error) {
    console.error('Stripe refund error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Refund failed'
    };
  }
}

// Get payment details
export async function getStripePaymentDetails(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent | null> {
  try {
    const stripe = await getStripe();
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error('Get payment details error:', error);
    return null;
  }
}

// Create customer
export async function createStripeCustomer(
  email: string,
  name: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer | null> {
  try {
    const stripe = await getStripe();
    
    return await stripe.customers.create({
      email,
      name,
      metadata: metadata || {}
    });
  } catch (error) {
    console.error('Create customer error:', error);
    return null;
  }
}

// Webhook handler
export async function handleStripeWebhook(
  payload: string | Buffer,
  signature: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const stripe = await getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      return {
        success: false,
        error: 'Webhook secret not configured'
      };
    }
    
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
    
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // Process successful payment
        if (paymentIntent.metadata.orderId) {
          await processStripePayment(
            paymentIntent.metadata.orderId,
            paymentIntent.id
          );
        }
        break;
        
      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object as Stripe.PaymentIntent;
        // Handle failed payment
        if (failedIntent.metadata.orderId) {
          await prisma.order.update({
            where: { id: failedIntent.metadata.orderId },
            data: { 
              paymentStatus: PaymentStatus.FAILED,
              status: 'CANCELLED'
            }
          });
        }
        break;
        
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        // Handle successful checkout
        if (session.metadata?.orderId && session.payment_intent) {
          await processStripePayment(
            session.metadata.orderId,
            session.payment_intent as string
          );
        }
        break;
        
      case 'charge.refunded':
        const charge = event.data.object as Stripe.Charge;
        // Handle refund
        console.log('Refund processed:', charge.id);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Webhook processing failed'
    };
  }
}

// Validate card
export async function validateCard(
  cardNumber: string,
  expMonth: number,
  expYear: number,
  cvc: string
): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    const stripe = await getStripe();
    
    // Create a token to validate the card
    // Note: In production, this should be done client-side using Stripe.js
    const token = await stripe.tokens.create({
      card: {
        number: cardNumber,
        exp_month: expMonth,
        exp_year: expYear,
        cvc: cvc
      }
    });
    
    return { valid: true };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Invalid card details'
    };
  }
}