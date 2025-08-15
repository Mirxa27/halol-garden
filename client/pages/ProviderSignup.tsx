import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  Building, 
  CheckCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Info,
  Clock,
  Wrench,
  Calendar,
  Package,
  Zap,
  Shield,
  Users,
  CreditCard,
  MessageCircle,
  Star
} from "lucide-react";

interface FormData {
  // Company Information
  companyName: string;
  companyNameEn: string;
  companyType: string;
  establishedYear: string;
  commercialRegister: string;
  taxNumber: string;
  
  // Contact Information
  contactPersonName: string;
  contactPersonPosition: string;
  phoneNumber: string;
  mobileNumber: string;
  email: string;
  website: string;
  
  // Address Information
  city: string;
  district: string;
  street: string;
  buildingNumber: string;
  postalCode: string;
  
  // Business Information
  serviceTypes: string[];
  specializations: string[];
  coverageAreas: string[];
  employeeCount: string;
  experience: string;
  workingHours: string;
  emergencyService: boolean;
  
  // Account Information
  username: string;
  password: string;
  confirmPassword: string;
  
  // Documents
  documents: {
    commercialRegister: File | null;
    taxCertificate: File | null;
    companyProfile: File | null;
    technicalCertificates: File | null;
    insuranceCertificate: File | null;
    companyLogo: File | null;
  };
  
  // Agreements
  termsAccepted: boolean;
  privacyAccepted: boolean;
  dataProcessingAccepted: boolean;
}

