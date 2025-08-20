'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, Heart, Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  image: string;
  category: string;
  rating?: number;
  reviews?: number;
  supplier?: string;
  inStock?: boolean;
  discount?: number;
}

interface ProductCardProps {
  product: Product;
  language?: 'en' | 'ar';
  onAddToCart?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
}

export function ProductCard({ 
  product, 
  language = 'en',
  onAddToCart,
  onAddToWishlist 
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const displayName = language === 'ar' && product.nameAr ? product.nameAr : product.name;
  const discountedPrice = product.discount 
    ? product.price * (1 - product.discount / 100)
    : product.price;

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      if (onAddToCart) {
        onAddToCart(product);
      } else {
        // Default API call
        const response = await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id, quantity: 1 }),
        });
        
        if (response.ok) {
          // Show success toast or update cart state
        }
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWishlist = async () => {
    setIsWishlisted(!isWishlisted);
    if (onAddToWishlist) {
      onAddToWishlist(product);
    } else {
      // Default API call
      try {
        await fetch('/api/wishlist/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id }),
        });
      } catch (error) {
        console.error('Failed to update wishlist:', error);
      }
    }
  };

  const handleQuickView = () => {
    router.push(`/products/${product.id}?quickview=true`);
  };

  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow">
      {/* Discount Badge */}
      {product.discount && (
        <Badge className="absolute top-2 left-2 z-10 bg-red-500 text-white">
          -{product.discount}%
        </Badge>
      )}

      {/* Wishlist Button */}
      <button
        onClick={handleWishlist}
        className="absolute top-2 right-2 z-10 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Heart 
          className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
        />
      </button>

      {/* Product Image */}
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={product.image || '/images/placeholder.jpg'}
            alt={displayName}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Quick View Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={handleQuickView}
              className="bg-white text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2 transform -translate-y-2 group-hover:translate-y-0 transition-transform"
            >
              <Eye className="h-4 w-4" />
              Quick View
            </button>
          </div>
        </div>
      </Link>

      <CardContent className="p-4">
        {/* Category */}
        <Badge variant="secondary" className="mb-2">
          {product.category}
        </Badge>

        {/* Product Name */}
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
            {displayName}
          </h3>
        </Link>

        {/* Supplier */}
        {product.supplier && (
          <p className="text-sm text-gray-500 mb-2">by {product.supplier}</p>
        )}

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating!)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {product.rating} {product.reviews && `(${product.reviews})`}
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(discountedPrice, 'USD')}
          </span>
          {product.discount && (
            <span className="text-sm text-gray-500 line-through">
              {formatCurrency(product.price, 'USD')}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-2 h-2 rounded-full ${
            product.inStock !== false ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-gray-600">
            {product.inStock !== false ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleAddToCart}
          disabled={isLoading || product.inStock === false}
          className="w-full gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          {isLoading ? 'Adding...' : 'Add to Cart'}
        </Button>
      </CardFooter>
    </Card>
  );
}