// Product and Equipment Types
export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
  PENDING_APPROVAL = 'pending_approval'
}

export enum ProductCondition {
  NEW = 'new',
  REFURBISHED = 'refurbished',
  USED_EXCELLENT = 'used_excellent',
  USED_GOOD = 'used_good',
  USED_FAIR = 'used_fair'
}

export enum AvailabilityType {
  SALE = 'sale',
  RENT = 'rent',
  BOTH = 'both'
}

export enum ProductCategory {
  DIAGNOSTIC = 'diagnostic',
  SURGICAL = 'surgical',
  MONITORING = 'monitoring',
  LABORATORY = 'laboratory',
  IMAGING = 'imaging',
  DENTAL = 'dental',
  REHABILITATION = 'rehabilitation',
  EMERGENCY = 'emergency',
  STERILIZATION = 'sterilization',
  FURNITURE = 'furniture',
  CONSUMABLES = 'consumables',
  PPE = 'ppe'
}

// Base Product Interface
export interface Product {
  id: string;
  supplierId: string;
  sku: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  category: ProductCategory;
  subcategory?: string;
  brand: string;
  model: string;
  manufacturerCountry?: string;
  condition: ProductCondition;
  availabilityType: AvailabilityType;
  status: ProductStatus;
  images: ProductImage[];
  specifications: ProductSpecification[];
  certifications: ProductCertification[];
  warranty: WarrantyInfo;
  dimensions?: Dimensions;
  weight?: number; // in kg
  tags: string[];
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
}

// Product Image
export interface ProductImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

// Product Specification
export interface ProductSpecification {
  name: string;
  nameAr?: string;
  value: string;
  valueAr?: string;
  unit?: string;
  category?: string; // Technical, Physical, Electrical, etc.
}

// Product Certification
export interface ProductCertification {
  name: string;
  issuingBody: string;
  certificateNumber: string;
  issueDate: Date;
  expiryDate?: Date;
  documentUrl?: string;
  region?: string; // FDA, CE, SFDA, etc.
}

// Warranty Information
export interface WarrantyInfo {
  duration: number; // in months
  type: 'manufacturer' | 'extended' | 'supplier';
  coverage: string;
  terms: string;
  claimProcess?: string;
}

// Dimensions
export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'inch';
}

// Sales-specific Product Extension
export interface SalesProduct extends Product {
  pricing: SalesPricing;
  inventory: SalesInventory;
  shipping: ShippingInfo;
}

export interface SalesPricing {
  basePrice: number;
  currency: string;
  discountedPrice?: number;
  discountPercentage?: number;
  bulkPricing?: BulkPricing[];
  taxRate?: number;
  priceValidUntil?: Date;
}

export interface BulkPricing {
  minQuantity: number;
  maxQuantity?: number;
  unitPrice: number;
  discountPercentage: number;
}

export interface SalesInventory {
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  warehouseStock: WarehouseStock[];
  restockDate?: Date;
  lowStockThreshold: number;
  trackInventory: boolean;
}

export interface WarehouseStock {
  warehouseId: string;
  warehouseName: string;
  location: string;
  quantity: number;
}

export interface ShippingInfo {
  weight: number; // in kg
  dimensions: Dimensions;
  shippingClass: 'standard' | 'oversized' | 'hazmat' | 'fragile';
  freeShipping: boolean;
  freeShippingThreshold?: number;
  estimatedDeliveryDays: {
    local: number;
    national: number;
    international?: number;
  };
  shippingRestrictions?: string[];
}

// Rental-specific Product Extension
export interface RentalProduct extends Product {
  pricing: RentalPricing;
  inventory: RentalInventory;
  rentalTerms: RentalTerms;
  maintenance: MaintenanceSchedule;
}

export interface RentalPricing {
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  currency: string;
  securityDeposit: number;
  deliveryFee?: number;
  setupFee?: number;
  minimumRentalPeriod: number; // in days
  maximumRentalPeriod?: number; // in days
}

export interface RentalInventory {
  totalUnits: number;
  availableUnits: number;
  rentedUnits: number;
  maintenanceUnits: number;
  unitDetails: RentalUnit[];
}

export interface RentalUnit {
  id: string;
  serialNumber: string;
  condition: ProductCondition;
  status: 'available' | 'rented' | 'maintenance' | 'retired';
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  currentRentalId?: string;
  location?: string;
  notes?: string;
}

export interface RentalTerms {
  agreementTemplate: string;
  includedServices: string[];
  excludedServices: string[];
  damagePolicy: string;
  lateReturnPolicy: string;
  lateReturnFeePerDay: number;
  cancellationPolicy: string;
  cancellationFee?: number;
  insuranceRequired: boolean;
  insuranceOptions?: InsuranceOption[];
}

export interface InsuranceOption {
  name: string;
  coverage: string;
  dailyCost: number;
  deductible: number;
}

export interface MaintenanceSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  lastServiceDate?: Date;
  nextServiceDate?: Date;
  serviceProvider?: string;
  includesPreventiveMaintenance: boolean;
  includesEmergencySupport: boolean;
  responseTime?: number; // in hours
}

// Product Review and Rating
export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userType: string;
  rating: number; // 1-5
  title?: string;
  comment: string;
  pros?: string[];
  cons?: string[];
  verifiedPurchase: boolean;
  helpful: number;
  notHelpful: number;
  images?: string[];
  createdAt: Date;
  updatedAt?: Date;
  response?: SupplierResponse;
}

export interface SupplierResponse {
  comment: string;
  respondedBy: string;
  respondedAt: Date;
}

// Product Question and Answer
export interface ProductQuestion {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  question: string;
  createdAt: Date;
  answers: ProductAnswer[];
}

export interface ProductAnswer {
  id: string;
  userId: string;
  userName: string;
  userType: string;
  answer: string;
  isSupplierAnswer: boolean;
  helpful: number;
  createdAt: Date;
}

// Product Comparison
export interface ProductComparison {
  products: Product[];
  commonSpecifications: string[];
  differences: ComparisonDifference[];
}

export interface ComparisonDifference {
  specification: string;
  values: {
    productId: string;
    value: string;
  }[];
}

// Product Search and Filter
export interface ProductSearchParams {
  query?: string;
  category?: ProductCategory;
  subcategory?: string;
  brands?: string[];
  conditions?: ProductCondition[];
  availabilityType?: AvailabilityType;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  radius?: number; // in km
  supplierId?: string;
  inStock?: boolean;
  featured?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'popularity';
  page?: number;
  limit?: number;
}

export interface ProductSearchResult {
  products: Product[];
  totalCount: number;
  page: number;
  totalPages: number;
  facets: SearchFacets;
}

export interface SearchFacets {
  categories: FacetItem[];
  brands: FacetItem[];
  conditions: FacetItem[];
  priceRanges: PriceRange[];
  locations: FacetItem[];
}

export interface FacetItem {
  value: string;
  label: string;
  count: number;
}

export interface PriceRange {
  min: number;
  max: number;
  label: string;
  count: number;
}

// Wishlist and Favorites
export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  addedAt: Date;
  notes?: string;
  priceAlert?: PriceAlert;
}

export interface PriceAlert {
  targetPrice: number;
  alertEnabled: boolean;
  lastAlertSent?: Date;
}

// Product Import/Export
export interface ProductImportData {
  products: Partial<Product>[];
  mappings?: FieldMapping[];
  validationErrors?: ValidationError[];
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
}

export interface ValidationError {
  row: number;
  field: string;
  value: any;
  error: string;
}