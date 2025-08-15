import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  BookOpen, 
  HelpCircle, 
  MessageCircle, 
  Phone,
  Mail,
  Video,
  FileText,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Star,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  Settings,
  CreditCard,
  Shield,
  Truck,
  Wrench,
  Calendar,
  ShoppingCart
} from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  categoryAr: string;
  helpful: number;
  notHelpful: number;
  views: number;
  lastUpdated: string;
}

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  categoryAr: string;
  readTime: number;
  views: number;
  lastUpdated: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'جميع الفئات', nameEn: 'All Categories', icon: BookOpen, count: 45 },
    { id: 'getting-started', name: 'البدء', nameEn: 'Getting Started', icon: Lightbulb, count: 8 },
    { id: 'maintenance', name: 'الصيانة', nameEn: 'Maintenance', icon: Wrench, count: 12 },
    { id: 'rental', name: 'الإيجار', nameEn: 'Rental', icon: Calendar, count: 10 },
    { id: 'sales', name: 'المبيعات', nameEn: 'Sales', icon: ShoppingCart, count: 7 },
    { id: 'payments', name: 'المدفوعات', nameEn: 'Payments', icon: CreditCard, count: 6 },
    { id: 'account', name: 'الحساب', nameEn: 'Account', icon: Settings, count: 8 },
    { id: 'security', name: 'الأمان', nameEn: 'Security', icon: Shield, count: 5 }
  ];

  const faqItems: FAQItem[] = [
    {
      id: '1',
      question: 'كيف يمكنني طلب خدمة صيانة؟',
      answer: 'يمكنك طلب خدمة الصيانة بسهولة من خلال اتباع هذه الخطوات: 1) انتقل إلى صفحة الصيانة 2) اختر نوع الجهاز 3) اشرح المشكلة 4) حدد الموقع والوقت المناسب 5) اضغط على "إرسال الطلب"',
      category: 'maintenance',
      categoryAr: 'الصيانة',
      helpful: 24,
      notHelpful: 2,
      views: 156,
      lastUpdated: '2024-01-15'
    },
    {
      id: '2',
      question: 'ما هي طرق الدفع المتاحة؟',
      answer: 'نوفر عدة طرق دفع آمنة: البطاقات الائتمانية (فيزا، ماستركارد)، التحويل البنكي، دفع عند الاستلام، محافظ إلكترون��ة (STC Pay، Apple Pay). جميع المدفوعات مشفرة وآمنة.',
      category: 'payments',
      categoryAr: 'المدفوعات',
      helpful: 18,
      notHelpful: 1,
      views: 89,
      lastUpdated: '2024-01-18'
    },
    {
      id: '3',
      question: 'كم يستغرق توصيل الأجهزة المستأجرة؟',
      answer: 'مدة التوصيل تعتمد على نوع الجهاز وموقعك: الأجهزة الصغيرة (24-48 ساعة)، الأجهزة الكبيرة (48-72 ساعة). نوفر خدمة توصيل سريعة في نفس اليوم للحالات الطارئة مقابل رسوم إضافية.',
      category: 'rental',
      categoryAr: 'الإيجار',
      helpful: 32,
      notHelpful: 3,
      views: 124,
      lastUpdated: '2024-01-12'
    },
    {
      id: '4',
      question: 'كيف يمكنني تتبع حالة طلبي؟',
      answer: 'يمكنك تتبع طلبك من خلال: 1) تسجيل الدخول لحسابك 2) انتقل إلى "طلباتي" 3) اختر الطلب المطلوب. ستحصل أيضاً على إشعارات فورية عبر الرسائل النصية والبريد الإلكتروني عند تحديث حالة الطلب.',
      category: 'getting-started',
      categoryAr: 'البدء',
      helpful: 45,
      notHelpful: 1,
      views: 289,
      lastUpdated: '2024-01-20'
    }
  ];

  const articles: Article[] = [
    {
      id: '1',
      title: 'دليل المبتدئين لاستخدام المنصة',
      excerpt: 'تعلم كيفية استخدام منصة حلول الأجهزة الطبية خطوة بخطوة',
      category: 'getting-started',
      categoryAr: 'البدء',
      readTime: 5,
      views: 456,
      lastUpdated: '2024-01-15',
      difficulty: 'beginner'
    },
    {
      id: '2',
      title: 'أفضل الممارسات لصيانة الأجهزة الطبية',
      excerpt: 'نصائح مهمة للحفاظ على أجهزتك الطبية وضمان عملها بكفاءة',
      category: 'maintenance',
      categoryAr: 'الصيانة',
      readTime: 8,
      views: 234,
      lastUpdated: '2024-01-18',
      difficulty: 'intermediate'
    },
    {
      id: '3',
      title: 'كيفية اختيار الجهاز المناسب للإيجار',
      excerpt: 'دليل شامل لمساعدتك في اختيار الجهاز الطبي المناسب لاحتياجاتك',
      category: 'rental',
      categoryAr: 'الإيجار',
      readTime: 6,
      views: 189,
      lastUpdated: '2024-01-10',
      difficulty: 'beginner'
    }
  ];

  const helpStats = {
    totalArticles: 45,
    totalViews: 12450,
    avgSatisfaction: 4.8,
    responseTime: '< 2 ساعة'
  };

  const filteredFAQs = faqItems.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'مبتدئ';
      case 'intermediate':
        return 'متوسط';
      case 'advanced':
        return 'متقدم';
      default:
        return difficulty;
    }
  };

  return (
    <Layout title="مركز المساعدة">
      <div className="max-w-7xl mx-auto px-4 pb-16">
        
        {/* Help Center Header */}
        <div className="glass-card rounded-3xl p-8 mb-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-primary mb-4 text-arabic">مركز المساعدة</h1>
            <p className="text-xl text-muted-foreground text-arabic leading-relaxed max-w-2xl mx-auto">
              ابحث عن الإجابات التي تحتاجها أو تواصل مع فريق الدعم للحصول على المساعدة
            </p>
          </div>
          
          {/* Search */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="ابحث عن سؤال أو موضوع..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass pr-12 text-lg py-3 text-arabic"
                dir="rtl"
              />
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{helpStats.totalArticles}</div>
              <p className="text-sm text-muted-foreground text-arabic">مقال مساعدة</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{helpStats.totalViews.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground text-arabic">مشاهدة</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{helpStats.avgSatisfaction}</div>
              <p className="text-sm text-muted-foreground text-arabic">تقييم الرضا</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{helpStats.responseTime}</div>
              <p className="text-sm text-muted-foreground text-arabic">زمن الاستجابة</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card className="glass-card border-0 sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg text-primary text-arabic">الفئات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-arabic ${
                      selectedCategory === category.id
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-white/10 text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <category.icon className="h-4 w-4" />
                      <span className="text-sm">{category.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {category.count}
                    </Badge>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="faq" className="space-y-6">
              <div className="glass-card rounded-2xl p-2">
                <TabsList className="grid w-full grid-cols-3 bg-transparent">
                  <TabsTrigger value="faq" className="text-arabic">الأسئلة الشائعة</TabsTrigger>
                  <TabsTrigger value="articles" className="text-arabic">المقالات</TabsTrigger>
                  <TabsTrigger value="contact" className="text-arabic">تواصل معنا</TabsTrigger>
                </TabsList>
              </div>

              {/* FAQ Tab */}
              <TabsContent value="faq" className="space-y-4">
                {filteredFAQs.length > 0 ? (
                  filteredFAQs.map((faq) => (
                    <Card key={faq.id} className="glass-card border-0">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-semibold text-primary text-arabic pr-6">
                            {faq.question}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {faq.categoryAr}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground text-arabic leading-relaxed mb-4">
                          {faq.answer}
                        </p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{faq.views} مشاهدة</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>آخر تحديث: {new Date(faq.lastUpdated).toLocaleDateString('ar-SA')}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground text-arabic">مفيد؟</span>
                            <Button variant="ghost" size="sm" className="glass-hover">
                              <ThumbsUp className="h-4 w-4 text-success" />
                              <span className="ml-1 text-success">{faq.helpful}</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="glass-hover">
                              <ThumbsDown className="h-4 w-4 text-destructive" />
                              <span className="ml-1 text-destructive">{faq.notHelpful}</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-primary mb-2 text-arabic">
                      لم نجد نتائج مطابقة
                    </h3>
                    <p className="text-muted-foreground text-arabic">
                      جرب استخدام كلمات مختلفة أو تواصل مع فريق الدعم
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Articles Tab */}
              <TabsContent value="articles" className="space-y-4">
                {filteredArticles.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {filteredArticles.map((article) => (
                      <Card key={article.id} className="glass-card border-0 hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <Badge className={getDifficultyColor(article.difficulty)}>
                              {getDifficultyText(article.difficulty)}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {article.categoryAr}
                            </Badge>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-primary mb-2 text-arabic">
                            {article.title}
                          </h3>
                          
                          <p className="text-sm text-muted-foreground text-arabic leading-relaxed mb-4">
                            {article.excerpt}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{article.readTime} دقائق</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                <span>{article.views}</span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-primary" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-primary mb-2 text-arabic">
                      لم نجد مقالات مطابقة
                    </h3>
                    <p className="text-muted-foreground text-arabic">
                      جرب استخدام كلمات مختلفة أو اختر فئة أخرى
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Contact Tab */}
              <TabsContent value="contact" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="glass-card border-0">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-primary mb-2 text-arabic">دردشة مباشرة</h3>
                      <p className="text-sm text-muted-foreground text-arabic mb-4">
                        تحدث مع فريق الدعم الآن
                      </p>
                      <Button className="bg-primary hover:bg-primary/90 text-arabic">
                        ابدأ المحادثة
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-0">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                        <Phone className="h-6 w-6 text-accent" />
                      </div>
                      <h3 className="font-semibold text-primary mb-2 text-arabic">اتصال هاتفي</h3>
                      <p className="text-sm text-muted-foreground text-arabic mb-4">
                        متاح 24/7 للدعم العاجل
                      </p>
                      <Button variant="outline" className="glass-hover border-accent/30 text-arabic">
                        +966 50 123 4567
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-0">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                        <Mail className="h-6 w-6 text-success" />
                      </div>
                      <h3 className="font-semibold text-primary mb-2 text-arabic">بريد إلكتروني</h3>
                      <p className="text-sm text-muted-foreground text-arabic mb-4">
                        للاستفسارات العامة
                      </p>
                      <Button variant="outline" className="glass-hover border-success/30 text-arabic">
                        support@holool.com
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-0">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                        <Video className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-primary mb-2 text-arabic">جلسة فيديو</h3>
                      <p className="text-sm text-muted-foreground text-arabic mb-4">
                        للدعم التقني المتقدم
                      </p>
                      <Button variant="outline" className="glass-hover border-blue-600/30 text-arabic">
                        حجز موعد
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}
