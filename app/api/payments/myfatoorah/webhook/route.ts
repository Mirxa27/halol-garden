import { NextRequest, NextResponse } from 'next/server';
import { handleMyFatoorahWebhook } from '@/lib/payment/myfatoorah';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // MyFatoorah sends webhook data in the body
    const result = await handleMyFatoorahWebhook(body);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true,
        message: 'Webhook processed successfully' 
      });
    } else {
      console.error('MyFatoorah webhook error:', result.error);
      return NextResponse.json(
        { 
          success: false,
          error: result.error 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('MyFatoorah webhook processing error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Webhook processing failed' 
      },
      { status: 500 }
    );
  }
}

// GET handler for MyFatoorah callback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const orderId = searchParams.get('orderId');
    
    if (!paymentId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/error`);
    }

    // Verify payment status with MyFatoorah
    const result = await handleMyFatoorahWebhook({ paymentId, orderId });
    
    if (result.success) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/success?orderId=${orderId}`);
    } else {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/error`);
    }
  } catch (error) {
    console.error('MyFatoorah callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/error`);
  }
}