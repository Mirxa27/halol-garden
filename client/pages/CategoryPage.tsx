import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import { useCategoryItems, CategoryItem } from "@/hooks/useCategoryItems";
import { CategoryFilters } from "@/components/category/CategoryFilters";
import { CategoryResults } from "@/components/category/CategoryResults";

export default function CategoryPage() {
  const { categorySlug } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [ratingFilter, setRatingFilter] = useState('all');

  const categoryNames: Record<string, { ar: string; en: string; description: string }> = {
    'imaging': { 
      ar: 'أجهزة التصوير الطبي', 
      en: 'Medical Imaging Equipment',
      description: 'أجهزة التصوير الطبي المتقدمة لتشخيص دقيق وموثوق'
    },
    'respiratory': { 
      ar: 'أجهزة التنفس', 
      en: 'Respiratory Equipment',
      description: 'معدات التنفس والرعاية التنفسية للمرضى'
    },
    'monitoring': { 
      ar: 'أجهزة المراقبة', 
      en: 'Monitoring Devices',
      description: 'أجهزة مراقبة العلامات الحيوية والحالة الصحية'
    },
    'surgical': { 
      ar: 'المعدات الجراحية', 
      en: 'Surgical Equipment',
      description: 'معدات وأدوات جراحية متطورة للعمليات الطبية'
    },
    'laboratory': { 
      ar: 'معدات المختبر', 
      en: 'Laboratory Equipment',
      description: 'أجهزة ومعدات المختبرات الطبية للتحاليل والفحوصات'
    },
    'emergency': { 
      ar: 'معدات الطوارئ', 
      en: 'Emergency Equipment',
      description: 'معدات الطوارئ والإنعاش للحالات الحرجة'
    }
  };

  const category = categorySlug ? categoryNames[categorySlug] : null;

  // Mock data for products and services
  const allItems: CategoryItem[] = [
    {
      id: '1',
      type: 'product' as const,
      title: 'جهاز الأشعة السينية الرقمي',
      titleEn: 'Digital X-Ray Machine',
      description: 'جهاز أشعة سينية رقمي عالي الدقة مع نظام معالجة متقدم',
      price: 85000,
      originalPrice: 95000,
      rating: 4.8,
      reviews: 45,
      image: '/placeholder.svg',
      brand: 'Siemens',
      seller: 'شركة المعدات الطبية المتقدمة',
      location: 'الرياض',
      inStock: true,
      verified: true,
      features: ['تصوير رقمي', 'جودة عالية', 'سهولة الاستخدام'],
      category: 'imaging'
    },
    {
      id: '2',
      type: 'service' as const,
      title: 'صيانة أجهزة الأشعة السينية',
      titleEn: 'X-Ray Equipment Maintenance',
      description: 'خدمة صيانة شاملة لأجهزة الأشعة السينية من جميع الأنواع',
      price: 450,
      rating: 4.9,
      reviews: 124,
      image: '/placeholder.svg',
      provider: 'شركة الرعاية الطبية المتقدمة',
      location: 'الرياض',
      verified: true,
      duration: '2-4 ساعات',
      emergency: true,
      features: ['صيانة شاملة', 'ضمان 3 أشهر', 'استجابة سريعة'],
      category: 'imaging'
    },
    {
      id: '3',
      type: 'rental' as const,
      title: 'إيجار جهاز الموجات فوق الصوتية',
      titleEn: 'Ultrasound Machine Rental',
      description: 'جهاز الموجات فوق الصوتية المحمول للإيجار اليومي والشهري',
      price: 300,
      priceType: 'يومي',
      rating: 4.7,
      reviews: 89,
      image: '/placeholder.svg',
      brand: 'GE Healthcare',
      provider: 'مؤسسة التأجير الطبي',
      location: 'جدة',
      available: true,
      verified: true,
      features: ['محمول', 'جودة عالية', 'سهل الاستخدام'],
      category: 'imaging'
    },
    {
      id: '4',
      type: 'product' as const,
      title: 'جهاز التصوير المقطعي',
      titleEn: 'CT Scanner',
      description: 'جهاز التصوير المقطعي متعدد الشرائح بتقنية حديثة',
      price: 150000,
      originalPrice: 170000,
      rating: 4.9,
      reviews: 23,
      image: '/placeholder.svg',
      brand: 'Philips',
      seller: 'الوكيل المعتمد',
      location: 'الرياض',
      inStock: true,
      verified: true,
      features: ['تصوير سريع', 'دقة عالية', 'إشعاع منخفض'],
      category: 'imaging'
    },
    {
      id: '5',
      type: 'service' as const,
      title: 'معايرة أجهزة التصوير',
      titleEn: 'Imaging Equipment Calibration',
      description: 'خدمة معايرة وضبط أجهزة التصوير الطبي لضمان دقة النتائج',
      price: 280,
      rating: 4.6,
      reviews: 67,
      image: '/placeholder.svg',
      provider: 'خبراء المعايرة',
      location: 'الدمام',
      verified: true,
      duration: '1-2 ساعات',
      features: ['معايرة دقيقة', 'شهادة معتمدة', 'تقرير مفصل'],
      category: 'imaging'
    }
  ];

  const brands = useMemo(() => [...new Set(allItems.map(item => 'brand' in item ? item.brand : null).filter(Boolean))], [allItems]) as string[];
  const locations = useMemo(() => [...new Set(allItems.map(item => item.location))], [allItems]);
  const features = useMemo(() => [...new Set(allItems.flatMap(item => item.features))], [allItems]);

  const filters = {
    categorySlug,
    searchQuery,
    priceRange,
    selectedBrands,
    selectedFeatures,
    selectedLocations,
    ratingFilter,
    sortBy,
  };

  const filteredAndSortedItems = useCategoryItems(allItems, filters);

  const handleBrandChange = (brand: string, checked: boolean) => {
    setSelectedBrands(prev => checked ? [...prev, brand] : prev.filter(b => b !== brand));
  };

  const handleFeatureChange = (feature: string, checked: boolean) => {
    setSelectedFeatures(prev => checked ? [...prev, feature] : prev.filter(f => f !== feature));
  };

  const handleLocationChange = (location: string, checked: boolean) => {
    setSelectedLocations(prev => checked ? [...prev, location] : prev.filter(l => l !== location));
  };

  const clearFilters = () => {
    setPriceRange([0, 200000]);
    setSelectedBrands([]);
    setSelectedFeatures([]);
    setSelectedLocations([]);
    setRatingFilter('all');
    setSearchQuery('');
  };

  if (!category) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-primary mb-4">فئة غير موجودة</h1>
          <p className="text-muted-foreground mb-8">الفئة التي تبحث عنها غير متوفرة</p>
          <Link to="/sales">
            <Button className="bg-primary hover:bg-primary/90">
              العودة إلى المتجر
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Category Header */}
          <div className="glass-card rounded-3xl p-8 mb-8">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold text-primary mb-3 text-arabic">{category.ar}</h1>
              <p className="text-xl text-muted-foreground mb-2">{category.en}</p>
              <p className="text-muted-foreground text-arabic">{category.description}</p>
            </div>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder={`ابحث في ${category.ar}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass pr-12 text-lg py-3 text-arabic"
                  dir="rtl"
                />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="lg:hidden mb-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-full glass-hover border-primary/30 text-arabic"
                  >
                    <SlidersHorizontal className="ml-2 h-4 w-4" />
                    {showFilters ? 'إخفاء المرشحات' : 'عرض المرشحات'}
                  </Button>
                </div>
                <div className={`${showFilters ? 'block' : 'hidden lg:block'}`}>
                  <CategoryFilters
                    priceRange={priceRange}
                    setPriceRange={setPriceRange}
                    ratingFilter={ratingFilter}
                    setRatingFilter={setRatingFilter}
                    brands={brands}
                    selectedBrands={selectedBrands}
                    handleBrandChange={handleBrandChange}
                    features={features}
                    selectedFeatures={selectedFeatures}
                    handleFeatureChange={handleFeatureChange}
                    locations={locations}
                    selectedLocations={selectedLocations}
                    handleLocationChange={handleLocationChange}
                    clearFilters={clearFilters}
                  />
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              <CategoryResults
                items={filteredAndSortedItems}
                sortBy={sortBy}
                setSortBy={setSortBy}
                viewMode={viewMode}
                setViewMode={setViewMode}
                isLoading={false} // Can be wired to a real loading state
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}