import axios, { AxiosInstance } from 'axios';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import prisma from '@/lib/prisma';

// MyFatoorah configuration
interface MyFatoorahConfig {
  apiKey: string;
  baseUrl: string;
  isTestMode: boolean;
}

// Payment request interface
interface PaymentRequest {
  invoiceValue: number;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  customerReference?: string;
  callBackUrl: string;
  errorUrl: string;
  language?: 'en' | 'ar';
  displayCurrencyIso?: string;
  mobileCountryCode?: string;
  invoiceItems?: Array<{
    itemName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

// Payment response interface
interface PaymentResponse {
  isSuccess: boolean;
  message: string;
  validationErrors?: any;
  data?: {
    invoiceId: number;
    invoiceURL: string;
    customerReference: string;
    userDefinedField: string;
  };
}

// Get MyFatoorah configuration
async function getConfig(): Promise<MyFatoorahConfig> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'payment_gateways' }
    });
    
    if (setting && setting.value) {
      const config = setting.value as any;
      if (config.myfatoorah?.apiKey) {
        return {
          apiKey: config.myfatoorah.apiKey,
          baseUrl: config.myfatoorah.baseUrl || 'https://api.myfatoorah.com',
          isTestMode: config.myfatoorah.baseUrl?.includes('test') || false
        };
      }
    }
  } catch (error) {
    console.error('Error fetching MyFatoorah config:', error);
  }
  
  // Fallback to environment variables
  return {
    apiKey: process.env.MYFATOORAH_API_KEY || '',
    baseUrl: process.env.MYFATOORAH_BASE_URL || 'https://apitest.myfatoorah.com',
    isTestMode: process.env.MYFATOORAH_TEST_MODE === 'true'
  };
}

// Create axios instance for MyFatoorah API
async function createApiClient(): Promise<AxiosInstance> {
  const config = await getConfig();
  
  if (!config.apiKey) {
    throw new Error('MyFatoorah API key not configured');
  }
  
  return axios.create({
    baseURL: config.baseUrl,
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 30000
  });
}

// Initiate payment
export async function initiateMyFatoorahPayment(
  orderId: string,
  amount: number,
  customerInfo: {
    name: string;
    email: string;
    mobile: string;
    countryCode?: string;
  },
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>,
  callbackUrl?: string,
  errorUrl?: string
): Promise<{
  success: boolean;
  invoiceId?: string;
  invoiceUrl?: string;
  error?: string;
}> {
  try {
    const client = await createApiClient();
    
    const paymentRequest: PaymentRequest = {
      invoiceValue: amount,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerMobile: customerInfo.mobile,
      customerReference: orderId,
      callBackUrl: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/myfatoorah/callback`,
      errorUrl: errorUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/error`,
      language: 'en',
      displayCurrencyIso: 'SAR',
      mobileCountryCode: customerInfo.countryCode || '+966',
      invoiceItems: items?.map(item => ({
        itemName: item.name,
        quantity: item.quantity,
        unitPrice: item.price
      }))
    };
    
    const response = await client.post<PaymentResponse>(
      '/v2/SendPayment',
      paymentRequest
    );
    
    if (response.data.isSuccess && response.data.data) {
      // Create payment record with pending status
      await prisma.payment.create({
        data: {
          orderId,
          amount,
          currency: 'SAR',
          method: PaymentMethod.MYFATOORAH,
          status: PaymentStatus.PENDING,
          transactionId: response.data.data.invoiceId.toString(),
          gatewayResponse: response.data as any
        }
      });
      
      return {
        success: true,
        invoiceId: response.data.data.invoiceId.toString(),
        invoiceUrl: response.data.data.invoiceURL
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Payment initiation failed'
      };
    }
    
  } catch (error) {
    console.error('MyFatoorah payment initiation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment initiation failed'
    };
  }
}

// Get payment status
export async function getMyFatoorahPaymentStatus(
  invoiceId: string
): Promise<{
  success: boolean;
  status?: string;
  paymentDetails?: any;
  error?: string;
}> {
  try {
    const client = await createApiClient();
    
    const response = await client.post('/v2/GetPaymentStatus', {
      Key: invoiceId,
      KeyType: 'InvoiceId'
    });
    
    if (response.data.isSuccess && response.data.data) {
      const paymentData = response.data.data;
      
      // Map MyFatoorah status to our status
      let status: PaymentStatus = PaymentStatus.PENDING;
      
      switch (paymentData.invoiceStatus) {
        case 'Paid':
          status = PaymentStatus.COMPLETED;
          break;
        case 'Failed':
          status = PaymentStatus.FAILED;
          break;
        case 'Expired':
          status = PaymentStatus.FAILED;
          break;
        case 'Pending':
          status = PaymentStatus.PENDING;
          break;
      }
      
      return {
        success: true,
        status: paymentData.invoiceStatus,
        paymentDetails: paymentData
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Failed to get payment status'
      };
    }
    
  } catch (error) {
    console.error('MyFatoorah get status error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment status'
    };
  }
}

