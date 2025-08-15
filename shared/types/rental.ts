// Rental Management Types
export enum RentalStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  ACTIVE = 'active',
  OVERDUE = 'overdue',
  PENDING_RETURN = 'pending_return',
  RETURNED = 'returned',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed'
}

export enum RentalPeriodType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

export enum RentalPaymentSchedule {
  UPFRONT = 'upfront',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  CUSTOM = 'custom'
}

// Rental Agreement
export interface RentalAgreement {
  id: string;
  agreementNumber: string;
  renterId: string;
  renterType: string;
  supplierId: string;
  status: RentalStatus;
  items: RentalItem[];
  startDate: Date;
  endDate: Date;
  actualReturnDate?: Date;
  periodType: RentalPeriodType;
  duration: number; // in days
  pricing: RentalPricingDetails;
  paymentSchedule: RentalPaymentSchedule;
  payments: RentalPayment[];
  deliveryAddress: RentalDeliveryAddress;
  pickupAddress?: RentalDeliveryAddress;
  terms: RentalAgreementTerms;
  insurance?: RentalInsurance;
  securityDeposit: SecurityDeposit;
  signatures: RentalSignature[];
  documents: RentalDocument[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  completedAt?: Date;
}

// Rental Item
export interface RentalItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  unitId?: string; // specific unit being rented
  serialNumber?: string;
  quantity: number;
  condition: 'new' | 'excellent' | 'good' | 'fair';
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  appliedRate: number;
  subtotal: number;
  accessories?: RentalAccessory[];
  maintenanceIncluded: boolean;
  replacementValue: number;
}

export interface RentalAccessory {
  name: string;
  quantity: number;
  included: boolean;
  additionalCost?: number;
}

// Rental Pricing Details
export interface RentalPricingDetails {
  subtotal: number;
  deliveryFee: number;
  setupFee?: number;
  insuranceFee?: number;
  taxAmount: number;
  discount: number;
  total: number;
  currency: string;
  breakdown: PricingBreakdown[];
}

export interface PricingBreakdown {
  description: string;
  quantity: number;
  rate: number;
  period: string;
  amount: number;
}

// Rental Payment
export interface RentalPayment {
  id: string;
  dueDate: Date;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paidDate?: Date;
  paymentMethod?: string;
  transactionId?: string;
  invoiceId?: string;
  remindersSent: number;
  lastReminderDate?: Date;
}

// Rental Delivery Address
export interface RentalDeliveryAddress {
  type: 'delivery' | 'pickup';
  contactName: string;
  phoneNumber: string;
  street: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
  scheduledDate: Date;
  scheduledTime?: string;
  actualDate?: Date;
  notes?: string;
  signature?: string;
  photos?: string[];
}

// Rental Agreement Terms
export interface RentalAgreementTerms {
  template: string;
  customTerms?: string[];
  includedServices: string[];
  excludedServices: string[];
  maintenanceResponsibility: 'renter' | 'supplier' | 'shared';
  damagePolicy: string;
  lossPolicy: string;
  earlyTerminationPolicy: string;
  earlyTerminationFee?: number;
  extensionPolicy: string;
  extensionRateAdjustment?: number; // percentage
  usageRestrictions?: string[];
  geographicRestrictions?: string[];
}

// Rental Insurance
export interface RentalInsurance {
  required: boolean;
  provider?: 'platform' | 'third_party' | 'renter_provided';
  policyNumber?: string;
  coverage: InsuranceCoverage[];
  premium: number;
  deductible: number;
  validFrom: Date;
  validTo: Date;
  documents?: string[];
}

export interface InsuranceCoverage {
  type: 'damage' | 'theft' | 'liability' | 'business_interruption';
  coverageAmount: number;
  conditions?: string[];
}

// Security Deposit
export interface SecurityDeposit {
  amount: number;
  status: 'pending' | 'held' | 'partially_released' | 'released' | 'forfeited';
  paymentMethod?: string;
  transactionId?: string;
  heldDate?: Date;
  releaseDate?: Date;
  deductions?: DepositDeduction[];
  refundAmount?: number;
  refundTransactionId?: string;
}

export interface DepositDeduction {
  reason: string;
  amount: number;
  description?: string;
  evidence?: string[]; // URLs to photos or documents
  disputeStatus?: 'none' | 'disputed' | 'resolved';
}

// Rental Signature
export interface RentalSignature {
  signatory: 'renter' | 'supplier' | 'witness';
  name: string;
  title?: string;
  signedAt: Date;
  signature: string; // base64 or URL
  ipAddress?: string;
  verified: boolean;
}

