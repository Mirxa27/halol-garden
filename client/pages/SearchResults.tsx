import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchComponent } from "@/components/SearchComponent";
import { GridSkeleton } from "@/components/LoadingStates";
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
  TrendingUp,
  Heart,
  Grid3X3,
  List,
  X,
  CheckCircle,
  Clock
} from "lucide-react";

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState('relevance');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<number[]>([]);

  // Simulate loading
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchQuery, sortBy, filterType]);

  // Load favorites from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('favorites');
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  }, []);

  const toggleFavorite = (id: number) => {
    const updated = favorites.includes(id)
      ? favorites.filter(fav => fav !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
  };

  // Mock search results
  const allResults = [
    {
      id: 1,
      type: 'service',
      title: 'صيانة جهاز الأشعة السينية',
      description: 'خدمة صيانة شاملة لأجهزة الأشعة السينية من جميع الأنواع',
      provider: 'شركة الرعاية الطبية المتقدمة',
      rating: 4.9,
      reviews: 124,
      price: 450,
      location: 'الرياض',
      category: 'maintenance',
      categoryAr: 'صيانة',
      verified: true
    },
    {
      id: 2,
      type: 'product',
      title: 'جهاز قياس ضغط الدم الرقمي',
      description: 'جهاز قياس ضغط الدم الرقمي عالي الدقة من Omron',
      provider: 'متجر الأجهزة الطبية',
      rating: 4.8,
      reviews: 89,
      price: 320,
      originalPrice: 400,
      location: 'جدة',
      category: 'sales',
      categoryAr: 'مبيعات',
      verified: true,
      inStock: true
    },
    {
      id: 3,
      type: 'rental',
      title: 'إيجار جهاز التنفس الاصطناعي',
      description: 'جهاز التنفس الاصطناعي المتقدم للإيجار اليومي والشهري',
      provider: 'مؤسسة الأجهزة المتقدمة',
      rating: 4.7,
      reviews: 156,
      price: 250,
      priceType: 'يومي',
      location: 'الدمام',
      category: 'rental',
      categoryAr: 'إيجار',
      verified: true,
      available: true
    }
  ];

  // Filter and sort results
  const filteredResults = allResults.filter(result => {
    if (filterType !== 'all' && result.category !== filterType) return false;
    if (searchQuery) {
      return result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             result.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
             result.provider.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'recent':
        return b.id - a.id;
      default:
        return 0;
    }
  });

  const searchStats = {
    total: sortedResults.length,
    responseTime: '0.23'
  };

  const categories = [
    { value: 'all', label: 'جميع النتائج' },
    { value: 'maintenance', label: 'الصيانة' },
    { value: 'rental', label: 'الإيجار' },
    { value: 'sales', label: 'المبيعات' }
  ];

  const sortOptions = [
    { value: 'relevance', label: 'الأكثر صلة' },
    { value: 'rating', label: 'التقييم' },
    { value: 'price-low', label: 'السعر: من الأقل للأعلى' },
    { value: 'price-high', label: 'السعر: من الأعلى للأقل' },
    { value: 'newest', label: 'الأحدث' }
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (query) {
        newParams.set('q', query);
      } else {
        newParams.delete('q');
      }
      return newParams;
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'maintenance':
        return <Wrench className="h-4 w-4" />;
      case 'rental':
        return <Calendar className="h-4 w-4" />;
      case 'sales':
        return <ShoppingCart className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'maintenance':
        return 'bg-primary text-primary-foreground';
      case 'rental':
        return 'bg-accent text-accent-foreground';
      case 'sales':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Layout title="نتائج البحث" showBreadcrumbs={false}>
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Search Header */}
        <div className="glass-card rounded-3xl p-6 mb-8">
          <SearchComponent
            placeholder="ابحث عن الأجهزة أو الخدمات..."
            onSearch={handleSearch}
            className="w-full"
          />
          
          {searchQuery && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="text-muted-foreground text-arabic">
                {searchStats.total} نتيجة لـ "<span className="font-semibold text-primary">{searchQuery}</span>" ({searchStats.responseTime} ثانية)
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-success text-arabic">نتائج شائعة</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="glass-card border-0 sticky top-24">
              <CardContent className="p-6">
                <h3 className="font-semibold text-primary mb-4 text-arabic flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  تصفية النتائج
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-arabic mb-2 block">نوع الخدمة</label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="glass">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-arabic mb-2 block">ترتيب حسب</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="glass">
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
                  
                  <Button 
                    variant="outline" 
                    className="w-full glass-hover border-primary/30 text-arabic"
                  >
                    مسح التصفية
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Results */}
          <div className="lg:col-span-3">
            {/* Results Header with Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-primary text-arabic">
                  {searchStats.total} نتائج البحث
                </h2>
                {!isLoading && (
                  <Badge variant="outline" className="text-success border-success">
                    <Clock className="h-3 w-3 ml-1" />
                    {searchStats.responseTime}s
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="glass-hover"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="glass-hover"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <GridSkeleton count={6} type="service" />
            ) : (
              <>
                <div className={viewMode === 'grid' ?
                  "grid grid-cols-1 md:grid-cols-2 gap-6" :
                  "space-y-4"
                }>
                  {sortedResults.map((result) => (
                    <Card key={result.id} className={`glass-card border-0 hover:shadow-xl transition-all duration-300 ${
                      viewMode === 'grid' ? 'h-fit' : ''
                    }`}>
                      <CardContent className="p-6">
                        <div className={`flex items-start gap-4 ${
                          viewMode === 'grid' ? 'flex-col' : 'flex-row'
                        }`}>
                          <div className={`rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center flex-shrink-0 ${
                            viewMode === 'grid' ? 'w-12 h-12' : 'w-16 h-16'
                          }`}>
                            {getCategoryIcon(result.category)}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className={`font-bold text-primary text-arabic ${
                                    viewMode === 'grid' ? 'text-base' : 'text-lg'
                                  }`}>{result.title}</h3>
                                  <Badge className={getCategoryColor(result.category)}>
                                    {result.categoryAr}
                                  </Badge>
                                  {result.verified && (
                                    <Badge className="bg-success text-success-foreground text-xs">
                                      <CheckCircle className="h-3 w-3 ml-1" />
                                      موثق
                                    </Badge>
                                  )}
                                </div>
                                <p className={`text-muted-foreground text-arabic mb-2 ${
                                  viewMode === 'grid' ? 'text-sm line-clamp-2' : ''
                                }`}>{result.description}</p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                  <span className="text-arabic">{result.provider}</span>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-current text-success" />
                                    <span>{result.rating}</span>
                                    <span>({result.reviews})</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{result.location}</span>
                                  </div>
                                </div>
                              </div>

                              <div className={`text-left ${
                                viewMode === 'grid' ? 'text-center w-full mt-2' : ''
                              }`}>
                                <div className="flex items-center gap-2 mb-1 justify-end">
                                  <span className={`font-bold text-primary ${
                                    viewMode === 'grid' ? 'text-xl' : 'text-2xl'
                                  }`}>{result.price}</span>
                                  <span className="text-sm text-muted-foreground">ريال</span>
                                  {(result as any).priceType && ( // Cast to any to access priceType
                                    <span className="text-xs text-muted-foreground text-arabic">/{(result as any).priceType}</span>
                                  )}
                                </div>
                                {(result as any).originalPrice && (result as any).originalPrice > result.price && ( // Cast to any
                                  <div className="text-sm text-muted-foreground line-through">
                                    {(result as any).originalPrice} ريال
                                  </div>
                                )}
                                {result.type === 'product' && (result as any).inStock && ( // Cast to any
                                  <Badge className="bg-success text-success-foreground text-xs">
                                    متوفر
                                  </Badge>
                                )}
                                {result.type === 'rental' && (result as any).available && ( // Cast to any
                                  <Badge className="bg-accent text-accent-foreground text-xs">
                                    متاح للإيجار
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-3 mt-4">
                              <Link to={`/${result.category}/${result.id}`}>
                                <Button className={`bg-primary hover:bg-primary/90 text-arabic ${
                                  viewMode === 'grid' ? 'text-sm px-3 py-1' : ''
                                }`}>
                                  <Eye className="ml-2 h-4 w-4" />
                                  عرض التفاصيل
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                className={`glass-hover border-primary/30 text-arabic ${
                                  viewMode === 'grid' ? 'text-sm px-3 py-1' : ''
                                }`}
                              >
                                <MessageCircle className="ml-2 h-4 w-4" />
                                تواصل
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleFavorite(result.id)}
                                className={favorites.includes(result.id) ? 'text-red-500' : 'text-muted-foreground'}
                              >
                                <Heart className={`h-4 w-4 ${favorites.includes(result.id) ? 'fill-current' : ''}`} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* No Results */}
                {sortedResults.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2 text-arabic">
                      لم يتم العثور على نتائج
                    </h3>
                    <p className="text-muted-foreground text-arabic mb-4">
                      جرب البحث بكلمات مختلفة أو قم بتعديل المرشحات
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery('');
                        setFilterType('all');
                        setSortBy('relevance');
                      }}
                      className="text-arabic"
                    >
                      <X className="ml-2 h-4 w-4" />
                      مسح البحث
                    </Button>
                  </div>
                )}

                {/* Load More */}
                {sortedResults.length > 0 && (
                  <div className="text-center mt-8">
                    <Button variant="outline" className="glass-hover border-primary/30 text-arabic">
                      عرض المزيد من النتائج
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}