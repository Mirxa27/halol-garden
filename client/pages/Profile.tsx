import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProfileSettingsModal } from "@/components/ProfileSettingsModal";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Settings,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Wrench,
  ShoppingCart,
  Edit,
  Plus,
  Bell,
  Shield,
  Heart,
  Truck,
  Download,
  Filter,
  Search,
  MoreHorizontal,
  ArrowUpDown
} from "lucide-react";
import { useState } from "react";

export default function Profile() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSort, setOrderSort] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock user data
  const userData = {
    name: "أحمد محمد العبدالله",
    nameEn: "Ahmed Mohammed Al-Abdullah",
    email: "ahmed@example.com",
    phone: "+966 50 123 4567",
    avatar: "",
    joinDate: "2023-08-15",
    rating: 4.8,
    totalOrders: 24,
    verified: true,
    addresses: [
      {
        id: 1,
        title: "المنزل",
        address: "حي العليا، الرياض، المملكة العربية السعودية",
        isDefault: true
      },
      {
        id: 2,
        title: "العمل",
        address: "مستشفى الملك فيصل التخصصي، الرياض",
        isDefault: false
      }
    ]
  };

  const allOrders = [
    {
      id: "ORD-2024-001",
      type: "maintenance",
      typeAr: "صيانة",
      equipment: "جهاز الأشعة السينية - Philips",
      date: "2024-01-15",
      status: "completed",
      statusAr: "مكتملة",
      provider: "شركة الرعاية الطبية",
      amount: 1200,
      rating: 5
    },
    {
      id: "ORD-2024-002",
      type: "rental",
      typeAr: "إيجار",
      equipment: "جهاز التنفس الاصطناعي - Medtronic",
      date: "2024-01-10",
      status: "active",
      statusAr: "نشطة",
      provider: "مؤسسة الأجهزة المتقدمة",
      amount: 800,
      rating: null
    },
    {
      id: "ORD-2024-003",
      type: "sales",
      typeAr: "مبيعات",
      equipment: "جهاز قياس الضغط الرقمي",
      date: "2024-01-05",
      status: "shipped",
      statusAr: "قيد الشحن",
      provider: "متجر الأجهزة الطبية",
      amount: 350,
      rating: null
    },
    {
      id: "ORD-2024-004",
      type: "maintenance",
      typeAr: "صيانة",
      equipment: "جهاز تحليل الدم الآلي - Sysmex",
      date: "2023-12-28",
      status: "completed",
      statusAr: "مكتملة",
      provider: "شركة التقنيات المتقدمة",
      amount: 2500,
      rating: 4
    },
    {
      id: "ORD-2024-005",
      type: "sales",
      typeAr: "مبيعات",
      equipment: "جهاز قياس السكر - FreeStyle",
      date: "2023-12-20",
      status: "cancelled",
      statusAr: "ملغي",
      provider: "متجر الصحة الذكية",
      amount: 450,
      rating: null
    },
    {
      id: "ORD-2024-006",
      type: "rental",
      typeAr: "إيجار",
      equipment: "كرسي متحرك كهربائي",
      date: "2023-12-15",
      status: "completed",
      statusAr: "مكتملة",
      provider: "مؤسسة الراحة الطبية",
      amount: 300,
      rating: 5
    }
  ];

  const wishlistItems = [
    {
      id: 1,
      name: "جهاز تخطيط القلب المحمول",
      nameEn: "Portable ECG Machine",
      price: 15000,
      image: "/placeholder.svg",
      provider: "شركة الطب الحديث"
    },
    {
      id: 2,
      name: "جهاز الموجات فوق الصوتية",
      nameEn: "Ultrasound Machine",
      price: 45000,
      image: "/placeholder.svg",
      provider: "مؤسسة التكنولوجيا الطبية"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success text-success-foreground";
      case "active":
        return "bg-primary text-primary-foreground";
      case "shipped":
        return "bg-accent text-accent-foreground";
      case "cancelled":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "maintenance":
        return <Wrench className="h-4 w-4" />;
      case "rental":
        return <Calendar className="h-4 w-4" />;
      case "sales":
        return <ShoppingCart className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  // Filter and sort orders
  const filteredOrders = allOrders
    .filter(order => {
      if (orderFilter === 'all') return true;
      return order.status === orderFilter;
    })
    .filter(order => {
      if (!searchTerm) return true;
      return order.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
             order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
             order.provider.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      switch (orderSort) {
        case 'newest':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount_high':
          return b.amount - a.amount;
        case 'amount_low':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

  const orderStats = {
    total: allOrders.length,
    completed: allOrders.filter(o => o.status === 'completed').length,
    active: allOrders.filter(o => o.status === 'active').length,
    shipped: allOrders.filter(o => o.status === 'shipped').length,
    cancelled: allOrders.filter(o => o.status === 'cancelled').length,
  };

  return (
    <Layout>
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Profile Header */}
          <div className="glass-card rounded-3xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={userData.avatar} />
                  <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                    أح
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold text-primary text-arabic">{userData.name}</h1>
                    {userData.verified && (
                      <Badge className="bg-success text-success-foreground">
                        <CheckCircle className="h-3 w-3 ml-1" />
                        موثق
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-1">{userData.nameEn}</p>
                  <div className="flex items-center gap-1 text-success">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-semibold">{userData.rating}</span>
                    <span className="text-sm text-muted-foreground">({userData.totalOrders} طلب)</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1"></div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="bg-primary hover:bg-primary/90 text-arabic">
                  <Edit className="ml-2 h-4 w-4" />
                  تعديل الملف الشخصي
                </Button>
                <Button
                  variant="outline"
                  className="glass-hover border-primary/30 text-arabic"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  <Settings className="ml-2 h-4 w-4" />
                  الإعدادات
                </Button>
              </div>
            </div>
          </div>

          {/* Profile Tabs */}
          <Tabs defaultValue="orders" className="space-y-6">
            <div className="glass-card rounded-2xl p-2">
              <TabsList className="grid w-full grid-cols-4 bg-transparent">
                <TabsTrigger value="orders" className="text-arabic">الطلبات</TabsTrigger>
                <TabsTrigger value="addresses" className="text-arabic">العناوين</TabsTrigger>
                <TabsTrigger value="wishlist" className="text-arabic">المفضلة</TabsTrigger>
                <TabsTrigger value="settings" className="text-arabic">الإعدادات</TabsTrigger>
              </TabsList>
            </div>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Orders Stats */}
                <div className="lg:col-span-1 space-y-4">
                  <Card className="glass-card border-0">
                    <CardHeader>
                      <CardTitle className="text-arabic">إحصائيات الطلبات</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground text-arabic">إجمالي الطلبات</span>
                        <span className="font-bold text-primary">{orderStats.total}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground text-arabic">��لمكتملة</span>
                        <span className="font-bold text-success">{orderStats.completed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground text-arabic">النشطة</span>
                        <span className="font-bold text-accent">{orderStats.active}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground text-arabic">قيد الشحن</span>
                        <span className="font-bold text-accent">{orderStats.shipped}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground text-arabic">الملغاة</span>
                        <span className="font-bold text-destructive">{orderStats.cancelled}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Orders */}
                <div className="lg:col-span-2">
                  <Card className="glass-card border-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-arabic">الطلبات</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="glass-hover border-primary/30">
                          <Download className="h-4 w-4 ml-2" />
                          تصدير
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {filteredOrders.map((order) => (
                          <div key={order.id} className="glass rounded-xl p-4 hover:bg-white/30 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  {getTypeIcon(order.type)}
                                </div>
                                <div>
                                  <p className="font-semibold text-primary">{order.id}</p>
                                  <p className="text-sm text-muted-foreground text-arabic">{order.typeAr}</p>
                                </div>
                              </div>
                              <Badge className={getStatusColor(order.status)}>
                                {order.statusAr}
                              </Badge>
                            </div>
                            
                            <h3 className="font-semibold mb-2 text-arabic">{order.equipment}</h3>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span className="text-arabic">{order.provider}</span>
                              <span>{order.amount} ريال</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                              <span>{order.date}</span>
                              {order.rating && (
                                <div className="flex items-center gap-1 text-success">
                                  <Star className="h-3 w-3 fill-current" />
                                  <span>{order.rating}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Button variant="outline" className="w-full mt-4 glass-hover border-primary/30 text-arabic">
                        عرض جميع الطلبات
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses" className="space-y-6">
              <Card className="glass-card border-0">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-arabic">العناوين المحفوظة</CardTitle>
                  <Button className="bg-primary hover:bg-primary/90 text-arabic">
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة عنوان جديد
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {userData.addresses.map((address) => (
                      <div key={address.id} className="glass rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-accent" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-primary text-arabic">{address.title}</h3>
                              {address.isDefault && (
                                <Badge variant="secondary" className="text-xs">افتراضي</Badge>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground text-arabic leading-relaxed">
                          {address.address}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Wishlist Tab */}
            <TabsContent value="wishlist" className="space-y-6">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-arabic">قائمة المفضلة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlistItems.map((item) => (
                      <div key={item.id} className="glass rounded-xl p-4 hover:bg-white/30 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-16 h-16 rounded-lg object-cover bg-muted"
                          />
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Heart className="h-4 w-4 fill-current" />
                          </Button>
                        </div>
                        <h3 className="font-semibold text-primary mb-1 text-arabic">{item.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2">{item.nameEn}</p>
                        <p className="text-sm text-muted-foreground text-arabic mb-3">{item.provider}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">{item.price.toLocaleString()} ريال</span>
                          <Button size="sm" className="bg-primary hover:bg-primary/90 text-arabic">
                            <ShoppingCart className="ml-2 h-3 w-3" />
                            أضف للسلة
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="text-arabic">الإعدادات الشخصية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-primary" />
                        <span className="text-arabic">الإشعارات</span>
                      </div>
                      <Button variant="outline" size="sm">تعديل</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-primary" />
                        <span className="text-arabic">الأمان والخصوصية</span>
                      </div>
                      <Button variant="outline" size="sm">تعديل</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <span className="text-arabic">طرق الدفع</span>
                      </div>
                      <Button variant="outline" size="sm">إدارة</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="text-arabic">معلومات الاتصال</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-primary" />
                        <span className="text-sm">{userData.email}</span>
                      </div>
                      <Badge variant="secondary">موثق</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-primary" />
                        <span className="text-sm">{userData.phone}</span>
                      </div>
                      <Badge variant="secondary">موثق</Badge>
                    </div>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-arabic">
                      تحديث معلومات الاتصال
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Profile Settings Modal */}
        <ProfileSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          userData={userData}
        />
      </div>
    </Layout>
  );
}
