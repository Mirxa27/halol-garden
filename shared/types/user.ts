// User Types and Enums
export enum UserType {
  HEALTHCARE_PROVIDER = 'healthcare_provider',
  EQUIPMENT_SUPPLIER = 'equipment_supplier',
  MAINTENANCE_ENGINEER = 'maintenance_engineer',
  CUSTOMER_SERVICE = 'customer_service',
  ADMIN = 'admin',
  INDIVIDUAL_CUSTOMER = 'individual_customer'
}

export enum UserStatus {
  PENDING_VERIFICATION = 'pending_verification',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive'
}

export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  EMAIL_VERIFIED = 'email_verified',
  DOCUMENTS_VERIFIED = 'documents_verified',
  FULLY_VERIFIED = 'fully_verified'
}

// Base User Interface
export interface BaseUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userType: UserType;
  status: UserStatus;
  verificationStatus: VerificationStatus;
  profileImage?: string;
  preferredLanguage: 'en' | 'ar';
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  emailVerifiedAt?: Date;
  twoFactorEnabled: boolean;
}

// Healthcare Provider Specific
export interface HealthcareProviderProfile {
  organizationName: string;
  organizationType: 'hospital' | 'clinic' | 'diagnostic_center' | 'pharmacy' | 'other';
  licenseNumber: string;
  taxRegistrationNumber?: string;
  address: Address;
  numberOfBeds?: number;
  specializations: string[];
  yearEstablished?: number;
  accreditations: Accreditation[];
  contactPersons: ContactPerson[];
  operatingHours: OperatingHours;
  emergencyContact?: string;
}

// Equipment Supplier Specific
export interface EquipmentSupplierProfile {
  companyName: string;
  businessRegistrationNumber: string;
  taxRegistrationNumber: string;
  address: Address;
  warehouseLocations: Address[];
  productCategories: string[];
  brands: string[];
  yearEstablished: number;
  certifications: Certification[];
  bankDetails: BankDetails;
  deliveryCapabilities: DeliveryCapabilities;
  returnPolicy: string;
  warrantyTerms: string;
}

// Maintenance Engineer Specific
export interface MaintenanceEngineerProfile {
  companyName?: string;
  isFreelancer: boolean;
  licenseNumber: string;
  specializations: string[];
  certifications: EngineerCertification[];
  experienceYears: number;
  serviceAreas: string[];
  availability: Availability;
  hourlyRate?: number;
  emergencyServiceAvailable: boolean;
  emergencyServiceSurcharge?: number;
  toolsAndEquipment: string[];
  insuranceCoverage?: InsuranceCoverage;
}

// Customer Service Representative Specific
export interface CustomerServiceProfile {
  employeeId: string;
  department: string;
  supervisor?: string;
  languages: string[];
  specializations: string[];
  shiftSchedule: ShiftSchedule;
  performanceMetrics?: PerformanceMetrics;
}

// Admin Specific
export interface AdminProfile {
  employeeId: string;
  department: string;
  accessLevel: 'super_admin' | 'admin' | 'moderator';
  permissions: string[];
  managedRegions?: string[];
  managedCategories?: string[];
}

// Individual Customer Specific
export interface IndividualCustomerProfile {
  dateOfBirth?: Date;
  nationalId?: string;
  address: Address;
  medicalLicenseNumber?: string; // For healthcare professionals
  profession?: string;
  preferredPaymentMethod?: string;
}

// Supporting Interfaces
export interface Address {
  street: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Accreditation {
  name: string;
  issuingBody: string;
  issueDate: Date;
  expiryDate?: Date;
  documentUrl?: string;
}

export interface ContactPerson {
  name: string;
  position: string;
  email: string;
  phoneNumber: string;
  isPrimary: boolean;
}

export interface OperatingHours {
  [key: string]: { // day of week
    open: string;
    close: string;
    isClosed: boolean;
  };
}

export interface Certification {
  name: string;
  issuingBody: string;
  certificateNumber: string;
  issueDate: Date;
  expiryDate?: Date;
  documentUrl?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

export interface EngineerCertification extends Certification {
  equipmentBrands?: string[];
  equipmentCategories?: string[];
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  swiftCode?: string;
  iban?: string;
  currency: string;
}

export interface DeliveryCapabilities {
  ownFleet: boolean;
  thirdPartyLogistics: boolean;
  deliveryRadius: number; // in kilometers
  expressDeliveryAvailable: boolean;
  installationServiceAvailable: boolean;
  internationalShipping: boolean;
}

export interface Availability {
  schedule: {
    [key: string]: { // day of week
      available: boolean;
      startTime?: string;
      endTime?: string;
    };
  };
  vacationDates?: DateRange[];
  nextAvailableSlot?: Date;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ShiftSchedule {
  pattern: 'fixed' | 'rotating';
  shifts: {
    [key: string]: { // day of week or shift name
      startTime: string;
      endTime: string;
    };
  };
}

export interface PerformanceMetrics {
  ticketsHandled: number;
  averageResponseTime: number; // in minutes
  customerSatisfactionScore: number;
  resolutionRate: number;
  escalationRate: number;
}

export interface InsuranceCoverage {
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  expiryDate: Date;
  coverageTypes: string[];
}

// Complete User Type Definitions
export interface HealthcareProvider extends BaseUser {
  userType: UserType.HEALTHCARE_PROVIDER;
  profile: HealthcareProviderProfile;
}

export interface EquipmentSupplier extends BaseUser {
  userType: UserType.EQUIPMENT_SUPPLIER;
  profile: EquipmentSupplierProfile;
}

export interface MaintenanceEngineer extends BaseUser {
  userType: UserType.MAINTENANCE_ENGINEER;
  profile: MaintenanceEngineerProfile;
}

export interface CustomerServiceRep extends BaseUser {
  userType: UserType.CUSTOMER_SERVICE;
  profile: CustomerServiceProfile;
}

export interface Admin extends BaseUser {
  userType: UserType.ADMIN;
  profile: AdminProfile;
}

export interface IndividualCustomer extends BaseUser {
  userType: UserType.INDIVIDUAL_CUSTOMER;
  profile: IndividualCustomerProfile;
}

// Union type for all users
export type User = 
  | HealthcareProvider 
  | EquipmentSupplier 
  | MaintenanceEngineer 
  | CustomerServiceRep 
  | Admin 
  | IndividualCustomer;

// Authentication related interfaces
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userType: UserType;
  organizationDetails?: Partial<HealthcareProviderProfile | EquipmentSupplierProfile>;
  acceptTerms: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface EmailVerification {
  userId: string;
  token: string;
  expiresAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}