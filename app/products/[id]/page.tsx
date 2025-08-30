import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Star, ShoppingCart, Heart, Share2, Shield, Truck, 
  RefreshCw, CheckCircle, Info, Package, AlertCircle,
  ThumbsUp, MessageSquare, User
} from 'lucide-react';
import { ProductGallery } from '@/components/products/ProductGallery';
import { ProductReviews } from '@/components/products/ProductReviews';
import { RelatedProducts } from '@/components/products/RelatedProducts';
import prisma from '@/lib/prisma';

interface ProductPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  // Fetch product data
  const product = await getProduct(params.id);
  
  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: `${product.name} | Medical Devices Marketplace`,
    description: product.description,
  };
}

async function getProduct(id: string) {
  // In production, fetch from database
  // const product = await prisma.product.findUnique({ where: { id } });
  
  // Mock data for now
  return {
    id,
    name: 'Advanced MRI Scanner ProMax 3000',
    nameAr: 'جهاز الرنين المغناطيسي المتقدم بروماكس 3000',
    description: 'State-of-the-art MRI scanner with advanced imaging capabilities, AI-powered diagnostics, and patient comfort features. Perfect for hospitals and diagnostic centers.',
    descriptionAr: 'جهاز رنين مغناطيسي متطور مع قدرات تصوير متقدمة وتشخيص مدعوم بالذكاء الاصطناعي وميزات راحة المريض.',
    price: 450000,
    compareAtPrice: 500000,
    sku: 'MRI-PM-3000',
    category: 'DIAGNOSTIC',
    brand: 'MedTech Solutions',
    images: [
      '/images/products/mri-1.jpg',
      '/images/products/mri-2.jpg',
      '/images/products/mri-3.jpg',
    ],
    inStock: true,
    quantity: 3,
    rating: 4.8,
    reviewCount: 124,
    specifications: {
      'Field Strength': '3.0 Tesla',
      'Bore Diameter': '70 cm',
      'Gradient Strength': '45 mT/m',
      'Slew Rate': '200 T/m/s',
      'RF Channels': '32',
      'Patient Weight': 'Up to 250 kg',
      'Power Requirements': '480V, 3-phase',
      'Dimensions': '2.4m x 2.4m x 1.8m',
      'Weight': '7,000 kg',
      'Warranty': '2 years',
    },
    features: [
      'AI-powered image reconstruction',
      'Silent scan technology',
      'Wide bore design for patient comfort',
      'Advanced cardiac imaging',
      'Neurological imaging suite',
      'Oncology imaging protocols',
      'Pediatric imaging capabilities',
      'Real-time motion correction',
    ],
    certifications: ['FDA', 'CE', 'ISO 13485', 'IEC 60601'],
    deliveryTime: '4-6 weeks',
    supplier: {
      id: 'sup-1',
      name: 'MedTech Solutions International',
      rating: 4.9,
      verified: true,
      responseTime: '< 2 hours',
      location: 'Dubai, UAE',
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  const discount = product.compareAtPrice 
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex mb-8 text-sm">
        <Link href="/" className="text-muted-foreground hover:text-primary">
          Home
        </Link>
        <span className="mx-2 text-muted-foreground">/</span>
        <Link href="/products" className="text-muted-foreground hover:text-primary">
          Products
        </Link>
        <span className="mx-2 text-muted-foreground">/</span>
        <Link href={`/products?category=${product.category.toLowerCase()}`} className="text-muted-foreground hover:text-primary">
          {product.category}
        </Link>
        <span className="mx-2 text-muted-foreground">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Product Images */}
        <div>
          <ProductGallery images={product.images} name={product.name} />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Title and Rating */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <p className="text-lg text-muted-foreground mb-3">{product.nameAr}</p>
            
            {/* Rating */}
            <div className="flex items-center space-x-4 mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm font-medium">{product.rating}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                ({product.reviewCount} reviews)
              </span>
              <Badge variant="outline">SKU: {product.sku}</Badge>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-bold">${product.price.toLocaleString()}</span>
              {product.compareAtPrice && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    ${product.compareAtPrice.toLocaleString()}
                  </span>
                  <Badge variant="destructive">{discount}% OFF</Badge>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">VAT inclusive</p>
          </div>

          {/* Stock Status */}
          <div className="flex items-center space-x-2">
            {product.inStock ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-600 font-medium">In Stock</span>
                <span className="text-muted-foreground">({product.quantity} units available)</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-600 font-medium">Out of Stock</span>
              </>
            )}
          </div>

          {/* Supplier Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{product.supplier.name}</p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                        {product.supplier.rating}
                      </span>
                      {product.supplier.verified && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">Contact Supplier</Button>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="flex space-x-3">
              <Button className="flex-1" size="lg" disabled={!product.inStock}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              <Button variant="outline" size="lg" disabled={!product.inStock}>
                Buy Now
              </Button>
            </div>
            <Button variant="outline" className="w-full">
              Request Quote for Bulk Orders
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-xs font-medium">Warranty Protected</p>
            </div>
            <div className="text-center">
              <Truck className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-xs font-medium">Fast Delivery</p>
            </div>
            <div className="text-center">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-xs font-medium">Easy Returns</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <Tabs defaultValue="description" className="mb-12">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
        </TabsList>
        
        <TabsContent value="description" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{product.description}</p>
              <div>
                <h3 className="font-semibold mb-2">Key Features:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {product.features.map((feature, index) => (
                    <li key={index} className="text-muted-foreground">{feature}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Certifications:</h3>
                <div className="flex flex-wrap gap-2">
                  {product.certifications.map((cert) => (
                    <Badge key={cert} variant="secondary">{cert}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="specifications">
          <Card>
            <CardHeader>
              <CardTitle>Technical Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-2 gap-4 py-2 border-b last:border-0">
                    <span className="font-medium">{key}</span>
                    <span className="text-muted-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reviews">
          <ProductReviews productId={product.id} />
        </TabsContent>
        
        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle>Shipping & Delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Estimated Delivery Time</h3>
                <p className="text-muted-foreground">{product.deliveryTime}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Shipping Options</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Standard Shipping (5-7 business days)
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Express Shipping (2-3 business days)
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Installation Service Available
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Return Policy</h3>
                <p className="text-muted-foreground">
                  30-day return policy for unopened items. Defective products can be returned within warranty period.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Related Products */}
      <RelatedProducts category={product.category} currentProductId={product.id} />
    </div>
  );
}