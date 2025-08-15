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
  Calendar,
  Star,
  MapPin,
  Clock,
  Shield,
  CheckCircle,
  Heart,
  Eye,
  Filter,
  Search,
  CreditCard,
  Award,
  Zap,
  Package,
  MessageCircle,
  Phone,
  ArrowRight,
  TrendingUp,
  Users,
  Sparkles,
  Timer,
  DollarSign,
} from "lucide-react";

export default function Rental() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const rentalCategories = [
    {
      id: "ventilators",
      name: "أجهزة التنفس الصناعي",
      nameEn: "Ventilators",
      count: 25,
      gradient: "from-blue-500 to-cyan-500",
      icon: "🫁",
    },
    {
      id: "monitors",
      name: "أجهزة المراقبة",
      nameEn: "Patient Monitors",
      count: 45,
      gradient: "from-green-500 to-emerald-500",
      icon: "📊",
    },
    {
      id: "dialysis",
      name: "أجهزة الغسيل الكلوي",
      nameEn: "Dialysis Machines",
      count: 18,
      gradient: "from-purple-500 to-violet-500",
      icon: "🏥",
    },
    {
      id: "imaging",
      name: "أجهزة التصوير",
      nameEn: "Imaging Equipment",
      count: 32,
      gradient: "from-orange-500 to-red-500",
      icon: "📷",
    },
    {
      id: "rehabilitation",
      name: "معدات العلاج الطبيعي",
      nameEn: "Rehabilitation Equipment",
      count: 28,
      gradient: "from-pink-500 to-purple-500",
      icon: "🏃",
    },
    {
      id: "emergency",
      name: "معدات الطوارئ",
      nameEn: "Emergency Equipment",
      count: 22,
      gradient: "from-red-600 to-orange-600",
      icon: "🚨",
    },
  ];

  const featuredRentals = [
    {
      id: 1,
      name: "جهاز تنفس صناعي متقدم",
      nameEn: "Advanced Ventilator - Philips V60",
      category: "أجهزة التنفس الصناعي",
      dailyRate: 125,
      weeklyRate: 800,
      monthlyRate: 2800,
      rating: 4.9,
      reviews: 78,
      available: true,
      badge: "الأكثر طلباً",
      features: ["تحكم متقدم", "مراقبة مستمرة", "إنذارات ذكية"],
      deliveryTime: "خلال ساعتين",
    },
    {
      id: 2,
      name: "جهاز مراقبة المريض",
      nameEn: "Patient Monitor - GE Carescape B450",
      category: "أجهزة المراقبة",
      dailyRate: 85,
      weeklyRate: 550,
      monthlyRate: 2100,
      rating: 4.8,
      reviews: 142,
      available: true,
      badge: "جديد",
      features: ["شاشة عالية الدقة", "مراقبة متعددة", "تخزين البيانات"],
      deliveryTime: "خلال 4 ساعات",
    },
    {
      id: 3,
      name: "جهاز الموجات فوق الصوتية المحمول",
      nameEn: "Portable Ultrasound - Sonosite M-Turbo",
      category: "أجهزة التصوير",
      dailyRate: 200,
      weeklyRate: 1200,
      monthlyRate: 4500,
      rating: 4.7,
      reviews: 89,
      available: true,
      badge: "عرض محدود",
      features: ["جودة عالية", "سهولة النقل", "بطارية طويلة المدى"],
      deliveryTime: "خلال 6 ساعات",
    },
  ];

  const rentalPeriods = [
    { id: "daily", name: "يومي", discount: 0 },
    { id: "weekly", name: "أسبوعي", discount: 15 },
    { id: "monthly", name: "شهري", discount: 25 },
    { id: "quarterly", name: "ربع سنوي", discount: 35 },
  ];

  return (
    <Layout>
      <div className="relative min-h-screen">
        {/* Floating background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-accent/5 to-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-success/3 to-accent/3 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "0.5s" }}
          ></div>
        </div>

        <div className="relative pt-24 pb-16 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Hero Header */}
            <div className="glass-intense rounded-[2rem] p-8 mb-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-primary/10 pointer-events-none"></div>

              <div className="relative z-10 text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-accent via-primary to-accent shadow-2xl mb-6 relative">
                  <Calendar className="h-10 w-10 text-white" />
                  <div className="absolute inset-0 rounded-3xl bg-white/20 blur-xl"></div>
                </div>

                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent mb-6 text-arabic">
                  إيجار الأجهزة الطبية
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground text-arabic leading-relaxed max-w-3xl mx-auto mb-8">
                  استأجر أحدث ال��جهزة الطبية بأسعار مناسبة ومرونة في فترات
                  الإيجار مع خدمة توصيل وتركيب مجانية
                </p>

                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  <Badge className="glass-subtle px-4 py-2 text-sm">
                    <Zap className="h-4 w-4 ml-2" />
                    توصيل سريع
                  </Badge>
                  <Badge className="glass-subtle px-4 py-2 text-sm">
                    <Shield className="h-4 w-4 ml-2" />
                    صيانة مجانية
                  </Badge>
                  <Badge className="glass-subtle px-4 py-2 text-sm">
                    <Timer className="h-4 w-4 ml-2" />
                    مرونة في المدة
                  </Badge>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="grid lg:grid-cols-5 gap-6 mb-8">
              <div className="lg:col-span-3">
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    placeholder="ابحث عن أجهزة للإيجار..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="glass h-14 text-lg rounded-2xl border-white/20 pr-12 text-arabic"
                  />
                </div>
              </div>
              <div>
                <Select
                  value={selectedDuration}
                  onValueChange={setSelectedDuration}
                >
                  <SelectTrigger className="glass h-14 text-lg rounded-2xl border-white/20">
                    <SelectValue placeholder="مدة الإيجار" />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    {rentalPeriods.map((period) => (
                      <SelectItem
                        key={period.id}
                        value={period.id}
                        className="p-4"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-arabic">{period.name}</span>
                          {period.discount > 0 && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              خصم {period.discount}%
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Button className="w-full h-14 text-lg bg-gradient-to-r from-accent to-primary hover:scale-105 transition-all rounded-2xl">
                  <Filter className="ml-2 h-5 w-5" />
                  بحث
                </Button>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              {/* Categories Sidebar */}
              <div className="lg:col-span-3">
                <Card className="glass-intense border-0 rounded-3xl overflow-hidden mb-6">
                  <CardHeader className="bg-gradient-to-r from-accent/5 to-primary/5 border-b border-white/10">
                    <CardTitle className="text-xl text-primary text-arabic flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                        <Filter className="h-3 w-3 text-white" />
                      </div>
                      فئات الإيجار
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    {rentalCategories.map((category) => (
                      <div
                        key={category.id}
                        className={`glass-card rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
                          selectedCategory === category.id
                            ? "ring-2 ring-accent bg-accent/5"
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

                {/* Rental Advantages */}
                <Card className="glass-intense border-0 rounded-3xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-accent/5 to-primary/5 border-b border-white/10">
                    <CardTitle className="text-lg text-primary text-arabic">
                      مزايا الإيجار
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-primary text-arabic">
                          توفير في التكلفة
                        </div>
                        <div className="text-xs text-muted-foreground text-arabic">
                          بدلاً من الشراء
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-primary text-arabic">
                          صيانة مجانية
                        </div>
                        <div className="text-xs text-muted-foreground text-arabic">
                          طوال فترة الإيجار
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
                        <Timer className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-primary text-arabic">
                          مرونة كاملة
                        </div>
                        <div className="text-xs text-muted-foreground text-arabic">
                          في مدة الإيجار
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Rental Equipment Grid */}
              <div className="lg:col-span-9">
                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {featuredRentals.map((rental) => (
                    <Card
                      key={rental.id}
                      className="glass-card border-0 rounded-3xl overflow-hidden hover:scale-105 transition-all duration-500 group"
                    >
                      <div className="relative">
                        {/* Rental Badge */}
                        {rental.badge && (
                          <div className="absolute top-4 right-4 z-10">
                            <Badge
                              className={`${
                                rental.badge === "جديد"
                                  ? "bg-green-500"
                                  : rental.badge === "الأكثر طلباً"
                                    ? "bg-blue-500"
                                    : "bg-orange-500"
                              } text-white px-3 py-1`}
                            >
                              {rental.badge}
                            </Badge>
                          </div>
                        )}

                        {/* Equipment Image Placeholder */}
                        <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
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
                            {rental.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {rental.nameEn}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {rental.category}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-current text-yellow-500" />
                            <span className="font-bold text-sm">
                              {rental.rating}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({rental.reviews} تقييم)
                          </span>
                          {rental.available && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              <CheckCircle className="h-3 w-3 ml-1" />
                              متاح
                            </Badge>
                          )}
                        </div>

                        <div className="mb-4 p-4 glass-card rounded-2xl">
                          <div className="text-sm font-medium text-muted-foreground mb-2 text-arabic">
                            أسعار الإيجار:
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-arabic">يومي:</span>
                              <span className="font-bold text-primary">
                                {rental.dailyRate} ريال
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-arabic">
                                أسبوعي:
                              </span>
                              <span className="font-bold text-accent">
                                {rental.weeklyRate} ريال
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-arabic">شهري:</span>
                              <span className="font-bold text-success">
                                {rental.monthlyRate} ريال
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="text-sm font-medium text-muted-foreground mb-2 text-arabic">
                            المزايا الرئيسية:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {rental.features.map((feature, index) => (
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
                          <Clock className="h-4 w-4" />
                          <span className="text-arabic">
                            التوصيل {rental.deliveryTime}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button className="text-sm h-10 rounded-xl bg-gradient-to-r from-accent to-primary hover:scale-105 transition-all">
                            <Calendar className="ml-1 h-3 w-3" />
                            احجز الآن
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
                  <Button className="h-14 px-8 text-lg bg-gradient-to-r from-accent via-primary to-accent hover:scale-105 transition-all rounded-2xl">
                    <ArrowRight className="ml-2 h-5 w-5" />
                    عرض المزيد من المعدات
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
