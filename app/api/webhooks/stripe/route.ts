import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '../../../../server/config/database';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const sig = headersList.get('stripe-signature');

    if (!sig) {
      console.error('No Stripe signature found');
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata?.orderId;
    
    if (!orderId) {
      console.error('No order ID found in payment intent metadata');
      return;
    }

    // Update payment record
    await prisma.payment.updateMany({
      where: {
        transactionId: paymentIntent.id,
      },
      data: {
        status: 'COMPLETED',
        paidAt: new Date(),
        gatewayResponse: paymentIntent as any,
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'COMPLETED',
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    // Send confirmation email
    await sendOrderConfirmationEmail(orderId);

    console.log(`Payment succeeded for order: ${orderId}`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata?.orderId;
    
    if (!orderId) {
      console.error('No order ID found in payment intent metadata');
      return;
    }

    // Update payment record
    await prisma.payment.updateMany({
      where: {
        transactionId: paymentIntent.id,
      },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        gatewayResponse: paymentIntent as any,
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'FAILED',
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    // Send payment failure email
    await sendPaymentFailureEmail(orderId);

    console.log(`Payment failed for order: ${orderId}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    // Handle subscription invoice payments
    const subscriptionId = invoice.subscription as string;
    
    if (subscriptionId) {
      console.log(`Invoice payment succeeded for subscription: ${subscriptionId}`);
      
      // Update subscription status or handle recurring billing
      // Implementation depends on your subscription model
    }
  } catch (error) {
    console.error('Error handling invoice payment success:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    
    // Find user by Stripe customer ID
    // Implementation depends on your user-customer mapping
    
    console.log(`Subscription created: ${subscription.id} for customer: ${customerId}`);
  } catch (error) {
    console.error('Error handling subscription creation:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    
    console.log(`Subscription updated: ${subscription.id} for customer: ${customerId}`);
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    
    console.log(`Subscription deleted: ${subscription.id} for customer: ${customerId}`);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

async function sendOrderConfirmationEmail(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      console.error('Order not found:', orderId);
      return;
    }

    // Get email template
    const template = await prisma.emailTemplate.findUnique({
      where: { name: 'order_confirmation' },
    });

    if (!template) {
      console.error('Order confirmation template not found');
      return;
    }

    // TODO: Send email using email service
    // This would integrate with your email service
    console.log(`Sending order confirmation email to: ${order.user.email}`);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
  }
}

async function sendPaymentFailureEmail(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
      },
    });

    if (!order) {
      console.error('Order not found:', orderId);
      return;
    }

    // TODO: Send payment failure email
    console.log(`Sending payment failure email to: ${order.user.email}`);
  } catch (error) {
    console.error('Error sending payment failure email:', error);
  }
}