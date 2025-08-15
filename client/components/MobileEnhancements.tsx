import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Filter,
  X,
  ArrowUp,
  Phone,
  MessageCircle,
  Share2,
  Plus,
  Minus
} from "lucide-react";

// Mobile Filter Sheet
interface MobileFilterSheetProps {
  filterType: string;
  sortBy: string;
  onFilterChange: (filter: string) => void;
  onSortChange: (sort: string) => void;
  categories: Array<{ value: string; label: string }>;
  sortOptions: Array<{ value: string; label: string }>;
}

export function MobileFilterSheet({
  filterType,
  sortBy,
  onFilterChange,
  onSortChange,
  categories,
  sortOptions
}: MobileFilterSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="glass-hover text-arabic">
          <Filter className="ml-2 h-4 w-4" />
          تصفية وترتيب
          {filterType !== 'all' && (
            <Badge className="mr-2 bg-primary text-primary-foreground text-xs">
              1
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] glass-card border-t rounded-t-3xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-primary text-arabic">
            تصفية وترتيب النتائج
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-6">
          {/* Categories */}
          <div>
            <h3 className="font-medium text-arabic mb-3">نوع الخدمة</h3>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <Button
                  key={category.value}
                  variant={filterType === category.value ? "default" : "outline"}
                  onClick={() => onFilterChange(category.value)}
                  className="justify-start text-arabic"
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Sort Options */}
          <div>
            <h3 className="font-medium text-arabic mb-3">ترتيب حسب</h3>
            <div className="space-y-2">
              {sortOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={sortBy === option.value ? "default" : "outline"}
                  onClick={() => onSortChange(option.value)}
                  className="w-full justify-start text-arabic"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Apply Filters */}
          <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 -mx-6 -mb-6 border-t">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 text-arabic"
                onClick={() => {
                  onFilterChange('all');
                  onSortChange('relevance');
                }}
              >
                مسح الكل
              </Button>
              <Button 
                className="flex-1 text-arabic"
                onClick={() => setIsOpen(false)}
              >
                تطبيق التصفية
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Mobile Quick Actions
interface MobileQuickActionsProps {
  onCall?: () => void;
  onMessage?: () => void;
  onShare?: () => void;
  className?: string;
}

export function MobileQuickActions({
  onCall,
  onMessage,
  onShare,
  className = ""
}: MobileQuickActionsProps) {
  return (
    <div className={`fixed bottom-20 left-4 right-4 z-40 ${className}`}>
      <Card className="glass-card border-0 shadow-xl">
        <CardContent className="p-3">
          <div className="flex items-center justify-around">
            {onCall && (
              <Button
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white rounded-full h-12 w-12 p-0"
                onClick={onCall}
              >
                <Phone className="h-5 w-5" />
              </Button>
            )}
            {onMessage && (
              <Button
                size="sm"
                variant="outline"
                className="glass-hover rounded-full h-12 w-12 p-0"
                onClick={onMessage}
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
            )}
            {onShare && (
              <Button
                size="sm"
                variant="outline"
                className="glass-hover rounded-full h-12 w-12 p-0"
                onClick={onShare}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Scroll to Top Button
export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <Button
      onClick={scrollToTop}
      className="fixed bottom-4 left-4 z-50 rounded-full h-12 w-12 p-0 shadow-xl"
      size="sm"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}

// Mobile Sticky CTA
interface MobileStickyCTAProps {
  title: string;
  price?: string;
  originalPrice?: string;
  currency?: string;
  primaryAction: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function MobileStickyCTA({
  title,
  price,
  originalPrice,
  currency = "ريال",
  primaryAction,
  secondaryAction
}: MobileStickyCTAProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <Card className="glass-card border-0 border-t rounded-t-3xl shadow-2xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-primary text-arabic text-sm line-clamp-1">
                {title}
              </h3>
              {price && (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">{price}</span>
                  <span className="text-sm text-muted-foreground">{currency}</span>
                  {originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {originalPrice}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            {secondaryAction && (
              <Button
                variant="outline"
                className="flex-1 text-arabic glass-hover"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Button>
            )}
            <Button
              className={`text-arabic ${secondaryAction ? 'flex-1' : 'w-full'}`}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Mobile Quantity Selector
interface MobileQuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function MobileQuantitySelector({
  quantity,
  onQuantityChange,
  min = 1,
  max = 99,
  disabled = false
}: MobileQuantitySelectorProps) {
  return (
    <div className="flex items-center gap-3 bg-muted/30 rounded-full p-1">
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full h-8 w-8 p-0"
        onClick={() => onQuantityChange(Math.max(min, quantity - 1))}
        disabled={disabled || quantity <= min}
      >
        <Minus className="h-4 w-4" />
      </Button>
      
      <span className="font-medium text-center min-w-[2rem]">
        {quantity}
      </span>
      
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full h-8 w-8 p-0"
        onClick={() => onQuantityChange(Math.min(max, quantity + 1))}
        disabled={disabled || quantity >= max}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Pull to Refresh (mock implementation)
export function PullToRefresh({ onRefresh }: { onRefresh: () => void }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  useEffect(() => {
    let startY = 0;
    let currentY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0 && e.touches.length > 0) {
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && startY > 0 && e.touches.length > 0) {
        currentY = e.touches[0].clientY;
        const distance = Math.max(0, currentY - startY);
        setPullDistance(Math.min(distance, 100));
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance > 50) {
        setIsRefreshing(true);
        onRefresh();
        setTimeout(() => {
          setIsRefreshing(false);
        }, 1000);
      }
      setPullDistance(0);
      startY = 0;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, pullDistance]);

  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-200"
      style={{ 
        transform: `translateY(${pullDistance - 50}px)`,
        opacity: pullDistance / 50
      }}
    >
      <div className="bg-primary text-primary-foreground rounded-full p-2">
        <X 
          className={`h-4 w-4 transition-transform duration-200 ${
            isRefreshing ? 'animate-spin' : ''
          }`} 
        />
      </div>
    </div>
  );
}