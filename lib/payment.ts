import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  paymentIntentId?: string;
  clientSecret?: string;
}

// Process payment based on method
export async function processPayment(
  order: any,
  paymentMethod: PaymentMethod
): Promise<PaymentResult> {
  try {
    switch (paymentMethod) {
      case PaymentMethod.CREDIT_CARD:
      case PaymentMethod.DEBIT_CARD:
        return await processStripePayment(order);
      
      case PaymentMethod.PAYPAL:
        return await processPayPalPayment(order);
      
      case PaymentMethod.MYFATOORAH:
        return await processMyFatoorahPayment(order);
      
      case PaymentMethod.BANK_TRANSFER:
        return await processBankTransfer(order);
      
      case PaymentMethod.CASH_ON_DELIVERY:
        return await processCashOnDelivery(order);
      
      default:
        return {
          success: false,
          error: 'Unsupported payment method',
        };
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed',
    };
  }
}

// Process Stripe payment (Credit/Debit cards)
async function processStripePayment(order: any): Promise<PaymentResult> {
  try {
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // Amount in cents
      currency: order.currency.toLowerCase(),
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
      description: `Order ${order.orderNumber}`,
    });

    // Update payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.total,
        currency: order.currency,
        method: order.paymentMethod,
        status: PaymentStatus.PENDING,
        transactionId: paymentIntent.id,
        gatewayResponse: paymentIntent as any,
      },
    });

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || '',
      transactionId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Stripe payment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Stripe payment failed',
    };
  }
}

// Process PayPal payment
async function processPayPalPayment(order: any): Promise<PaymentResult> {
  // In production, integrate with PayPal SDK
  // For now, simulate PayPal payment
  try {
    const transactionId = `PAYPAL-${Date.now()}`;
    
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.total,
        currency: order.currency,
        method: PaymentMethod.PAYPAL,
        status: PaymentStatus.PENDING,
        transactionId,
        gatewayResponse: {
          provider: 'PayPal',
          status: 'pending',
          redirectUrl: `https://www.paypal.com/checkoutnow?token=${transactionId}`,
        },
      },
    });

    return {
      success: true,
      transactionId,
      clientSecret: `https://www.paypal.com/checkoutnow?token=${transactionId}`,
    };
  } catch (error) {
    return {
      success: false,
      error: 'PayPal payment processing failed',
    };
  }
}

// Process MyFatoorah payment (Popular in Middle East)
async function processMyFatoorahPayment(order: any): Promise<PaymentResult> {
  // In production, integrate with MyFatoorah API
  // For now, simulate MyFatoorah payment
  try {
    const transactionId = `MF-${Date.now()}`;
    
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.total,
        currency: order.currency,
        method: PaymentMethod.MYFATOORAH,
        status: PaymentStatus.PENDING,
        transactionId,
        gatewayResponse: {
          provider: 'MyFatoorah',
          status: 'pending',
          paymentUrl: `https://portal.myfatoorah.com/payment/${transactionId}`,
        },
      },
    });

    return {
      success: true,
      transactionId,
      clientSecret: `https://portal.myfatoorah.com/payment/${transactionId}`,
    };
  } catch (error) {
    return {
      success: false,
      error: 'MyFatoorah payment processing failed',
    };
  }
}

// Process Bank Transfer
async function processBankTransfer(order: any): Promise<PaymentResult> {
  try {
    const transactionId = `BANK-${Date.now()}`;
    const bankDetails = {
      accountName: 'Medical Devices Marketplace LLC',
      accountNumber: process.env.BANK_ACCOUNT_NUMBER || 'SA03 8000 0000 6080 1016 7519',
      bankName: 'Al Rajhi Bank',
      swiftCode: 'RJHISARI',
      reference: order.orderNumber,
      amount: order.total,
      currency: order.currency,
    };
    
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.total,
        currency: order.currency,
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PENDING,
        transactionId,
        gatewayResponse: {
          provider: 'Bank Transfer',
          status: 'awaiting_transfer',
          bankDetails,
          instructions: 'Please transfer the amount to the bank account provided and use the order number as reference.',
        },
      },
    });

    return {
      success: true,
      transactionId,
      clientSecret: JSON.stringify(bankDetails),
    };
  } catch (error) {
    return {
      success: false,
      error: 'Bank transfer setup failed',
    };
  }
}

// Process Cash on Delivery
async function processCashOnDelivery(order: any): Promise<PaymentResult> {
  try {
    const transactionId = `COD-${Date.now()}`;
    
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.total,
        currency: order.currency,
        method: PaymentMethod.CASH_ON_DELIVERY,
        status: PaymentStatus.PENDING,
        transactionId,
        gatewayResponse: {
          provider: 'Cash on Delivery',
          status: 'pending_delivery',
          instructions: 'Payment will be collected upon delivery.',
        },
      },
    });

    // Update order status to confirmed for COD
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    return {
      success: true,
      transactionId,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Cash on delivery setup failed',
    };
  }
}

// Confirm payment completion
export async function confirmPayment(
  paymentIntentId: string,
  orderId: string
): Promise<boolean> {
  try {
    // For Stripe payments
    if (paymentIntentId.startsWith('pi_')) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        await prisma.$transaction([
          prisma.payment.updateMany({
            where: {
              orderId,
              transactionId: paymentIntentId,
            },
            data: {
              status: PaymentStatus.COMPLETED,
              paidAt: new Date(),
            },
          }),
          prisma.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: PaymentStatus.COMPLETED,
              status: 'CONFIRMED',
              confirmedAt: new Date(),
            },
          }),
        ]);
        
        return true;
      }
    }
    
    // Handle other payment providers...
    
    return false;
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return false;
  }
}

// Refund payment
export async function refundPayment(
  orderId: string,
  amount?: number,
  reason?: string
): Promise<PaymentResult> {
  try {
    const payment = await prisma.payment.findFirst({
      where: {
        orderId,
        status: PaymentStatus.COMPLETED,
      },
    });

    if (!payment) {
      return {
        success: false,
        error: 'No completed payment found for this order',
      };
    }

    // Process refund based on payment method
    if (payment.transactionId?.startsWith('pi_')) {
      // Stripe refund
      const refund = await stripe.refunds.create({
        payment_intent: payment.transactionId,
        amount: amount ? Math.round(amount * 100) : undefined, // Partial refund if amount specified
        reason: 'requested_by_customer',
      });

      await prisma.refund.create({
        data: {
          orderId,
          amount: amount || payment.amount,
          reason: reason || 'Customer requested refund',
          status: 'COMPLETED',
          processedAt: new Date(),
          metadata: refund as any,
        },
      });

      return {
        success: true,
        transactionId: refund.id,
      };
    }

    // Handle other payment providers...

    return {
      success: false,
      error: 'Refund not supported for this payment method',
    };
  } catch (error) {
    console.error('Refund error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Refund failed',
    };
  }
}