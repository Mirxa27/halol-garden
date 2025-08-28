import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../server/config/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature (implement based on MyFatoorah documentation)
    const isValid = await verifyMyFatoorahWebhook(request, body);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Handle different event types
    const { EventType, Data } = body;

    switch (EventType) {
      case 'TransactionStatusChanged':
        await handleTransactionStatusChanged(Data);
        break;
        
      case 'PaymentSuccessful':
        await handlePaymentSuccessful(Data);
        break;
        
      case 'PaymentFailed':
        await handlePaymentFailed(Data);
        break;
        
      case 'RefundSuccessful':
        await handleRefundSuccessful(Data);
        break;
        
      default:
        console.log(`Unhandled MyFatoorah event type: ${EventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('MyFatoorah webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function verifyMyFatoorahWebhook(request: NextRequest, body: any): Promise<boolean> {
  try {
    // Implement MyFatoorah signature verification
    // This typically involves checking a signature header against your webhook secret
    
    const signature = request.headers.get('myfatoorah-signature');
    const webhookSecret = process.env.MYFATOORAH_WEBHOOK_SECRET;
    
    if (!signature || !webhookSecret) {
      return false;
    }

    // Verify signature (implementation depends on MyFatoorah's method)
    // Usually involves HMAC verification
    return true; // Placeholder - implement actual verification
  } catch (error) {
    console.error('MyFatoorah signature verification failed:', error);
    return false;
  }
}

async function handleTransactionStatusChanged(data: any) {
  try {
    const { InvoiceId, InvoiceStatus, CustomerReference } = data;
    
    // CustomerReference should contain our order ID
    const orderId = CustomerReference;
    
    if (!orderId) {
      console.error('No order ID found in MyFatoorah webhook data');
      return;
    }

    let paymentStatus: string;
    let orderStatus: string;
    
    switch (InvoiceStatus) {
      case 'Paid':
        paymentStatus = 'COMPLETED';
        orderStatus = 'CONFIRMED';
        break;
      case 'Failed':
      case 'Cancelled':
        paymentStatus = 'FAILED';
        orderStatus = 'CANCELLED';
        break;
      case 'Pending':
        paymentStatus = 'PENDING';
        orderStatus = 'PENDING';
        break;
      default:
        paymentStatus = 'PROCESSING';
        orderStatus = 'PROCESSING';
    }

    // Update payment record
    await prisma.payment.updateMany({
      where: {
        orderId: orderId,
        method: 'MYFATOORAH',
      },
      data: {
        status: paymentStatus as any,
        gatewayResponse: data,
        ...(paymentStatus === 'COMPLETED' ? { paidAt: new Date() } : {}),
        ...(paymentStatus === 'FAILED' ? { failedAt: new Date() } : {}),
      },
    });

    // Update order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: paymentStatus as any,
        status: orderStatus as any,
        ...(orderStatus === 'CONFIRMED' ? { confirmedAt: new Date() } : {}),
        ...(orderStatus === 'CANCELLED' ? { cancelledAt: new Date() } : {}),
      },
    });

    console.log(`MyFatoorah transaction status changed: ${InvoiceStatus} for order: ${orderId}`);
  } catch (error) {
    console.error('Error handling MyFatoorah transaction status change:', error);
  }
}

async function handlePaymentSuccessful(data: any) {
  try {
    const { InvoiceId, CustomerReference, InvoiceValue } = data;
    const orderId = CustomerReference;

    if (!orderId) {
      console.error('No order ID found in MyFatoorah payment success data');
      return;
    }

    // Create audit log for successful payment
    await prisma.auditLog.create({
      data: {
        action: 'PAYMENT_COMPLETED',
        entity: 'PAYMENT',
        entityId: orderId,
        newData: {
          gateway: 'MyFatoorah',
          invoiceId: InvoiceId,
          amount: InvoiceValue,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Send order confirmation
    await sendOrderConfirmationEmail(orderId);

    console.log(`MyFatoorah payment successful for order: ${orderId}`);
  } catch (error) {
    console.error('Error handling MyFatoorah payment success:', error);
  }
}

async function handlePaymentFailed(data: any) {
  try {
    const { InvoiceId, CustomerReference, ErrorMessage } = data;
    const orderId = CustomerReference;

    if (!orderId) {
      console.error('No order ID found in MyFatoorah payment failure data');
      return;
    }

    // Create audit log for failed payment
    await prisma.auditLog.create({
      data: {
        action: 'PAYMENT_FAILED',
        entity: 'PAYMENT',
        entityId: orderId,
        newData: {
          gateway: 'MyFatoorah',
          invoiceId: InvoiceId,
          error: ErrorMessage,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Send payment failure notification
    await sendPaymentFailureEmail(orderId);

    console.log(`MyFatoorah payment failed for order: ${orderId}`);
  } catch (error) {
    console.error('Error handling MyFatoorah payment failure:', error);
  }
}

async function handleRefundSuccessful(data: any) {
  try {
    const { InvoiceId, CustomerReference, RefundAmount } = data;
    const orderId = CustomerReference;

    if (!orderId) {
      console.error('No order ID found in MyFatoorah refund data');
      return;
    }

    // Update refund record
    await prisma.refund.updateMany({
      where: {
        orderId: orderId,
      },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
        metadata: data,
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'REFUNDED',
        paymentStatus: 'REFUNDED',
      },
    });

    console.log(`MyFatoorah refund successful for order: ${orderId}, amount: ${RefundAmount}`);
  } catch (error) {
    console.error('Error handling MyFatoorah refund success:', error);
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

    // TODO: Implement email sending
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

    // TODO: Implement email sending
    console.log(`Sending payment failure email to: ${order.user.email}`);
  } catch (error) {
    console.error('Error sending payment failure email:', error);
  }
}