export default function ProviderSignup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    companyNameEn: '',
    companyType: '',
    establishedYear: '',
    commercialRegister: '',
    taxNumber: '',
    contactPersonName: '',
    contactPersonPosition: '',
    phoneNumber: '',
    mobileNumber: '',
    email: '',
    website: '',
    city: '',
    district: '',
    street: '',
    buildingNumber: '',
    postalCode: '',
    serviceTypes: [],
    specializations: [],
    coverageAreas: [],
    employeeCount: '',
    experience: '',
    workingHours: '',
    emergencyService: false,
    username: '',
    password: '',
    confirmPassword: '',
    documents: {
      commercialRegister: null,
      taxCertificate: null,
      companyProfile: null,
      technicalCertificates: null,
      insuranceCertificate: null,
      companyLogo: null
    },
    termsAccepted: false,
    privacyAccepted: false,
    dataProcessingAccepted: false
  });

  const totalSteps = 5;
  const stepProgress = (currentStep / totalSteps) * 100;

  const companyTypes = [
    'شركة ذات مسؤولية محدودة',
    'مؤسسة فردية',
    'شركة مساهمة',
    'فرع شركة أجنبية',
    'شراكة'
  ];

  const serviceTypes = [
    { id: 'maintenance', name: 'الصيانة والإصلاح', icon: Wrench },
    { id: 'rental', name: 'تأجير الأجهزة', icon: Calendar },
    { id: 'sales', name: 'بيع الأجهزة', icon: Package },
    { id: 'installation', name: 'التركيب والتشغيل', icon: Zap },
    { id: 'calibration', name: 'المعايرة والاختبار', icon: Shield },
    { id: 'training', name: 'التدريب والاستشارات', icon: Users }
  ];

  const specializations = [
    'أجهزة التصوير الطبي',
    'معدات العناية المركزة',
    'أجهزة التنفس والتخدير',
    'معدات غرف العمليات',
    'أجهزة المختبرات الطبية',
    'معدات طب الأسنان',
    'أجهزة العلاج الطبيعي',
    'معدات الطوارئ والإسعاف',
    'أجهزة طب العيون',
    'معدات القلب والأوعية الدموية'
  ];

  const saudiCities = [
    'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الظهران',
    'الطائف', 'بريدة', 'تبوك', 'الجبيل', 'حائل', 'الخرج', 'الأحساء', 'القصيم',
    'أبها', 'نجران', 'الباحة', 'ينبع', 'سكاكا', 'عرعر', 'القريات'
  ];

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleServiceTypeChange = (serviceId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      serviceTypes: checked 
        ? [...prev.serviceTypes, serviceId]
        : prev.serviceTypes.filter(id => id !== serviceId)
    }));
  };

  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      specializations: checked 
        ? [...prev.specializations, specialization]
        : prev.specializations.filter(s => s !== specialization)
    }));
  };

  const handleCoverageAreaChange = (city: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      coverageAreas: checked 
        ? [...prev.coverageAreas, city]
        : prev.coverageAreas.filter(c => c !== city)
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.companyName && formData.companyType && formData.commercialRegister && formData.taxNumber);
      case 2:
        return !!(formData.contactPersonName && formData.phoneNumber && formData.email);
      case 3:
        return !!(formData.city && formData.district && formData.street);
      case 4:
        return formData.serviceTypes.length > 0 && formData.specializations.length > 0;
      case 5:
        return !!(formData.username && formData.password && formData.confirmPassword && 
                 formData.password === formData.confirmPassword && formData.termsAccepted);
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;
    
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      // Redirect to success page or login
      alert('تم إرسال طلب التسجيل بنجاح! سيتم مراجعته خلال 24-48 ساعة.');
    }, 2000);
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'معلومات الشركة';
      case 2: return 'معلومات الاتصال';
      case 3: return 'العنوان والموقع';
      case 4: return 'الخدمات والتخصصات';
      case 5: return 'إنشاء الحساب';
      default: return '';
    }
  };

  return (
    <Layout>
      <div className="pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="glass-card rounded-3xl p-8 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-4">
                <Building className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-primary mb-4 text-arabic">تسجيل مقدم خدمة</h1>
              <p className="text-lg text-muted-foreground text-arabic leading-relaxed max-w-2xl mx-auto">
                انضم إلى شبكتنا من مقدمي الخدمات المعتمدين واكتشف فرص عمل جديدة في مجال الأجهزة الطبية
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground text-arabic">الخطوة {currentStep} من {totalSteps}</span>
                <span className="text-sm text-muted-foreground">{Math.round(stepProgress)}%</span>
              </div>
              <Progress value={stepProgress} className="h-2" />
              <div className="flex justify-between mt-2">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      step <= currentStep
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-xl text-primary text-arabic flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                  {currentStep}
                </span>
                {getStepTitle(currentStep)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Company Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName" className="text-arabic">اسم الشركة (بالعربية) *</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        placeholder="أدخل اسم الشركة"
                        className="glass text-arabic"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyNameEn" className="text-arabic">اسم الشركة (بالإنجليزية)</Label>
                      <Input
                        id="companyNameEn"
                        value={formData.companyNameEn}
                        onChange={(e) => handleInputChange('companyNameEn', e.target.value)}
                        placeholder="Company name in English"
                        className="glass"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyType" className="text-arabic">نوع الشركة *</Label>
                      <Select value={formData.companyType} onValueChange={(value) => handleInputChange('companyType', value)}>
                        <SelectTrigger className="glass">
                          <SelectValue placeholder="اختر نوع الشركة" />
                        </SelectTrigger>
                        <SelectContent>
                          {companyTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="establishedYear" className="text-arabic">سنة التأسيس</Label>
                      <Input
                        id="establishedYear"
                        type="number"
                        value={formData.establishedYear}
                        onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                        placeholder="2020"
                        className="glass"
                        min="1900"
                        max={new Date().getFullYear()}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="commercialRegister" className="text-arabic">رقم السجل التجاري *</Label>
                      <Input
                        id="commercialRegister"
                        value={formData.commercialRegister}
                        onChange={(e) => handleInputChange('commercialRegister', e.target.value)}
                        placeholder="1010123456"
                        className="glass"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="taxNumber" className="text-arabic">الرقم الضريبي *</Label>
                      <Input
                        id="taxNumber"
                        value={formData.taxNumber}
                        onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                        placeholder="300123456789003"
                        className="glass"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-accent/10 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-accent mt-0.5" />
                      <div>
                        <h4 className="font-medium text-accent text-arabic">معلومات مهمة:</h4>
                        <ul className="text-sm text-muted-foreground text-arabic mt-2 space-y-1">
                          <li>• تأكد من صحة رقم السجل التجاري والرقم الضريبي</li>
                          <li>• سيتم التحقق من جميع المعلومات المدخلة</li>
                          <li>• المعلومات المطلوبة بعلامة (*) إجبارية</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Contact Information */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactPersonName" className="text-arabic">اسم الشخص المسؤول *</Label>
                      <Input
                        id="contactPersonName"
                        value={formData.contactPersonName}
                        onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
                        placeholder="اسم المسؤول"
                        className="glass text-arabic"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactPersonPosition" className="text-arabic">المنصب</Label>
                      <Input
                        id="contactPersonPosition"
                        value={formData.contactPersonPosition}
                        onChange={(e) => handleInputChange('contactPersonPosition', e.target.value)}
                        placeholder="مدير عام، مدير مبيعات، إلخ"
                        className="glass text-arabic"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phoneNumber" className="text-arabic">رقم الهاتف *</Label>
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        placeholder="+966 11 123 4567"
                        className="glass"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="mobileNumber" className="text-arabic">رقم الجوال</Label>
                      <Input
                        id="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                        placeholder="+966 50 123 4567"
                        className="glass"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" className="text-arabic">البريد الإلكتروني *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="info@company.com"
                        className="glass"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="website" className="text-arabic">الموقع الإلكتروني</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="www.company.com"
                        className="glass"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Address Information */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city" className="text-arabic">المدينة *</Label>
                      <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)}>
                        <SelectTrigger className="glass">
                          <SelectValue placeholder="اختر المدينة" />
                        </SelectTrigger>
                        <SelectContent>
                          {saudiCities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="district" className="text-arabic">الحي *</Label>
                      <Input
                        id="district"
                        value={formData.district}
                        onChange={(e) => handleInputChange('district', e.target.value)}
                        placeholder="اسم الحي"
                        className="glass text-arabic"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="street" className="text-arabic">الشارع *</Label>
                      <Input
                        id="street"
                        value={formData.street}
                        onChange={(e) => handleInputChange('street', e.target.value)}
                        placeholder="اسم الشارع"
                        className="glass text-arabic"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="buildingNumber" className="text-arabic">رقم المبنى</Label>
                      <Input
                        id="buildingNumber"
                        value={formData.buildingNumber}
                        onChange={(e) => handleInputChange('buildingNumber', e.target.value)}
                        placeholder="123"
                        className="glass"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode" className="text-arabic">الرمز البريدي</Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        placeholder="12345"
                        className="glass"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Services and Specializations */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-primary mb-4 text-arabic">أنواع الخدمات المقدمة *</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {serviceTypes.map((service) => (
                        <label key={service.id} className="flex items-center gap-3 p-3 glass rounded-lg cursor-pointer hover:bg-white/30 transition-colors">
                          <Checkbox
                            checked={formData.serviceTypes.includes(service.id)}
                            onCheckedChange={(checked) => handleServiceTypeChange(service.id, checked as boolean)}
                          />
                          <service.icon className="h-5 w-5 text-primary" />
                          <span className="text-arabic">{service.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-primary mb-4 text-arabic">التخصصات *</h3>
                    <div className="grid md:grid-cols-2 gap-2">
                      {specializations.map((specialization) => (
                        <label key={specialization} className="flex items-center gap-2 p-2 text-sm">
                          <Checkbox
                            checked={formData.specializations.includes(specialization)}
                            onCheckedChange={(checked) => handleSpecializationChange(specialization, checked as boolean)}
                          />
                          <span className="text-arabic">{specialization}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-primary mb-4 text-arabic">مناطق التغطية</h3>
                    <div className="grid md:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                      {saudiCities.map((city) => (
                        <label key={city} className="flex items-center gap-2 p-1 text-sm">
                          <Checkbox
                            checked={formData.coverageAreas.includes(city)}
                            onCheckedChange={(checked) => handleCoverageAreaChange(city, checked as boolean)}
                          />
                          <span className="text-arabic">{city}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="employeeCount" className="text-arabic">عدد الموظفين</Label>
                      <Select value={formData.employeeCount} onValueChange={(value) => handleInputChange('employeeCount', value)}>
                        <SelectTrigger className="glass">
                          <SelectValue placeholder="اختر عدد الموظفين" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-5">1-5 موظفين</SelectItem>
                          <SelectItem value="6-20">6-20 موظف</SelectItem>
                          <SelectItem value="21-50">21-50 موظف</SelectItem>
                          <SelectItem value="51-100">51-100 موظف</SelectItem>
                          <SelectItem value="100+">أكثر من 100 موظف</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="experience" className="text-arabic">سنوات الخبرة</Label>
                      <Select value={formData.experience} onValueChange={(value) => handleInputChange('experience', value)}>
                        <SelectTrigger className="glass">
                          <SelectValue placeholder="اختر سنوات الخبرة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-2">1-2 سنة</SelectItem>
                          <SelectItem value="3-5">3-5 سنوات</SelectItem>
                          <SelectItem value="6-10">6-10 سنوات</SelectItem>
                          <SelectItem value="11-15">11-15 سنة</SelectItem>
                          <SelectItem value="15+">أكثر من 15 سنة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="workingHours" className="text-arabic">ساعات العمل</Label>
                      <Select value={formData.workingHours} onValueChange={(value) => handleInputChange('workingHours', value)}>
                        <SelectTrigger className="glass">
                          <SelectValue placeholder="اختر ساعات العمل" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="8am-5pm">8:00 ص - 5:00 م</SelectItem>
                          <SelectItem value="7am-7pm">7:00 ص - 7:00 م</SelectItem>
                          <SelectItem value="24/7">24/7</SelectItem>
                          <SelectItem value="custom">مخصص</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="emergencyService"
                      checked={formData.emergencyService}
                      onCheckedChange={(checked) => handleInputChange('emergencyService', checked as boolean)}
                    />
                    <label htmlFor="emergencyService" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mr-2 text-arabic">
                      نقدم خدمات طوارئ على مدار الساعة
                    </label>
                  </div>
                </div>
              )}

              {/* Step 5: Account Creation */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username" className="text-arabic">اسم المستخدم *</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        placeholder="username"
                        className="glass"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password" className="text-arabic">كلمة المرور *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="********"
                          className="glass pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-arabic">تأكيد كلمة المرور *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="********"
                      className="glass"
                      required
                    />
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="text-sm text-destructive mt-1 text-arabic">كلمات المرور غير متطابقة</p>
                    )}
                  </div>

                  {/* Terms and Conditions */}
                  <div className="space-y-4 p-4 glass rounded-lg">
                    <h3 className="font-semibold text-primary text-arabic">الموافقات المطلوبة</h3>
                    
                    <div className="space-y-3">
                      <label className="flex items-start gap-3">
                        <Checkbox
                          checked={formData.termsAccepted}
                          onCheckedChange={(checked) => handleInputChange('termsAccepted', checked as boolean)}
                          className="mt-1"
                        />
                        <span className="text-sm text-arabic">
                          أوافق على <Link to="/terms" className="text-primary hover:underline">الشروط والأحكام</Link> الخاصة بمقدمي الخدمات *
                        </span>
                      </label>
                      
                      <label className="flex items-start gap-3">
                        <Checkbox
                          checked={formData.privacyAccepted}
                          onCheckedChange={(checked) => handleInputChange('privacyAccepted', checked as boolean)}
                          className="mt-1"
                        />
                        <span className="text-sm text-arabic">
                          أوافق على <Link to="/privacy" className="text-primary hover:underline">سياسة الخصوصية</Link>
                        </span>
                      </label>
                      
                      <label className="flex items-start gap-3">
                        <Checkbox
                          checked={formData.dataProcessingAccepted}
                          onCheckedChange={(checked) => handleInputChange('dataProcessingAccepted', checked as boolean)}
                          className="mt-1"
                        />
                        <span className="text-sm text-arabic">
                          أوافق على معالجة البيانات الشخصية لأغراض التحقق وتقديم الخدمات
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-success/10 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                      <div>
                        <h4 className="font-medium text-success text-arabic">ما بعد التسجيل:</h4>
                        <ul className="text-sm text-muted-foreground text-arabic mt-2 space-y-1">
                          <li>• سيتم مراجعة طلبك خلال 24-48 ساعة</li>
                          <li>• ستحصل على رسالة تأكيد عبر البريد الإلكتروني</li>
                          <li>• بعد الموافقة، يمكنك البدء في استقبال طلبات الخدمة</li>
                          <li>• ستحصل على دورة تدريبية مجانية على استخدام المنصة</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="glass-hover border-primary/30 text-arabic"
                >
                  <ArrowRight className="ml-2 h-4 w-4" />
                  السابق
                </Button>

                <div className="flex gap-3">
                  <Link to="/login">
                    <Button variant="ghost" className="text-arabic">
                      لديك حساب؟ سجل دخول
                    </Button>
                  </Link>
                  
                  {currentStep < totalSteps ? (
                    <Button
                      onClick={nextStep}
                      disabled={!validateStep(currentStep)}
                      className="bg-primary hover:bg-primary/90 text-arabic"
                    >
                      التالي
                      <ArrowLeft className="mr-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={!validateStep(5) || isSubmitting}
                      className="bg-success hover:bg-success/90 text-arabic"
                    >
                      {isSubmitting ? (
                        <>
                          <Clock className="ml-2 h-4 w-4 animate-spin" />
                          جار المعالجة...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="ml-2 h-4 w-4" />
                          إرسال الطلب
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits Section */}
          <Card className="glass-card border-0 mt-8">
            <CardHeader>
              <CardTitle className="text-xl text-primary text-arabic text-center">
                مزايا الانضمام إلى شبكتنا
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-primary mb-2 text-arabic">عملاء جدد</h3>
                  <p className="text-sm text-muted-foreground text-arabic">وصول لآلاف العملاء المحتملين</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="h-6 w-6 text-success" />
                  </div>
                  <h3 className="font-semibold text-primary mb-2 text-arabic">دفع آمن</h3>
                  <p className="text-sm text-muted-foreground text-arabic">نظام دفع آمن ومضمون</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-primary mb-2 text-arabic">دعم مستمر</h3>
                  <p className="text-sm text-muted-foreground text-arabic">فريق دعم متخصص 24/7</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-primary mb-2 text-arabic">تقييم العملاء</h3>
                  <p className="text-sm text-muted-foreground text-arabic">نظام تقييم يساعد في بناء السمعة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}