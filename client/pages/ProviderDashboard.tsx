import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  BarChart3, 
  DollarSign, 
  Calendar, 
  Users, 
  Star,
  TrendingUp,
  MessageCircle,
  Phone,
  Eye,
  Edit,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  Truck,
  Award,
  Settings,
  FileText,
  Camera,
  MapPin
} from "lucide-react";

export default function ProviderDashboard() {
  const [timeFrame, setTimeFrame] = useState('month');

  // Mock provider data
  const providerData = {
    name: "شركة الرعاية الطبية المتقدمة",
    nameEn: "Advanced Medical Care Co.",
    verified: true,
    rating: 4.9,
    totalReviews: 124,
    joinDate: "2022-03-15",
    completedJobs: 2400,
    location: "الرياض",
    specialties: ["أجهزة التصوير", "معدات الطوارئ", "أجهزة المراقبة"],
    responseTime: "خلال ساعة",
    availabilityStatus: "متاح",
    verificationBadges: ["موثق", "فني معتمد", "ضمان ذهبي"]
  };

  const dashboardStats = {
    totalEarnings: 45800,
    monthlyEarnings: 12400,
    pendingPayouts: 3200,
    activeJobs: 8,
    pendingRequests: 15,
    completedThisMonth: 34,
    averageRating: 4.9,
    responseRate: 98
  };

  const recentJobs = [
    {
      id: "JOB-2024-156",
      type: "maintenance",
      typeAr: "صيانة",
      client: "مستشفى الملك فيصل",
      equipment: "جهاز الأشعة السينية - Philips",
      date: "2024-01-20",
      status: "in_progress",
      statusAr: "قيد التنفيذ",
      amount: 1200,
      priority: "high",
      location: "الرياض"
    },
    {
      id: "JOB-2024-155",
      type: "rental",
      typeAr: "إيجار",
      client: "عيادة النخبة الطبية",
      equipment: "جهاز التنفس الاصطناعي",
      date: "2024-01-18",
      status: "completed",
      statusAr: "مكتمل",
      amount: 800,
      priority: "medium",
      location: "الري��ض",
      rating: 5
    },
    {
      id: "JOB-2024-154",
      type: "maintenance",
      typeAr: "صيانة",
      client: "مركز الرعاية الشاملة",
      equipment: "جهاز مراقبة العلامات الحيوية",
      date: "2024-01-15",
      status: "pending",
      statusAr: "في الانتظار",
      amount: 450,
      priority: "low",
      location: "الرياض"
    }
  ];

  const pendingRequests = [
    {
      id: "REQ-2024-089",
      client: "مستشفى الأمير سلطان",
      equipment: "جهاز تخطيط القلب",
      type: "صيانة طارئة",
      submittedAt: "منذ ساعتين",
      priority: "urgent",
      estimatedValue: 950,
      description: "توقف مفاجئ في الجهاز أثناء الفحص"
    },
    {
      id: "REQ-2024-088",
      client: "عيادة الأسرة الصحية",
      equipment: "جهاز قياس الضغط",
      type: "صيانة دورية",
      submittedAt: "منذ 4 ساعات",
      priority: "medium",
      estimatedValue: 150,
      description: "صيانة دورية وفحص شامل"
    }
  ];

  const earningsData = {
    thisMonth: [
      { day: '1', amount: 450 },
      { day: '5', amount: 1200 },
      { day: '10', amount: 800 },
      { day: '15', amount: 950 },
      { day: '20', amount: 1100 }
    ],
    thisYear: 145600,
    lastYear: 98400
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success text-success-foreground";
      case "in_progress":
        return "bg-primary text-primary-foreground";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Layout>
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Provider Header */}
          <div className="glass-card rounded-3xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                    ش
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold text-primary text-arabic">{providerData.name}</h1>
                    {providerData.verified && (
                      <Badge className="bg-success text-success-foreground">
                        <CheckCircle className="h-3 w-3 ml-1" />
                        موثق
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-1">{providerData.nameEn}</p>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-1 text-success">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-semibold">{providerData.rating}</span>
                      <span className="text-sm text-muted-foreground">({providerData.totalReviews})</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{providerData.location}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {providerData.verificationBadges.map((badge, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex-1"></div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="bg-primary hover:bg-primary/90 text-arabic">
                  <Edit className="ml-2 h-4 w-4" />
                  تعديل الملف الشخصي
                </Button>
                <Button variant="outline" className="glass-hover border-primary/30 text-arabic">
                  <Settings className="ml-2 h-4 w-4" />
                  الإعدادات
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="glass-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground text-arabic">الأرباح الشهرية</p>
                    <p className="text-2xl font-bold text-primary">{dashboardStats.monthlyEarnings.toLocaleString()} ريال</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-success" />
                  <span className="text-xs text-success">+12.5%</span>
                  <span className="text-xs text-muted-foreground text-arabic">من الشهر الماضي</span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground text-arabic">الطلبات النشطة</p>
                    <p className="text-2xl font-bold text-accent">{dashboardStats.activeJobs}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-accent" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-muted-foreground text-arabic">{dashboardStats.pendingRequests} طلب جديد</span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground text-arabic">التقييم</p>
                    <p className="text-2xl font-bold text-success">{dashboardStats.averageRating}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                    <Star className="h-6 w-6 text-success" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-muted-foreground text-arabic">معدل الاستجابة {dashboardStats.responseRate}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground text-arabic">مكتمل هذا الشهر</p>
                    <p className="text-2xl font-bold text-primary">{dashboardStats.completedThisMonth}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-muted-foreground text-arabic">إجمالي {providerData.completedJobs}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="requests" className="space-y-6">
            <div className="glass-card rounded-2xl p-2">
              <TabsList className="grid w-full grid-cols-5 bg-transparent">
                <TabsTrigger value="requests" className="text-arabic">الطلبات الجديدة</TabsTrigger>
                <TabsTrigger value="jobs" className="text-arabic">أعمالي</TabsTrigger>
                <TabsTrigger value="earnings" className="text-arabic">الأرباح</TabsTrigger>
                <TabsTrigger value="reviews" className="text-arabic">التقييمات</TabsTrigger>
                <TabsTrigger value="portfolio" className="text-arabic">معرض الأعمال</TabsTrigger>
              </TabsList>
            </div>

            {/* Pending Requests */}
            <TabsContent value="requests" className="space-y-6">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-xl text-primary text-arabic">الطلبات الجديدة ({pendingRequests.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="glass rounded-xl p-4 hover:bg-white/30 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-primary text-arabic">{request.client}</h3>
                              <Badge className={getPriorityColor(request.priority)}>
                                {request.priority === 'urgent' ? 'طارئ' : request.priority === 'high' ? 'عالي' : request.priority === 'medium' ? 'متوسط' : 'منخفض'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">{request.equipment}</p>
                            <p className="text-sm text-muted-foreground text-arabic mb-2">{request.type}</p>
                            <p className="text-sm text-arabic">{request.description}</p>
                          </div>
                          <div className="text-left">
                            <div className="text-lg font-bold text-primary">{request.estimatedValue} ريال</div>
                            <div className="text-xs text-muted-foreground">{request.submittedAt}</div>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <Button className="bg-success hover:bg-success/90 text-arabic">
                            <CheckCircle className="ml-2 h-4 w-4" />
                            قبول الطلب
                          </Button>
                          <Button variant="outline" className="glass-hover border-primary/30 text-arabic">
                            <MessageCircle className="ml-2 h-4 w-4" />
                            رسالة
                          </Button>
                          <Button variant="outline" className="glass-hover border-primary/30">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Active Jobs */}
            <TabsContent value="jobs" className="space-y-6">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-xl text-primary text-arabic">أعمالي النشطة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentJobs.map((job) => (
                      <div key={job.id} className="glass rounded-xl p-4 hover:bg-white/30 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-primary">{job.id}</h3>
                              <Badge className={getStatusColor(job.status)}>
                                {job.statusAr}
                              </Badge>
                              <Badge className={getPriorityColor(job.priority)}>
                                {job.priority === 'high' ? 'عالي' : job.priority === 'medium' ? 'متوسط' : 'منخفض'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground text-arabic mb-1">{job.client}</p>
                            <p className="text-sm text-arabic mb-2">{job.equipment}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{job.date}</span>
                              <span>{job.location}</span>
                              {job.rating && (
                                <div className="flex items-center gap-1 text-success">
                                  <Star className="h-3 w-3 fill-current" />
                                  <span>{job.rating}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-left">
                            <div className="text-lg font-bold text-primary">{job.amount} ريال</div>
                            <div className="text-xs text-muted-foreground text-arabic">{job.typeAr}</div>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          {job.status === 'in_progress' && (
                            <Button className="bg-success hover:bg-success/90 text-arabic">
                              تم الانتهاء
                            </Button>
                          )}
                          <Button variant="outline" className="glass-hover border-primary/30 text-arabic">
                            <MessageCircle className="ml-2 h-4 w-4" />
                            تواصل مع العميل
                          </Button>
                          <Button variant="outline" className="glass-hover border-primary/30">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Earnings */}
            <TabsContent value="earnings" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary text-arabic">إجمالي الأرباح</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary mb-2">{dashboardStats.totalEarnings.toLocaleString()} ريال</div>
                    <p className="text-sm text-muted-foreground text-arabic">منذ انضمامك للمنصة</p>
                  </CardContent>
                </Card>
                
                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary text-arabic">الأرباح المعلقة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-accent mb-2">{dashboardStats.pendingPayouts.toLocaleString()} ريال</div>
                    <p className="text-sm text-muted-foreground text-arabic">ستُحول خلال 3-5 أيام</p>
                  </CardContent>
                </Card>
                
                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary text-arabic">متوسط الأرباح</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-success mb-2">365 ريال</div>
                    <p className="text-sm text-muted-foreground text-arabic">لكل طلب</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg text-primary text-arabic">تفاصيل الأرباح</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {earningsData.thisMonth.map((earning, index) => (
                      <div key={index} className="flex items-center justify-between p-3 glass rounded-lg">
                        <span className="text-sm text-arabic">يوم {earning.day} من الشهر</span>
                        <span className="font-semibold text-primary">{earning.amount} ريال</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews */}
            <TabsContent value="reviews" className="space-y-6">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-xl text-primary text-arabic">التقييمات والمراجعات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-6">
                      <div className="text-4xl font-bold text-primary mb-2">{providerData.rating}</div>
                      <div className="flex items-center justify-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-current text-success" />
                        ))}
                      </div>
                      <p className="text-muted-foreground text-arabic">بناءً على {providerData.totalReviews} تقييم</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Portfolio */}
            <TabsContent value="portfolio" className="space-y-6">
              <Card className="glass-card border-0">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl text-primary text-arabic">معرض الأعمال</CardTitle>
                  <Button className="bg-primary hover:bg-primary/90 text-arabic">
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة عمل جديد
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground text-arabic">أضف صور أعمالك</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        <Plus className="ml-2 h-4 w-4" />
                        إضافة صورة
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
