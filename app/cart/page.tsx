import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Truck, Shield, CreditCard } from 'lucide-react';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Shopping Cart | Medical Devices Marketplace',
  description: 'Review and checkout your medical equipment orders',
};

export default async function CartPage() {
  const session = await getServerSession();
  
  // Fetch cart items (mock data for now)
  const cartItems = [
    {
      id: '1',
      productId: 'prod-1',
      name: 'Digital Blood Pressure Monitor',
      nameAr: 'جهاز قياس ضغط الدم الرقمي',
      price: 89.99,
      quantity: 2,
      image: '/images/products/bp-monitor.jpg',
      sku: 'BPM-2024-001',
      inStock: true,
      supplier: 'MedTech Solutions',
    },
    {
      id: '2',
      productId: 'prod-2',
      name: 'Pulse Oximeter Pro',
      nameAr: 'جهاز قياس الأكسجين',
      price: 45.50,
      quantity: 1,
      image: '/images/products/pulse-oximeter.jpg',
      sku: 'POX-2024-002',
      inStock: true,
      supplier: 'HealthCare Innovations',
    },
    {
      id: '3',
      productId: 'prod-3',
      name: 'Digital Thermometer',
      nameAr: 'ميزان حرارة رقمي',
      price: 25.00,
      quantity: 3,
      image: '/images/products/thermometer.jpg',
      sku: 'THM-2024-003',
      inStock: true,
      supplier: 'Medical Supplies Co',
    },
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.15; // 15% VAT
  const shipping = subtotal > 500 ? 0 : 25;
  const total = subtotal + tax + shipping;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
        <p className="text-muted-foreground">
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      {cartItems.length === 0 ? (
        // Empty Cart
        <Card className="text-center py-12">
          <CardContent>
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Add medical equipment to your cart to get started
            </p>
            <Link href="/products">
              <Button size="lg">
                Browse Products
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="relative h-24 w-24 flex-shrink-0">
                      <div className="h-full w-full bg-gray-100 rounded-lg flex items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-gray-400" />
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.nameAr}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            SKU: {item.sku} | Supplier: {item.supplier}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Quantity and Price */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            className="w-16 text-center h-8"
                            min="1"
                            readOnly
                          />
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${item.price.toFixed(2)} each
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Continue Shopping */}
            <Link href="/products">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Continue Shopping
              </Button>
            </Link>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>VAT (15%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Free shipping on orders over $500
                    </p>
                  )}
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                {/* Promo Code */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Promo Code</p>
                  <div className="flex space-x-2">
                    <Input placeholder="Enter code" />
                    <Button variant="outline">Apply</Button>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button className="w-full" size="lg">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Proceed to Checkout
                </Button>

                {/* Trust Badges */}
                <div className="space-y-2 pt-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Shield className="mr-2 h-4 w-4" />
                    Secure Checkout
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Truck className="mr-2 h-4 w-4" />
                    Fast & Reliable Delivery
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}