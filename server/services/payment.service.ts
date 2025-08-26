import Stripe from 'stripe';
import axios from 'axios';
import { prisma } from '../config/database';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';
import { logger } from '@/lib/logger';
import { EmailService } from './email.service';

interface PaymentProcessingResult {
  success: boolean;
  paymentId?: string;
  status?: string;
  error?: string;
  redirectUrl?: string;
  clientSecret?: string;
}

interface PaymentData {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  customerEmail?: string;
  metadata?: Record<string, any>;
}

export class PaymentService {
  private static stripe: Stripe | null = null;
  private static myFatoorahApiKey = process.env.MYFATOORAH_API_KEY;
  private static myFatoorahBaseUrl = process.env.MYFATOORAH_BASE_URL || 'https://apitest.myfatoorah.com';
  private static paypalClientId = process.env.PAYPAL_CLIENT_ID;
  private static paypalSecret = process.env.PAYPAL_SECRET;
  private static paypalBaseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';

  /**
   * Initialize Stripe
   */
  private static getStripe(): Stripe {
    if (!this.stripe) {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        throw new Error('Stripe secret key not configured');
      }
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2024-12-18.acacia',
      });
    }
    return this.stripe;
  }

  /**
   * Process payment based on method
   */
  static async processPayment(data: PaymentData): Promise<PaymentProcessingResult> {
    try {
      switch (data.paymentMethod) {
        case PaymentMethod.CREDIT_CARD:
        case PaymentMethod.DEBIT_CARD:
        case PaymentMethod.STRIPE:
          return await this.processStripePayment(data);
          
        case PaymentMethod.PAYPAL:
          return await this.processPayPalPayment(data);
          
        case PaymentMethod.MYFATOORAH:
          return await this.processMyFatoorahPayment(data);
          
        case PaymentMethod.BANK_TRANSFER:
          return await this.processBankTransfer(data);
          
        case PaymentMethod.CASH_ON_DELIVERY:
          return await this.processCOD(data);
          
        default:
          return {
            success: false,
            error: `Unsupported payment method: ${data.paymentMethod}`,
          };
      }
    } catch (error) {
      logger.error('Payment processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  }

  /**
   * Process Stripe payment
   */
  private static async processStripePayment(data: PaymentData): Promise<PaymentProcessingResult> {
    try {
      const stripe = this.getStripe();
      
      // Get order details
      const order = await prisma.order.findUnique({
        where: { id: data.orderId },
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
        throw new Error('Order not found');
      }

      // Create or retrieve customer
      let customer;
      const existingCustomers = await stripe.customers.list({
        email: order.user.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: order.user.email,
          name: `${order.user.firstName} ${order.user.lastName}`,
          metadata: {
            userId: order.userId,
          },
        });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency.toLowerCase(),
        customer: customer.id,
        description: `Order #${order.orderNumber}`,
        metadata: {
          orderId: data.orderId,
          orderNumber: order.orderNumber,
          ...data.metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
        receipt_email: order.user.email,
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          orderId: data.orderId,
          amount: data.amount,
          currency: data.currency,
          method: data.paymentMethod,
          status: 'PENDING',
          transactionId: paymentIntent.id,
          metadata: {
            stripeCustomerId: customer.id,
            paymentIntentId: paymentIntent.id,
          },
        },
      });

      return {
        success: true,
        paymentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined,
        status: paymentIntent.status,
      };
    } catch (error) {
      logger.error('Stripe payment error:', error);
      throw error;
    }
  }

  /**
   * Process PayPal payment
   */
  private static async processPayPalPayment(data: PaymentData): Promise<PaymentProcessingResult> {
    try {
      if (!this.paypalClientId || !this.paypalSecret) {
        throw new Error('PayPal credentials not configured');
      }

      // Get access token
      const authResponse = await axios.post(
        `${this.paypalBaseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          auth: {
            username: this.paypalClientId,
            password: this.paypalSecret,
          },
        }
      );

      const accessToken = authResponse.data.access_token;

      // Get order details
      const order = await prisma.order.findUnique({
        where: { id: data.orderId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Create PayPal order
      const paypalOrder = await axios.post(
        `${this.paypalBaseUrl}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: order.orderNumber,
            amount: {
              currency_code: data.currency,
              value: data.amount.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: data.currency,
                  value: order.subtotal.toFixed(2),
                },
                tax_total: {
                  currency_code: data.currency,
                  value: order.tax.toFixed(2),
                },
                shipping: {
                  currency_code: data.currency,
                  value: order.shipping.toFixed(2),
                },
                discount: {
                  currency_code: data.currency,
                  value: order.discount.toFixed(2),
                },
              },
            },
            items: order.items.map(item => ({
              name: item.product.name,
              unit_amount: {
                currency_code: data.currency,
                value: item.price.toFixed(2),
              },
              quantity: item.quantity.toString(),
              sku: item.product.sku,
            })),
          }],
          application_context: {
            brand_name: 'Medical Devices Marketplace',
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      // Create payment record
      await prisma.payment.create({
        data: {
          orderId: data.orderId,
          amount: data.amount,
          currency: data.currency,
          method: PaymentMethod.PAYPAL,
          status: 'PENDING',
          transactionId: paypalOrder.data.id,
          metadata: {
            paypalOrderId: paypalOrder.data.id,
          },
        },
      });

      // Get approval URL
      const approvalUrl = paypalOrder.data.links.find(
        (link: any) => link.rel === 'approve'
      )?.href;

      return {
        success: true,
        paymentId: paypalOrder.data.id,
        redirectUrl: approvalUrl,
        status: paypalOrder.data.status,
      };
    } catch (error) {
      logger.error('PayPal payment error:', error);
      throw error;
    }
  }

  /**
   * Process MyFatoorah payment
   */
  private static async processMyFatoorahPayment(data: PaymentData): Promise<PaymentProcessingResult> {
    try {
      if (!this.myFatoorahApiKey) {
        throw new Error('MyFatoorah API key not configured');
      }

      const order = await prisma.order.findUnique({
        where: { id: data.orderId },
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
        throw new Error('Order not found');
      }

      // Create MyFatoorah payment
      const response = await axios.post(
        `${this.myFatoorahBaseUrl}/v2/ExecutePayment`,
        {
          PaymentMethodId: 2, // Credit/Debit Card
          CustomerName: `${order.user.firstName} ${order.user.lastName}`,
          DisplayCurrencyIso: data.currency,
          CustomerEmail: order.user.email,
          InvoiceValue: data.amount,
          CallBackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/myfatoorah/callback`,
          ErrorUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/error`,
          Language: 'en',
          CustomerReference: order.orderNumber,
          InvoiceItems: order.items.map(item => ({
            ItemName: item.product.name,
            Quantity: item.quantity,
            UnitPrice: item.price,
          })),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.myFatoorahApiKey}`,
          },
        }
      );

      if (!response.data.IsSuccess) {
        throw new Error(response.data.Message || 'MyFatoorah payment creation failed');
      }

      // Create payment record
      await prisma.payment.create({
        data: {
          orderId: data.orderId,
          amount: data.amount,
          currency: data.currency,
          method: PaymentMethod.MYFATOORAH,
          status: 'PENDING',
          transactionId: response.data.Data.InvoiceId,
          metadata: {
            invoiceId: response.data.Data.InvoiceId,
            paymentUrl: response.data.Data.PaymentURL,
          },
        },
      });

      return {
        success: true,
        paymentId: response.data.Data.InvoiceId,
        redirectUrl: response.data.Data.PaymentURL,
        status: 'PENDING',
      };
    } catch (error) {
      logger.error('MyFatoorah payment error:', error);
      throw error;
    }
  }

  /**
   * Process bank transfer
   */
  private static async processBankTransfer(data: PaymentData): Promise<PaymentProcessingResult> {
    try {
      // Generate unique reference
      const reference = `BT-${data.orderId.substring(0, 8).toUpperCase()}-${Date.now()}`;

      // Create payment record
      await prisma.payment.create({
        data: {
          orderId: data.orderId,
          amount: data.amount,
          currency: data.currency,
          method: PaymentMethod.BANK_TRANSFER,
          status: 'PENDING',
          transactionId: reference,
          metadata: {
            bankDetails: {
              accountName: 'Medical Devices Marketplace LLC',
              accountNumber: process.env.BANK_ACCOUNT_NUMBER || 'SA0000000000000000000000',
              bankName: process.env.BANK_NAME || 'Saudi National Bank',
              swiftCode: process.env.BANK_SWIFT || 'NCBKSAJE',
              reference,
            },
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        },
      });

      // Update order status
      await prisma.order.update({
        where: { id: data.orderId },
        data: {
          paymentStatus: PaymentStatus.PENDING,
          metadata: {
            bankTransferReference: reference,
          },
        },
      });

      // Send bank transfer instructions email
      const order = await prisma.order.findUnique({
        where: { id: data.orderId },
        include: { user: true },
      });

      if (order) {
        await EmailService.sendEmail({
          to: order.user.email,
          subject: `Bank Transfer Instructions - Order ${order.orderNumber}`,
          template: 'bank-transfer',
          data: {
            user: {
              firstName: order.user.firstName,
              lastName: order.user.lastName,
            },
            order: {
              orderNumber: order.orderNumber,
              total: data.amount,
              reference,
            },
            bankDetails: {
              accountName: 'Medical Devices Marketplace LLC',
              accountNumber: process.env.BANK_ACCOUNT_NUMBER || 'SA0000000000000000000000',
              bankName: process.env.BANK_NAME || 'Saudi National Bank',
              swiftCode: process.env.BANK_SWIFT || 'NCBKSAJE',
            },
          },
        });
      }

      return {
        success: true,
        paymentId: reference,
        status: 'PENDING',
      };
    } catch (error) {
      logger.error('Bank transfer error:', error);
      throw error;
    }
  }

  /**
   * Process cash on delivery
   */
  private static async processCOD(data: PaymentData): Promise<PaymentProcessingResult> {
    try {
      // Generate COD reference
      const reference = `COD-${data.orderId.substring(0, 8).toUpperCase()}-${Date.now()}`;

      // Create payment record
      await prisma.payment.create({
        data: {
          orderId: data.orderId,
          amount: data.amount,
          currency: data.currency,
          method: PaymentMethod.CASH_ON_DELIVERY,
          status: 'PENDING',
          transactionId: reference,
          metadata: {
            collectionNote: 'Payment to be collected upon delivery',
          },
        },
      });

      // Update order status
      await prisma.order.update({
        where: { id: data.orderId },
        data: {
          status: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PENDING,
          confirmedAt: new Date(),
        },
      });

      return {
        success: true,
        paymentId: reference,
        status: 'CONFIRMED',
      };
    } catch (error) {
      logger.error('COD processing error:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook
   */
  static async handleStripeWebhook(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await this.updatePaymentStatus(
            paymentIntent.id,
            'COMPLETED',
            paymentIntent.metadata
          );
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await this.updatePaymentStatus(
            paymentIntent.id,
            'FAILED',
            paymentIntent.metadata
          );
          break;
        }

        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          if (charge.payment_intent) {
            await this.processRefund(
              charge.payment_intent as string,
              charge.amount_refunded / 100
            );
          }
          break;
        }
      }
    } catch (error) {
      logger.error('Stripe webhook error:', error);
      throw error;
    }
  }

  /**
   * Handle PayPal webhook
   */
  static async handlePayPalWebhook(event: any) {
    try {
      switch (event.event_type) {
        case 'CHECKOUT.ORDER.APPROVED': {
          // Capture the payment
          const orderId = event.resource.id;
          await this.capturePayPalPayment(orderId);
          break;
        }

        case 'PAYMENT.CAPTURE.COMPLETED': {
          const captureId = event.resource.id;
          const orderId = event.resource.supplementary_data.related_ids.order_id;
          await this.updatePaymentStatus(orderId, 'COMPLETED', {
            captureId,
          });
          break;
        }

        case 'PAYMENT.CAPTURE.DENIED':
        case 'PAYMENT.CAPTURE.FAILED': {
          const orderId = event.resource.supplementary_data.related_ids.order_id;
          await this.updatePaymentStatus(orderId, 'FAILED');
          break;
        }
      }
    } catch (error) {
      logger.error('PayPal webhook error:', error);
      throw error;
    }
  }

  /**
   * Capture PayPal payment
   */
  private static async capturePayPalPayment(orderId: string) {
    try {
      // Get access token
      const authResponse = await axios.post(
        `${this.paypalBaseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          auth: {
            username: this.paypalClientId!,
            password: this.paypalSecret!,
          },
        }
      );

      const accessToken = authResponse.data.access_token;

      // Capture payment
      const captureResponse = await axios.post(
        `${this.paypalBaseUrl}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return captureResponse.data;
    } catch (error) {
      logger.error('PayPal capture error:', error);
      throw error;
    }
  }

  /**
   * Update payment status
   */
  private static async updatePaymentStatus(
    transactionId: string,
    status: string,
    metadata?: any
  ) {
    try {
      // Update payment record
      const payment = await prisma.payment.findFirst({
        where: { transactionId },
      });

      if (!payment) {
        logger.warn(`Payment not found for transaction: ${transactionId}`);
        return;
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status,
          metadata: {
            ...payment.metadata,
            ...metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      });

      // Update order if payment completed
      if (status === 'COMPLETED') {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: PaymentStatus.COMPLETED,
            status: OrderStatus.PROCESSING,
          },
        });

        // Send confirmation email
        await EmailService.sendOrderConfirmation(payment.orderId);
      } else if (status === 'FAILED') {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: PaymentStatus.FAILED,
          },
        });
      }
    } catch (error) {
      logger.error('Payment status update error:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  private static async processRefund(transactionId: string, amount: number) {
    try {
      const payment = await prisma.payment.findFirst({
        where: { transactionId },
      });

      if (!payment) {
        logger.warn(`Payment not found for refund: ${transactionId}`);
        return;
      }

      // Create refund record
      await prisma.refund.create({
        data: {
          orderId: payment.orderId,
          amount,
          reason: 'Customer requested',
          status: 'COMPLETED',
          processedAt: new Date(),
          metadata: {
            paymentId: payment.id,
            transactionId,
          },
        },
      });

      // Update order status if fully refunded
      const order = await prisma.order.findUnique({
        where: { id: payment.orderId },
        include: {
          refunds: true,
        },
      });

      if (order) {
        const totalRefunded = order.refunds.reduce((sum, r) => sum + r.amount, 0);
        if (totalRefunded >= order.total) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: PaymentStatus.REFUNDED,
              status: OrderStatus.CANCELLED,
              cancelledAt: new Date(),
            },
          });
        }
      }
    } catch (error) {
      logger.error('Refund processing error:', error);
      throw error;
    }
  }

  /**
   * Get payment details
   */
  static async getPaymentDetails(orderId: string) {
    try {
      const payments = await prisma.payment.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
      });

      return payments;
    } catch (error) {
      logger.error('Get payment details error:', error);
      throw error;
    }
  }

  /**
   * Verify payment status
   */
  static async verifyPaymentStatus(paymentId: string): Promise<string> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Verify with payment provider
      switch (payment.method) {
        case PaymentMethod.STRIPE:
        case PaymentMethod.CREDIT_CARD:
        case PaymentMethod.DEBIT_CARD: {
          const stripe = this.getStripe();
          const paymentIntent = await stripe.paymentIntents.retrieve(payment.transactionId);
          return paymentIntent.status;
        }

        // Add other payment method verifications as needed

        default:
          return payment.status;
      }
    } catch (error) {
      logger.error('Payment verification error:', error);
      throw error;
    }
  }
}

export default PaymentService;