// Process callback
export async function processMyFatoorahCallback(
  paymentId: string
): Promise<{
  success: boolean;
  orderId?: string;
  error?: string;
}> {
  try {
    // Get payment status from MyFatoorah
    const statusResult = await getMyFatoorahPaymentStatus(paymentId);
    
    if (!statusResult.success) {
      return {
        success: false,
        error: statusResult.error
      };
    }
    
    // Find payment record
    const payment = await prisma.payment.findFirst({
      where: { transactionId: paymentId }
    });
    
    if (!payment) {
      return {
        success: false,
        error: 'Payment record not found'
      };
    }
    
    // Map status
    let paymentStatus: PaymentStatus = PaymentStatus.PENDING;
    let orderStatus = 'PENDING';
    
    switch (statusResult.status) {
      case 'Paid':
        paymentStatus = PaymentStatus.COMPLETED;
        orderStatus = 'CONFIRMED';
        break;
      case 'Failed':
      case 'Expired':
        paymentStatus = PaymentStatus.FAILED;
        orderStatus = 'CANCELLED';
        break;
    }
    
    // Update payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        gatewayResponse: statusResult.paymentDetails,
        paidAt: paymentStatus === PaymentStatus.COMPLETED ? new Date() : undefined,
        failedAt: paymentStatus === PaymentStatus.FAILED ? new Date() : undefined
      }
    });
    
    // Update order
    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus,
        status: orderStatus as any
      }
    });
    
    return {
      success: true,
      orderId: payment.orderId
    };
    
  } catch (error) {
    console.error('MyFatoorah callback processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Callback processing failed'
    };
  }
}

// Create refund
export async function createMyFatoorahRefund(
  paymentId: string,
  amount: number,
  reason?: string
): Promise<{
  success: boolean;
  refundId?: string;
  error?: string;
}> {
  try {
    const client = await createApiClient();
    
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
    
    // Make refund request
    const response = await client.post('/v2/MakeRefund', {
      KeyType: 'InvoiceId',
      Key: payment.transactionId,
      RefundChargeOnCustomer: false,
      ServiceChargeOnCustomer: false,
      Amount: amount,
      Comment: reason || 'Customer requested refund'
    });
    
    if (response.data.isSuccess && response.data.data) {
      // Create refund record
      const refund = await prisma.refund.create({
        data: {
          orderId: payment.orderId,
          amount,
          reason: reason || 'Customer requested refund',
          status: 'COMPLETED',
          processedAt: new Date(),
          metadata: response.data.data
        }
      });
      
      // Update payment status
      const newStatus = amount < payment.amount 
        ? PaymentStatus.PARTIALLY_REFUNDED 
        : PaymentStatus.REFUNDED;
      
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: newStatus }
      });
      
      // Update order if fully refunded
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
        refundId: refund.id
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Refund failed'
      };
    }
    
  } catch (error) {
    console.error('MyFatoorah refund error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Refund failed'
    };
  }
}

// Get available payment methods
export async function getMyFatoorahPaymentMethods(
  amount: number,
  currencyIso: string = 'SAR'
): Promise<{
  success: boolean;
  methods?: any[];
  error?: string;
}> {
  try {
    const client = await createApiClient();
    
    const response = await client.post('/v2/InitiatePayment', {
      InvoiceAmount: amount,
      CurrencyIso: currencyIso
    });
    
    if (response.data.isSuccess && response.data.data) {
      return {
        success: true,
        methods: response.data.data.paymentMethods
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Failed to get payment methods'
      };
    }
    
  } catch (error) {
    console.error('MyFatoorah get payment methods error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment methods'
    };
  }
}

// Validate configuration
export async function validateMyFatoorahConfig(): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    const config = await getConfig();
    
    if (!config.apiKey) {
      return {
        valid: false,
        error: 'API key not configured'
      };
    }
    
    // Test API connection
    const client = await createApiClient();
    const response = await client.post('/v2/InitiatePayment', {
      InvoiceAmount: 100,
      CurrencyIso: 'SAR'
    });
    
    if (response.data.isSuccess) {
      return { valid: true };
    } else {
      return {
        valid: false,
        error: response.data.message || 'Invalid configuration'
      };
    }
    
  } catch (error) {
    console.error('MyFatoorah config validation error:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Configuration validation failed'
    };
  }
}