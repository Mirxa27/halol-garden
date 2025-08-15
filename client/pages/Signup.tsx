import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  User, 
  Phone, 
  Mail, 
  Eye, 
  EyeOff, 
  Building,
  UserCheck,
  Shield,
  CheckCircle,
  FileText,
  Camera,
  Upload
} from "lucide-react";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<'customer' | 'provider'>('customer');
  const [step, setStep] = useState<'info' | 'verification' | 'documents'>('info');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('verification');
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userType === 'provider') {
      setStep('documents');
    } else {
      window.location.href = '/profile';
    }
  };

  const handleDocumentsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = '/provider-dashboard';
  };

  return (
    <Layout showBreadcrumbs={false} className="flex items-center justify-center min-h-screen py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-2xl">ح</span>
            </div>
            <div className="text-arabic">
              <h1 className="text-xl font-bold text-primary">حلول الأجهزة الطبية</h1>
            </div>
          </Link>
        </div>

        <Card className="glass-card border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary text-arabic">
              إنشاء حساب جديد
            </CardTitle>
            <CardDescription className="text-arabic">
              انضم إلى منصة الأجهزة الطبية الرائدة
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {step === 'info' && (
              <>
                {/* User Type Selection */}
                <div className="space-y-4 mb-6">
                  <Label className="text-arabic">نوع الحساب</Label>
                  <Tabs value={userType} onValueChange={(value) => setUserType(value as 'customer' | 'provider')}>
                    <TabsList className="grid w-full grid-cols-2 bg-transparent">
                      <TabsTrigger value="customer" className="text-arabic">عميل</TabsTrigger>
                      <TabsTrigger value="provider" className="text-arabic">مقدم خدمة</TabsTrigger>
                    </TabsList>

                    <TabsContent value="customer" className="mt-4">
                      <div className="glass rounded-xl p-4 text-center">
                        <User className="h-8 w-8 text-primary mx-auto mb-2" />
                        <h3 className="font-semibold text-primary text-arabic">حساب عميل</h3>
                        <p className="text-sm text-muted-foreground text-arabic">
                          للبحث عن خدمات الصيانة والإيجار والشراء
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="provider" className="mt-4">
                      <div className="glass rounded-xl p-4 text-center">
                        <Building className="h-8 w-8 text-accent mx-auto mb-2" />
                        <h3 className="font-semibold text-primary text-arabic">مقدم خدمة</h3>
                        <p className="text-sm text-muted-foreground text-arabic">
                          لتقديم خدمات الصيانة والإيجار والبيع
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Registration Form */}
                <form onSubmit={handleInfoSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-arabic">الاسم الأول</Label>
                      <Input
                        id="firstName"
                        placeholder="أحمد"
                        className="glass text-arabic"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-arabic">الاسم الأخير</Label>
                      <Input
                        id="lastName"
                        placeholder="العبدالله"
                        className="glass text-arabic"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-arabic">رقم الجوال</Label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+966 5X XXX XXXX"
                        className="glass pr-10 text-right"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-arabic">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        className="glass pr-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-arabic">كلمة المرور</Label>
                    <div className="relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="glass pl-10"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-arabic">
                      يجب أن تحتوي على 8 أحرف على الأقل
                    </p>
                  </div>

                  {userType === 'provider' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="companyName" className="text-arabic">اسم الشركة/المؤسسة</Label>
                        <div className="relative">
                          <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            id="companyName"
                            placeholder="شركة الرعاية الطبية"
                            className="glass pr-10 text-arabic"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="businessLicense" className="text-arabic">رقم السجل التجاري</Label>
                        <Input
                          id="businessLicense"
                          placeholder="1010123456"
                          className="glass"
                          required
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox 
                      id="terms" 
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    />
                    <Label htmlFor="terms" className="text-sm text-arabic">
                      أوافق على{' '}
                      <Link to="/terms" className="text-primary hover:underline">شروط الاستخدام</Link>
                      {' '}و{' '}
                      <Link to="/privacy" className="text-primary hover:underline">سياسة الخصوصية</Link>
                    </Label>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-arabic"
                    disabled={!agreedToTerms}
                  >
                    متابعة التسجيل
                  </Button>
                </form>
              </>
            )}

            {step === 'verification' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-primary text-arabic">التحقق من الهوية</h3>
                  <p className="text-sm text-muted-foreground text-arabic">
                    أدخل رمز التحقق المرسل إلى رقم جوالك
                  </p>
                </div>
                
                <form onSubmit={handleVerificationSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-arabic">رمز التحقق</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      className="glass text-center text-2xl tracking-widest"
                      maxLength={6}
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-arabic">
                    التحقق من الرمز
                    <CheckCircle className="mr-2 h-4 w-4" />
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="link" 
                    className="w-full text-sm text-primary text-arabic"
                  >
                    إعادة إرسال الرمز
                  </Button>
                </form>
              </div>
            )}

            {step === 'documents' && userType === 'provider' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                    <FileText className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="font-semibold text-primary text-arabic">التحقق من الوثائق</h3>
                  <p className="text-sm text-muted-foreground text-arabic">
                    ارفع المستندات المطلوبة للحصول على شارة "موثق"
                  </p>
                </div>
                
                <form onSubmit={handleDocumentsSubmit} className="space-y-4">
                  <div className="space-y-4">
                    <div className="glass rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <UserCheck className="h-5 w-5 text-primary" />
                        <span className="font-medium text-arabic">هوية شخصية</span>
                      </div>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground text-arabic">
                          ارفع صورة الهوية الشخصية
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Upload className="ml-2 h-4 w-4" />
                          اختر ملف
                        </Button>
                      </div>
                    </div>
                    
                    <div className="glass rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Building className="h-5 w-5 text-primary" />
                        <span className="font-medium text-arabic">السجل التجاري</span>
                      </div>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground text-arabic">
                          ارفع صورة السجل التجاري
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Upload className="ml-2 h-4 w-4" />
                          اختر ملف
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-accent/10 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-accent mt-0.5" />
                      <div>
                        <h4 className="font-medium text-accent text-arabic">فوائد التحقق</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 mt-1 text-arabic">
                          <li>• شارة "موثق" في ملفك الشخصي</li>
                          <li>• زيادة الثقة مع العملاء</li>
                          <li>• أولوية في نتائج البحث</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-arabic">
                    إرسال للمراجعة
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full glass-hover border-primary/30 text-arabic"
                    onClick={() => window.location.href = '/provider-dashboard'}
                  >
                    التحقق لاحقاً
                  </Button>
                </form>
              </div>
            )}
            
            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground text-arabic">
                لديك ��ساب بالفعل؟{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  تسجيل الدخول
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
