import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  DollarSign, 
  Users, 
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Search,
  Filter,
  Download,
  Settings,
  UserCheck,
  Building,
  Package,
  MessageCircle,
  Bell,
  Shield,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

export default function AdminDashboard() {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('month');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock admin data
  const adminStats = {
    totalUsers: 2847,
    totalProviders: 156,
    totalOrders: 1923,
    totalRevenue: 486750,
    monthlyGrowth: {
      users: 12.5,
      providers: 8.3,
      orders: 15.7,
      revenue: 23.4
    },
    platformCommission: 68456,
    pendingPayouts: 23890
  };

  const recentActivity = [
    {
      id: 1,
      type: 'user_registration',
      user: 'أحمد محمد العلي',
      action: 'تسجيل مستخدم جديد',
      timestamp: '2024-01-20T14:30:00Z',
      status: 'success'
    },
    {
      id: 2,
      type: 'provider_verification',
      user: 'شركة الرعاية الطبية',
      action: 'طلب توثيق مقدم خدمة',
      timestamp: '2024-01-20T13:45:00Z',
      status: 'pending'
    },
    {
      id: 3,
      type: 'order_completed',
      user: 'مستشفى الملك فيصل',
      action: 'اكتمال طلب صيانة',
      amount: 1200,
      timestamp: '2024-01-20T12:15:00Z',
      status: 'success'
    }
  ];

  const topProviders = [
    {
      id: 1,
      name: 'شركة الرعاية الطبية المتقدمة',
      rating: 4.9,
      completedJobs: 240,
      totalEarnings: 45800,
      status: 'verified'
    },
    {
      id: 2,
      name: 'مؤسسة التكنولوجيا الطبية',
      rating: 4.8,
      completedJobs: 186,
      totalEarnings: 32400,
      status: 'verified'
    },
    {
      id: 3,
      name: 'شركة الصيانة الفورية',
      rating: 4.7,
      completedJobs: 298,
      totalEarnings: 56700,
      status: 'pending'
    }
  ];

  const pendingVerifications = [
    {
      id: 1,
      providerName: 'مركز الأجهزة الطبية الحديثة',
      businessLicense: '1234567890',
      submittedAt: '2024-01-18T10:30:00Z',
      documents: 3,
      status: 'pending'
    },
    {
      id: 2,
      providerName: 'شركة الحلول الطبية المبتكرة',
      businessLicense: '0987654321',
      submittedAt: '2024-01-17T15:20:00Z',
      documents: 2,
      status: 'under_review'
    }
  ];

  const systemHealth = {
    uptime: '99.98%',
    responseTime: '245ms',
    errorRate: '0.02%',
    activeConnections: 1247
  };

  const getGrowthIcon = (growth: number) => {
    return growth > 0 ? (
      <ArrowUpRight className="h-4 w-4 text-success" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-destructive" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth > 0 ? 'text-success' : 'text-destructive';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'success':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return 'موثق';
      case 'pending':
        return 'في الانتظار';
      case 'under_review':
        return 'قيد المراجعة';
      case 'success':
        return 'مكتمل';
      case 'rejected':
        return 'مرفوض';
      default:
        return status;
    }
  };

  return (
    <Layout title="لوحة الإدارة">
      <div className="max-w-7xl mx-auto px-4 pb-16">
        
        {/* Admin Header */}
        <div className="glass-card rounded-3xl p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2 text-arabic">لوحة التحكم الإدارية</h1>
              <p className="text-muted-foreground text-arabic">إدارة شاملة لمنصة حلول الأجهزة الطبية</p>
            </div>
            <div className="flex gap-3">
              <Select value={selectedTimeFrame} onValueChange={setSelectedTimeFrame}>
                <SelectTrigger className="glass w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">هذا الأسبوع</SelectItem>
                  <SelectItem value="month">هذا الشهر</SelectItem>
                  <SelectItem value="quarter">هذا الربع</SelectItem>
                  <SelectItem value="year">هذا العام</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-primary hover:bg-primary/90 text-arabic">
                <Download className="ml-2 h-4 w-4" />
                تصدير التقرير
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground text-arabic">إجمالي المستخدمين</p>
                  <p className="text-3xl font-bold text-primary">{adminStats.totalUsers.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                {getGrowthIcon(adminStats.monthlyGrowth.users)}
                <span className={`text-sm font-medium ${getGrowthColor(adminStats.monthlyGrowth.users)}`}>
                  {adminStats.monthlyGrowth.users}%
                </span>
                <span className="text-sm text-muted-foreground text-arabic">من الشهر الماضي</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground text-arabic">مقدمو الخدمات</p>
                  <p className="text-3xl font-bold text-accent">{adminStats.totalProviders}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Building className="h-6 w-6 text-accent" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                {getGrowthIcon(adminStats.monthlyGrowth.providers)}
                <span className={`text-sm font-medium ${getGrowthColor(adminStats.monthlyGrowth.providers)}`}>
                  {adminStats.monthlyGrowth.providers}%
                </span>
                <span className="text-sm text-muted-foreground text-arabic">من الشهر الماضي</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground text-arabic">إجمالي الطلبات</p>
                  <p className="text-3xl font-bold text-success">{adminStats.totalOrders.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-success" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                {getGrowthIcon(adminStats.monthlyGrowth.orders)}
                <span className={`text-sm font-medium ${getGrowthColor(adminStats.monthlyGrowth.orders)}`}>
                  {adminStats.monthlyGrowth.orders}%
                </span>
                <span className="text-sm text-muted-foreground text-arabic">من الشهر الماضي</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground text-arabic">إجمالي الإيرادات</p>
                  <p className="text-3xl font-bold text-primary">{adminStats.totalRevenue.toLocaleString()} ريال</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                {getGrowthIcon(adminStats.monthlyGrowth.revenue)}
                <span className={`text-sm font-medium ${getGrowthColor(adminStats.monthlyGrowth.revenue)}`}>
                  {adminStats.monthlyGrowth.revenue}%
                </span>
                <span className="text-sm text-muted-foreground text-arabic">من الشهر الماضي</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="glass-card rounded-2xl p-2">
            <TabsList className="grid w-full grid-cols-6 bg-transparent">
              <TabsTrigger value="overview" className="text-arabic">نظرة عامة</TabsTrigger>
              <TabsTrigger value="users" className="text-arabic">المستخدمون</TabsTrigger>
              <TabsTrigger value="providers" className="text-arabic">مقدمو الخدمات</TabsTrigger>
              <TabsTrigger value="orders" className="text-arabic">الطلبات</TabsTrigger>
              <TabsTrigger value="finances" className="text-arabic">المالية</TabsTrigger>
              <TabsTrigger value="system" className="text-arabic">النظام</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-xl text-primary text-arabic">النشاط الأخير</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 glass rounded-lg">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.status === 'success' ? 'bg-success' : 
                          activity.status === 'pending' ? 'bg-yellow-500' : 'bg-muted'
                        }`}></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-primary text-arabic">{activity.user}</h4>
                            <Badge className={getStatusColor(activity.status)}>
                              {getStatusText(activity.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground text-arabic mb-1">{activity.action}</p>
                          {activity.amount && (
                            <p className="text-sm font-semibold text-primary">{activity.amount} ريال</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString('ar-SA')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Providers */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-xl text-primary text-arabic">أفضل مقدمي الخدمات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topProviders.map((provider, index) => (
                      <div key={provider.id} className="flex items-center gap-3 p-3 glass rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-primary text-arabic">{provider.name}</h4>
                            <Badge className={getStatusColor(provider.status)}>
                              {getStatusText(provider.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>تقييم: {provider.rating}</span>
                            <span>{provider.completedJobs} مهمة</span>
                            <span className="font-semibold text-primary">{provider.totalEarnings.toLocaleString()} ريال</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Provider Verification Tab */}
          <TabsContent value="providers" className="space-y-6">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-xl text-primary text-arabic">طلبات التوثيق المعلقة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingVerifications.map((verification) => (
                    <div key={verification.id} className="glass rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-primary text-arabic mb-1">{verification.providerName}</h3>
                          <p className="text-sm text-muted-foreground mb-2">رقم السجل: {verification.businessLicense}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{verification.documents} مستندات</span>
                            <span>{new Date(verification.submittedAt).toLocaleDateString('ar-SA')}</span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(verification.status)}>
                          {getStatusText(verification.status)}
                        </Badge>
                      </div>
                      <div className="flex gap-3">
                        <Button className="bg-success hover:bg-success/90 text-arabic">
                          <CheckCircle className="ml-2 h-4 w-4" />
                          قبول
                        </Button>
                        <Button variant="outline" className="glass-hover border-destructive/30 text-destructive">
                          <XCircle className="ml-2 h-4 w-4" />
                          رفض
                        </Button>
                        <Button variant="outline" className="glass-hover border-primary/30">
                          <Eye className="ml-2 h-4 w-4" />
                          مراجعة
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-xl text-primary text-arabic">صحة النظام</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-arabic">معدل التشغيل</span>
                    <span className="font-semibold text-success">{systemHealth.uptime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-arabic">زمن الاستجابة</span>
                    <span className="font-semibold text-primary">{systemHealth.responseTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-arabic">معدل الأخطاء</span>
                    <span className="font-semibold text-success">{systemHealth.errorRate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-arabic">الاتصالات النشطة</span>
                    <span className="font-semibold text-accent">{systemHealth.activeConnections}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-xl text-primary text-arabic">إعدادات النظام</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start glass-hover border-primary/30 text-arabic">
                    <Settings className="ml-2 h-4 w-4" />
                    إعدادات عامة
                  </Button>
                  <Button variant="outline" className="w-full justify-start glass-hover border-primary/30 text-arabic">
                    <Shield className="ml-2 h-4 w-4" />
                    إعدادات الأمان
                  </Button>
                  <Button variant="outline" className="w-full justify-start glass-hover border-primary/30 text-arabic">
                    <Bell className="ml-2 h-4 w-4" />
                    إعدادات الإشعارات
                  </Button>
                  <Button variant="outline" className="w-full justify-start glass-hover border-primary/30 text-arabic">
                    <RefreshCw className="ml-2 h-4 w-4" />
                    تحديث النظام
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
