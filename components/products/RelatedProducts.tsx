'use client';

import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RelatedProductsProps {
  category: string;
  currentProductId: string;
}

export function RelatedProducts({ category, currentProductId }: RelatedProductsProps) {
  // Mock related products - in production, fetch from API
  const relatedProducts = [
    {
      id: '2',
      name: 'CT Scanner Advanced',
      nameAr: 'جهاز الأشعة المقطعية المتقدم',
      price: 380000,
      image: '/images/products/ct-scanner.jpg',
      category: 'DIAGNOSTIC',
      rating: 4.7,
      supplier: 'HealthTech Pro',
    },
    {
      id: '3',
      name: 'Ultrasound System HD',
      nameAr: 'نظام الموجات فوق الصوتية عالي الدقة',
      price: 75000,
      image: '/images/products/ultrasound.jpg',
      category: 'DIAGNOSTIC',
      rating: 4.6,
      supplier: 'MedEquip Solutions',
    },
    {
      id: '4',
      name: 'Digital X-Ray Machine',
      nameAr: 'جهاز الأشعة السينية الرقمي',
      price: 125000,
      image: '/images/products/xray.jpg',
      category: 'DIAGNOSTIC',
      rating: 4.5,
      supplier: 'RadTech Systems',
    },
    {
      id: '5',
      name: 'PET Scanner Pro',
      nameAr: 'ماسح البوزيترون المتقدم',
      price: 920000,
      image: '/images/products/pet-scanner.jpg',
      category: 'DIAGNOSTIC',
      rating: 4.9,
      supplier: 'Nuclear Medical',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Related Products</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedProducts
          .filter(product => product.id !== currentProductId)
          .slice(0, 4)
          .map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
      </div>
    </div>
  );
}