// Order and Transaction Types
export enum OrderType {
  SALE = 'sale',
  RENTAL = 'rental'
}

export enum OrderStatus {
  DRAFT = 'draft',
  PENDING_PAYMENT = 'pending_payment',
  PAYMENT_FAILED = 'payment_failed',
  PROCESSING = 'processing',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  MYFATOORAH = 'myfatoorah',
  BANK_TRANSFER = 'bank_transfer',
  MADA = 'mada',
  STC_PAY = 'stc_pay',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
  CASH_ON_DELIVERY = 'cash_on_delivery'
}

export enum DeliveryStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETURNED = 'returned'
}

// Base Order Interface
export interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  customerId: string;
  customerType: string;
  supplierId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discount: number;
  total: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentDetails?: PaymentDetails;
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress;
  deliveryStatus: DeliveryStatus;
  deliveryDetails?: DeliveryDetails;
  notes?: string;
  internalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

// Order Item
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  specifications?: Record<string, any>;
  customization?: string;
  warranty?: OrderItemWarranty;
}

export interface OrderItemWarranty {
  duration: number; // in months
  startDate: Date;
  endDate: Date;
  terms: string;
}

// Payment Details
export interface PaymentDetails {
  transactionId: string;
  gateway: 'paypal' | 'myfatoorah' | 'stripe' | 'bank';
  gatewayResponse?: Record<string, any>;
  paidAmount: number;
  paidAt?: Date;
  refundedAmount?: number;
  refunds?: RefundTransaction[];
  cardLast4?: string;
  cardBrand?: string;
  bankName?: string;
  receiptUrl?: string;
}

export interface RefundTransaction {
  id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'completed' | 'failed';
  processedAt: Date;
  processedBy: string;
  gatewayRefundId?: string;
}

// Shipping and Delivery
export interface ShippingAddress {
  recipientName: string;
  phoneNumber: string;
  street: string;
  building?: string;
  floor?: string;
  apartment?: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
  landmark?: string;
  instructions?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface BillingAddress {
  name: string;
  companyName?: string;
  taxId?: string;
  street: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
  phoneNumber?: string;
  email?: string;
}

export interface DeliveryDetails {
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  deliveryProof?: string; // URL to signature or photo
  deliveryNotes?: string;
  attempts?: DeliveryAttempt[];
}

export interface DeliveryAttempt {
  attemptNumber: number;
  attemptedAt: Date;
  status: 'successful' | 'failed';
  reason?: string;
  notes?: string;
}

// Sales Order Extension
export interface SalesOrder extends Order {
  type: OrderType.SALE;
  installationRequired?: boolean;
  installationSchedule?: InstallationSchedule;
  trainingRequired?: boolean;
  trainingSchedule?: TrainingSchedule;
}

export interface InstallationSchedule {
  scheduledDate: Date;
  technician?: string;
  estimatedDuration: number; // in hours
  requirements?: string[];
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed';
  completedAt?: Date;
  completionNotes?: string;
}

export interface TrainingSchedule {
  scheduledDate: Date;
  trainer?: string;
  duration: number; // in hours
  attendees?: string[];
  topics?: string[];
  materials?: string[];
  status: 'pending' | 'scheduled' | 'completed';
  completedAt?: Date;
  feedback?: string;
}

// Shopping Cart
export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  estimatedTax: number;
  estimatedShipping: number;
  estimatedTotal: number;
  currency: string;
  appliedCoupon?: AppliedCoupon;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  availability: 'in_stock' | 'out_of_stock' | 'limited';
  addedAt: Date;
  savedForLater: boolean;
  customization?: Record<string, any>;
}

export interface AppliedCoupon {
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  minimumPurchase?: number;
  applicableCategories?: string[];
  excludedProducts?: string[];
}

// Order Invoice
export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  customerId: string;
  supplierId: string;
  issueDate: Date;
  dueDate?: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  notes?: string;
  terms?: string;
  paidAmount: number;
  balance: number;
  payments: InvoicePayment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
}

// Order Tracking
export interface OrderTracking {
  orderId: string;
  events: TrackingEvent[];
  currentStatus: OrderStatus;
  estimatedDelivery?: Date;
  deliveryProgress: number; // percentage
}

export interface TrackingEvent {
  id: string;
  status: OrderStatus;
  description: string;
  descriptionAr?: string;
  location?: string;
  timestamp: Date;
  notes?: string;
  performedBy?: string;
}

// Order Statistics
export interface OrderStatistics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByType: Record<OrderType, number>;
  topProducts: ProductSalesStats[];
  topCustomers: CustomerStats[];
  revenueByPeriod: RevenuePeriod[];
}

export interface ProductSalesStats {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  orderCount: number;
}

export interface CustomerStats {
  customerId: string;
  customerName: string;
  orderCount: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: Date;
}

export interface RevenuePeriod {
  period: string; // e.g., "2024-01", "2024-W01", "2024-Q1"
  revenue: number;
  orderCount: number;
  growth: number; // percentage compared to previous period
}

// Discount and Promotion
export interface Discount {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'buy_x_get_y' | 'free_shipping';
  value: number;
  minimumPurchase?: number;
  maximumDiscount?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  excludedProducts?: string[];
  usageLimit?: number;
  usageCount: number;
  userUsageLimit?: number;
  startDate: Date;
  endDate: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Return and Refund
export interface ReturnRequest {
  id: string;
  orderId: string;
  customerId: string;
  items: ReturnItem[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
  refundAmount: number;
  refundMethod?: 'original_payment' | 'store_credit' | 'replacement';
  returnShipping?: ReturnShipping;
  notes?: string;
  images?: string[];
  createdAt: Date;
  processedAt?: Date;
  processedBy?: string;
  completedAt?: Date;
}

export interface ReturnItem {
  orderItemId: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: string;
  condition: 'unopened' | 'like_new' | 'damaged' | 'defective';
  refundAmount: number;
}

export interface ReturnShipping {
  carrier: string;
  trackingNumber: string;
  label?: string; // URL to return label
  cost: number;
  paidBy: 'customer' | 'supplier';
}