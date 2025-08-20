import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Truck, 
  CheckCircle,
  Star,
  MessageCircle,
  Phone,
  Download,
  RefreshCw,
  User,
  FileText,
  Camera,
  Share2,
  Navigation,
  Timer,
  Receipt,
  Shield,
  Send,
  Eye,
  Activity,
  ThumbsUp,
  HelpCircle,
  Clock, // Added Clock import
  Bell // Added Bell import
} from "lucide-react";

export default function OrderTracking() {
  const { orderId } = useParams();
  const [trackingId, setTrackingId] = useState(orderId || 'ORD-2024-001');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [newMessage, setNewMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  // Simulate real-time updates
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
      }, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
    return () => {}; // Explicitly return nothing if autoRefresh is false
  }, [autoRefresh]);

  // Mock order data with more detailed information
  const orderData = {
    id: trackingId,
    type: 'maintenance',
    typeAr: 'صيانة',
    status: 'in_progress',
    statusAr: 'قيد التنفيذ',
    progress: 65,
    equipment: 'جهاز الأشعة السينية - Philips MX450',
    equipmentSerial: 'PH-MX450-2021-0892',
    client: 'مستشفى الملك فيصل التخصصي',
    clientContact: {
      name: 'د. محمد العتيبي',
      position: 'مدير الصيانة',
      phone: '+966 11 464 7272',
      email: 'm.alotaibi@kfshrc.edu.sa'
    },
    provider: {
      name: 'شركة الرعاية الطبية المتقدمة',
      rating: 4.9,
      phone: '+966 50 123 4567',
      verified: true,
      logo: '/placeholder.svg'
    },
    technician: {
      name: 'أحمد محمد الأحمد',
      phone: '+966 55 789 0123',
      specialization: 'فني أجهزة تصوير طبي',
      rating: 4.8,
      experience: '8 سنوات',
      certifications: ['Philips Certified', 'ISO 9001'],
      avatar: '/placeholder.svg',
      currentLocation: {
        lat: 24.7136,
        lng: 46.6753,
        address: 'على بعد 5 دقائق من الموقع'
      }
    },
    createdAt: '2024-01-15T10:30:00Z',
    scheduledDate: '2024-01-18T14:00:00Z',
    estimatedCompletion: '2024-01-18T17:00:00Z',
    actualStartTime: '2024-01-18T14:15:00Z',
    location: 'الرياض، حي العليا، شارع الملك فهد',
    locationDetails: {
      building: 'مستشفى الملك فيصل التخصصي',
      floor: 'الطابق الثالث',
      department: 'قسم الأشعة',
      room: 'غرفة رقم 301'
    },
    priority: 'high',
    amount: 1200,
    description: 'صيانة دورية شاملة مع استبدال قطع الغيار التالفة واختبار أداء النظام',
    notes: 'يرجى إحضار شهادة معايرة الجهاز السابقة وإيقاف تشغيل الجهاز قبل البدء',
    partsUsed: [
      { name: 'أنبوب الأشعة السينية', partNumber: 'XR-TUBE-450', quantity: 1, cost: 800 },
      { name: 'مرشح الألومنيوم', partNumber: 'AL-FILTER-3mm', quantity: 2, cost: 150 }
    ],
    warranty: {
      period: '3 أشهر',
      startDate: '2024-01-18',
      endDate: '2024-04-18',
      coverage: 'شامل للقطع المستبدلة والعمالة'
    }
  };

  const timeline = [
    {
      id: 1,
      title: 'تم إنشاء الطلب',
      titleEn: 'Order Created',
      description: 'تم استلام طلب الصيانة وإرساله للمراجعة',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'completed',
      icon: Package,
      details: 'تم استلام الطلب وتخصيص رقم تتبع'
    },
    {
      id: 2,
      title: 'تم قبول الطلب',
      titleEn: 'Order Accepted',
      description: 'قبلت شركة الرعاية الطبية المتقدمة الطلب',
      timestamp: '2024-01-15T11:15:00Z',
      status: 'completed',
      icon: CheckCircle,
      details: 'مراجعة الطلب وتأكيد توفر القطع والفني المختص'
    },
    {
      id: 3,
      title: 'تم تعيين فني',
      titleEn: 'Technician Assigned',
      description: 'تم تعيين الفني أحمد محمد الأحمد لتنفيذ المهمة',
      timestamp: '2024-01-15T12:00:00Z',
      status: 'completed',
      icon: User,
      details: 'اختيار الفني الأنسب بناءً على التخصص والخبرة'
    },
    {
      id: 4,
      title: 'تحضير المعدات',
      titleEn: 'Equipment Preparation',
      description: 'تم تحضير القطع والأدوات اللازمة',
      timestamp: '2024-01-18T13:00:00Z',
      status: 'completed',
      icon: Package,
      details: 'فحص وتحضير جميع القطع والأدوات المطلوبة'
    },
    {
      id: 5,
      title: 'الفني في الطريق',
      titleEn: 'Technician On Route',
      description: 'الفني في طريقه إلى موقع العمل',
      timestamp: '2024-01-18T13:30:00Z',
      status: 'current',
      icon: Truck,
      details: 'الوقت المتوقع للوصول: 10 دقائق'
    },
    {
      id: 6,
      title: 'وصول الفني',
      titleEn: 'Technician Arrived',
      description: 'وصل الفني إلى الموقع',
      timestamp: null,
      status: 'pending',
      icon: Navigation,
      details: 'سيتم إشعارك عند وصول الفني'
    },
    {
      id: 7,
      title: 'بدء العمل',
      titleEn: 'Work Started',
      description: 'بدء أعمال الصيانة والفحص',
      timestamp: null,
      status: 'pending',
      icon: Clock,
      details: 'فحص أولي وبدء عملية الصيانة'
    },
    {
      id: 8,
      title: 'اكتمال العمل',
      titleEn: 'Work Completed',
      description: 'انتهاء أعمال الصيانة واختبار الجهاز',
      timestamp: null,
      status: 'pending',
      icon: CheckCircle,
      details: 'اختبار شامل وتسليم الجهاز'
    }
  ];

  const messages = [
    {
      id: 1,
      sender: 'system',
      senderName: 'النظام',
      content: 'تم إنشاء طلب الصيانة بنجاح',
      timestamp: '2024-01-15T10:30:00Z',
      type: 'info'
    },
    {
      id: 2,
      sender: 'provider',
      senderName: 'شركة الرعاية الطبية',
      content: 'تم قبول طلبكم وسيتم التواصل معكم قريباً لتأكيد الموعد',
      timestamp: '2024-01-15T11:15:00Z',
      type: 'message'
    },
    {
      id: 3,
      sender: 'technician',
      senderName: 'أحمد محمد',
      content: 'مرحباً، أنا الفني المكلف بصيانة جهازكم. سأصل خلال 15 دقيقة',
      timestamp: '2024-01-18T13:30:00Z',
      type: 'message'
    },
    {
      id: 4,
      sender: 'technician',
      senderName: 'أحمد محمد',
      content: 'صورة للجهاز قبل البدء بالصيانة',
      timestamp: '2024-01-18T14:10:00Z',
      type: 'image',
      image: '/placeholder.svg'
    }
  ];

  const documents = [
    {
      id: 1,
      name: 'فاتورة الخدمة',
      type: 'PDF',
      size: '245 KB',
      uploadedAt: '2024-01-15T10:30:00Z',
      status: 'available'
    },
    {
      id: 2,
      name: 'تقرير الفحص الأولي',
      type: 'PDF',
      size: '189 KB',
      uploadedAt: '2024-01-15T11:15:00Z',
      status: 'available'
    },
    {
      id: 3,
      name: 'شهادة المعايرة',
      type: 'PDF',
      size: '156 KB',
      uploadedAt: '2024-01-18T14:05:00Z',
      status: 'processing'
    },
    {
      id: 4,
      name: 'تقرير الصيانة النهائي',
      type: 'PDF',
      size: 'قيد الإنشاء',
      uploadedAt: null,
      status: 'pending'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success';
      case 'current':
        return 'text-primary';
      case 'pending':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success';
      case 'current':
        return 'bg-primary animate-pulse';
      case 'pending':
        return 'bg-muted';
      default:
        return 'bg-muted';
    }
  };

  const formatDateTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-success';
      case 'processing':
        return 'text-primary';
      case 'pending':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim()) {
      try {
        const response = await fetch('/api/support/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: id,
            message: newMessage.trim(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const result = await response.json();
        setNewMessage('');
        
        // Refresh messages or update UI as needed
        alert('Message sent successfully');
      } catch (error) {
        alert('Failed to send message. Please try again.');
      }
    }
  };

  const submitRating = async () => {
    if (rating > 0) {
      try {
        const response = await fetch('/api/orders/rating', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: id,
            rating,
            feedback: feedback.trim(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to submit rating');
        }

        const result = await response.json();
        alert('Rating submitted successfully');
        
        // Reset form
        setRating(0);
        setFeedback('');
      } catch (error) {
        alert('Failed to submit rating. Please try again.');
      }
    }
  };

  return (
    <Layout>
      <div className="pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="glass-card rounded-3xl p-8 mb-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-primary mb-4 text-arabic">تتبع الطلب</h1>
              <p className="text-xl text-muted-foreground text-arabic leading-relaxed max-w-2xl mx-auto">
                تابع حالة طلبك ومراحل تنفيذه بالتفصيل
              </p>
            </div>
            
            {/* Order Search */}
            <div className="max-w-md mx-auto">
              <div className="flex gap-3">
                <Input
                  placeholder="أدخل رقم الطلب..."
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="glass text-arabic"
                />
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setLastUpdate(new Date())}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Auto-refresh toggle */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span className="text-arabic">تحديث تلقائي</span>
              </label>
              <span className="text-xs text-muted-foreground">
                آخر تحديث: {lastUpdate.toLocaleTimeString('ar-SA')}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <Card className="glass-card border-0 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-primary text-arabic">تقدم العمل</h3>
                <Badge className={getPriorityColor(orderData.priority)}>
                  {orderData.priority === 'high' ? 'أولوية عالية' : 'أولوية متوسطة'}
                </Badge>
              </div>
              <Progress value={orderData.progress} className="h-3 mb-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span className="text-arabic">مكتمل</span>
                <span>{orderData.progress}%</span>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Tabs defaultValue="timeline" className="space-y-6">
                <div className="glass-card rounded-2xl p-2">
                  <TabsList className="grid w-full grid-cols-4 bg-transparent">
                    <TabsTrigger value="timeline" className="text-arabic">سير العمل</TabsTrigger>
                    <TabsTrigger value="details" className="text-arabic">التفاصيل</TabsTrigger>
                    <TabsTrigger value="messages" className="text-arabic">الرسائل</TabsTrigger>
                    <TabsTrigger value="documents" className="text-arabic">المستندات</TabsTrigger>
                  </TabsList>
                </div>

                {/* Timeline Tab */}
                <TabsContent value="timeline">
                  <Card className="glass-card border-0">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl text-primary text-arabic">مراحل تنفيذ الطلب</CardTitle>
                        <Badge variant="outline" className="text-arabic">
                          <Activity className="h-3 w-3 ml-1" />
                          مباشر
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {timeline.map((step, index) => (
                          <div key={step.id} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusBgColor(step.status)} text-white`}>
                                <step.icon className="h-6 w-6" />
                              </div>
                              {index < timeline.length - 1 && (
                                <div className={`w-0.5 h-16 mt-3 ${step.status === 'completed' ? 'bg-success' : step.status === 'current' ? 'bg-primary' : 'bg-muted'}`}></div>
                              )}
                            </div>
                            
                            <div className="flex-1 pb-8">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className={`font-semibold text-lg ${getStatusColor(step.status)} text-arabic`}>
                                  {step.title}
                                </h3>
                                {step.status === 'current' && (
                                  <Badge className="bg-primary text-primary-foreground animate-pulse text-arabic">
                                    جاري التنفيذ
                                  </Badge>
                                )}
                              </div>
                              <p className="text-muted-foreground text-arabic mb-2">{step.description}</p>
                              <p className="text-sm text-muted-foreground text-arabic mb-3">{step.details}</p>
                              {step.timestamp && (
                                <p className="text-xs text-muted-foreground">
                                  {formatDateTime(step.timestamp)}
                                </p>
                              )}
                              {step.status === 'current' && (
                                <div className="mt-3 p-3 glass rounded-lg">
                                  <div className="flex items-center gap-2 text-primary">
                                    <Timer className="h-4 w-4" />
                                    <span className="text-sm font-medium text-arabic">التقدير الحالي: 10 دقائق للوصول</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="details">
                  <div className="space-y-6">
                    {/* Order Summary */}
                    <Card className="glass-card border-0">
                      <CardHeader>
                        <CardTitle className="text-xl text-primary text-arabic">تفاصيل الطلب</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="font-semibold text-primary mb-3 text-arabic">معلومات الطلب</h3>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground text-arabic">رقم الطلب:</span>
                                <span className="font-medium">{orderData.id}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground text-arabic">نوع الخدمة:</span>
                                <span className="font-medium text-arabic">{orderData.typeAr}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground text-arabic">تاريخ الإنشاء:</span>
                                <span className="font-medium">{formatDateTime(orderData.createdAt)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground text-arabic">الموعد المجدول:</span>
                                <span className="font-medium">{formatDateTime(orderData.scheduledDate)}</span>
                              </div>
                              {orderData.actualStartTime && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground text-arabic">وقت البدء الفعلي:</span>
                                  <span className="font-medium">{formatDateTime(orderData.actualStartTime)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="font-semibold text-primary mb-3 text-arabic">تفاصيل الجهاز</h3>
                            <div className="space-y-3 text-sm">
                              <div>
                                <span className="text-muted-foreground text-arabic">اسم الجهاز:</span>
                                <p className="font-medium text-arabic">{orderData.equipment}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground text-arabic">الرقم المسلسل:</span>
                                <p className="font-medium">{orderData.equipmentSerial}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground text-arabic">الموقع:</span>
                                <div className="font-medium text-arabic">
                                  <p>{orderData.locationDetails.building}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {orderData.locationDetails.floor} - {orderData.locationDetails.department} - {orderData.locationDetails.room}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground text-arabic">وصف المشكلة:</span>
                                <p className="font-medium text-arabic">{orderData.description}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {orderData.notes && (
                          <div className="bg-accent/10 rounded-lg p-4">
                            <h4 className="font-semibold text-accent mb-2 text-arabic">ملاحظات خاصة:</h4>
                            <p className="text-sm text-arabic">{orderData.notes}</p>
                          </div>
                        )}

                        {/* Parts Used */}
                        {orderData.partsUsed.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-primary mb-3 text-arabic">القطع المستخدمة</h3>
                            <div className="space-y-2">
                              {orderData.partsUsed.map((part, index) => (
                                <div key={index} className="glass rounded-lg p-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-medium text-arabic">{part.name}</h4>
                                      <p className="text-sm text-muted-foreground">رقم القطعة: {part.partNumber}</p>
                                      <p className="text-sm text-muted-foreground text-arabic">الكمية: {part.quantity}</p>
                                    </div>
                                    <span className="font-semibold text-primary">{part.cost} ريال</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Warranty Info */}
                        <div className="bg-success/10 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-5 w-5 text-success" />
                            <h4 className="font-semibold text-success text-arabic">معلومات الضمان</h4>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground text-arabic">مدة الضمان:</span>
                              <p className="font-medium text-arabic">{orderData.warranty.period}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-arabic">تاريخ البداية:</span>
                              <p className="font-medium">{orderData.warranty.startDate}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-arabic">تايخ الانتهاء:</span>
                              <p className="font-medium">{orderData.warranty.endDate}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-arabic">التغطية:</span>
                              <p className="font-medium text-arabic">{orderData.warranty.coverage}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Messages Tab */}
                <TabsContent value="messages">
                  <Card className="glass-card border-0">
                    <CardHeader>
                      <CardTitle className="text-xl text-primary text-arabic">رسائل الطلب</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                        {messages.map((message) => (
                          <div key={message.id} className={`flex gap-3 ${message.sender === 'client' ? 'flex-row-reverse' : ''}`}>
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {message.sender === 'system' ? 'س' : 
                                 message.sender === 'client' ? 'ع' : 
                                 message.senderName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`flex-1 ${message.sender === 'client' ? 'text-right' : ''}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">{message.senderName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDateTime(message.timestamp)}
                                </span>
                              </div>
                              {message.type === 'image' ? (
                                <div>
                                  <img 
                                    src={message.image} 
                                    alt="مرفق"
                                    className="w-48 h-32 object-cover rounded-lg mb-2"
                                  />
                                  <p className="text-sm text-arabic">{message.content}</p>
                                </div>
                              ) : (
                                <p className={`text-sm p-3 rounded-lg ${
                                  message.sender === 'client' 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'glass'
                                } text-arabic`}>
                                  {message.content}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Message Input */}
                      <div className="flex gap-3">
                        <Textarea
                          placeholder="اكتب رسالتك هنا..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-1 glass text-arabic resize-none"
                          rows={2}
                        />
                        <div className="flex flex-col gap-2">
                          <Button 
                            size="sm" 
                            onClick={sendMessage}
                            disabled={!newMessage.trim()}
                            className="bg-primary hover:bg-primary/90"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="glass-hover">
                            <Camera className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents">
                  <Card className="glass-card border-0">
                    <CardHeader>
                      <CardTitle className="text-xl text-primary text-arabic">المستندات المرفقة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-4 glass rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-arabic">{doc.name}</h4>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>{doc.type}</span>
                                  <span>•</span>
                                  <span>{doc.size}</span>
                                  {doc.uploadedAt && (
                                    <>
                                      <span>•</span>
                                      <span>{formatDateTime(doc.uploadedAt)}</span>
                                    </>
                                  )}
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs mt-1 ${getDocumentStatusColor(doc.status)}`}
                                >
                                  {doc.status === 'available' && 'متاح'}
                                  {doc.status === 'processing' && 'قيد المعالجة'}
                                  {doc.status === 'pending' && 'في الانتظار'}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {doc.status === 'available' && (
                                <>
                                  <Button variant="outline" size="sm" className="glass-hover">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" className="glass-hover border-primary/30">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {doc.status === 'processing' && (
                                <Badge className="bg-primary text-primary-foreground animate-pulse">
                                  معالجة...
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Current Status */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg text-primary text-arabic">الحالة الحالية</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Truck className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-primary mb-2 text-arabic">الفني في الطريق</h3>
                  <p className="text-sm text-muted-foreground text-arabic mb-4">
                    {orderData.technician.currentLocation.address}
                  </p>
                  <div className="space-y-2">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-arabic">
                      <Navigation className="ml-2 h-4 w-4" />
                      تتبع موقع الفني
                    </Button>
                    <Button variant="outline" className="w-full glass-hover border-primary/30 text-arabic">
                      <Bell className="ml-2 h-4 w-4" />
                      إعدادات التنبيهات
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Technician Contact */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg text-primary text-arabic">الفني المختص</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={orderData.technician.avatar} />
                        <AvatarFallback className="bg-accent text-accent-foreground">
                          {orderData.technician.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-primary text-arabic">{orderData.technician.name}</h3>
                        <p className="text-sm text-muted-foreground text-arabic">{orderData.technician.specialization}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current text-success" />
                            <span className="text-sm">{orderData.technician.rating}</span>
                          </div>
                          <span className="text-xs text-muted-foreground text-arabic">خبرة {orderData.technician.experience}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {orderData.technician.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline" className="text-xs mr-1">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="space-y-2">
                      <Button className="w-full bg-accent hover:bg-accent/90 text-arabic">
                        <Phone className="ml-2 h-4 w-4" />
                        اتصال مباشر
                      </Button>
                      <Button variant="outline" className="w-full glass-hover border-accent/30 text-arabic">
                        <MessageCircle className="ml-2 h-4 w-4" />
                        واتساب
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Provider Contact */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg text-primary text-arabic">مقدم الخدمة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={orderData.provider.logo} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          ش
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-primary text-arabic">{orderData.provider.name}</h3>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current text-success" />
                          <span className="text-sm">{orderData.provider.rating}</span>
                          {orderData.provider.verified && (
                            <Badge className="bg-success text-success-foreground text-xs">
                              <CheckCircle className="h-2 w-2 ml-1" />
                              موثق
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full glass-hover border-primary/30 text-arabic">
                        <Phone className="ml-2 h-4 w-4" />
                        اتصال بالشركة
                      </Button>
                      <Button variant="outline" className="w-full glass-hover border-primary/30 text-arabic">
                        <MessageCircle className="ml-2 h-4 w-4" />
                        رسالة
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg text-primary text-arabic">ملخص التكلفة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground text-arabic">تكلفة الخدمة</span>
                      <span className="font-medium">{orderData.amount} ريال</span>
                    </div>
                    {orderData.partsUsed.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground text-arabic">قطع الغيار</span>
                        <span className="font-medium">
                          {orderData.partsUsed.reduce((sum, part) => sum + part.cost, 0)} ريال
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground text-arabic">ضريبة القيمة المضافة</span>
                      <span className="font-medium">{(orderData.amount * 0.15).toFixed(0)} ريال</span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-arabic">الإجمالي</span>
                        <span className="font-bold text-primary">{(orderData.amount * 1.15).toFixed(0)} ريال</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full mt-4 glass-hover border-primary/30 text-arabic">
                    <Receipt className="ml-2 h-4 w-4" />
                    عرض الفاتورة
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg text-primary text-arabic">إجراءات سريعة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full glass-hover border-primary/30 text-arabic">
                    <Share2 className="ml-2 h-4 w-4" />
                    مشاركة الطلب
                  </Button>
                  <Button variant="outline" className="w-full glass-hover border-primary/30 text-arabic">
                    <Download className="ml-2 h-4 w-4" />
                    تحميل التقرير
                  </Button>
                  <Button variant="outline" className="w-full glass-hover border-primary/30 text-arabic">
                    <HelpCircle className="ml-2 h-4 w-4" />
                    مساعدة
                  </Button>
                </CardContent>
              </Card>

              {/* Rating (shown when order is completed) */}
              {orderData.status === 'completed' && (
                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary text-arabic">تقييم الخدمة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className={`w-8 h-8 ${star <= rating ? 'text-yellow-400' : 'text-muted-foreground'}`}
                        >
                          <Star className="w-full h-full fill-current" />
                        </button>
                      ))}
                    </div>
                    
                    <Textarea
                      placeholder="شاركنا رأيك في الخدمة..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="glass text-arabic"
                      rows={3}
                    />
                    
                    <Button 
                      onClick={submitRating}
                      disabled={rating === 0}
                      className="w-full bg-success hover:bg-success/90 text-arabic"
                    >
                      <ThumbsUp className="ml-2 h-4 w-4" />
                      إرسال التقييم
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}