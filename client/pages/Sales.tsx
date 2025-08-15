import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart,
  Star,
  Truck,
  Shield,
  CheckCircle,
  Heart,
  Eye,
  Filter,
  Search,
  CreditCard,
  Package,
  ArrowRight,
} from "lucide-react";

export default function Sales() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<number[]>([]);

  const productCategories = [
    {
      id: "monitors",
      name: "أجهزة المراقبة",
      nameEn: "Monitoring Devices",
      count: 89,
      gradient: "from-blue-500 to-cyan-500",
      icon: "📊",
    },
    {
      id: "diagnostic",
      name: "معدات التشخيص",
      nameEn: "Diagnostic Equipment",
      count: 67,
      gradient: "from-green-500 to-emerald-500",
      icon: "🔬",
    },
    {
      id: "surgical",
      name: "المعدات الجراحية",
      nameEn: "Surgical Equipment",
      count: 134,
      gradient: "from-red-500 to-pink-500",
      icon: "⚕️",
    },
    {
      id: "rehabilitation",
      name: "معدات التأهيل",
      nameEn: "Rehabilitation Equipment",
      count: 45,
      gradient: "from-purple-500 to-violet-500",
      icon: "🏃",
    },
    {
      id: "laboratory",
      name: "معدات المختبر",
      nameEn: "Laboratory Equipment",
      count: 78,
      gradient: "from-orange-500 to-yellow-500",
      icon: "🧪",
    },
    {
      id: "emergency",
      name: "معدات الطوارئ",
      nameEn: "Emergency Equipment",
      count: 56,
      gradient: "from-red-600 to-orange-600",
      icon: "🚨",
    },
  ];

  const featuredProducts = [
    {
      id: 1,
      name: "جهاز قياس ضغط الدم الرقمي",
      nameEn: "Digital Blood Pressure Monitor - Omron HEM-7120",
      category: "معدات التشخيص",
      price: 450,
      originalPrice: 650,
      rating: 4.8,
      reviews: 156,
      inStock: true,
      badge: "الأكثر مبيعاً",
      features: ["دقة عالية", "شاشة رقمية", "ذاكرة متقدمة"],
      warranty: "سنة واحدة",
    },
    {
      id: 2,
      name: "جهاز تخطيط القلب المحمول",
      nameEn: "Portable ECG Machine - Philips PageWriter",
      category: "معدات التشخيص",
      price: 2850,
      originalPrice: 3200,
      rating: 4.9,
      reviews: 89,
      inStock: true,
      badge: "جديد",
      features: ["12 قناة", "طباعة فورية", "تخزين البيانات"],
      warranty: "سنتان",
    },
    {
      id: 3,
      name: "جهاز الموجات فوق الصوتية",
      nameEn: "Ultrasound Scanner - GE Voluson",
      category: "أجهزة التصوير",
      price: 15500,
      originalPrice: 18000,
      rating: 4.7,
      reviews: 234,
      inStock: true,
      badge: "عرض محدود",
      features: ["دقة 4D", "شاشة عالية الدقة", "مجسات متعددة"],
      warranty: "ثلاث سنوات",
    },
  ];

  const addToCart = (productId: number) => {
    setCartItems([...cartItems, productId]);
  };

  const isInCart = (productId: number) => {
    return cartItems.includes(productId);
  };

  return (
    <Layout>
      <div className="relative min-h-screen">
        {/* Floating background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-success/5 to-primary/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-accent/3 to-success/3 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "0.5s" }}
          ></div>
        </div>

        <div className="relative pt-24 pb-16 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Hero Header */}
            <div className="glass-intense rounded-[2rem] p-8 mb-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-success/10 via-transparent to-primary/10 pointer-events-none"></div>

              <div className="relative z-10 text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-success via-primary to-success shadow-2xl mb-6 relative">
                  <ShoppingCart className="h-10 w-10 text-white" />
                  <div className="absolute inset-0 rounded-3xl bg-white/20 blur-xl"></div>
                </div>

                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-success via-primary to-success bg-clip-text text-transparent mb-6 text-arabic">
                  متجر الأجهزة الطبية
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground text-arabic leading-relaxed max-w-3xl mx-auto mb-8">
                  اشتري أجهزة طبية عالية الجودة بأفضل الأسعار مع ضمان شامل وخدمة
                  توصيل سريعة
                </p>

                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  <Badge className="glass-subtle px-4 py-2 text-sm">
                    <Shield className="h-4 w-4 ml-2" />
                    ضمان أصلي
                  </Badge>
                  <Badge className="glass-subtle px-4 py-2 text-sm">
                    <Truck className="h-4 w-4 ml-2" />
                    توصيل مجاني
                  </Badge>
                  <Badge className="glass-subtle px-4 py-2 text-sm">
                    <CreditCard className="h-4 w-4 ml-2" />
                    دفع آمن
                  </Badge>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="grid lg:grid-cols-4 gap-6 mb-8">
              <div className="lg:col-span-3">
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    placeholder="ابحث عن أجهزة طبية..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="glass h-14 text-lg rounded-2xl border-white/20 pr-12 text-arabic"
                  />
                </div>
              </div>
              <div>
                <Select
                  value={selectedPriceRange}
                  onValueChange={setSelectedPriceRange}
                >
                  <SelectTrigger className="glass h-14 text-lg rounded-2xl border-white/20">
                    <SelectValue placeholder="نطاق السعر" />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    <SelectItem value="0-500">أقل من 500 ريال</SelectItem>
                    <SelectItem value="500-2000">500 - 2000 ريال</SelectItem>
                    <SelectItem value="2000-10000">
                      2000 - 10000 ريال
                    </SelectItem>
                    <SelectItem value="10000+">أكثر من 10000 ريال</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              {/* Categories Sidebar */}
              <div className="lg:col-span-3">
                <Card className="glass-intense border-0 rounded-3xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-success/5 to-primary/5 border-b border-white/10">
                    <CardTitle className="text-xl text-primary text-arabic flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-success to-primary flex items-center justify-center">
                        <Filter className="h-3 w-3 text-white" />
                      </div>
                      فئات المنتجات
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    {productCategories.map((category) => (
                      <div
                        key={category.id}
                        className={`glass-card rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
                          selectedCategory === category.id
                            ? "ring-2 ring-primary bg-primary/5"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedCategory(
                            category.id === selectedCategory ? "" : category.id,
                          )
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center text-lg`}
                          >
                            {category.icon}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-primary text-arabic">
                              {category.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {category.nameEn}
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {category.count}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Products Grid */}
              <div className="lg:col-span-9">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredProducts.map((product) => (
                    <Card
                      key={product.id}
                      className="glass-card border-0 rounded-3xl overflow-hidden hover:scale-105 transition-all duration-500 group"
                    >
                      <div className="relative">
                        {/* Product Badge */}
                        {product.badge && (
                          <div className="absolute top-4 right-4 z-10">
                            <Badge
                              className={`${
                                product.badge === "جديد"
                                  ? "bg-green-500"
                                  : product.badge === "الأكثر مبيعاً"
                                    ? "bg-blue-500"
                                    : "bg-orange-500"
                              } text-white px-3 py-1`}
                            >
                              {product.badge}
                            </Badge>
                          </div>
                        )}

                        {/* Product Image Placeholder */}
                        <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <Package className="h-12 w-12 text-white" />
                          </div>
                        </div>

                        {/* Heart Icon */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-4 left-4 w-10 h-10 rounded-full glass-hover"
                        >
                          <Heart className="h-5 w-5" />
                        </Button>
                      </div>

                      <CardContent className="p-6">
                        <div className="mb-4">
                          <h3 className="font-bold text-primary mb-2 text-arabic text-lg group-hover:text-accent transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {product.nameEn}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-current text-yellow-500" />
                            <span className="font-bold text-sm">
                              {product.rating}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({product.reviews} تقييم)
                          </span>
                          {product.inStock && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              <CheckCircle className="h-3 w-3 ml-1" />
                              متوفر
                            </Badge>
                          )}
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl font-bold text-primary">
                              {product.price} ريال
                            </span>
                            {product.originalPrice && (
                              <span className="text-lg text-muted-foreground line-through">
                                {product.originalPrice} ريال
                              </span>
                            )}
                          </div>
                          {product.originalPrice && (
                            <div className="text-sm text-green-600 font-medium">
                              توفير {product.originalPrice - product.price} ريال
                            </div>
                          )}
                        </div>

                        <div className="mb-4">
                          <div className="text-sm font-medium text-muted-foreground mb-2 text-arabic">
                            المزايا الرئيسية:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {product.features.map((feature, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs"
                              >
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                          <Shield className="h-4 w-4" />
                          <span className="text-arabic">
                            ضمان {product.warranty}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => addToCart(product.id)}
                            disabled={isInCart(product.id)}
                            className={`text-sm h-10 rounded-xl ${
                              isInCart(product.id)
                                ? "bg-green-500 hover:bg-green-600"
                                : "bg-gradient-to-r from-success to-primary hover:scale-105"
                            } transition-all`}
                          >
                            {isInCart(product.id) ? (
                              <>
                                <CheckCircle className="ml-1 h-3 w-3" />
                                تم الإضافة
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="ml-1 h-3 w-3" />
                                أضف للسلة
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            className="glass-hover text-sm h-10 rounded-xl"
                          >
                            <Eye className="ml-1 h-3 w-3" />
                            تفاصيل
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Load More Button */}
                <div className="text-center mt-12">
                  <Button className="h-14 px-8 text-lg bg-gradient-to-r from-success via-primary to-success hover:scale-105 transition-all rounded-2xl">
                    <ArrowRight className="ml-2 h-5 w-5" />
                    عرض المزيد من المنتجات
                  </Button>
                </div>
              </div>
            </div>

            {/* Shopping Cart Summary */}
            {cartItems.length > 0 && (
              <div className="fixed bottom-6 right-6 glass-intense rounded-2xl p-4 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success to-primary flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-primary">
                      {cartItems.length} منتج في السلة
                    </div>
                    <div className="text-sm text-muted-foreground text-arabic">
                      اضغط لعرض السلة
                    </div>
                  </div>
                  <Button className="bg-gradient-to-r from-success to-primary hover:scale-105 transition-all">
                    عرض السلة
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}