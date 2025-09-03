'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, Heart, Eye, Share2, Check } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useIsMobile } from '@/lib/responsive';
import { toast } from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  compareAtPrice?: number;
  image?: string;
  images?: string[];
  category: string;
  rating?: number;
  reviewCount?: number;
  supplier?: string | { companyName: string };
  inStock?: boolean;
  quantity?: number;
  featured?: boolean;
  discount?: number;
}

interface ResponsiveProductCardProps {
  product: Product;
  language?: 'en' | 'ar';
  variant?: 'grid' | 'list' | 'compact';
  className?: string;
  priority?: boolean;
  onAddToCart?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
}

export function ResponsiveProductCard({ 
  product, 
  language = 'en',
  variant = 'grid',
  className,
  priority = false,
  onAddToCart,
  onAddToWishlist 
}: ResponsiveProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isMobile = useIsMobile();

  const displayName = language === 'ar' && product.nameAr ? product.nameAr : product.name;
  const supplierName = typeof product.supplier === 'object' 
    ? product.supplier.companyName 
    : product.supplier;
  
  const discountPercentage = product.discount || 
    (product.compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0);
  
  const imageUrl = product.image || 
    (product.images && product.images[0]) || 
    '/images/product-placeholder.svg';

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (onAddToCart) {
        await onAddToCart(product);
      } else {
        const response = await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id, quantity: 1 }),
        });
        
        if (response.ok) {
          toast.success('Added to cart!', {
            icon: <Check className="h-4 w-4" />,
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
            },
          });
        } else {
          throw new Error('Failed to add to cart');
        }
      }
    } catch (error) {
      toast.error('Failed to add to cart');
      console.error('Failed to add to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsWishlisted(!isWishlisted);
    
    if (onAddToWishlist) {
      await onAddToWishlist(product);
    } else {
      try {
        const response = await fetch('/api/wishlist/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update wishlist');
        }
        
        toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
      } catch (error) {
        setIsWishlisted(isWishlisted); // Revert on error
        toast.error('Failed to update wishlist');
      }
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: displayName,
          text: `Check out ${displayName} on Medical Devices Marketplace`,
          url: `${window.location.origin}/products/${product.id}`,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(`${window.location.origin}/products/${product.id}`);
      toast.success('Link copied to clipboard!');
    }
  };

  if (variant === 'list') {
    return (
      <Card className={cn(
        "group overflow-hidden hover:shadow-lg transition-all duration-300",
        "flex flex-col sm:flex-row",
        className
      )}>
        {/* Image */}
        <Link href={`/products/${product.id}`} className="relative w-full sm:w-48 md:w-64">
          <div className="relative aspect-square sm:h-full">
            <Image
              src={imageUrl}
              alt={displayName}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 192px, 256px"
              priority={priority}
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
            {discountPercentage > 0 && (
              <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                -{discountPercentage}%
              </Badge>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6">
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <Badge variant="secondary" className="text-xs">
                  {product.category}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handleWishlist}
                  >
                    <Heart className={cn(
                      "h-4 w-4",
                      isWishlisted && "fill-red-500 text-red-500"
                    )} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Link href={`/products/${product.id}`}>
                <h3 className="font-semibold text-base sm:text-lg mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                  {displayName}
                </h3>
              </Link>

              {supplierName && (
                <p className="text-sm text-gray-500 mb-2">by {supplierName}</p>
              )}

              {/* Rating */}
              {product.rating && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3 w-3 sm:h-4 sm:w-4",
                          i < Math.floor(product.rating!)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {product.rating} {product.reviewCount && `(${product.reviewCount})`}
                  </span>
                </div>
              )}
            </div>

            {/* Price and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-bold">
                    {formatCurrency(product.price, language)}
                  </span>
                  {product.compareAtPrice && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatCurrency(product.compareAtPrice, language)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    product.inStock !== false ? "bg-green-500" : "bg-red-500"
                  )} />
                  <span className="text-xs sm:text-sm text-gray-600">
                    {product.inStock !== false ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>
              
              <Button
                onClick={handleAddToCart}
                disabled={isLoading || product.inStock === false}
                className="w-full sm:w-auto gap-2"
                size={isMobile ? "default" : "default"}
              >
                <ShoppingCart className="h-4 w-4" />
                {isLoading ? 'Adding...' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={cn(
        "group overflow-hidden hover:shadow-md transition-all duration-300",
        "p-3",
        className
      )}>
        <div className="flex gap-3">
          <Link href={`/products/${product.id}`} className="relative w-20 h-20 flex-shrink-0">
            <Image
              src={imageUrl}
              alt={displayName}
              fill
              className="object-cover rounded"
              sizes="80px"
              priority={priority}
            />
          </Link>
          
          <div className="flex-1 min-w-0">
            <Link href={`/products/${product.id}`}>
              <h3 className="font-medium text-sm line-clamp-2 hover:text-blue-600">
                {displayName}
              </h3>
            </Link>
            <p className="text-lg font-bold mt-1">
              {formatCurrency(product.price, language)}
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 mt-1"
              onClick={handleAddToCart}
              disabled={isLoading || product.inStock === false}
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Default grid variant
  return (
    <Card className={cn(
      "group relative overflow-hidden hover:shadow-lg transition-all duration-300",
      "flex flex-col h-full",
      className
    )}>
      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {discountPercentage > 0 && (
          <Badge className="bg-red-500 text-white text-xs">
            -{discountPercentage}%
          </Badge>
        )}
        {product.featured && (
          <Badge className="bg-blue-500 text-white text-xs">
            Featured
          </Badge>
        )}
      </div>

      {/* Action Buttons */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        <Button
          size="icon"
          variant="secondary"
          className={cn(
            "h-8 w-8 bg-white/90 backdrop-blur-sm",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            isMobile && "opacity-100"
          )}
          onClick={handleWishlist}
        >
          <Heart className={cn(
            "h-4 w-4",
            isWishlisted && "fill-red-500 text-red-500"
          )} />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className={cn(
            "h-8 w-8 bg-white/90 backdrop-blur-sm",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            isMobile && "opacity-100"
          )}
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Product Image */}
      <Link href={`/products/${product.id}`} className="relative">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={imageUrl}
            alt={displayName}
            fill
            className={cn(
              "object-cover transition-transform duration-300",
              "group-hover:scale-105"
            )}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            priority={priority}
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          
          {/* Quick View Overlay - Desktop Only */}
          {!isMobile && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Link
                href={`/products/${product.id}`}
                className="bg-white text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2 transform -translate-y-2 group-hover:translate-y-0 transition-transform"
              >
                <Eye className="h-4 w-4" />
                Quick View
              </Link>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="flex-1 p-3 sm:p-4">
        {/* Category */}
        <Badge variant="secondary" className="mb-2 text-xs">
          {product.category}
        </Badge>

        {/* Product Name */}
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-sm sm:text-base lg:text-lg mb-1 sm:mb-2 line-clamp-2 hover:text-blue-600 transition-colors min-h-[2.5rem] sm:min-h-[3rem]">
            {displayName}
          </h3>
        </Link>

        {/* Supplier */}
        {supplierName && (
          <p className="text-xs sm:text-sm text-gray-500 mb-2 truncate">
            by {supplierName}
          </p>
        )}

        {/* Rating - Hide on very small screens */}
        {product.rating && (
          <div className="hidden sm:flex items-center gap-2 mb-3">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3 w-3 lg:h-4 lg:w-4",
                    i < Math.floor(product.rating!)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
            <span className="text-xs lg:text-sm text-gray-500">
              {product.rating} {product.reviewCount && `(${product.reviewCount})`}
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-2 sm:mb-3">
          <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(product.price, language)}
          </span>
          {product.compareAtPrice && (
            <span className="text-xs sm:text-sm text-gray-500 line-through">
              {formatCurrency(product.compareAtPrice, language)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <div className={cn(
            "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full",
            product.inStock !== false ? "bg-green-500" : "bg-red-500"
          )} />
          <span className="text-gray-600">
            {product.inStock !== false ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-3 sm:p-4 pt-0">
        <Button
          onClick={handleAddToCart}
          disabled={isLoading || product.inStock === false}
          className="w-full gap-2 text-sm sm:text-base h-9 sm:h-10"
          size={isMobile ? "sm" : "default"}
        >
          <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          {isLoading ? 'Adding...' : isMobile ? 'Add' : 'Add to Cart'}
        </Button>
      </CardFooter>
    </Card>
  );
}