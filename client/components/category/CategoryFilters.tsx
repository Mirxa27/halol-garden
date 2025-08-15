import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Filter, X } from "lucide-react";

interface CategoryFiltersProps {
  priceRange: [number, number];
  setPriceRange: (value: [number, number]) => void;
  ratingFilter: string;
  setRatingFilter: (value: string) => void;
  brands: string[];
  selectedBrands: string[];
  handleBrandChange: (brand: string, checked: boolean) => void;
  features: string[];
  selectedFeatures: string[];
  handleFeatureChange: (feature: string, checked: boolean) => void;
  locations: string[];
  selectedLocations: string[];
  handleLocationChange: (location: string, checked: boolean) => void;
  clearFilters: () => void;
}

export function CategoryFilters({
  priceRange,
  setPriceRange,
  ratingFilter,
  setRatingFilter,
  brands,
  selectedBrands,
  handleBrandChange,
  features,
  selectedFeatures,
  handleFeatureChange,
  locations,
  selectedLocations,
  handleLocationChange,
  clearFilters,
}: CategoryFiltersProps) {
  return (
    <Card className="glass-card border-0 sticky top-24">
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
                onValueChange={(value) => setPriceRange(value as [number, number])}
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
  );
}