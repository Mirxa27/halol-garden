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
  MapPin, 
  Clock, 
  Phone,
  MessageCircle,
  Award,
  CheckCircle,
  Calendar,
  Users,
  Shield,
  TrendingUp,
  Package,
  Eye,
  Heart,
  Share2,
  Camera,
  Plus,
  ThumbsUp,
  Wrench,
  Building,
  Globe,
  Mail,
  FileText,
  Download,
  ExternalLink,
  Zap,
  Timer,
  Truck,
  Calculator
} from "lucide-react";

export default function ProviderProfile() {
  const { providerId } = useParams();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [followingProvider, setFollowingProvider] = useState(false);

  // Mock provider data
  const provider = {
    id: providerId,
    name: "شركة الرعاية الطبية المتقدمة",
    nameEn: "Advanced Medical Care Company",
    logo: "/placeholder.svg",
    coverImage: "/placeholder.svg",
    description: "شركة رائدة في مجال صيانة وتطوير الأجهزة الطبية، نقدم خدمات عالية الجودة للمستشفيات والعيادات في جميع أنحاء المملكة العربية السعودية.",
    descriptionEn: "Leading company in medical equipment maintenance and development, providing high-quality services to hospitals and clinics throughout Saudi Arabia.",
    rating: 4.9,
    totalReviews: 324,
    completedJobs: 2400,
    responseTime: "خلال ساعة",
    location: "الرياض، المملكة العربية السعودية",
    established: "2015",
    verified: true,
    employeeCount: "50-100",
    licenseNumber: "MED-2015-0456",
    vatNumber: "300123456789003",
    specialties: [
      "أجهزة التصوير الطبي",
      "معدات الطوارئ والإنعاش",
      "أجهزة المراقبة والقياس",
      "معدات العمليات الجراحية",
      "أنظمة المختبرات الطبية"
    ],
    certifications: [
      { name: "ISO 9001:2015", issuer: "International Organization for Standardization", year: "2023" },
      { name: "FDA Medical Device Registration", issuer: "FDA", year: "2022" },
      { name: "سعودي معتمد", issuer: "هيئة الغذاء والدواء السعودية", year: "2023" },
      { name: "شهادة الجودة المحلية", issuer: "وزارة الصحة السعودية", year: "2023" }
    ],
    badges: ["خبير معتمد", "استجابة سريعة", "ضمان ذهبي", "خدمة 24/7"],
    contact: {
      phone: "+966501234567",
      email: "info@advanced-medical.sa",
      website: "www.advanced-medical.sa",
      address: "حي العليا، شارع الملك فهد، الرياض"
    },
    workingHours: {
      weekdays: "8:00 ص - 8:00 م",
      weekends: "10:00 ص - 6:00 م",
      emergency: "24/7"
    },
    serviceAreas: ["الرياض", "الخرج", "الدرعية", "جدة", "مكة", "الدمام", "الخبر"],
    portfolio: [
      {
        id: 1,
        title: "مشروع تطوير مستشفى الملك فيصل",
        description: "صيانة شاملة وتطوير أنظمة الأجهزة الطبية",
        image: "/placeholder.svg",
        year: "2023",
        client: "مستشفى الملك فيصل",
        value: "2.5 مليون ريال"
      },
      {
        id: 2,
        title: "مشروع عيادات النخبة الطبية",
        description: "تركيب وصيانة معدات التصوير الطبي",
        image: "/placeholder.svg",
        year: "2023",
        client: "عيادات النخبة",
        value: "800 ألف ريال"
      },
      {
        id: 3,
        title: "مشروع مركز الرعاية المتقدمة",
        description: "تطوير أنظمة المراقبة والطوارئ",
        image: "/placeholder.svg",
        year: "2022",
        client: "مركز الرعاية المتقدمة",
        value: "1.2 مليون ريال"
      }
    ],
    team: [
      {
        name: "م. أحمد الشريف",
        position: "مدير المشاريع",
        experience: "15 سنة",
        certifications: ["PMP", "ISO Lead Auditor"]
      },
      {
        name: "د. فاطمة العتيبي",
        position: "مهندسة طبية حيوية",
        experience: "12 سنة",
        certifications: ["CBET", "CHTM"]
      },
      {
        name: "م. محمد الغامدي",
        position: "فني أول",
        experience: "10 سنوات",
        certifications: ["Siemens Certified", "Philips Certified"]
      }
    ]
  };

  const services = [
    {
      id: "service-1",
      title: "صيانة أجهزة الأشعة السينية",
      description: "خدمة صيانة شاملة لأجهزة الأشعة السينية من جميع الأنواع",
      price: 450,
      duration: "2-4 ساعات",
      rating: 4.9,
      reviews: 156,
      image: "/placeholder.svg",
      emergency: true,
      category: "صيانة"
    },
    {
      id: "service-2",
      title: "معايرة أجهزة المراقبة",
      description: "معايرة وضبط أجهزة مراقبة العلامات الحيوية",
      price: 280,
      duration: "1-2 ساعات",
      rating: 4.8,
      reviews: 98,
      image: "/placeholder.svg",
      emergency: false,
      category: "معايرة"
    },
    {
      id: "service-3",
      title: "صيانة معدات العمليات",
      description: "صيانة وإصلاح معدات غرف العمليات الجراحية",
      price: 650,
      duration: "3-6 ساعات",
      rating: 4.9,
      reviews: 87,
      image: "/placeholder.svg",
      emergency: true,
      category: "صيانة"
    },
    {
      id: "service-4",
      title: "تطوير أنظمة المختبرات",
      description: "تطوير وتحديث أنظمة معدات المختبرات الطبية",
      price: 1200,
      duration: "1-2 أيام",
      rating: 4.7,
      reviews: 45,
      image: "/placeholder.svg",
      emergency: false,
      category: "تطوير"
    }
  ];

  const reviews = [
    {
      id: 1,
      user: "مستشفى الملك فيصل التخصصي",
      userType: "مؤسسة طبية",
      rating: 5,
      date: "2024-01-18",
      title: "شراكة ممتازة وخدمة استثنائية",
      comment: "نتعامل مع هذه الشركة منذ سنوات وهي تقدم خدمة ممتازة دائماً. الفريق محترف وسريع الاستجابة، والأسعار معقولة جداً مقارنة بالجودة المقدمة.",
      serviceUsed: "صيانة شاملة",
      verified: true,
      helpful: 45,
      images: ["/placeholder.svg", "/placeholder.svg"]
    },
    {
      id: 2,
      user: "د. أحمد المحمدي",
      userType: "طبيب استشاري",
      rating: 5,
      date: "2024-01-15",
      title: "احترافية عالية ونتائج ممتازة",
      comment: "تعاملت معهم لصيانة أجهزة العيادة وكانت النتيجة فوق التوقعات. الفنيين مدربين ولديهم خبرة واسعة في التعامل مع الأجهزة المتقدمة.",
      serviceUsed: "صيانة دورية",
      verified: true,
      helpful: 32
    },
    {
      id: 3,
      user: "مجمع عيادات النخبة",
      userType: "مجمع طبي",
      rating: 4,
      date: "2024-01-10",
      title: "خدمة جيدة وأسعار منافسة",
      comment: "الخدمة جيدة بشكل عام، الفريق محترف والأسعار مناسبة. أتمنى تحسين أوقات الاستجابة للطلبات العادية قليلاً.",
      serviceUsed: "معايرة أجهزة",
      verified: true,
      helpful: 28
    }
  ];

  const getServiceCategoryColor = (category: string) => {
    switch (category) {
      case 'صيانة':
        return 'bg-primary text-primary-foreground';
      case 'معايرة':
        return 'bg-accent text-accent-foreground';
      case 'تطوير':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Layout>
      <div className="pb-16">
        {/* Cover Section */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img 
            src={provider.coverImage} 
            alt={`${provider.name} cover`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
          
          {/* Provider Header Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-end gap-6">
                <Avatar className="h-24 w-24 border-4 border-white">
                  <AvatarImage src={provider.logo} />
                  <AvatarFallback className="text-3xl font-bold bg-primary text-primary-foreground">
                    ش
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-arabic">{provider.name}</h1>
                    {provider.verified && (
                      <Badge className="bg-success text-success-foreground">
                        <CheckCircle className="h-4 w-4 ml-1" />
                        موثق
                      </Badge>
                    )}
                  </div>
                  <p className="text-xl mb-2">{provider.nameEn}</p>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-current text-yellow-400" />
                      <span className="font-semibold">{provider.rating}</span>
                      <span>({provider.totalReviews} تقييم)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{provider.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      <span className="text-arabic">متأسس منذ {provider.established}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-arabic"
                    onClick={() => setFollowingProvider(!followingProvider)}
                  >
                    <Heart className={`ml-2 h-4 w-4 ${followingProvider ? 'fill-current' : ''}`} />
                    {followingProvider ? 'متابع' : 'متابعة'}
                  </Button>
                  <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-arabic">
                    <MessageCircle className="ml-2 h-4 w-4" />
                    تواصل
                  </Button>
                  <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 mt-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="overview" className="space-y-8">
                <div className="glass-card rounded-2xl p-2">
                  <TabsList className="grid w-full grid-cols-5 bg-transparent">
                    <TabsTrigger value="overview" className="text-arabic">نظرة عامة</TabsTrigger>
                    <TabsTrigger value="services" className="text-arabic">الخدمات</TabsTrigger>
                    <TabsTrigger value="portfolio" className="text-arabic">معرض الأعمال</TabsTrigger>
                    <TabsTrigger value="reviews" className="text-arabic">التقييمات</TabsTrigger>
                    <TabsTrigger value="team" className="text-arabic">الفريق</TabsTrigger>
                  </TabsList>
                </div>

                {/* Overview */}
                <TabsContent value="overview" className="space-y-6">
                  {/* About */}
                  <Card className="glass-card border-0">
                    <CardHeader>
                      <CardTitle className="text-xl text-primary text-arabic">عن الشركة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-arabic mb-4">{provider.description}</p>
                      <p className="text-muted-foreground mb-6">{provider.descriptionEn}</p>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-primary mb-3 text-arabic">التخصصات:</h4>
                          <div className="space-y-2">
                            {provider.specialties.map((specialty, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-success" />
                                <span className="text-arabic">{specialty}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-primary mb-3 text-arabic">مناطق الخدمة:</h4>
                          <div className="flex flex-wrap gap-2">
                            {provider.serviceAreas.map((area, index) => (
                              <Badge key={index} variant="outline">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stats */}
                  <div className="grid md:grid-cols-4 gap-4">
                    <Card className="glass-card border-0">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary mb-1">{provider.completedJobs}</div>
                        <div className="text-sm text-muted-foreground text-arabic">خدمة مكتملة</div>
                      </CardContent>
                    </Card>
                    <Card className="glass-card border-0">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-success mb-1">{provider.rating}</div>
                        <div className="text-sm text-muted-foreground text-arabic">معدل التقييم</div>
                      </CardContent>
                    </Card>
                    <Card className="glass-card border-0">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-accent mb-1">{provider.responseTime}</div>
                        <div className="text-sm text-muted-foreground text-arabic">متوسط الرد</div>
                      </CardContent>
                    </Card>
                    <Card className="glass-card border-0">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary mb-1">98.5%</div>
                        <div className="text-sm text-muted-foreground text-arabic">معدل النجاح</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Certifications */}
                  <Card className="glass-card border-0">
                    <CardHeader>
                      <CardTitle className="text-xl text-primary text-arabic">الشهادات والاعتمادات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        {provider.certifications.map((cert, index) => (
                          <div key={index} className="glass rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                                <Award className="h-6 w-6 text-success" />
                              </div>
                              <div>
                                <h4 className="font-medium text-primary">{cert.name}</h4>
                                <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                                <p className="text-xs text-muted-foreground">صادر في {cert.year}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Services */}
                <TabsContent value="services" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-primary text-arabic">الخدمات المتاحة</h2>
                    <Badge variant="outline">{services.length} خدمة</Badge>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {services.map((service) => (
                      <Card key={service.id} className="glass-card border-0 hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex gap-4">
                            <img 
                              src={service.image} 
                              alt={service.title}
                              className="w-16 h-16 rounded-lg object-cover bg-white flex-shrink-0"
                            />
                            
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge className={getServiceCategoryColor(service.category)}>
                                      {service.category}
                                    </Badge>
                                    {service.emergency && (
                                      <Badge className="bg-destructive text-destructive-foreground text-xs">
                                        <Zap className="h-3 w-3 ml-1" />
                                        طوارئ
                                      </Badge>
                                    )}
                                  </div>
                                  <h3 className="font-semibold text-primary text-arabic">{service.title}</h3>
                                  <p className="text-sm text-muted-foreground text-arabic mb-2">{service.description}</p>
                                  
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 fill-current text-success" />
                                      <span>{service.rating}</span>
                                      <span>({service.reviews})</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Timer className="h-3 w-3" />
                                      <span className="text-arabic">{service.duration}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="text-lg font-bold text-primary">{service.price} ريال</div>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" className="glass-hover">
                                    <Heart className="h-3 w-3" />
                                  </Button>
                                  <Link to={`/services/${service.id}`}>
                                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-arabic">
                                      <Eye className="ml-2 h-3 w-3" />
                                      عرض
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Portfolio */}
                <TabsContent value="portfolio" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-primary text-arabic">معرض الأعمال</h2>
                    <Badge variant="outline">{provider.portfolio.length} مشروع</Badge>
                  </div>
                  
                  <div className="grid gap-6">
                    {provider.portfolio.map((project) => (
                      <Card key={project.id} className="glass-card border-0 overflow-hidden">
                        <div className="md:flex">
                          <img 
                            src={project.image} 
                            alt={project.title}
                            className="w-full md:w-48 h-48 object-cover"
                          />
                          <CardContent className="p-6 flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="text-xl font-bold text-primary mb-2 text-arabic">{project.title}</h3>
                                <p className="text-muted-foreground text-arabic mb-3">{project.description}</p>
                                
                                <div className="grid md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium text-arabic">العميل: </span>
                                    <span className="text-muted-foreground">{project.client}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-arabic">السنة: </span>
                                    <span className="text-muted-foreground">{project.year}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-arabic">القيمة: </span>
                                    <span className="text-primary font-semibold">{project.value}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <Button variant="outline" size="sm" className="glass-hover">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Reviews */}
                <TabsContent value="reviews" className="space-y-6">
                  {/* Reviews Summary */}
                  <Card className="glass-card border-0">
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="text-center">
                          <div className="text-5xl font-bold text-primary mb-2">{provider.rating}</div>
                          <div className="flex items-center justify-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-5 w-5 ${
                                  i < Math.floor(provider.rating)
                                    ? 'fill-success text-success'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-muted-foreground text-arabic">
                            بناءً على {provider.totalReviews} تقييم
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
                                  style={{ width: `${stars === 5 ? 85 : stars === 4 ? 12 : 2}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-8">
                                {stars === 5 ? '85%' : stars === 4 ? '12%' : '2%'}
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
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="text-lg font-bold">
                                {review.user.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium text-primary">{review.user}</h4>
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
                              
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex">
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
                                <Badge variant="outline" className="text-xs">
                                  {review.serviceUsed}
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
                                      className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:opacity-80"
                                      onClick={() => setSelectedImageIndex(index)}
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
                </TabsContent>

                {/* Team */}
                <TabsContent value="team" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-primary text-arabic">فريق العمل</h2>
                    <Badge variant="outline">{provider.team.length} عضو</Badge>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {provider.team.map((member, index) => (
                      <Card key={index} className="glass-card border-0">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarFallback className="text-lg font-bold bg-primary text-primary-foreground">
                                {member.name.split(' ')[0].charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-semibold text-primary text-arabic">{member.name}</h3>
                              <p className="text-muted-foreground text-arabic mb-1">{member.position}</p>
                              <p className="text-sm text-muted-foreground text-arabic mb-2">خبرة {member.experience}</p>
                              <div className="flex flex-wrap gap-1">
                                {member.certifications.map((cert, certIndex) => (
                                  <Badge key={certIndex} variant="outline" className="text-xs">
                                    {cert}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-6 sticky top-24">
                {/* Contact Info */}
                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary text-arabic">معلومات الاتصال</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{provider.contact.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{provider.contact.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{provider.contact.website}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm text-arabic">{provider.contact.address}</span>
                    </div>
                    
                    <div className="pt-4 space-y-2">
                      <Button className="w-full bg-primary hover:bg-primary/90 text-arabic">
                        <MessageCircle className="ml-2 h-4 w-4" />
                        إرسال رسالة
                      </Button>
                      <Button variant="outline" className="w-full glass-hover border-primary/30">
                        <Phone className="ml-2 h-4 w-4" />
                        اتصال مباشر
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Working Hours */}
                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary text-arabic">ساعات العمل</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-arabic">أيام الأسبوع:</span>
                      <span className="text-sm font-medium">{provider.workingHours.weekdays}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-arabic">عطلة نهاية الأسبوع:</span>
                      <span className="text-sm font-medium">{provider.workingHours.weekends}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-arabic">الطوارئ:</span>
                      <Badge className="bg-destructive text-destructive-foreground text-xs">
                        {provider.workingHours.emergency}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Company Info */}
                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary text-arabic">معلومات الشركة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-arabic">تأسست:</span>
                      <span className="text-sm font-medium">{provider.established}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-arabic">عدد الموظفين:</span>
                      <span className="text-sm font-medium">{provider.employeeCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-arabic">رقم الترخيص:</span>
                      <span className="text-sm font-medium">{provider.licenseNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-arabic">الرقم الضريبي:</span>
                      <span className="text-sm font-medium">{provider.vatNumber}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Badges */}
                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary text-arabic">الشارات والجوائز</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {provider.badges.map((badge, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}