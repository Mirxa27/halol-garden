export interface BaseItem {
  id: string;
  type: 'product' | 'service' | 'rental';
  title: string;
  titleEn: string;
  description: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  location: string;
  verified: boolean;
  features: string[];
  category: string;
}

export interface ProductItem extends BaseItem {
  type: 'product';
  originalPrice?: number;
  brand: string;
  seller: string;
  inStock: boolean;
}

export interface ServiceItem extends BaseItem {
  type: 'service';
  provider: string;
  duration: string;
  emergency: boolean;
}

export interface RentalItem extends BaseItem {
  type: 'rental';
  priceType: 'يومي' | 'أسبوعي' | 'شهري';
  brand: string;
  provider: string;
  available: boolean;
}

export type CategoryItem = ProductItem | ServiceItem | RentalItem;

export interface Filters {
  categorySlug?: string | null;
  searchQuery: string;
  priceRange: [number, number];
  selectedBrands: string[];
  selectedFeatures: string[];
  selectedLocations: string[];
  ratingFilter: string;
  sortBy: string;
}