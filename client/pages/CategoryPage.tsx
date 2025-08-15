import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Eye, 
  MessageCircle,
  Wrench,
  Calendar,
  ShoppingCart,
  Heart,
  TrendingUp,
  Package,
  Shield,
  Truck,
  Clock,
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
  CheckCircle,
  ArrowUpDown
} from "lucide-react";

export default function CategoryPage() {
  const { categorySlug } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 2000]);
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
  const allItems = [
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

  const brands = ['Siemens', 'Philips', 'GE Healthcare', 'Canon', 'Fujifilm'];
  const locations = ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة'];
  const features = ['تصوير رقمي', 'جودة عالية', 'سهولة الاستخدام', 'محمول', 'ضمان شامل'];

  const sortOptions = [
    { value: 'popularity', label: 'الأكثر شعبية' },
    { value: 'rating', label: 'الأعلى تقييماً' },
    { value: 'price-low', label: 'السعر: من الأقل للأعلى' },
    { value: 'price-high', label: 'السعر: من الأعلى للأقل' },
    { value: 'newest', label: 'الأحدث' },
    { value: 'name', label: 'الاسم أ-ي' }
  ];

  const filteredAndSortedItems = useMemo(() => {
    let items = allItems;

    // Filter by category
    if (categorySlug && categorySlug !== 'all') {
      items = items.filter(item => item.category === categorySlug);
    }

    // Filter by search query
    if (searchQuery) {
      items = items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by price range
    items = items.filter(item => 
      item.price >= priceRange[0] && item.price <= priceRange[1]
    );

    // Filter by brands
    if (selectedBrands.length > 0) {
      items = items.filter(item => 
        'brand' in item && selectedBrands.includes(item.brand)
      );
    }

    // Filter by features
    if (selectedFeatures.length > 0) {
      items = items.filter(item =>
        selectedFeatures.some(feature => item.features.includes(feature))
      );
    }

    // Filter by locations
    if (selectedLocations.length > 0) {
      items = items.filter(item => selectedLocations.includes(item.location));
    }

    // Filter by rating
    if (ratingFilter !== 'all') {
      const minRating = parseFloat(ratingFilter);
      items = items.filter(item => item.rating >= minRating);
    }

    // Sort items
    switch (sortBy) {
      case 'rating':
        items.sort((a, b) => b.rating - a.rating);
        break;
      case 'price-low':
        items.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        items.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        items.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'newest':
        // Simulate newest first (would use actual date in real app)
        items.reverse();
        break;
      default: // popularity
        items.sort((a, b) => b.reviews - a.reviews);
    }

    return items;
  }, [categorySlug, searchQuery, priceRange, selectedBrands, selectedFeatures, selectedLocations, ratingFilter, sortBy]);

  const handleBrandChange = (brand: string, checked: boolean) => {
    if (checked) {
      setSelectedBrands([...selectedBrands, brand]);
    } else {
      setSelectedBrands(selectedBrands.filter(b => b !== brand));
    }
  };

  const handleFeatureChange = (feature: string, checked: boolean) => {
    if (checked) {
      setSelectedFeatures([...selectedFeatures, feature]);
    } else {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feature));
    }
  };

  const handleLocationChange = (location: string, checked: boolean) => {
    if (checked) {
      setSelectedLocations([...selectedLocations, location]);
    } else {
      setSelectedLocations(selectedLocations.filter(l => l !== location));
    }
  };

  const clearFilters = () => {
    setPriceRange([0, 2000]);
    setSelectedBrands([]);
    setSelectedFeatures([]);
    setSelectedLocations([]);
    setRatingFilter('all');
    setSearchQuery('');
  };

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'service':
        return <Wrench className="h-4 w-4" />;
      case 'rental':
        return <Calendar className="h-4 w-4" />;
      case 'product':
        return <Package className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getItemTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'service':
        return 'bg-primary text-primary-foreground';
      case 'rental':
        return 'bg-accent text-accent-foreground';
      case 'product':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'service':
        return 'خدمة';
      case 'rental':
        return 'إيجار';
      case 'product':
        return 'منتج';
      default:
        return 'عنصر';
    }
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
                {/* Mobile Filter Toggle */}
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

                <Card className={`glass-card border-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-primary text-arabic flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        تصفية النتائج
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-muted-foreground hover:text-primary text-arabic"
                      >
                        <X className="h-4 w-4 ml-1" />
                        مسح
                      </Button>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Price Range */}
                      <div>
                        <label className="text-sm font-medium text-arabic mb-3 block">نطاق السعر</label>
                        <div className="px-2">
                          <Slider
                            value={priceRange}
                            onValueChange={setPriceRange}
                            max={200000}
                            min={0}
                            step={100}
                            className="mb-2"
                          />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{priceRange[0]} ريال</span>
                            <span>{priceRange[1]} ريال</span>
                          </div>
                        </div>
                      </div>

                      {/* Rating Filter */}
                      <div>
                        <label className="text-sm font-medium text-arabic mb-2 block">التقييم</label>
                        <Select value={ratingFilter} onValueChange={setRatingFilter}>
                          <SelectTrigger className="glass">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">جميع التقييمات</SelectItem>
                            <SelectItem value="4.5">4.5 نجوم فأكثر</SelectItem>
                            <SelectItem value="4">4 نجوم فأكثر</SelectItem>
                            <SelectItem value="3.5">3.5 نجوم فأكثر</SelectItem>
                            <SelectItem value="3">3 نجوم فأكثر</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Brands */}
                      <div>
                        <h4 className="text-sm font-medium text-arabic mb-3">العلامات التجارية</h4>
                        <div className="space-y-2">
                          {brands.map((brand) => (
                            <div key={brand} className="flex items-center space-x-2">
                              <Checkbox
                                id={`brand-${brand}`}
                                checked={selectedBrands.includes(brand)}
                                onCheckedChange={(checked) => handleBrandChange(brand, checked as boolean)}
                              />
                              <label
                                htmlFor={`brand-${brand}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mr-2"
                              >
                                {brand}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Features */}
                      <div>
                        <h4 className="text-sm font-medium text-arabic mb-3">الميزات</h4>
                        <div className="space-y-2">
                          {features.map((feature) => (
                            <div key={feature} className="flex items-center space-x-2">
                              <Checkbox
                                id={`feature-${feature}`}
                                checked={selectedFeatures.includes(feature)}
                                onCheckedChange={(checked) => handleFeatureChange(feature, checked as boolean)}
                              />
                              <label
                                htmlFor={`feature-${feature}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mr-2 text-arabic"
                              >
                                {feature}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Locations */}
                      <div>
                        <h4 className="text-sm font-medium text-arabic mb-3">المواقع</h4>
                        <div className="space-y-2">
                          {locations.map((location) => (
                            <div key={location} className="flex items-center space-x-2">
                              <Checkbox
                                id={`location-${location}`}
                                checked={selectedLocations.includes(location)}
                                onCheckedChange={(checked) => handleLocationChange(location, checked as boolean)}
                              />
                              <label
                                htmlFor={`location-${location}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mr-2 text-arabic"
                              >
                                {location}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground text-arabic">
                    {filteredAndSortedItems.length} نتيجة
                  </span>
                  {(searchQuery || selectedBrands.length > 0 || selectedFeatures.length > 0 || selectedLocations.length > 0 || ratingFilter !== 'all') && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-primary text-arabic">مُرشّح</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  {/* View Mode Toggle */}
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-none"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[200px] glass">
                      <ArrowUpDown className="h-4 w-4 ml-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Items Grid/List */}
              {filteredAndSortedItems.length === 0 ? (
                <Card className="glass-card border-0">
                  <CardContent className="p-12 text-center">
                    <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-primary mb-2 text-arabic">لا توجد نتائج</h3>
                    <p className="text-muted-foreground mb-6 text-arabic">
                      لم نجد أي عناصر تطابق معايير البحث الحالية
                    </p>
                    <Button onClick={clearFilters} className="bg-primary hover:bg-primary/90 text-arabic">
                      مسح جميع المرشحات
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'md:grid-cols-2 xl:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {filteredAndSortedItems.map((item) => (
                    <Card key={item.id} className={`glass-card border-0 hover:shadow-xl transition-all duration-300 ${
                      viewMode === 'list' ? 'p-0' : ''
                    }`}>
                      <CardContent className={viewMode === 'list' ? 'p-6' : 'p-4'}>
                        <div className={`flex ${viewMode === 'list' ? 'gap-6' : 'flex-col'}`}>
                          {/* Image */}
                          <div className={`${
                            viewMode === 'list' 
                              ? 'w-32 h-32 flex-shrink-0' 
                              : 'w-full h-48 mb-4'
                          } rounded-xl overflow-hidden bg-white`}>
                            <img 
                              src={item.image} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className={getItemTypeBadgeColor(item.type)}>
                                    {getItemTypeIcon(item.type)}
                                    <span className="mr-1">{getItemTypeLabel(item.type)}</span>
                                  </Badge>
                                  {item.verified && (
                                    <Badge className="bg-success text-success-foreground text-xs">
                                      <CheckCircle className="h-3 w-3 ml-1" />
                                      موثق
                                    </Badge>
                                  )}
                                  {item.type === 'service' && 'emergency' in item && item.emergency && (
                                    <Badge className="bg-destructive text-destructive-foreground text-xs">
                                      ط��ارئ
                                    </Badge>
                                  )}
                                </div>
                                
                                <h3 className="font-bold text-primary text-lg mb-1 text-arabic line-clamp-2">
                                  {item.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                                  {item.titleEn}
                                </p>
                                <p className="text-sm text-muted-foreground text-arabic mb-3 line-clamp-2">
                                  {item.description}
                                </p>
                                
                                {/* Provider/Seller */}
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                  <span className="text-arabic">
                                    {item.type === 'product' && 'seller' in item ? item.seller : 
                                     item.type === 'service' && 'provider' in item ? item.provider :
                                     item.type === 'rental' && 'provider' in item ? item.provider : ''}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-current text-success" />
                                    <span>{item.rating}</span>
                                    <span>({item.reviews})</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{item.location}</span>
                                  </div>
                                </div>

                                {/* Features */}
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {item.features.slice(0, 3).map((feature, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {feature}
                                    </Badge>
                                  ))}
                                  {item.features.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{item.features.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Price and Actions */}
                            <div className="flex items-center justify-between">
                              <div className="text-left">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-2xl font-bold text-primary">{item.price}</span>
                                  <span className="text-sm text-muted-foreground">ريال</span>
                                  {item.type === 'rental' && 'priceType' in item && (
                                    <span className="text-xs text-muted-foreground text-arabic">/{item.priceType}</span>
                                  )}
                                </div>
                                {item.type === 'product' && 'originalPrice' in item && item.originalPrice && item.originalPrice > item.price && (
                                  <div className="text-sm text-muted-foreground line-through">
                                    {item.originalPrice} ريال
                                  </div>
                                )}
                                {item.type === 'service' && 'duration' in item && (
                                  <div className="text-xs text-muted-foreground text-arabic">
                                    المدة: {item.duration}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="glass-hover border-primary/30">
                                  <Heart className="h-3 w-3" />
                                </Button>
                                <Link to={
                                  item.type === 'product' ? `/product/${item.id}` :
                                  item.type === 'service' ? `/services/${item.id}` :
                                  `/rental/${item.id}`
                                }>
                                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-arabic">
                                    <Eye className="ml-2 h-3 w-3" />
                                    {viewMode === 'list' ? 'عرض التفاصيل' : 'عرض'}
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Load More */}
              {filteredAndSortedItems.length > 0 && (
                <div className="text-center mt-8">
                  <Button variant="outline" className="glass-hover border-primary/30 text-arabic">
                    عرض المزيد من النتائج
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