// Rental Document
export interface RentalDocument {
  id: string;
  type: 'agreement' | 'invoice' | 'receipt' | 'inspection' | 'insurance' | 'other';
  name: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

// Rental Extension Request
export interface RentalExtension {
  id: string;
  rentalId: string;
  requestedBy: string;
  currentEndDate: Date;
  requestedEndDate: Date;
  reason?: string;
  proposedRate?: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  processedBy?: string;
  processedAt?: Date;
  notes?: string;
}

// Rental Return
export interface RentalReturn {
  id: string;
  rentalId: string;
  scheduledDate: Date;
  actualDate?: Date;
  returnMethod: 'pickup' | 'dropoff' | 'shipped';
  address?: RentalDeliveryAddress;
  inspection: ReturnInspection;
  condition: ItemCondition[];
  damages?: Damage[];
  missingItems?: MissingItem[];
  cleaningRequired: boolean;
  cleaningFee?: number;
  additionalCharges?: AdditionalCharge[];
  totalCharges: number;
  processedBy?: string;
  customerSignature?: string;
  notes?: string;
  photos?: string[];
  completedAt?: Date;
}

export interface ReturnInspection {
  inspectedBy: string;
  inspectionDate: Date;
  checklistCompleted: boolean;
  functionalityTest: 'passed' | 'failed' | 'partial';
  cleanlinessRating: number; // 1-5
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
}

export interface ItemCondition {
  itemId: string;
  itemName: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  notes?: string;
}

export interface Damage {
  itemId: string;
  itemName: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major' | 'total_loss';
  repairCost?: number;
  replaceRequired: boolean;
  photos?: string[];
}

export interface MissingItem {
  itemId: string;
  itemName: string;
  quantity: number;
  replacementCost: number;
  notes?: string;
}

export interface AdditionalCharge {
  type: 'late_return' | 'damage' | 'cleaning' | 'missing_item' | 'other';
  description: string;
  amount: number;
  taxable: boolean;
}

// Rental Maintenance
export interface RentalMaintenance {
  id: string;
  rentalId: string;
  unitId: string;
  type: 'preventive' | 'corrective' | 'emergency';
  scheduledDate?: Date;
  performedDate?: Date;
  performedBy?: string;
  description: string;
  partsReplaced?: MaintenancePart[];
  laborHours?: number;
  cost?: number;
  coveredByAgreement: boolean;
  downtime?: number; // in hours
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  nextMaintenanceDate?: Date;
}

export interface MaintenancePart {
  name: string;
  partNumber?: string;
  quantity: number;
  unitCost: number;
  supplier?: string;
}

// Rental Analytics
export interface RentalAnalytics {
  totalRentals: number;
  activeRentals: number;
  revenue: RentalRevenue;
  utilization: UtilizationMetrics;
  performance: PerformanceMetrics;
  customerMetrics: RentalCustomerMetrics;
}

export interface RentalRevenue {
  total: number;
  byPeriod: RevenuePeriod[];
  byCategory: CategoryRevenue[];
  averageRentalValue: number;
  recurringRevenue: number;
}

export interface RevenuePeriod {
  period: string;
  revenue: number;
  rentalCount: number;
  growth: number; // percentage
}

export interface CategoryRevenue {
  category: string;
  revenue: number;
  percentage: number;
}

export interface UtilizationMetrics {
  overallUtilization: number; // percentage
  byProduct: ProductUtilization[];
  averageRentalDuration: number; // in days
  turnoverRate: number;
}

export interface ProductUtilization {
  productId: string;
  productName: string;
  totalUnits: number;
  rentedUnits: number;
  utilizationRate: number; // percentage
  revenue: number;
}

export interface PerformanceMetrics {
  onTimeReturns: number; // percentage
  damageRate: number; // percentage
  customerSatisfaction: number; // rating out of 5
  averageExtensions: number;
  disputeRate: number; // percentage
}

export interface RentalCustomerMetrics {
  totalCustomers: number;
  repeatCustomers: number;
  averageRentalsPerCustomer: number;
  customerLifetimeValue: number;
  topCustomers: TopRentalCustomer[];
}

export interface TopRentalCustomer {
  customerId: string;
  customerName: string;
  totalRentals: number;
  totalRevenue: number;
  averageRentalDuration: number;
  lastRentalDate: Date;
}

// Rental Search and Filter
export interface RentalSearchParams {
  status?: RentalStatus[];
  customerId?: string;
  supplierId?: string;
  productId?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
  minValue?: number;
  maxValue?: number;
  overdue?: boolean;
  sortBy?: 'newest' | 'oldest' | 'value' | 'duration';
  page?: number;
  limit?: number;
}

export interface RentalSearchResult {
  rentals: RentalAgreement[];
  totalCount: number;
  page: number;
  totalPages: number;
  summary: RentalSearchSummary;
}

export interface RentalSearchSummary {
  totalValue: number;
  averageValue: number;
  averageDuration: number;
  statusBreakdown: Record<RentalStatus, number>;
}