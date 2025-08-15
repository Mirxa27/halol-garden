import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Minus, 
  Plus, 
  Trash2, 
  CreditCard,
  MapPin,
  Truck,
  Shield,
  Tag,
  Gift,
  ArrowRight,
  CheckCircle
} from "lucide-react";

export default function Cart() {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "جهاز قياس ضغط الدم الرقمي",
      nameEn: "Digital Blood Pressure Monitor",
      image: "/placeholder.svg",
      price: 450,
      originalPrice: 550,
      quantity: 1,
      seller: "متجر الأجهزة الطبية",
      inStock: true,
      warranty: "سنتان",
      shipping: "توصيل مجاني"
    },
    {
      id: 2,
      name: "جهاز قياس السكر مع الشرائح",
      nameEn: "Blood Glucose Meter Kit",
      image: "/placeholder.svg",
      price: 180,
      originalPrice: 220,
      quantity: 2,
      seller: "صيدلية الشفاء",
      inStock: true,
      warranty: "سنة واحدة",
      shipping: "توصيل فوري"
    }
  ]);

  const [couponCode, setCouponCode] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(id);
      return;
    }
    setCartItems(items => 
      items.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id: number) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const originalTotal = cartItems.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
  const totalSavings = originalTotal - subtotal;
  const shippingCost = subtotal > 300 ? 0 : 25;
  const taxRate = 0.15;
  const taxAmount = (subtotal + shippingCost) * taxRate;
  const finalTotal = subtotal + shippingCost + taxAmount;

  const addresses = [
    { id: '1', title: 'المنزل', address: 'حي العليا، الرياض، المملكة العربية السعودية' },
    { id: '2', title: 'العمل', address: 'مستشفى الملك فيصل التخصصي، الرياض' }
  ];

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="px-4">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card rounded-3xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
              <h1 className="text-3xl font-bold text-primary mb-4 text-arabic">السلة فارغة</h1>
              <p className="text-muted-foreground mb-8 text-arabic">
                ابدأ التسوق واكتشف مجموعة واسعة من ال��جهزة الطبية عالية الجودة
              </p>
              <Button className="bg-primary hover:bg-primary/90 text-arabic">
                تصفح المنتجات
                <ArrowRight className="mr-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2 text-arabic">سلة التسوق</h1>
            <p className="text-muted-foreground text-arabic">{cartItems.length} منتج في السلة</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="glass-card border-0">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-20 h-20 rounded-lg object-cover bg-muted flex-shrink-0"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-primary text-arabic">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">{item.nameEn}</p>
                            <p className="text-sm text-muted-foreground text-arabic">{item.seller}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-4 mb-3">
                          <Badge variant="outline" className="text-xs">
                            <Shield className="h-3 w-3 ml-1" />
                            {item.warranty}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Truck className="h-3 w-3 ml-1" />
                            {item.shipping}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-primary">{item.price * item.quantity} ريال</span>
                              {item.originalPrice > item.price && (
                                <span className="text-sm text-muted-foreground line-through">
                                  {item.originalPrice * item.quantity} ريال
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-success text-arabic">وفرت {(item.originalPrice - item.price) * item.quantity} ريال</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Coupon Code */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg text-primary text-arabic flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    كوبون الخصم
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Input
                      placeholder="أدخل كود الخصم"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="glass text-arabic"
                    />
                    <Button variant="outline" className="glass-hover border-primary/30">
                      تطبيق
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary & Checkout */}
            <div className="space-y-6">
              {/* Order Summary */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg text-primary text-arabic">ملخص الطلب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-arabic">المجموع الفرعي</span>
                    <span className="font-medium">{subtotal} ريال</span>
                  </div>
                  
                  {totalSavings > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-success text-arabic">إجمالي التوفير</span>
                      <span className="font-medium text-success">-{totalSavings} ريال</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-arabic">رسوم الشحن</span>
                    <span className="font-medium">
                      {shippingCost === 0 ? (
                        <span className="text-success text-arabic">مجاني</span>
                      ) : (
                        `${shippingCost} ريال`
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-arabic">ضريبة القيمة المضافة (15%)</span>
                    <span className="font-medium">{taxAmount.toFixed(2)} ريال</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span className="text-arabic">الإجمالي النهائي</span>
                    <span className="text-primary">{finalTotal.toFixed(2)} ريال</span>
                  </div>
                  
                  {shippingCost > 0 && (
                    <div className="bg-accent/10 rounded-lg p-3">
                      <p className="text-sm text-accent text-arabic">
                        أضف منتجات بقيمة {300 - subtotal} ريال للحصول على شحن مجاني
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Delivery Address */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg text-primary text-arabic flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    عنوان التوصيل
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedAddress} onValueChange={setSelectedAddress}>
                    <SelectTrigger className="glass">
                      <SelectValue placeholder="اختر عنوان التوصيل" />
                    </SelectTrigger>
                    <SelectContent>
                      {addresses.map((address) => (
                        <SelectItem key={address.id} value={address.id}>
                          <div className="text-arabic">
                            <div className="font-medium">{address.title}</div>
                            <div className="text-xs text-muted-foreground">{address.address}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="link" className="w-full mt-2 text-primary text-arabic">
                    إضافة عنوان جديد
                  </Button>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg text-primary text-arabic flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    طريقة الدفع
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="glass">
                      <SelectValue placeholder="اختر طريقة الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">بطاقة ائتمانية</SelectItem>
                      <SelectItem value="debit">بطاقة سحب</SelectItem>
                      <SelectItem value="cod">دفع عند الاستلام</SelectItem>
                      <SelectItem value="bank">تحويل بنكي</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Checkout Button */}
              <Button 
                className="w-full bg-success hover:bg-success/90 text-white py-3 text-arabic text-lg"
                disabled={!selectedAddress || !paymentMethod}
              >
                <CheckCircle className="ml-2 h-5 w-5" />
                إتمام الشراء ({finalTotal.toFixed(2)} ريال)
              </Button>
              
              <div className="text-center">
                <p className="text-xs text-muted-foreground text-arabic">
                  عملية شراء آمنة ومشفرة 100%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
