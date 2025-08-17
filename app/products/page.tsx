/**
 * Products Page - Browse all medical devices
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductsGrid } from './components/ProductsGrid';
import { ProductsFilter } from './components/ProductsFilter';
import { ProductsSort } from './components/ProductsSort';
import { ProductsPagination } from './components/ProductsPagination';
import { getTranslations } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Medical Equipment & Devices | Browse Our Catalog',
  description: 'Explore our comprehensive catalog of medical devices, diagnostic equipment, surgical instruments, and healthcare supplies from verified suppliers.',
};

interface ProductsPageProps {
  searchParams: {
    search?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    supplier?: string;
    condition?: string;
    sort?: string;
    page?: string;
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const t = await getTranslations();
  
  // Parse search params
  const filters = {
    search: searchParams.search || '',
    category: searchParams.category || '',
    minPrice: searchParams.minPrice ? parseInt(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? parseInt(searchParams.maxPrice) : undefined,
    supplier: searchParams.supplier || '',
    condition: searchParams.condition || '',
  };

  const sort = searchParams.sort || 'featured';
  const page = searchParams.page ? parseInt(searchParams.page) : 1;

  // Fetch products (this would be an API call in production)
  const products = await fetchProducts({ ...filters, sort, page });
  const totalPages = 10; // This would come from the API

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">{t.common.products}</h1>
            <p className="text-lg text-muted-foreground">
              Browse our extensive catalog of medical equipment from trusted suppliers worldwide
            </p>
            
            {/* Search Results Info */}
            {filters.search && (
              <div className="mt-6 p-4 bg-background rounded-lg border">
                <p className="text-sm">
                  Showing results for: <span className="font-semibold">"{filters.search}"</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:w-64 shrink-0">
              <ProductsFilter filters={filters} />
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              {/* Sort Bar */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">
                  {products.total} products found
                </p>
                <ProductsSort currentSort={sort} />
              </div>

              {/* Products */}
              <Suspense fallback={<ProductsGridSkeleton />}>
                <ProductsGrid products={products.items} />
              </Suspense>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <ProductsPagination
                    currentPage={page}
                    totalPages={totalPages}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Mock function to fetch products
async function fetchProducts(params: any) {
  // This would be replaced with actual API call
  return {
    items: [
      {
        id: '1',
        name: 'MRI Scanner ProMax 3000',
        nameAr: 'جهاز الرنين المغناطيسي بروماكس 3000',
        price: 450000,
        image: '/images/products/mri-scanner.jpg',
        category: 'DIAGNOSTIC',
        rating: 4.8,
        reviews: 124,
        supplier: 'MedTech Solutions',
        inStock: true,
        discount: 10,
      },
      {
        id: '2',
        name: 'Surgical Robot System X1',
        nameAr: 'نظام الروبوت الجراحي X1',
        price: 850000,
        image: '/images/products/surgical-robot.jpg',
        category: 'SURGICAL',
        rating: 4.9,
        reviews: 89,
        supplier: 'Advanced Medical Systems',
        inStock: true,
      },
      {
        id: '3',
        name: 'Patient Monitor X500',
        nameAr: 'جهاز مراقبة المريض X500',
        price: 12000,
        image: '/images/products/patient-monitor.jpg',
        category: 'MONITORING',
        rating: 4.7,
        reviews: 256,
        supplier: 'HealthCare Innovations',
        inStock: true,
        discount: 15,
      },
      {
        id: '4',
        name: 'Ultrasound System UltraView',
        nameAr: 'نظام الموجات فوق الصوتية ألترافيو',
        price: 75000,
        image: '/images/products/ultrasound.jpg',
        category: 'DIAGNOSTIC',
        rating: 4.6,
        reviews: 178,
        supplier: 'Imaging Tech Corp',
        inStock: true,
      },
      {
        id: '5',
        name: 'Ventilator VentPro 2000',
        nameAr: 'جهاز التنفس الصناعي فينت برو 2000',
        price: 25000,
        image: '/images/products/ventilator.jpg',
        category: 'RESPIRATORY',
        rating: 4.8,
        reviews: 92,
        supplier: 'Respiratory Solutions',
        inStock: true,
        discount: 5,
      },
      {
        id: '6',
        name: 'Laboratory Analyzer LabMaster',
        nameAr: 'محلل المختبر لاب ماستر',
        price: 35000,
        image: '/images/products/lab-analyzer.jpg',
        category: 'LABORATORY',
        rating: 4.5,
        reviews: 145,
        supplier: 'Lab Equipment Co',
        inStock: false,
      },
    ],
    total: 156,
    page: params.page,
    perPage: 12,
  };
}

function ProductsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-muted rounded-lg h-64"></div>
          <div className="mt-4 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}