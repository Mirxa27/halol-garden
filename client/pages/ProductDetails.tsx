import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Star, 
  ShoppingCart, 
  Heart,
  Share2,
  Truck,
  Shield,
  CheckCircle,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Users,
  RefreshCcw,
  Plus,
  Minus,
  Eye
} from "lucide-react";

export default function ProductDetails() {
  const { productId } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState('standard');
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Mock product data
  const product = {
    id: productId,
    name: "جهاز قياس ضغط الدم الرقمي المتقدم",
    nameEn: "Advanced Digital Blood Pressure Monitor",
    brand: "OMRON",
    model: "HEM-7120",
    price: 450,
    originalPrice: 550,
    currency: "ريال",
    discount: 18,
    rating: 4.8,
    totalReviews: 234,
    fiveStarPercentage: 85,
    inStock: true,
    stockCount: 15,
    soldCount: 1240,
    category: "أجهزة القياس",
    categoryEn: "Measurement Devices",
    images: [
      "/placeholder.svg",
      "/placeholder.svg", 
      "/placeholder.svg",
      "/placeholder.svg"
    ],
    description: `جهاز قياس ضغط الدم الرقمي المتقدم من OMRON، يوفر قراءات دقيقة وموثوقة لضغط الدم ونبضات القلب. مصمم للاستخدام المنزلي والمهني، مع شاشة رقمية كبيرة وذاكرة تخزين للقراءات السابقة.`,
    specifications: {
      "الدقة": "±3 mmHg أو 2% من القراءة",
      "نطاق القياس": "0-300 mmHg",
      "معدل النبض": "40-180 نبضة في الدقيقة",
      "ذاكرة التخزين": "60 قراءة للمستخدم الواحد",
      "حجم الكفة": "22-42 سم",
      "مصدر الطاقة": "4 بطاريات AA أو محول كهربائي",
      "الشاشة": "شاشة LCD كبيرة",
      "الوزن": "390 جرام بدون البطاريات",
      "الأبعاد": "107 × 79 × 141 مم",
      "الضمان": "سنتان"
    },
    features: [
      "تقنية IntelliSense للنفخ التلقائي",
      "كشف عدم انتظام ضربات القلب",
      "مؤشر ضغط الدم العالي",
      "ذاكرة مزدوجة لمستخدمين",
      "حساب متوسط القراءات الثلاث الأخيرة",
      "إيقاف تلقائي لتوفير البطارية"
    ],
    seller: {
      name: "متجر الأجهزة الطبية المتقدمة",
      nameEn: "Advanced Medical Devices Store",
      rating: 4.9,
      totalSales: 15600,
      responseTime: "خلال ساعة",
      location: "الرياض",
      verified: true,
      memberSince: "2020",
      badges: ["بائع موثق", "شحن سريع", "ضمان ذهبي"]
    },
    shipping: {
      free: true,
      standard: "2-3 أيام عمل",
      express: "24 ساعة",
      expressPrice: 25
    },
    warranty: {
      duration: "سنتان",
      type: "ضمان شامل",
      provider: "الوكيل المعتمد",
      coverage: "يغطي العيوب المصنعية والأجزاء والصيانة"
    },
    variants: [
      {
        id: 'standard',
        name: 'النسخة القياسية',
        price: 450,
        features: ['جهاز القياس', 'كفة قياسية', 'دليل المستخدم']
      },
      {
        id: 'premium',
        name: 'النسخة المميزة',
        price: 520,
        features: ['جهاز القياس', 'كفة كبيرة إضافية', 'محول كهربائي', 'حقيبة حمل', 'دليل مفصل']
      }
    ]
  };

  const reviews = [
    {
      id: 1,
      user: "أحمد محمد",
      rating: 5,
      date: "2024-01-15",
      title: "جهاز ممتاز ودقيق",
      comment: "اشتريت هذا الجهاز لوالدي وهو راضي عنه جداً. القراءات دقيقة ومطابقة لقراءات المستشفى. سهل الاستخدام والشاشة واضحة.",
      verified: true,
      helpful: 23,
      images: ["/placeholder.svg"]
    },
    {
      id: 2,
      user: "فاطمة علي",
      rating: 4,
      date: "2024-01-10",
      title: "جودة جيدة",
      comment: "الجهاز جيد بشكل عام، ولكن أتمنى لو كانت الكفة أكبر قليلاً. الشحن كان سريع والتعبئة ممتازة.",
      verified: true,
      helpful: 18
    },
    {
      id: 3,
      user: "محمد الأحمد",
      rating: 5,
      date: "2024-01-05",
      title: "يستحق الشراء",
      comment: "استخدمه منذ شهرين ولم أواجه أي مشاكل. الذاكرة مفيدة لتتبع القراءات. أنصح به بقوة.",
      verified: false,
      helpful: 15
    }
  ];

  const relatedProducts = [
    {
      id: 2,
      name: "جهاز قياس السكر",
      price: 180,
      originalPrice: 220,
      rating: 4.7,
      image: "/placeholder.svg"
    },
    {
      id: 3,
      name: "مقياس الحرارة الرقمي",
      price: 85,
      originalPrice: 100,
      rating: 4.6,
      image: "/placeholder.svg"
    },
    {
      id: 4,
      name: "جهاز الاستنشاق المنزلي",
      price: 320,
      originalPrice: 380,
      rating: 4.9,
      image: "/placeholder.svg"
    }
  ];

  const selectedVariantData = product.variants.find(v => v.id === selectedVariant);
  const finalPrice = selectedVariantData?.price || product.price;

  return (
    <Layout>
      <div className="pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm">
            <ol className="flex items-center gap-2 text-muted-foreground">
              <li><Link to="/" className="hover:text-primary">الرئيسية</Link></li>
              <li>/</li>
              <li><Link to="/sales" className="hover:text-primary">المتجر</Link></li>
              <li>/</li>
              <li><Link to={`/category/${product.category}`} className="hover:text-primary">{product.category}</Link></li>
              <li>/</li>
              <li className="text-primary">{product.name}</li>
            </ol>
          </nav>

          <div className="grid lg:grid-cols-12 gap-8">
            {/* Product Images */}
            <div className="lg:col-span-5">
              <div className="sticky top-24">
                <div className="glass-card rounded-3xl p-6 mb-4">
                  <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-white">
                    <img 
                      src={product.images[selectedImage]} 
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`aspect-square rounded-lg overflow-hidden bg-white border-2 transition-colors ${
                          selectedImage === index ? 'border-primary' : 'border-transparent hover:border-muted'
                        }`}
                      >
                        <img 
                          src={image} 
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="lg:col-span-4">
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-primary text-primary-foreground">{product.category}</Badge>
                    <Badge variant="outline">{product.brand}</Badge>
                  </div>
                  <h1 className="text-3xl font-bold text-primary mb-2 text-arabic">{product.name}</h1>
                  <p className="text-lg text-muted-foreground mb-3">{product.nameEn}</p>
                  <p className="text-muted-foreground text-arabic mb-4">{product.description}</p>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(product.rating)
                                ? 'fill-success text-success'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold">{product.rating}</span>
                    </div>
                    <span className="text-muted-foreground">({product.totalReviews} تقييم)</span>
                    <span className="text-muted-foreground text-arabic">• {product.soldCount} مبيعة</span>
                  </div>
                </div>

                {/* Price */}
                <div className="glass rounded-2xl p-4">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-3xl font-bold text-primary">{finalPrice}</span>
                    <span className="text-lg text-muted-foreground">{product.currency}</span>
                    {product.originalPrice > finalPrice && (
                      <>
                        <span className="text-lg text-muted-foreground line-through">{product.originalPrice}</span>
                        <Badge className="bg-destructive text-destructive-foreground">
                          وفر {product.discount}%
                        </Badge>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-success text-arabic">وفر {product.originalPrice - finalPrice} ريال</p>
                </div>

                {/* Variants */}
                <div>
                  <h3 className="font-semibold text-primary mb-3 text-arabic">اختر النسخة:</h3>
                  <div className="space-y-2">
                    {product.variants.map((variant) => (
                      <label key={variant.id} className="block">
                        <input
                          type="radio"
                          name="variant"
                          value={variant.id}
                          checked={selectedVariant === variant.id}
                          onChange={(e) => setSelectedVariant(e.target.value)}
                          className="sr-only"
                        />
                        <div className={`glass rounded-xl p-4 cursor-pointer transition-colors border-2 ${
                          selectedVariant === variant.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-transparent hover:border-primary/30'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-arabic">{variant.name}</span>
                            <span className="font-bold text-primary">{variant.price} ريال</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {variant.features.join(' • ')}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Stock & Quantity */}
                <div className="glass rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span className="text-success font-medium text-arabic">متوفر في المخزن</span>
                    </div>
                    <span className="text-sm text-muted-foreground">باقي {product.stockCount} قطع</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-arabic">الكمية:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-12 text-center font-medium">{quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button className="w-full bg-success hover:bg-success/90 text-white py-3 text-lg text-arabic">
                    <ShoppingCart className="ml-2 h-5 w-5" />
                    أضف إلى السلة ({finalPrice * quantity} ريال)
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="glass-hover border-primary/30 text-arabic"
                      onClick={() => setIsWishlisted(!isWishlisted)}
                    >
                      <Heart className={`ml-2 h-4 w-4 ${isWishlisted ? 'fill-current text-red-500' : ''}`} />
                      {isWishlisted ? 'في المفضلة' : 'أضف للمفضلة'}
                    </Button>
                    <Button variant="outline" className="glass-hover border-primary/30">
                      <Share2 className="ml-2 h-4 w-4" />
                      مشاركة
                    </Button>
                  </div>
                </div>

                {/* Features */}
                <div className="glass rounded-2xl p-4">
                  <h3 className="font-semibold text-primary mb-3 text-arabic">الميزات الرئيسية:</h3>
                  <div className="space-y-2">
                    {product.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-arabic">
                        <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Seller & Info */}
            <div className="lg:col-span-3">
              <div className="space-y-6 sticky top-24">
                {/* Seller Info */}
                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary text-arabic">معلومات البائع</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          م
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-primary text-arabic">{product.seller.name}</h4>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-3 w-3 fill-current text-success" />
                          <span>{product.seller.rating}</span>
                          <span className="text-muted-foreground">({product.seller.totalSales} مبيعة)</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{product.seller.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-arabic">يرد {product.seller.responseTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-arabic">عضو منذ {product.seller.memberSince}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {product.seller.badges.map((badge, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-arabic">
                        <MessageCircle className="ml-1 h-4 w-4" />
                        رسالة
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Phone className="ml-1 h-4 w-4" />
                        اتصال
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping & Warranty */}
                <Card className="glass-card border-0">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                          <Truck className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <div className="font-medium text-arabic">شحن مجاني</div>
                          <div className="text-sm text-muted-foreground text-arabic">التوصيل خلال {product.shipping.standard}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-arabic">{product.warranty.type}</div>
                          <div className="text-sm text-muted-foreground text-arabic">{product.warranty.duration}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                          <RefreshCcw className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <div className="font-medium text-arabic">استبدال مجاني</div>
                          <div className="text-sm text-muted-foreground text-arabic">خلال 7 أيام</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Product Details Tabs */}
          <div className="mt-12">
            <Tabs defaultValue="specifications" className="space-y-8">
              <div className="glass-card rounded-2xl p-2">
                <TabsList className="grid w-full grid-cols-4 bg-transparent">
                  <TabsTrigger value="specifications" className="text-arabic">المواصفات</TabsTrigger>
                  <TabsTrigger value="reviews" className="text-arabic">التقييمات</TabsTrigger>
                  <TabsTrigger value="questions" className="text-arabic">الأسئلة</TabsTrigger>
                  <TabsTrigger value="related" className="text-arabic">منتجات مشابهة</TabsTrigger>
                </TabsList>
              </div>

              {/* Specifications */}
              <TabsContent value="specifications">
                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="text-xl text-primary text-arabic">المواصفات التفصيلية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="font-medium text-arabic">{key}</span>
                          <span className="text-muted-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews */}
              <TabsContent value="reviews">
                <div className="space-y-6">
                  {/* Reviews Summary */}
                  <Card className="glass-card border-0">
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="text-center">
                          <div className="text-5xl font-bold text-primary mb-2">{product.rating}</div>
                          <div className="flex items-center justify-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-5 w-5 ${
                                  i < Math.floor(product.rating)
                                    ? 'fill-success text-success'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-muted-foreground text-arabic">
                            بناءً على {product.totalReviews} تقييم
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map((stars) => (
                            <div key={stars} className="flex items-center gap-2">
                              <span className="text-sm w-6">{stars}</span>
                              <Star className="h-3 w-3 fill-current text-success" />
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-success"
                                  style={{ width: `${stars === 5 ? 85 : stars === 4 ? 10 : 3}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-8">
                                {stars === 5 ? '85%' : stars === 4 ? '10%' : '3%'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Individual Reviews */}
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id} className="glass-card border-0">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{review.user.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{review.user}</h4>
                                {review.verified && (
                                  <Badge className="bg-success text-success-foreground text-xs">
                                    مشتري موثق
                                  </Badge>
                                )}
                                <span className="text-sm text-muted-foreground">{review.date}</span>
                              </div>
                              
                              <div className="flex items-center gap-1 mb-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? 'fill-success text-success'
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                ))}
                              </div>
                              
                              <h5 className="font-medium mb-2 text-arabic">{review.title}</h5>
                              <p className="text-muted-foreground mb-3 text-arabic">{review.comment}</p>
                              
                              {review.images && (
                                <div className="flex gap-2 mb-3">
                                  {review.images.map((image, index) => (
                                    <img
                                      key={index}
                                      src={image}
                                      alt="تقييم"
                                      className="w-16 h-16 rounded-lg object-cover"
                                    />
                                  ))}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-4 text-sm">
                                <button className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                                  <ThumbsUp className="h-3 w-3" />
                                  <span>مفيد ({review.helpful})</span>
                                </button>
                                <button className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                                  <MessageCircle className="h-3 w-3" />
                                  <span>رد</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="text-center">
                    <Button variant="outline" className="glass-hover border-primary/30 text-arabic">
                      عرض المزيد من التقييمات
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Questions */}
              <TabsContent value="questions">
                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="text-xl text-primary text-arabic">أسئلة وأجوبة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-primary mb-2 text-arabic">لا توجد أسئلة بعد</h3>
                      <p className="text-muted-foreground mb-6 text-arabic">
                        كن أول من يسأل سؤالاً حول هذا المنتج
                      </p>
                      <Button className="bg-primary hover:bg-primary/90 text-arabic">
                        اطرح سؤالاً
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Related Products */}
              <TabsContent value="related">
                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="text-xl text-primary text-arabic">منتجات مشابهة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      {relatedProducts.map((relatedProduct) => (
                        <Card key={relatedProduct.id} className="glass border-0 hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <img
                              src={relatedProduct.image}
                              alt={relatedProduct.name}
                              className="w-full h-32 object-contain mb-3 rounded-lg bg-white"
                            />
                            <h4 className="font-medium text-primary mb-2 text-arabic">{relatedProduct.name}</h4>
                            <div className="flex items-center gap-1 mb-2">
                              <Star className="h-3 w-3 fill-current text-success" />
                              <span className="text-sm">{relatedProduct.rating}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="font-bold text-primary">{relatedProduct.price} ريال</span>
                              <span className="text-sm text-muted-foreground line-through">
                                {relatedProduct.originalPrice} ريال
                              </span>
                            </div>
                            <Link to={`/product/${relatedProduct.id}`}>
                              <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-arabic">
                                <Eye className="ml-2 h-3 w-3" />
                                عرض المنتج
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}