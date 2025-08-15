// Maintenance Service Types
export enum MaintenanceRequestStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  ACCEPTED = 'accepted',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed'
}

export enum MaintenanceType {
  PREVENTIVE = 'preventive',
  CORRECTIVE = 'corrective',
  EMERGENCY = 'emergency',
  CALIBRATION = 'calibration',
  INSTALLATION = 'installation',
  INSPECTION = 'inspection',
  UPGRADE = 'upgrade'
}

export enum MaintenancePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ServiceFrequency {
  ONE_TIME = 'one_time',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUAL = 'semi_annual',
  ANNUAL = 'annual',
  AS_NEEDED = 'as_needed'
}

// Maintenance Request
export interface MaintenanceRequest {
  id: string;
  requestNumber: string;
  customerId: string;
  customerType: string;
  equipmentId?: string;
  equipmentDetails: EquipmentDetails;
  type: MaintenanceType;
  priority: MaintenancePriority;
  status: MaintenanceRequestStatus;
  issueDescription: string;
  symptoms?: string[];
  errorCodes?: string[];
  requestedDate: Date;
  preferredSchedule?: PreferredSchedule;
  location: ServiceLocation;
  assignedEngineerId?: string;
  assignedEngineerName?: string;
  estimatedCost?: number;
  actualCost?: number;
  currency: string;
  attachments?: Attachment[];
  history?: MaintenanceHistory[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  assignedAt?: Date;
  scheduledAt?: Date;
  completedAt?: Date;
}

// Equipment Details
export interface EquipmentDetails {
  name: string;
  brand: string;
  model: string;
  serialNumber?: string;
  category: string;
  purchaseDate?: Date;
  warrantyStatus: 'under_warranty' | 'expired' | 'extended' | 'none';
  warrantyExpiry?: Date;
  lastServiceDate?: Date;
  installationDate?: Date;
  usageHours?: number;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  specifications?: Record<string, any>;
}

// Preferred Schedule
export interface PreferredSchedule {
  preferredDates: Date[];
  preferredTimeSlots: TimeSlot[];
  urgency: 'immediate' | 'within_24_hours' | 'within_week' | 'flexible';
  availabilityNotes?: string;
}

export interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

// Service Location
export interface ServiceLocation {
  type: 'on_site' | 'off_site' | 'remote';
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
  contactPerson: string;
  contactPhone: string;
  accessInstructions?: string;
  parkingAvailable?: boolean;
  equipmentAccessible?: boolean;
  safetyRequirements?: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Attachment
export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'document' | 'audio';
  name: string;
  url: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
  description?: string;
}

// Maintenance History
export interface MaintenanceHistory {
  id: string;
  date: Date;
  type: MaintenanceType;
  performedBy: string;
  description: string;
  partsReplaced?: string[];
  cost?: number;
  nextServiceDue?: Date;
  warrantyWork: boolean;
  report?: string; // URL to report
}

// Service Assignment
export interface ServiceAssignment {
  id: string;
  requestId: string;
  engineerId: string;
  engineerName: string;
  assignedBy: string;
  assignedAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'reassigned';
  responseDeadline: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  declineReason?: string;
  estimatedArrival?: Date;
  estimatedDuration?: number; // in hours
  quotation?: ServiceQuotation;
  notes?: string;
}

// Service Quotation
export interface ServiceQuotation {
  id: string;
  quotationNumber: string;
  requestId: string;
  engineerId: string;
  laborCost: number;
  partsCost: number;
  travelCost?: number;
  otherCosts?: CostItem[];
  discount?: number;
  tax: number;
  total: number;
  currency: string;
  validUntil: Date;
  terms: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
  sentAt?: Date;
  respondedAt?: Date;
  customerResponse?: string;
}

export interface CostItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Service Work Order
export interface ServiceWorkOrder {
  id: string;
  workOrderNumber: string;
  requestId: string;
  engineerId: string;
  status: 'scheduled' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  checkInLocation?: CheckInLocation;
  workPerformed: WorkPerformed;
  partsUsed?: PartsUsed[];
  testResults?: TestResult[];
  recommendations?: Recommendation[];
  customerSignature?: Signature;
  engineerSignature?: Signature;
  completionReport?: CompletionReport;
  followUpRequired: boolean;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Check-in Location
export interface CheckInLocation {
  timestamp: Date;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  accuracy: number; // in meters
  method: 'gps' | 'manual' | 'qr_code';
}

// Work Performed
export interface WorkPerformed {
  description: string;
  tasks: MaintenanceTask[];
  totalLaborHours: number;
  complications?: string;
  resolutionNotes?: string;
}

export interface MaintenanceTask {
  name: string;
  completed: boolean;
  duration: number; // in minutes
  notes?: string;
}

// Parts Used
export interface PartsUsed {
  partNumber: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  warranty?: PartWarranty;
  supplier?: string;
  isCustomerProvided: boolean;
}

export interface PartWarranty {
  duration: number; // in months
  startDate: Date;
  terms: string;
}

// Test Result
export interface TestResult {
  testName: string;
  testType: string;
  result: 'pass' | 'fail' | 'partial';
  measurements?: Measurement[];
  notes?: string;
  attachments?: string[];
}

export interface Measurement {
  parameter: string;
  value: number;
  unit: string;
  normalRange?: {
    min: number;
    max: number;
  };
  status: 'normal' | 'warning' | 'critical';
}

// Recommendation
export interface Recommendation {
  type: 'immediate' | 'scheduled' | 'optional';
  description: string;
  estimatedCost?: number;
  priority: MaintenancePriority;
  deadline?: Date;
}

// Signature
export interface Signature {
  name: string;
  role: string;
  signedAt: Date;
  signature: string; // base64 or URL
  ipAddress?: string;
}

// Completion Report
export interface CompletionReport {
  summary: string;
  rootCause?: string;
  actionsTaken: string[];
  preventiveMeasures?: string[];
  equipmentCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  operationalStatus: 'fully_operational' | 'partially_operational' | 'non_operational';
  safetyChecks: SafetyCheck[];
  performanceMetrics?: PerformanceMetric[];
  photos?: string[];
  additionalNotes?: string;
}

export interface SafetyCheck {
  item: string;
  status: 'pass' | 'fail' | 'not_applicable';
  notes?: string;
}

export interface PerformanceMetric {
  metric: string;
  value: number;
  unit: string;
  benchmark?: number;
  status: 'optimal' | 'acceptable' | 'below_standard';
}

// Service Contract
export interface ServiceContract {
  id: string;
  contractNumber: string;
  customerId: string;
  supplierId?: string;
  engineerId?: string;
  equipmentCovered: EquipmentCoverage[];
  serviceLevel: 'basic' | 'standard' | 'premium' | 'custom';
  frequency: ServiceFrequency;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  pricing: ContractPricing;
  inclusions: string[];
  exclusions: string[];
  responseTime: ResponseTime;
  penalties?: Penalty[];
  terms: string;
  status: 'draft' | 'active' | 'expired' | 'cancelled' | 'renewed';
  createdAt: Date;
  signedAt?: Date;
  renewedAt?: Date;
  cancelledAt?: Date;
}

export interface EquipmentCoverage {
  equipmentId: string;
  name: string;
  serialNumber?: string;
  coverageType: 'full' | 'parts_only' | 'labor_only' | 'preventive_only';
  location: string;
}

export interface ContractPricing {
  model: 'fixed' | 'per_visit' | 'per_hour' | 'hybrid';
  basePrice: number;
  currency: string;
  billingFrequency: 'monthly' | 'quarterly' | 'annually' | 'per_service';
  additionalVisitCost?: number;
  partsIncluded: boolean;
  partsDiscount?: number; // percentage
  laborRate?: number;
  emergencyServiceSurcharge?: number; // percentage
}

export interface ResponseTime {
  critical: number; // in hours
  high: number;
  medium: number;
  low: number;
  businessHoursOnly: boolean;
}

export interface Penalty {
  condition: string;
  amount: number;
  type: 'fixed' | 'percentage';
}

// Engineer Schedule
export interface EngineerSchedule {
  engineerId: string;
  date: Date;
  appointments: ScheduleAppointment[];
  availability: AvailabilitySlot[];
  travelTime: number; // total minutes
  utilization: number; // percentage
}

export interface ScheduleAppointment {
  id: string;
  requestId: string;
  customerName: string;
  location: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  type: MaintenanceType;
  priority: MaintenancePriority;
  status: 'confirmed' | 'tentative' | 'in_progress' | 'completed';
  travelTimeFrom?: number; // in minutes
  notes?: string;
}

export interface AvailabilitySlot {
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
}

// Maintenance Analytics
export interface MaintenanceAnalytics {
  overview: MaintenanceOverview;
  performance: MaintenancePerformance;
  financial: MaintenanceFinancial;
  equipment: EquipmentAnalytics;
  engineer: EngineerAnalytics;
}

export interface MaintenanceOverview {
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  averageResponseTime: number; // in hours
  averageResolutionTime: number; // in hours
  customerSatisfaction: number; // rating out of 5
}

export interface MaintenancePerformance {
  firstTimeFixRate: number; // percentage
  repeatServiceRate: number; // percentage
  slaCompliance: number; // percentage
  preventiveVsCorrective: {
    preventive: number;
    corrective: number;
  };
  breakdownsByCategory: Record<string, number>;
}

export interface MaintenanceFinancial {
  totalRevenue: number;
  averageTicketValue: number;
  laborRevenue: number;
  partsRevenue: number;
  profitMargin: number; // percentage
  outstandingPayments: number;
}

export interface EquipmentAnalytics {
  mostServiced: EquipmentServiceStats[];
  failureRates: EquipmentFailureRate[];
  maintenanceCosts: EquipmentCost[];
  reliability: EquipmentReliability[];
}

export interface EquipmentServiceStats {
  equipmentId: string;
  name: string;
  serviceCount: number;
  totalCost: number;
  averageDowntime: number; // in hours
}

export interface EquipmentFailureRate {
  category: string;
  failureRate: number; // percentage
  mtbf: number; // mean time between failures in days
}

export interface EquipmentCost {
  equipmentId: string;
  name: string;
  maintenanceCost: number;
  costPerYear: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface EquipmentReliability {
  equipmentId: string;
  name: string;
  uptime: number; // percentage
  availability: number; // percentage
  performanceEfficiency: number; // percentage
}

export interface EngineerAnalytics {
  performance: EngineerPerformance[];
  utilization: EngineerUtilization[];
  skills: EngineerSkills[];
  ratings: EngineerRatings[];
}

export interface EngineerPerformance {
  engineerId: string;
  name: string;
  completedJobs: number;
  averageJobTime: number; // in hours
  firstTimeFixRate: number; // percentage
  revenue: number;
}

export interface EngineerUtilization {
  engineerId: string;
  name: string;
  utilizationRate: number; // percentage
  billableHours: number;
  travelTime: number;
  idleTime: number;
}

export interface EngineerSkills {
  engineerId: string;
  name: string;
  specializations: string[];
  certifications: string[];
  equipmentExpertise: string[];
  trainingNeeded?: string[];
}

export interface EngineerRatings {
  engineerId: string;
  name: string;
  averageRating: number; // out of 5
  totalReviews: number;
  recommendationRate: number; // percentage
  complaints: number;
}