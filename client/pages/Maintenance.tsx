import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Wrench,
  Star,
  MapPin,
  Clock,
  Shield,
  CheckCircle,
  Phone,
  MessageCircle,
  Zap,
  Award,
  Users,
  TrendingUp,
  Heart,
  Monitor,
  FileText,
  Camera,
  Thermometer,
  Activity,
  Settings,
  ArrowRight,
  PlayCircle,
} from "lucide-react";

export default function Maintenance() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedUrgency, setSelectedUrgency] = useState("");

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
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none"></div>

              <div className="relative z-10 text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary via-accent to-primary shadow-2xl mb-6 relative">
                  <Wrench className="h-10 w-10 text-white" />
                  <div className="absolute inset-0 rounded-3xl bg-white/20 blur-xl"></div>
                </div>

                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-6 text-arabic">
                  خدمات الصيانة المتقدمة
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground text-arabic leading-relaxed max-w-3xl mx-auto mb-8">
                  صيانة شاملة واحترافية لجميع أنواع الأجهزة الطبية من قبل فنيين
                  معتمدين ومتخصصين مع ضمان الجودة والسرعة
                </p>

                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  <Badge className="glass-subtle px-4 py-2 text-sm">
                    <Zap className="h-4 w-4 ml-2" />
                    استجابة فورية
                  </Badge>
                  <Badge className="glass-subtle px-4 py-2 text-sm">
                    <Shield className="h-4 w-4 ml-2" />
                    ضمان شامل
                  </Badge>
                  <Badge className="glass-subtle px-4 py-2 text-sm">
                    <Award className="h-4 w-4 ml-2" />
                    فنيون معتمدون
                  </Badge>
                </div>
              </div>

              {/* Feature highlights grid */}
              <div className="grid md:grid-cols-3 gap-6 relative z-10">
                <div className="glass-card p-6 text-center hover:scale-105 transition-all duration-500 group">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-primary mb-2 text-arabic text-lg">
                    استجابة سريعة
                  </h3>
                  <p className="text-muted-foreground text-arabic">
                    خدمة عاجلة خلال 30 دقيقة للحالات الطارئة
                  </p>
                </div>

                <div className="glass-card p-6 text-center hover:scale-105 transition-all duration-500 group">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-success to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-primary mb-2 text-arabic text-lg">
                    فنيون معتمدون
                  </h3>
                  <p className="text-muted-foreground text-arabic">
                    جميع الفنيين حاصلون على شهادات دولية معتمدة
                  </p>
                </div>

                <div className="glass-card p-6 text-center hover:scale-105 transition-all duration-500 group">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-cyan-600 flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-primary mb-2 text-arabic text-lg">
                    ضمان ش��مل
                  </h3>
                  <p className="text-muted-foreground text-arabic">
                    ضمان على جميع أعمال الصيانة لمدة عام كامل
                  </p>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              {/* Enhanced Request Form */}
              <div className="lg:col-span-8">
                <Card className="glass-intense border-0 rounded-3xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-white/10">
                    <CardTitle className="text-3xl text-primary text-arabic flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      طلب صيانة جديد
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <form className="space-y-8">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label
                            htmlFor="category"
                            className="text-arabic font-semibold text-lg"
                          >
                            نوع الجهاز
                          </Label>
                          <Select
                            value={selectedCategory}
                            onValueChange={setSelectedCategory}
                          >
                            <SelectTrigger className="glass h-14 text-lg rounded-2xl border-white/20">
                              <SelectValue placeholder="اختر نوع الجهاز" />
                            </SelectTrigger>
                            <SelectContent className="glass-card">
                              <SelectItem value="imaging" className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                    <Camera className="h-5 w-5 text-white" />
                                  </div>
                                  <div className="text-arabic">
                                    <div className="font-medium text-lg">
                                      أجهزة التصوير الطبي
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Medical Imaging
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value="respiratory" className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                    <Heart className="h-5 w-5 text-white" />
                                  </div>
                                  <div className="text-arabic">
                                    <div className="font-medium text-lg">
                                      أجهزة التنفس
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Respiratory Equipment
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value="monitoring" className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
                                    <Monitor className="h-5 w-5 text-white" />
                                  </div>
                                  <div className="text-arabic">
                                    <div className="font-medium text-lg">
                                      أجهزة المراقبة
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Monitoring Devices
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label
                            htmlFor="urgency"
                            className="text-arabic font-semibold text-lg"
                          >
                            مستوى الأولوية
                          </Label>
                          <Select
                            value={selectedUrgency}
                            onValueChange={setSelectedUrgency}
                          >
                            <SelectTrigger className="glass h-14 text-lg rounded-2xl border-white/20">
                              <SelectValue placeholder="اختر مستوى الأولوية" />
                            </SelectTrigger>
                            <SelectContent className="glass-card">
                              <SelectItem value="low" className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                                    <span className="text-lg">🟢</span>
                                  </div>
                                  <span className="text-arabic font-medium text-lg">
                                    منخفضة
                                  </span>
                                </div>
                              </SelectItem>
                              <SelectItem value="medium" className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                                    <span className="text-lg">🟡</span>
                                  </div>
                                  <span className="text-arabic font-medium text-lg">
                                    متوسطة
                                  </span>
                                </div>
                              </SelectItem>
                              <SelectItem value="high" className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                                    <span className="text-lg">🟠</span>
                                  </div>
                                  <span className="text-arabic font-medium text-lg">
                                    عالية
                                  </span>
                                </div>
                              </SelectItem>
                              <SelectItem value="critical" className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                                    <span className="text-lg">🔴</span>
                                  </div>
                                  <span className="text-arabic font-medium text-lg">
                                    طارئة
                                  </span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label
                            htmlFor="deviceModel"
                            className="text-arabic font-semibold text-lg"
                          >
                            موديل الجهاز
                          </Label>
                          <Input
                            id="deviceModel"
                            placeholder="مثال: Philips MX450"
                            className="glass h-14 text-lg rounded-2xl border-white/20"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label
                            htmlFor="serialNumber"
                            className="text-arabic font-semibold text-lg"
                          >
                            الرقم التسلسلي
                          </Label>
                          <Input
                            id="serialNumber"
                            placeholder="الرقم التسلسلي للجهاز"
                            className="glass h-14 text-lg rounded-2xl border-white/20"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="location"
                          className="text-arabic font-semibold text-lg"
                        >
                          موقع الجهاز
                        </Label>
                        <Input
                          id="location"
                          placeholder="اسم المستشفى أو العيادة والعنوان التفصيلي"
                          className="glass h-14 text-lg rounded-2xl border-white/20 text-arabic"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="problem"
                          className="text-arabic font-semibold text-lg"
                        >
                          وصف المشكلة
                        </Label>
                        <Textarea
                          id="problem"
                          placeholder="اشرح المشكلة بالتفصيل ليتمكن الفني من التحضير المناسب..."
                          rows={5}
                          className="glass text-lg rounded-2xl border-white/20 text-arabic resize-none"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="preferredTime"
                          className="text-arabic font-semibold text-lg"
                        >
                          الوقت المفضل
                        </Label>
                        <Select>
                          <SelectTrigger className="glass h-14 text-lg rounded-2xl border-white/20">
                            <SelectValue placeholder="اختر الوقت المفضل للزيارة" />
                          </SelectTrigger>
                          <SelectContent className="glass-card">
                            <SelectItem value="morning" className="p-4">
                              <div className="flex items-center gap-3 text-arabic">
                                <Clock className="h-5 w-5" />
                                الصباح (8:00 - 12:00)
                              </div>
                            </SelectItem>
                            <SelectItem value="afternoon" className="p-4">
                              <div className="flex items-center gap-3 text-arabic">
                                <Clock className="h-5 w-5" />
                                بعد الظهر (12:00 - 17:00)
                              </div>
                            </SelectItem>
                            <SelectItem value="evening" className="p-4">
                              <div className="flex items-center gap-3 text-arabic">
                                <Clock className="h-5 w-5" />
                                المساء (17:00 - 22:00)
                              </div>
                            </SelectItem>
                            <SelectItem value="urgent" className="p-4">
                              <div className="flex items-center gap-3 text-arabic">
                                <Zap className="h-5 w-5 text-red-500" />
                                في أسرع وقت ممكن
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button className="w-full h-16 text-xl font-bold rounded-2xl relative overflow-hidden group bg-gradient-to-r from-primary via-accent to-primary hover:scale-[1.02] transition-all shadow-2xl">
                        <div className="relative flex items-center justify-center gap-3 text-white">
                          إرسال طلب الصيانة
                          <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Sidebar */}
              <div className="lg:col-span-4 space-y-6">
                {/* Top Providers */}
                <Card className="glass-intense border-0 rounded-3xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-white/10">
                    <CardTitle className="text-xl text-primary text-arabic flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <Star className="h-3 w-3 text-white" />
                      </div>
                      أفضل مقدمي الخدمة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="glass-card rounded-2xl p-5 hover:scale-[1.02] transition-all duration-300 group">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                            ش
                          </div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-success to-emerald-600 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                        </div>

                        <div className="flex-1">
                          <h3 className="font-bold text-primary text-arabic group-hover:text-accent transition-colors">
                            شركة الرعاية الطبية المتقدمة
                          </h3>
                          <p className="text-xs text-muted-foreground mb-2">
                            Advanced Medical Care Co.
                          </p>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-current text-yellow-500" />
                              <span className="font-bold text-sm">4.9</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              (124 تقييم)
                            </span>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-lg font-bold text-primary">
                            150 ريال
                          </div>
                          <div className="text-xs text-muted-foreground text-arabic">
                            سعر المعاينة
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        <Badge variant="secondary" className="text-xs">
                          أجهزة التصوير
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          معدات الطوارئ
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-arabic">خلال ساعة</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>الرياض</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          className="text-xs h-10 rounded-xl bg-gradient-to-r from-primary to-accent hover:scale-105 transition-all"
                        >
                          <Phone className="ml-1 h-3 w-3" />
                          اتصال
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="glass-hover text-xs h-10 rounded-xl"
                        >
                          <MessageCircle className="ml-1 h-3 w-3" />
                          رسالة
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Stats */}
                <Card className="glass-intense border-0 rounded-3xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-white/10">
                    <CardTitle className="text-xl text-primary text-arabic flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <Activity className="h-3 w-3 text-white" />
                      </div>
                      إحصائيات مباشرة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between p-4 glass-card rounded-2xl hover:scale-105 transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-blue-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <span className="text-sm text-muted-foreground text-arabic font-medium">
                          طلبات اليوم
                        </span>
                      </div>
                      <span className="font-bold text-primary text-lg">24</span>
                    </div>

                    <div className="flex items-center justify-between p-4 glass-card rounded-2xl hover:scale-105 transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-green-600">
                          <Clock className="h-5 w-5" />
                        </div>
                        <span className="text-sm text-muted-foreground text-arabic font-medium">
                          متوسط الاستجابة
                        </span>
                      </div>
                      <span className="font-bold text-primary text-lg">
                        45 دقيقة
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 glass-card rounded-2xl hover:scale-105 transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-purple-600">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <span className="text-sm text-muted-foreground text-arabic font-medium">
                          نسبة الرضا
                        </span>
                      </div>
                      <span className="font-bold text-primary text-lg">
                        98%
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 glass-card rounded-2xl hover:scale-105 transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-orange-600">
                          <Users className="h-5 w-5" />
                        </div>
                        <span className="text-sm text-muted-foreground text-arabic font-medium">
                          مقدمي الخدمة
                        </span>
                      </div>
                      <span className="font-bold text-primary text-lg">
                        127
                      </span>
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
