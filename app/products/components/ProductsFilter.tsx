'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';
import { Filter, X } from 'lucide-react';

interface FiltersProps {
  filters: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    supplier?: string;
    condition?: string;
  };
}

export function ProductsFilter({ filters }: FiltersProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const categories = [
    { value: 'diagnostic', label: t('filter.category') },
    { value: 'surgical', label: t('filter.category') },
    { value: 'monitoring', label: t('filter.category') },
    { value: 'therapeutic', label: t('filter.category') },
    { value: 'laboratory', label: t('filter.category') },
    { value: 'emergency', label: t('filter.category') },
  ];

  const conditions = [
    { value: 'new', label: t('filter.new') },
    { value: 'refurbished', label: t('filter.refurbished') },
    { value: 'used', label: t('filter.used') },
  ];

  const updateFilter = (key: string, value: any) => {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/products');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Filter className="h-4 w-4" />
          {t('common.filter')}
        </h3>
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Categories */}
      <div>
        <Label className="mb-3 block">{t('filter.category')}</Label>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.value} className="flex items-center space-x-2">
              <Checkbox
                id={category.value}
                checked={filters.category === category.value}
                onCheckedChange={(checked) =>
                  updateFilter('category', checked ? category.value : '')
                }
              />
              <Label
                htmlFor={category.value}
                className="text-sm font-normal cursor-pointer"
              >
                {category.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <Label className="mb-3 block">Price Range</Label>
        <div className="space-y-4">
          <Slider
            defaultValue={[filters.minPrice || 0, filters.maxPrice || 1000000]}
            max={1000000}
            step={1000}
            onValueCommit={([min, max]) => {
              updateFilter('minPrice', min);
              updateFilter('maxPrice', max);
            }}
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>${filters.minPrice || 0}</span>
            <span>${filters.maxPrice || '1M+'}</span>
          </div>
        </div>
      </div>

      {/* Condition */}
      <div>
        <Label className="mb-3 block">{t('filter.condition')}</Label>
        <div className="space-y-2">
          {conditions.map((condition) => (
            <div key={condition.value} className="flex items-center space-x-2">
              <Checkbox
                id={condition.value}
                checked={filters.condition === condition.value}
                onCheckedChange={(checked) =>
                  updateFilter('condition', checked ? condition.value : '')
                }
              />
              <Label
                htmlFor={condition.value}
                className="text-sm font-normal cursor-pointer"
              >
                {condition.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <Label className="mb-3 block">{t('filter.availability')}</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="inStock" />
            <Label htmlFor="inStock" className="text-sm font-normal cursor-pointer">
              {t('products.inStock')}
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}