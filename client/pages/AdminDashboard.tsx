import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  Users, 
  Package,
  TrendingUp,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  XCircle,
  CheckCircle,
  Clock,
  Eye,
  Download
} from "lucide-react";

interface DashboardData {
  overview: {
    totalUsers: { value: number; change: number; trend: 'up' | 'down' };
    totalOrders: { value: number; change: number; trend: 'up' | 'down' };
    totalRevenue: { value: number; change: number; trend: 'up' | 'down' };
    totalProducts: { value: number; change: number; trend: 'up' | 'down' };
  };
  recentOrders: any[];
  topProducts: any[];
  analytics: {
    usersByType: any[];
    ordersByStatus: any[];
    monthlyRevenue: any[];
  };
}

export default function AdminDashboard() {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('month');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/dashboard?timeframe=${selectedTimeFrame}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setDashboardData(result.data);
      } else {
        throw new Error(result.error || 'Failed to load dashboard data');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeFrame]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTrendIcon = (trend: 'up' | 'down') => {
    return trend === 'up' ? (
      <ArrowUpRight className="h-4 w-4 text-green-500" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-red-500" />
    );
  };

  const getTrendColor = (trend: 'up' | 'down') => {
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      CONFIRMED: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      PROCESSING: { color: 'bg-purple-100 text-purple-800', icon: RefreshCw },
      SHIPPED: { color: 'bg-indigo-100 text-indigo-800', icon: TrendingUp },
      DELIVERED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      CANCELLED: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Layout title="لوحة الإدارة">
        <div className="max-w-7xl mx-auto px-4 pb-16">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">جاري تحميل البيانات...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="لوحة الإدارة">
        <div className="max-w-7xl mx-auto px-4 pb-16">
          <div className="text-center py-12">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">خطأ في تحميل البيانات</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchDashboardData} className="mx-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!dashboardData) return null;

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
                  <SelectItem value="day">اليوم</SelectItem>
                  <SelectItem value="week">الأسبوع</SelectItem>
                  <SelectItem value="month">الشهر</SelectItem>
                  <SelectItem value="quarter">الربع</SelectItem>
                  <SelectItem value="year">السنة</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchDashboardData} variant="outline" size="icon" className="glass">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="glass text-arabic">
                <Download className="h-4 w-4 mr-2" />
                تصدير التقرير
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-arabic">إجمالي المستخدمين</p>
                  <p className="text-3xl font-bold text-primary">{formatNumber(dashboardData.overview.totalUsers.value)}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex items-center mt-4 gap-2">
                {getTrendIcon(dashboardData.overview.totalUsers.trend)}
                <span className={`text-sm font-medium ${getTrendColor(dashboardData.overview.totalUsers.trend)}`}>
                  {Math.abs(dashboardData.overview.totalUsers.change).toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground text-arabic">مقارنة بالفترة السابقة</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-arabic">إجمالي الطلبات</p>
                  <p className="text-3xl font-bold text-accent">{formatNumber(dashboardData.overview.totalOrders.value)}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-accent" />
                </div>
              </div>
              <div className="flex items-center mt-4 gap-2">
                {getTrendIcon(dashboardData.overview.totalOrders.trend)}
                <span className={`text-sm font-medium ${getTrendColor(dashboardData.overview.totalOrders.trend)}`}>
                  {Math.abs(dashboardData.overview.totalOrders.change).toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground text-arabic">مقارنة بالفترة السابقة</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-arabic">إجمالي الإيرادات</p>
                  <p className="text-3xl font-bold text-success">{formatCurrency(dashboardData.overview.totalRevenue.value)}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-success" />
                </div>
              </div>
              <div className="flex items-center mt-4 gap-2">
                {getTrendIcon(dashboardData.overview.totalRevenue.trend)}
                <span className={`text-sm font-medium ${getTrendColor(dashboardData.overview.totalRevenue.trend)}`}>
                  {Math.abs(dashboardData.overview.totalRevenue.change).toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground text-arabic">مقارنة بالفترة السابقة</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-arabic">إجمالي المنتجات</p>
                  <p className="text-3xl font-bold text-primary">{formatNumber(dashboardData.overview.totalProducts.value)}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex items-center mt-4 gap-2">
                {getTrendIcon(dashboardData.overview.totalProducts.trend)}
                <span className={`text-sm font-medium ${getTrendColor(dashboardData.overview.totalProducts.trend)}`}>
                  {Math.abs(dashboardData.overview.totalProducts.change).toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground text-arabic">مقارنة بالفترة السابقة</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value="overview" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="overview" className="text-arabic">نظرة عامة</TabsTrigger>
            <TabsTrigger value="orders" className="text-arabic">الطلبات</TabsTrigger>
            <TabsTrigger value="products" className="text-arabic">المنتجات</TabsTrigger>
            <TabsTrigger value="analytics" className="text-arabic">التحليلات</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-xl text-primary text-arabic">الطلبات الحديثة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.recentOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-white/10">
                        <div className="flex-1">
                          <p className="font-medium text-arabic">{order.customer}</p>
                          <p className="text-sm text-muted-foreground">#{order.orderNumber}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{formatCurrency(order.total)}</p>
                          <p className="text-xs text-muted-foreground">{order.itemCount} منتج</p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-xl text-primary text-arabic">المنتجات الأكثر مبيعاً</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.topProducts.slice(0, 5).map((product, index) => (
                      <div key={product.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/10">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">#{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-arabic">{product.nameAr}</p>
                          <p className="text-sm text-muted-foreground">{product.salesCount} مبيعة</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(product.price)}</p>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-yellow-500">★</span>
                            <span className="text-xs">{product.rating?.toFixed(1) || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-xl text-primary text-arabic">إدارة الطلبات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-arabic">واجهة إدارة الطلبات المفصلة ستكون متاحة قريباً</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-xl text-primary text-arabic">إدارة المنتجات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-arabic">واجهة إدارة المنتجات المفصلة ستكون متاحة قريباً</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-xl text-primary text-arabic">التحليلات والتقارير</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-arabic">لوحة التحليلات المفصلة ستكون متاحة قريباً</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}