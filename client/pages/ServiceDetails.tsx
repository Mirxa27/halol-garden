import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Star, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin,
  Phone,
  MessageCircle,
  Award,
  CheckCircle,
  AlertCircle,
  Wrench,
  Users,
  Shield,
  Truck,
  Camera,
  FileText,
  Calculator,
  Timer,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Heart,
  Share2,
  BookOpen,
  Zap,
  TrendingUp,
  Package,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function ServiceDetails() {
  const { serviceId } = useParams();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('normal');
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Mock service data
  const service = {
    id: serviceId,
    title: "صيانة أجهزة الأشعة السينية المتقدمة",
    titleEn: "Advanced X-Ray Equipment Maintenance",
    category: "صيانة",
    categoryEn: "Maintenance",
    subcategory: "أجهزة التصوير الطبي",
    description: `خدمة صيانة شاملة ومتخصصة لجميع أنواع أجهزة الأشعة السينية. نقدم فحص شامل، صيانة وقائية، إصلاح الأعطال، وضبط المعايرة لضمان أداء مثالي وسلامة المرضى.`,
    rating: 4.9,
    totalReviews: 156,
    completedJobs: 420,
    basePrice: 450,
    currency: "ريال",
    estimatedDuration: "2-4 ساعات",
    serviceType: "زيارة ميدانية",
    emergencyAvailable: true,
    warrantyPeriod: "3 أشهر",
    features: [
      "فحص شامل لجميع المكونات",
      "تنظيف وصيانة الأنبوب والمولد",
      "فحص أنظمة السلامة والحماية",
      "ضبط معايرة الصورة والإشعاع",
      "اختبار أداء النظام",
      "تقرير مفصل عن حالة الجهاز",
      "ضمان لمدة 3 أشهر على الخدمة",
      "استشارة فنية مجانية"
    ],
    images: [
      "/placeholder.svg",
      "/placeholder.svg",
      "/placeholder.svg",
      "/placeholder.svg"
    ],
    provider: {
      id: "provider-123",
      name: "شركة الرعاية الطبية المتقدمة",
      nameEn: "Advanced Medical Care Company",
      logo: "/placeholder.svg",
      rating: 4.9,
      totalReviews: 324,
      completedJobs: 2400,
      responseTime: "خلال ساعة",
      location: "الرياض",
      established: "2015",
      verified: true,
      specialties: ["أجهزة التصوير", "معدات الطوارئ", "أجهزة المراقبة"],
      certifications: ["ISO 9001", "FDA Approved", "سعودي معتمد"],
      badges: ["خبير معتمد", "استجابة سريعة", "ضمان ذهبي"],
      contact: {
        phone: "+966501234567",
        email: "info@advanced-medical.sa",
        website: "www.advanced-medical.sa"
      }
    },
    pricing: {
      consultation: {
        price: 100,
        description: "استشارة مجانية عند طلب الخدمة"
      },
      regular: {
        price: 450,
        description: "صيانة دورية - مجدولة مسبقاً"
      },
      urgent: {
        price: 650,
        description: "صيانة طارئة - خلال 24 ساعة"
      },
      emergency: {
        price: 900,
        description: "صيانة عاجلة - خلال 4 ساعات"
      }
    },
    availability: {
      workingHours: "8:00 ص - 8:00 م",
      workingDays: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"],
      emergency: "24/7",
      averageResponseTime: "2 ساعة"
    },
    serviceAreas: ["الرياض", "الخرج", "الدرعية", "جدة", "مكة"],
    equipmentCovered: [
      "أجهزة الأشعة السينية الثابتة",
      "أجهزة الأشعة المحمولة",
      "أنظمة الأشعة الرقمية",
      "معدات التصوير المقطعي",
      "أجهزة الأشعة بالأمواج فوق الصوتية"
    ]
  };

  const reviews = [
    {
      id: 1,
      user: "مستشفى الملك فيصل",
      userType: "مؤسسة طبية",
      rating: 5,
      date: "2024-01-18",
      title: "خدمة ممتازة ومهنية عالية",
      comment: "الفريق محترف جداً وانتهى من الصيانة في الوقت المحدد. الجهاز يعمل بكفاءة عالية الآن. أنصح بهذه الشركة بقوة.",
      serviceType: "صيانة دورية",
      verified: true,
      helpful: 24,
      images: ["/placeholder.svg", "/placeholder.svg"]
    },
    {
      id: 2,
      user: "د. أحمد الشهري",
      userType: "طبيب",
      rating: 5,
      date: "2024-01-15",
      title: "استجابة سريعة وحل فعال",
      comment: "تواصلوا معي خلال نصف ساعة وحضروا في نفس ا��يوم. حلوا المشكلة بسرعة ومهنية.",
      serviceType: "صيانة طارئة",
      verified: true,
      helpful: 18
    },
    {
      id: 3,
      user: "عيادة النخبة الطبية",
      userType: "عيادة خاصة",
      rating: 4,
      date: "2024-01-10",
      title: "جودة ممتازة",
      comment: "خدمة جيدة جداً، الفنيين مدربين ولديهم خبرة واسعة. السعر مناسب مقارنة بالجودة.",
      serviceType: "صيانة دورية",
      verified: true,
      helpful: 12
    }
  ];

  const relatedServices = [
    {
      id: "service-2",
      title: "صيانة أجهزة الموجات فوق الصوتية",
      price: 380,
      rating: 4.8,
      provider: "تقنيات الطب المتقدم"
    },
    {
      id: "service-3", 
      title: "صيانة أجهزة المراقبة الطبية",
      price: 220,
      rating: 4.7,
      provider: "الخبراء التقنيون"
    },
    {
      id: "service-4",
      title: "معايرة أجهزة القياس الطبية",
      price: 180,
      rating: 4.9,
      provider: "معايرة دقيقة"
    }
  ];

  const availableTimes = [
    "9:00 ص", "10:00 ص", "11:00 ص", "12:00 م",
    "1:00 م", "2:00 م", "3:00 م", "4:00 م", "5:00 م"
  ];

  const getPriceByUrgency = () => {
    switch (urgencyLevel) {
      case 'emergency':
        return service.pricing.emergency.price;
      case 'urgent':
        return service.pricing.urgent.price;
      case 'normal':
      default:
        return service.pricing.regular.price;
    }
  };

  const getPricingDescription = () => {
    switch (urgencyLevel) {
      case 'emergency':
        return service.pricing.emergency.description;
      case 'urgent':
        return service.pricing.urgent.description;
      case 'normal':
      default:
        return service.pricing.regular.description;
    }
  };

  return (
    <Layout>
      <div className="pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm">
            <ol className="flex items-center gap-2 text-muted-foreground">
              <li><Link to="/" className="hover:text-primary">الرئيسية</Link></li>
              <li>/</li>
              <li><Link to="/maintenance" className="hover:text-primary">الصيانة</Link></li>
              <li>/</li>
              <li><Link to={`/category/${service.subcategory}`} className="hover:text-primary">{service.subcategory}</Link></li>
              <li>/</li>
              <li className="text-primary">{service.title}</li>
            </ol>
          </nav>

          <div className="grid lg:grid-cols-12 gap-8">
            {/* Service Images */}
            <div className="lg:col-span-5">
              <div className="sticky top-24">
                <div className="glass-card rounded-3xl p-6 mb-4">
                  <div className="aspect-video rounded-2xl overflow-hidden mb-4 bg-white">
                    <img 
                      src={service.images[0]} 
                      alt={service.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {service.images.map((image, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded-lg overflow-hidden bg-white border-2 border-transparent hover:border-muted"
                      >
                        <img 
                          src={image} 
                          alt={`${service.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Service Info */}
            <div className="lg:col-span-4">
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-primary text-primary-foreground">{service.category}</Badge>
                    <Badge variant="outline">{service.subcategory}</Badge>
                    {service.emergencyAvailable && (
                      <Badge className="bg-destructive text-destructive-foreground">
                        <Zap className="h-3 w-3 ml-1" />
                        طوارئ 24/7
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-primary mb-2 text-arabic">{service.title}</h1>
                  <p className="text-lg text-muted-foreground mb-3">{service.titleEn}</p>
                  <p className="text-muted-foreground text-arabic mb-4">{service.description}</p>
                  
                  {/* Rating & Stats */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(service.rating)
                                ? 'fill-success text-success'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold">{service.rating}</span>
                    </div>
                    <span className="text-muted-foreground">({service.totalReviews} تقييم)</span>
                    <span className="text-muted-foreground text-arabic">• {service.completedJobs} خدمة مكتملة</span>
                  </div>
                </div>

                {/* Service Details */}
                <div className="glass rounded-2xl p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium text-arabic">مدة الخدمة</div>
                        <div className="text-muted-foreground">{service.estimatedDuration}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium text-arabic">نوع الخدمة</div>
                        <div className="text-muted-foreground">{service.serviceType}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium text-arabic">الضمان</div>
                        <div className="text-muted-foreground">{service.warrantyPeriod}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium text-arabic">متوسط الاستجابة</div>
                        <div className="text-muted-foreground">{service.availability.averageResponseTime}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Options */}
                <div>
                  <h3 className="font-semibold text-primary mb-3 text-arabic">اختر نوع الخدمة:</h3>
                  <div className="space-y-2">
                    {Object.entries(service.pricing).map(([key, pricing]) => (
                      key !== 'consultation' && (
                        <label key={key} className="block">
                          <input
                            type="radio"
                            name="urgency"
                            value={key}
                            checked={urgencyLevel === key}
                            onChange={(e) => setUrgencyLevel(e.target.value)}
                            className="sr-only"
                          />
                          <div className={`glass rounded-xl p-4 cursor-pointer transition-colors border-2 ${
                            urgencyLevel === key 
                              ? 'border-primary bg-primary/5' 
                              : 'border-transparent hover:border-primary/30'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-arabic">
                                {key === 'regular' && 'صيانة دورية'}
                                {key === 'urgent' && 'صيانة طارئة'}
                                {key === 'emergency' && 'صيانة عاجلة'}
                              </span>
                              <span className="font-bold text-primary">{pricing.price} ريال</span>
                            </div>
                            <div className="text-sm text-muted-foreground text-arabic">
                              {pricing.description}
                            </div>
                          </div>
                        </label>
                      )
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div className="glass rounded-2xl p-4">
                  <h3 className="font-semibold text-primary mb-3 text-arabic">ما يشمله الخدمة:</h3>
                  <div className="space-y-2">
                    {service.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-arabic">
                        <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <div className="glass rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {getPriceByUrgency()} ريال
                    </div>
                    <div className="text-sm text-muted-foreground text-arabic">
                      {getPricingDescription()}
                    </div>
                  </div>

                  <Button className="w-full bg-success hover:bg-success/90 text-white py-3 text-lg text-arabic">
                    <CalendarIcon className="ml-2 h-5 w-5" />
                    احجز الخدمة الآن
                  </Button>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant="outline" 
                      className="glass-hover border-primary/30 text-arabic"
                      onClick={() => setIsWishlisted(!isWishlisted)}
                    >
                      <Heart className={`ml-1 h-4 w-4 ${isWishlisted ? 'fill-current text-red-500' : ''}`} />
                      حفظ
                    </Button>
                    <Button variant="outline" className="glass-hover border-primary/30">
                      <Share2 className="ml-1 h-4 w-4" />
                      مشاركة
                    </Button>
                    <Button variant="outline" className="glass-hover border-primary/30 text-arabic">
                      <Calculator className="ml-1 h-4 w-4" />
                      تسعير
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Provider & Booking */}
            <div className="lg:col-span-3">
              <div className="space-y-6 sticky top-24">
                {/* Provider Info */}
                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary text-arabic">مقدم الخدمة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={service.provider.logo} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          ش
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-primary text-arabic">{service.provider.name}</h4>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-3 w-3 fill-current text-success" />
                          <span>{service.provider.rating}</span>
                          <span className="text-muted-foreground">({service.provider.totalReviews})</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{service.provider.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-arabic">يرد {service.provider.responseTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <span className="text-arabic">متأسس منذ {service.provider.established}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-arabic">{service.provider.completedJobs} خدمة مكتملة</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {service.provider.badges.map((badge, index) => (
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
                    
                    <Link to={`/provider/${service.provider.id}`} className="block mt-3">
                      <Button variant="link" className="w-full text-primary text-arabic">
                        عرض الملف الكامل
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Quick Booking */}
                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary text-arabic">حجز سريع</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-arabic">اختر التاريخ</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full glass justify-start text-right">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div>
                      <Label className="text-arabic">اختر الوقت</Label>
                      <Select value={selectedTime} onValueChange={setSelectedTime}>
                        <SelectTrigger className="glass">
                          <SelectValue placeholder="اختر الوقت المناسب" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTimes.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-arabic">وصف المشكلة (اختياري)</Label>
                      <Textarea 
                        placeholder="اكتب وصفاً مختصراً للمشكلة..."
                        className="glass text-arabic"
                        rows={3}
                      />
                    </div>
                    
                    <Button 
                      className="w-full bg-success hover:bg-success/90 text-arabic"
                      disabled={!selectedDate || !selectedTime}
                    >
                      <CheckCircle className="ml-2 h-4 w-4" />
                      تأكيد الحجز
                    </Button>
                    
                    <p className="text-xs text-muted-foreground text-center text-arabic">
                      سيتم التواصل معك خلال ساعة لتأكيد الموعد
                    </p>
                  </CardContent>
                </Card>

                {/* Service Areas */}
                <Card className="glass-card border-0">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-primary mb-2 text-arabic">مناطق الخدمة:</h4>
                    <div className="flex flex-wrap gap-1">
                      {service.serviceAreas.map((area, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Service Details Tabs */}
          <div className="mt-12">
            <Tabs defaultValue="details" className="space-y-8">
              <div className="glass-card rounded-2xl p-2">
                <TabsList className="grid w-full grid-cols-4 bg-transparent">
                  <TabsTrigger value="details" className="text-arabic">تفاصيل الخدمة</TabsTrigger>
                  <TabsTrigger value="reviews" className="text-arabic">التقييمات</TabsTrigger>
                  <TabsTrigger value="provider" className="text-arabic">عن مقدم الخدمة</TabsTrigger>
                  <TabsTrigger value="related" className="text-arabic">خدمات مشابهة</TabsTrigger>
                </TabsList>
              </div>

              {/* Service Details */}
              <TabsContent value="details">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="glass-card border-0">
                    <CardHeader>
                      <CardTitle className="text-lg text-primary text-arabic">الأجهزة المشمولة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {service.equipmentCovered.map((equipment, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-arabic">
                            <CheckCircle className="h-4 w-4 text-success" />
                            <span>{equipment}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-0">
                    <CardHeader>
                      <CardTitle className="text-lg text-primary text-arabic">أوقات العمل</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="font-medium text-arabic">ساعات العمل العادية:</div>
                          <div className="text-muted-foreground">{service.availability.workingHours}</div>
                        </div>
                        <div>
                          <div className="font-medium text-arabic">أيام العمل:</div>
                          <div className="text-muted-foreground text-arabic">
                            {service.availability.workingDays.join(" - ")}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-arabic">الطوارئ:</div>
                          <div className="text-muted-foreground">{service.availability.emergency}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Reviews */}
              <TabsContent value="reviews">
                <div className="space-y-6">
                  {/* Reviews Summary */}
                  <Card className="glass-card border-0">
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="text-center">
                          <div className="text-5xl font-bold text-primary mb-2">{service.rating}</div>
                          <div className="flex items-center justify-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-5 w-5 ${
                                  i < Math.floor(service.rating)
                                    ? 'fill-success text-success'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-muted-foreground text-arabic">
                            بناءً على {service.totalReviews} تقييم
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
                                  style={{ width: `${stars === 5 ? 80 : stars === 4 ? 15 : 3}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-8">
                                {stars === 5 ? '80%' : stars === 4 ? '15%' : '3%'}
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
                                <Badge variant="outline" className="text-xs">
                                  {review.userType}
                                </Badge>
                                {review.verified && (
                                  <Badge className="bg-success text-success-foreground text-xs">
                                    موثق
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
                                <span className="text-sm text-muted-foreground mr-2">•</span>
                                <Badge variant="outline" className="text-xs">
                                  {review.serviceType}
                                </Badge>
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
                </div>
              </TabsContent>

              {/* Provider Details */}
              <TabsContent value="provider">
                <Card className="glass-card border-0">
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-xl font-semibold text-primary mb-4 text-arabic">
                          عن {service.provider.name}
                        </h3>
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-primary" />
                            <span className="text-arabic">متأسسة منذ {service.provider.established}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="text-arabic">{service.provider.completedJobs} خدمة مكتملة</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <span className="text-arabic">معدل نجاح 98.5%</span>
                          </div>
                        </div>
                        
                        <h4 className="font-medium text-primary mb-2 text-arabic">التخصصات:</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {service.provider.specialties.map((specialty, index) => (
                            <Badge key={index} variant="secondary">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-primary mb-2 text-arabic">الشهادات والاعتمادات:</h4>
                        <div className="space-y-2 mb-4">
                          {service.provider.certifications.map((cert, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-success" />
                              <span>{cert}</span>
                            </div>
                          ))}
                        </div>
                        
                        <h4 className="font-medium text-primary mb-2 text-arabic">معلومات الاتصال:</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{service.provider.contact.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-muted-foreground" />
                            <span>{service.provider.contact.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span>{service.provider.contact.website}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Related Services */}
              <TabsContent value="related">
                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="text-xl text-primary text-arabic">خدمات مشابهة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      {relatedServices.map((relatedService) => (
                        <Card key={relatedService.id} className="glass border-0 hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="w-full h-32 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg mb-3 flex items-center justify-center">
                              <Wrench className="h-8 w-8 text-primary" />
                            </div>
                            <h4 className="font-medium text-primary mb-2 text-arabic">{relatedService.title}</h4>
                            <div className="flex items-center gap-1 mb-2">
                              <Star className="h-3 w-3 fill-current text-success" />
                              <span className="text-sm">{relatedService.rating}</span>
                            </div>
                            <div className="text-sm text-muted-foreground text-arabic mb-2">
                              {relatedService.provider}
                            </div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-bold text-primary">{relatedService.price} ريال</span>
                              <span className="text-xs text-muted-foreground">يبدأ من</span>
                            </div>
                            <Link to={`/services/${relatedService.id}`}>
                              <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-arabic">
                                <Eye className="ml-2 h-3 w-3" />
                                عرض الخدمة
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
