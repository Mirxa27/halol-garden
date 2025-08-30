'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, Heart, Eye, Truck, Shield, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  images: string[];
  category: string;
  subcategory?: string;
  brand: string;
  condition: 'NEW' | 'REFURBISHED' | 'USED_EXCELLENT' | 'USED_GOOD' | 'USED_FAIR';
  availabilityType: 'SALE' | 'RENT' | 'BOTH';
  rating?: number;
  reviewCount?: number;
  supplier?: {
    id: string;
    name: string;
    rating?: number;
    verified?: boolean;
  };
  inStock?: boolean;
  discount?: number;
  features?: string[];
  warranty?: boolean;
  freeShipping?: boolean;
  expressDelivery?: boolean;
}

interface ProductCardProps {
  product: Product;
  language?: 'en' | 'ar';
  view?: 'grid' | 'list';
  priority?: boolean;
  onAddToCart?: (product: Product) => Promise<void>;
  onAddToWishlist?: (product: Product) => Promise<void>;
  onQuickView?: (product: Product) => void;
}

export function ProductCard({ 
  product, 
  language = 'en',
  view = 'grid',
  priority = false,
  onAddToCart,
  onAddToWishlist,
  onQuickView
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const router = useRouter();
  const { toast } = useToast();

  const displayName = language === 'ar' && product.nameAr ? product.nameAr : product.name;
  const discountedPrice = product.discount 
    ? product.price * (1 - product.discount / 100)
    : product.price;

  const handleAddToCart = useCallback(async () => {
    if (!onAddToCart) return;
    
    setIsLoading(true);
    try {
      await onAddToCart(product);
      toast({
        title: 'Added to cart',
        description: `${displayName} has been added to your cart`,
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add item to cart',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [onAddToCart, product, displayName, toast]);

  const handleWishlist = useCallback(async () => {
    if (!onAddToWishlist) return;
    
    try {
      await onAddToWishlist(product);
      setIsWishlisted(!isWishlisted);
      toast({
        title: isWishlisted ? 'Removed from wishlist' : 'Added to wishlist',
        description: `${displayName} has been ${isWishlisted ? 'removed from' : 'added to'} your wishlist`,
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update wishlist',
        variant: 'destructive',
      });
    }
  }, [onAddToWishlist, product, displayName, isWishlisted, toast]);

  const handleQuickView = useCallback(() => {
    if (onQuickView) {
      onQuickView(product);
    }
  }, [onQuickView, product]);

  const handleImageError = () => {
    setImageError(true);
  };

  const nextImage = () => {
    if (product.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const getConditionBadgeColor = (condition: string) => {
    switch (condition) {
      case 'NEW': return 'bg-green-500';
      case 'REFURBISHED': return 'bg-blue-500';
      case 'USED_EXCELLENT': return 'bg-yellow-500';
      case 'USED_GOOD': return 'bg-orange-500';
      case 'USED_FAIR': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (view === 'list') {
    return (
      <Card className="w-full hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          {/* Image Section */}
          <div className="relative w-full sm:w-48 md:w-64 h-48 sm:h-auto">
            <Link href={`/products/${product.id}`}>
              <div className="relative w-full h-full group">
                <Image
                  src={imageError ? '/placeholder-product.jpg' : product.images[currentImageIndex]}
                  alt={displayName}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={handleImageError}
                  priority={priority}
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 192px, 256px"
                />
                {product.discount && (
                  <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                    -{product.discount}%
                  </Badge>
                )}
                <Badge className={cn("absolute top-2 right-2 text-white", getConditionBadgeColor(product.condition))}>
                  {product.condition}
                </Badge>
              </div>
            </Link>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-4 sm:p-6">
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <Link href={`/products/${product.id}`}>
                  <h3 className="text-lg sm:text-xl font-semibold hover:text-primary transition-colors line-clamp-2">
                    {displayName}
                  </h3>
                </Link>
                
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{product.category}</Badge>
                  {product.subcategory && (
                    <Badge variant="outline">{product.subcategory}</Badge>
                  )}
                  <Badge variant="outline">{product.brand}</Badge>
                </div>

                {/* Features for desktop */}
                <div className="hidden md:flex flex-wrap gap-2 mt-3">
                  {product.warranty && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4" />
                      <span>Warranty</span>
                    </div>
                  )}
                  {product.freeShipping && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Truck className="w-4 h-4" />
                      <span>Free Shipping</span>
                    </div>
                  )}
                  {product.expressDelivery && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Express Delivery</span>
                    </div>
                  )}
                </div>

                {/* Rating */}
                {product.rating !== undefined && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-4 h-4",
                            i < Math.floor(product.rating || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({product.reviewCount || 0} reviews)
                    </span>
                  </div>
                )}
              </div>

              {/* Price and Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {formatCurrency(discountedPrice)}
                    </span>
                    {product.discount && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatCurrency(product.price)}
                      </span>
                    )}
                  </div>
                  {product.availabilityType === 'RENT' && (
                    <span className="text-sm text-muted-foreground">/day</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleWishlist}
                    className="p-2"
                  >
                    <Heart className={cn("w-4 h-4", isWishlisted && "fill-current text-red-500")} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleQuickView}
                    className="p-2"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddToCart}
                    disabled={!product.inStock || isLoading}
                    className="gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Grid View (default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group h-full flex flex-col hover:shadow-xl transition-all duration-300 overflow-hidden">
        {/* Image Section */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Link href={`/products/${product.id}`} className="block w-full h-full">
            <Image
              src={imageError ? '/placeholder-product.jpg' : product.images[currentImageIndex]}
              alt={displayName}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              onError={handleImageError}
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            
            {/* Overlay with quick actions - visible on hover for desktop, always visible on mobile */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 md:transition-opacity duration-300 flex items-center justify-center gap-2 md:opacity-0">
              <Button
                size="icon"
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault();
                  handleQuickView();
                }}
                className="w-10 h-10 rounded-full"
              >
                <Eye className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault();
                  handleWishlist();
                }}
                className="w-10 h-10 rounded-full"
              >
                <Heart className={cn("w-5 h-5", isWishlisted && "fill-current text-red-500")} />
              </Button>
            </div>
          </Link>

          {/* Badges */}
          <div className="absolute top-2 left-2 right-2 flex justify-between">
            {product.discount && (
              <Badge className="bg-red-500 text-white">
                -{product.discount}%
              </Badge>
            )}
            <Badge className={cn("text-white ml-auto", getConditionBadgeColor(product.condition))}>
              {product.condition}
            </Badge>
          </div>

          {/* Image indicators for multiple images */}
          {product.images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {product.images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentImageIndex(index);
                  }}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    index === currentImageIndex
                      ? "bg-white w-4"
                      : "bg-white/50"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content Section */}
        <CardContent className="flex-1 p-3 sm:p-4">
          <Link href={`/products/${product.id}`}>
            <h3 className="font-semibold text-sm sm:text-base hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
              {displayName}
            </h3>
          </Link>

          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {product.brand}
            </Badge>
            {product.availabilityType === 'BOTH' && (
              <Badge variant="outline" className="text-xs">
                Sale/Rent
              </Badge>
            )}
          </div>

          {/* Rating - Mobile optimized */}
          {product.rating !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3 h-3 sm:w-4 sm:h-4",
                      i < Math.floor(product.rating || 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">
                ({product.reviewCount})
              </span>
            </div>
          )}

          {/* Features - Show on larger screens */}
          <div className="hidden sm:flex flex-wrap gap-2 mt-2">
            {product.warranty && (
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-green-500" />
                <span className="text-xs text-muted-foreground">Warranty</span>
              </div>
            )}
            {product.freeShipping && (
              <div className="flex items-center gap-1">
                <Truck className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-muted-foreground">Free Ship</span>
              </div>
            )}
          </div>
        </CardContent>

        {/* Footer Section */}
        <CardFooter className="p-3 sm:p-4 pt-0 flex flex-col gap-3">
          <div className="w-full">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-lg sm:text-xl font-bold">
                  {formatCurrency(discountedPrice)}
                </span>
                {product.discount && (
                  <span className="text-xs sm:text-sm text-muted-foreground line-through ml-2">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </div>
              {product.availabilityType === 'RENT' && (
                <span className="text-xs text-muted-foreground">/day</span>
              )}
            </div>
          </div>

          <Button
            className="w-full gap-2"
            size="sm"
            onClick={handleAddToCart}
            disabled={!product.inStock || isLoading}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="text-xs sm:text-sm">
              {!product.inStock ? 'Out of Stock' : 
               product.availabilityType === 'RENT' ? 'Rent Now' : 'Add to Cart'}
            </span>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}