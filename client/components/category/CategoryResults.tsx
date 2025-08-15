import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Grid3X3, List, ArrowUpDown, Search } from "lucide-react";
import { CategoryItem } from "@/types/category";
import { ProductResultCard } from "./ProductResultCard";
import { ServiceResultCard } from "./ServiceResultCard";
import { RentalResultCard } from "./RentalResultCard";
import { Card, CardContent } from "@/components/ui/card";

interface CategoryResultsProps {
  items: CategoryItem[];
  sortBy: string;
  setSortBy: (value: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  isLoading: boolean;
}

const sortOptions = [
  { value: 'popularity', label: 'الأكثر شعبية' },
  { value: 'rating', label: 'الأعلى تقييماً' },
  { value: 'price-low', label: 'السعر: من الأقل للأعلى' },
  { value: 'price-high', label: 'السعر: من الأعلى للأقل' },
  { value: 'newest', label: 'الأحدث' },
  { value: 'name', label: 'الاسم أ-ي' }
];

export function CategoryResults({
  items,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  isLoading,
}: CategoryResultsProps) {
  return (
    <div>
      {/* Results Header with Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-arabic">
            {items.length} نتيجة
          </span>
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
      {items.length === 0 && !isLoading ? (
        <Card className="glass-card border-0">
          <CardContent className="p-12 text-center">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-primary mb-2 text-arabic">لا توجد نتائج</h3>
            <p className="text-muted-foreground mb-6 text-arabic">
              لم نجد أي عناصر تطابق معايير البحث الحالية
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'md:grid-cols-2 xl:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {items.map((item) => {
            if (item.type === 'product') {
              return <ProductResultCard key={item.id} item={item} viewMode={viewMode} />;
            }
            if (item.type === 'service') {
              return <ServiceResultCard key={item.id} item={item} viewMode={viewMode} />;
            }
            if (item.type === 'rental') {
              return <RentalResultCard key={item.id} item={item} viewMode={viewMode} />;
            }
            return null;
          })}
        </div>
      )}

      {/* Load More */}
      {items.length > 0 && (
        <div className="text-center mt-8">
          <Button variant="outline" className="glass-hover border-primary/30 text-arabic">
            عرض المزيد من النتائج
          </Button>
        </div>
      )}
    </div>
  );
}