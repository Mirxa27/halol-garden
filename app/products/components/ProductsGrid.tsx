'use client';

import { ProductCard } from '@/components/ProductCard';
import { useLanguage } from '@/contexts/LanguageContext';

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  image: string;
  category: string;
  rating?: number;
  reviews?: number;
  supplier?: string;
  inStock?: boolean;
  discount?: number;
}

interface ProductsGridProps {
  products: Product[];
}

export function ProductsGrid({ products }: ProductsGridProps) {
  const { language } = useLanguage();

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">No products found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your filters or search terms
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} language={language} />
      ))}
    </div>
  );
}