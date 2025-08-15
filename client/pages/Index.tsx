import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/Layout";
import {
  Wrench,
  Calendar,
  ShoppingCart,
  Shield,
  Star,
  Users,
  MessageCircle,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Award,
  TrendingUp,
  PlayCircle,
  Sparkles,
  Heart,
  Globe
} from "lucide-react";

export default function Index() {
  const services = [
    {
      id: 'maintenance',
      title: 'خدمات الصيانة',
      description: 'صيانة شاملة واحترافية لجميع أنواع الأجهزة الطبية من قبل فنيين معتمدين',
      icon: Wrench,
      gradient: 'from-primary to-primary/80',
      rating: 4.9,
      link: '/maintenance',
      stats: '2400+ عملية صيانة'
    },
    {
      id: 'rental',
      title: 'إيجار الأجهزة',
      description: 'استأجر أحدث الأجهزة الطبية بأسعار مناسبة ومرونة في فترات الإيجار',
      icon: Calendar,
      gradient: 'from-accent to-accent/80',
      rating: 4.8,
      link: '/rental',
      stats: '150+ جهاز متاح'
    },
    {
      id: 'sales',
      title: 'بيع الأجهزة',
      description: 'اشتري أجهزة طبية عالية الجودة بأفضل الأسعار مع ضمان شامل',
      icon: ShoppingCart,
      gradient: 'from-success to-success/80',
      rating: 4.9,
      link: '/sales',
      stats: '500+ منتج متوفر'
    }
  ];

  const features = [
    {
      icon: Shield,
      title: 'مقدمو خدمات موثوقون',
      description: 'جميع مقدمي الخدمات معتمدون ومتحققون',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Users,
      title: 'أكثر من 500 مقدم خدمة',
      description: 'شبكة واسعة في جميع أنحاء المنطقة',
      gradient: 'from-purple-500 to-violet-500'
    },
    {
      icon: MessageCircle,
      title: 'دعم على مدار الساعة',
      description: 'فريق دعم متاح 24/7 لمساعدتك',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: CheckCircle,
      title: 'ضمان الجودة',
      description: 'ضمان شامل على جميع الخدمات',
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  const stats = [
    { label: 'عملاء راضون', value: '10000+', icon: Users },
    { label: 'أجهزة تمت صيانتها', value: '25000+', icon: Wrench },
    { label: 'مقدمي خدمة', value: '500+', icon: Award },
    { label: 'نسبة الرضا', value: '98%', icon: TrendingUp }
  ];

  return (
    <Layout showBreadcrumbs={false} className="pt-0">
      <div className="relative min-h-screen overflow-hidden">
        {/* Sophisticated floating background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-5 w-96 h-96 bg-gradient-to-br from-primary/3 to-accent/3 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-5 w-80 h-80 bg-gradient-to-br from-success/4 to-primary/4 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-br from-accent/2 to-success/2 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        {/* Enhanced Hero Section */}
        <section className="relative pb-20 px-4 pt-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 relative">
              <div className="glass-intense rounded-[3rem] p-16 max-w-5xl mx-auto relative overflow-hidden">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none"></div>
                
                {/* Animated decorative elements */}
                <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-xl animate-pulse"></div>
                <div className="absolute bottom-10 right-10 w-16 h-16 rounded-full bg-gradient-to-br from-success/20 to-primary/20 blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
                
                <div className="relative z-10">
                  {/* Logo badge */}
                  <div className="inline-flex items-center gap-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full px-6 py-3 mb-8 backdrop-blur-sm border border-white/20">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-primary font-semibold text-arabic">منصة متقدمة للأجهزة الطبية</span>
                  </div>
                  
                  <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-8 text-arabic leading-tight">
                    منصة الأجهزة الطبية الرائدة
                  </h1>
                  
                  <p className="text-xl md:text-2xl text-muted-foreground mb-12 text-arabic leading-relaxed max-w-3xl mx-auto">
                    اكتشف أفضل خدمات الصيانة والإيجار والمبيعات للأجهزة الطبية من مقدمي خدمات موثوقين ومعتمدين في جميع أنحاء المملكة
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
                    <Button size="lg" className="h-16 px-12 text-xl font-bold rounded-2xl bg-gradient-to-r from-primary via-accent to-primary hover:scale-105 transition-all shadow-2xl group">
                      <span className="flex items-center gap-3 text-white">
                        ابدأ الآن
                        <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                    <Button variant="outline" size="lg" className="h-16 px-12 text-xl glass-hover border-primary/30 rounded-2xl font-bold text-arabic group">
                      <PlayCircle className="h-6 w-6 ml-3 group-hover:scale-110 transition-transform" />
                      تعرف على المزيد
                    </Button>
                  </div>

                  {/* Trust indicators */}
                  <div className="flex flex-wrap justify-center gap-6">
                    <Badge className="glass-subtle px-6 py-3 text-base">
                      <Shield className="h-5 w-5 ml-2" />
                      معتمد ومرخص
                    </Badge>
                    <Badge className="glass-subtle px-6 py-3 text-base">
                      <Award className="h-5 w-5 ml-2" />
                      جودة مضمونة
                    </Badge>
                    <Badge className="glass-subtle px-6 py-3 text-base">
                      <Globe className="h-5 w-5 ml-2" />
                      تغطية شاملة
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Services Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-20">
              {services.map((service, index) => (
                <Card key={service.id} className="glass-card hover:scale-105 transition-all duration-500 group cursor-pointer relative overflow-hidden border-0 rounded-[2rem]" style={{animationDelay: `${index * 0.1}s`}}>
                  {/* Gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                  
                  <CardContent className="p-8 relative z-10">
                    <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${service.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-all shadow-xl`}>
                      <service.icon className="h-10 w-10 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-primary mb-4 text-arabic group-hover:text-accent transition-colors">{service.title}</h3>
                    <p className="text-muted-foreground mb-6 text-arabic leading-relaxed">
                      {service.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-success">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="font-semibold">{service.rating}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">تقييم ممتاز</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {service.stats}
                      </Badge>
                    </div>
                    
                    <Link to={service.link}>
                      <Button className={`w-full h-12 bg-gradient-to-r ${service.gradient} hover:scale-105 transition-all rounded-2xl font-bold text-arabic shadow-lg`}>
                        {service.id === 'maintenance' && 'طلب صيانة'}
                        {service.id === 'rental' && 'استعرض الأجهزة'}
                        {service.id === 'sales' && 'تسوق الآن'}
                        <ArrowRight className="mr-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Statistics Section */}
            <Card className="glass-intense border-0 rounded-[2rem] mb-20">
              <CardContent className="p-12">
                <h2 className="text-3xl font-bold text-center text-primary mb-12 text-arabic">
                  إحصائياتنا في خدمة القطاع الطبي
                </h2>
                <div className="grid md:grid-cols-4 gap-8">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center group">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <stat.icon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                      <div className="text-muted-foreground text-arabic">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <Card className="glass-intense border-0 rounded-[2rem] mb-20">
              <CardContent className="p-12">
                <h2 className="text-4xl font-bold text-center text-primary mb-12 text-arabic">
                  لماذا تختار حلول الأجهزة الطبية؟
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {features.map((feature, index) => (
                    <div key={index} className="text-center group">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all shadow-lg`}>
                        <feature.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="font-bold text-primary mb-3 text-arabic text-lg group-hover:text-accent transition-colors">{feature.title}</h3>
                      <p className="text-muted-foreground text-arabic leading-relaxed">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card className="glass-intense border-0 rounded-[2rem] overflow-hidden">
              <CardContent className="p-12 text-center relative">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-success/5 pointer-events-none"></div>
                
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary via-accent to-primary shadow-2xl mb-8">
                    <Heart className="h-10 w-10 text-white" />
                  </div>
                  
                  <h2 className="text-4xl font-bold text-primary mb-6 text-arabic">
                    هل أنت مقدم خدمة؟
                  </h2>
                  <p className="text-xl text-muted-foreground mb-8 text-arabic leading-relaxed max-w-2xl mx-auto">
                    انضم إلى شبكتنا من مقدمي الخدمات المعتمدين واكتشف فرص عمل جديدة ومربحة
                  </p>
                  <Link to="/provider-signup">
                    <Button size="lg" className="h-16 px-12 text-xl glass-hover border-primary/30 rounded-2xl font-bold text-arabic group bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-sm">
                      <Users className="ml-3 h-6 w-6 group-hover:scale-110 transition-transform" />
                      انضم كمقدم خدمة
                      <ArrowLeft className="mr-2 h-6 w-6 group-hover:-translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Enhanced Footer */}
        <footer className="glass-intense rounded-t-[2rem] mt-20 relative overflow-hidden border-0">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto relative z-10 p-12">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">ح</span>
                  </div>
                  <h3 className="font-bold text-primary text-xl text-arabic">حلول الأجهزة الطبية</h3>
                </div>
                <p className="text-muted-foreground text-arabic leading-relaxed">
                  منصة رائدة في مجال خدمات الأجهزة الطبية المتقدمة والمعتمدة
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-primary mb-6 text-arabic text-lg">الخدمات</h4>
                <ul className="space-y-3">
                  <li><Link to="/maintenance" className="text-muted-foreground hover:text-primary transition-colors text-arabic">الصيانة</Link></li>
                  <li><Link to="/rental" className="text-muted-foreground hover:text-primary transition-colors text-arabic">الإيجار</Link></li>
                  <li><Link to="/sales" className="text-muted-foreground hover:text-primary transition-colors text-arabic">المبيعات</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold text-primary mb-6 text-arabic text-lg">الدعم</h4>
                <ul className="space-y-3">
                  <li><Link to="/help" className="text-muted-foreground hover:text-primary transition-colors text-arabic">مركز المساعدة</Link></li>
                  <li><Link to="/support" className="text-muted-foreground hover:text-primary transition-colors text-arabic">اتصل بنا</Link></li>
                  <li><Link to="/help" className="text-muted-foreground hover:text-primary transition-colors text-arabic">الأسئلة الشائعة</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold text-primary mb-6 text-arabic text-lg">تواصل معنا</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">+966 50 123 4567</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">info@holool.com</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground text-arabic">الرياض، المملكة العربية السعودية</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-8 border-t border-border text-center">
              <p className="text-muted-foreground text-arabic">
                © 2024 حلول الأجهزة الطبية. جميع الحقوق محفوظة.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Layout>
  );
}