import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Phone, 
  Mail, 
  Eye, 
  EyeOff, 
  Shield, 
  Fingerprint,
  ArrowRight,
  CheckCircle,
  MessageSquare
} from "lucide-react";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp' | 'biometric'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate sending OTP
    setStep('otp');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate OTP verification
    setStep('biometric');
  };

  const handleBiometricAuth = () => {
    // Simulate biometric authentication
    window.location.href = '/profile';
  };

  return (
    <Layout showBreadcrumbs={false} className="flex items-center justify-center min-h-screen">
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
              تسجيل الدخول
            </CardTitle>
            <CardDescription className="text-arabic">
              ادخل لحسابك للوصول إلى جميع الخدمات
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="phone" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-transparent">
                <TabsTrigger value="phone" className="text-arabic">رقم الجوال</TabsTrigger>
                <TabsTrigger value="email" className="text-arabic">البريد الإلكتروني</TabsTrigger>
              </TabsList>

              {/* Phone Login */}
              <TabsContent value="phone" className="space-y-6">
                {step === 'phone' && (
                  <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-arabic">رقم الجوال</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+966 5X XXX XXXX"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="glass pr-10 text-right"
                          dir="ltr"
                          required
                        />
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-arabic">
                      إرسال رمز التحقق
                      <MessageSquare className="mr-2 h-4 w-4" />
                    </Button>
                  </form>
                )}

                {step === 'otp' && (
                  <form onSubmit={handleOtpSubmit} className="space-y-4">
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <MessageSquare className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-primary text-arabic">رمز التحقق</h3>
                      <p className="text-sm text-muted-foreground text-arabic">
                        تم إرسال رمز التحقق إلى {phoneNumber}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="otp" className="text-arabic">ادخل رمز التحقق</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
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
                      onClick={() => setStep('phone')}
                    >
                      إعادة إرسال الرمز
                    </Button>
                  </form>
                )}

                {step === 'biometric' && (
                  <div className="space-y-6 text-center">
                    <div className="space-y-4">
                      <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                        <CheckCircle className="h-8 w-8 text-success" />
                      </div>
                      <h3 className="font-semibold text-primary text-arabic">تم التحقق بنجاح</h3>
                      <p className="text-sm text-muted-foreground text-arabic">
                        يمكنك الآن استخدام البيانات البيومترية للدخول السريع
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Button 
                        onClick={handleBiometricAuth}
                        className="w-full bg-gradient-to-r from-primary to-accent text-white text-arabic"
                      >
                        <Fingerprint className="mr-2 h-4 w-4" />
                        تسجيل الدخول بالبصمة
                      </Button>
                      
                      <Button 
                        onClick={() => window.location.href = '/profile'}
                        variant="outline" 
                        className="w-full glass-hover border-primary/30 text-arabic"
                      >
                        تخطي - الدخول للحساب
                        <ArrowRight className="mr-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Email Login */}
              <TabsContent value="email" className="space-y-6">
                <form className="space-y-4">
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
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Link to="/forgot-password" className="text-sm text-primary hover:underline text-arabic">
                      نسيت كلمة المرور؟
                    </Link>
                  </div>
                  
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-arabic">
                    تسجيل الدخول
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            {/* Security Features */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-arabic">حماية متقدمة</span>
                </div>
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-primary" />
                  <span className="text-arabic">دعم البيومترية</span>
                </div>
              </div>
            </div>
            
            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground text-arabic">
                ليس لديك حساب؟{' '}
                <Link to="/signup" className="text-primary hover:underline font-medium">
                  إنشاء حساب جديد
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}