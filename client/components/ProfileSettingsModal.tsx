import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Bell,
  Shield,
  CreditCard,
  Mail,
  Trash2,
  Plus,
  Edit,
  Settings,
  Key,
  Smartphone,
} from 'lucide-react';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const [notificationSettings, setNotificationSettings] = useState({
    emailOrders: true,
    emailMarketing: false,
    smsOrders: true,
    smsMarketing: false,
    pushNotifications: true,
    orderUpdates: true,
    maintenanceReminders: true,
    promotions: false,
  });

  const [paymentMethods] = useState([
    {
      id: 1,
      type: 'card',
      number: '**** **** **** 4532',
      expiry: '12/26',
      isDefault: true,
      brand: 'Visa',
    },
    {
      id: 2,
      type: 'card',
      number: '**** **** **** 8901',
      expiry: '09/25',
      isDefault: false,
      brand: 'Mastercard',
    },
  ]);

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: true,
    loginAlerts: true,
    biometricAuth: false,
    sessionTimeout: '30',
  });

  const handleNotificationChange = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSecurityChange = (key: keyof typeof securitySettings, value: boolean | string) => {
    setSecuritySettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-0 max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary text-arabic">إعدادات الحساب</DialogTitle>
          <DialogDescription className="text-muted-foreground text-arabic">
            إدارة تفضيلاتك وإعدادات الحساب
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-transparent">
            <TabsTrigger value="notifications" className="text-arabic">الإشعارات</TabsTrigger>
            <TabsTrigger value="security" className="text-arabic">الأمان</TabsTrigger>
            <TabsTrigger value="payments" className="text-arabic">المدفوعات</TabsTrigger>
            <TabsTrigger value="preferences" className="text-arabic">التفضيلات</TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-arabic">
                  <Bell className="h-5 w-5" />
                  إعدادات الإشعارات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-4 text-arabic">إشعارات البريد الإلكتروني</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="text-arabic">تحديثات الطلبات</span>
                      </div>
                      <Switch
                        checked={notificationSettings.emailOrders}
                        onCheckedChange={() => handleNotificationChange('emailOrders')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="text-arabic">العروض التسويقية</span>
                      </div>
                      <Switch
                        checked={notificationSettings.emailMarketing}
                        onCheckedChange={() => handleNotificationChange('emailMarketing')}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4 text-arabic">رسائل الجوال (SMS)</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-4 w-4 text-primary" />
                        <span className="text-arabic">تحديثات الطلبات</span>
                      </div>
                      <Switch
                        checked={notificationSettings.smsOrders}
                        onCheckedChange={() => handleNotificationChange('smsOrders')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-4 w-4 text-primary" />
                        <span className="text-arabic">تذكيرات الصيانة</span>
                      </div>
                      <Switch
                        checked={notificationSettings.maintenanceReminders}
                        onCheckedChange={() => handleNotificationChange('maintenanceReminders')}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4 text-arabic">إشعارات التطبيق</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell className="h-4 w-4 text-primary" />
                        <span className="text-arabic">الإشعارات المفعلة</span>
                      </div>
                      <Switch
                        checked={notificationSettings.pushNotifications}
                        onCheckedChange={() => handleNotificationChange('pushNotifications')}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-arabic">
                  <Shield className="h-5 w-5" />
                  الأمان والخصوصية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Key className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium text-arabic">المصادقة الثنائية</p>
                        <p className="text-sm text-muted-foreground text-arabic">طبقة أمان إضافية لحسابك</p>
                      </div>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactorEnabled}
                      onCheckedChange={(checked) => handleSecurityChange('twoFactorEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium text-arabic">تنبيهات تسجيل الدخول</p>
                        <p className="text-sm text-muted-foreground text-arabic">إشعار عند تسجيل الدخول من جهاز جديد</p>
                      </div>
                    </div>
                    <Switch
                      checked={securitySettings.loginAlerts}
                      onCheckedChange={(checked) => handleSecurityChange('loginAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium text-arabic">المصادقة البيومترية</p>
                        <p className="text-sm text-muted-foreground text-arabic">بصمة الإصبع أو الوجه</p>
                      </div>
                    </div>
                    <Switch
                      checked={securitySettings.biometricAuth}
                      onCheckedChange={(checked) => handleSecurityChange('biometricAuth', checked)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-arabic">مهلة انتهاء الجلسة (دقيقة)</Label>
                  <select
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
                    className="w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="15">15 دقيقة</option>
                    <option value="30">30 دقيقة</option>
                    <option value="60">ساعة واحدة</option>
                    <option value="120">ساعتين</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-arabic">
                    تغيير كلمة المرور
                  </Button>
                  <Button variant="outline" className="w-full glass-hover border-primary/30 text-arabic">
                    تحميل بيانات الحساب
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card className="glass border-0">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-arabic">
                  <CreditCard className="h-5 w-5" />
                  طرق الدفع
                </CardTitle>
                <Button className="bg-primary hover:bg-primary/90 text-arabic">
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة بطاقة
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="glass rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{method.number}</p>
                              {method.isDefault && (
                                <Badge variant="secondary" className="text-xs">افتراضي</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{method.brand} • ينتهي في {method.expiry}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-arabic">
                  <Settings className="h-5 w-5" />
                  التفضيلات العامة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-arabic mb-3 block">مظهر التطبيق</Label>
                  <div className="flex items-center gap-3">
                    <ThemeToggle />
                  </div>
                </div>

                <div>
                  <Label className="text-arabic mb-3 block">اللغة</Label>
                  <select className="w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-arabic">
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div>
                  <Label className="text-arabic mb-3 block">المنطقة الزمنية</Label>
                  <select className="w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-arabic">
                    <option value="Asia/Riyadh">الرياض (GMT+3)</option>
                    <option value="Asia/Dubai">دبي (GMT+4)</option>
                    <option value="Asia/Kuwait">الكويت (GMT+3)</option>
                  </select>
                </div>

                <div>
                  <Label className="text-arabic mb-3 block">تفضيلات العرض</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-arabic">عرض الأسعار شاملة الضريبة</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-arabic">إخفاء المنتجات غير المتوفرة</span>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-arabic">عرض التوصيات الذكية</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="glass-hover border-primary/30 text-arabic">
            إلغاء
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-arabic">
            حفظ التغييرات
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}