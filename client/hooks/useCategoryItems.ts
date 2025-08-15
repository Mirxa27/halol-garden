import { useMemo } from "react";
import { CategoryItem, Filters } from "@/types/category";

export function useCategoryItems(allItems: CategoryItem[], filters: Filters) {
  const filteredAndSortedItems = useMemo(() => {
    let items: CategoryItem[] = [...allItems];

    // Filter by category
    if (filters.categorySlug && filters.categorySlug !== 'all') {
      items = items.filter(item => item.category === filters.categorySlug);
    }

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      items = items.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.titleEn.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    }

    // Filter by price range
    items = items.filter(item => 
      item.price >= filters.priceRange[0] && item.price <= filters.priceRange[1]
    );

    // Filter by brands
    if (filters.selectedBrands.length > 0) {
      items = items.filter(item => 
        (item.type === 'product' || item.type === 'rental') && filters.selectedBrands.includes(item.brand)
      );
    }

    // Filter by features
    if (filters.selectedFeatures.length > 0) {
      items = items.filter(item =>
        filters.selectedFeatures.some(feature => item.features.includes(feature))
      );
    }

    // Filter by locations
    if (filters.selectedLocations.length > 0) {
      items = items.filter(item => filters.selectedLocations.includes(item.location));
    }

    // Filter by rating
    if (filters.ratingFilter !== 'all') {
      const minRating = parseFloat(filters.ratingFilter);
      items = items.filter(item => item.rating >= minRating);
    }

    // Sort items
    const sortedItems = [...items];
    switch (filters.sortBy) {
      case 'rating':
        sortedItems.sort((a, b) => b.rating - a.rating);
        break;
      case 'price-low':
        sortedItems.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sortedItems.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        sortedItems.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'newest':
        sortedItems.reverse();
        break;
      default: // popularity
        sortedItems.sort((a, b) => b.reviews - a.reviews);
    }

    return sortedItems;
  }, [allItems, filters]);

  return filteredAndSortedItems;
}