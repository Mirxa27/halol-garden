import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Building2, 
  Smartphone, 
  Wallet, 
  Shield, 
  Lock,
  CheckCircle,
  Plus,
  Trash2,
  Edit,
  Receipt
} from "lucide-react";

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_transfer' | 'digital_wallet' | 'cash_on_delivery';
  name: string;
  nameAr: string;
  icon: any;
  description: string;
  descriptionAr: string;
  fees?: number;
  processing_time: string;
  processing_timeAr: string;
  enabled: boolean;
}

interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export default function Payment() {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [showAddCard, setShowAddCard] = useState(false);

  // Mock order data
  const orderData = {
    id: 'ORD-2024-001',
    type: 'maintenance',
    typeAr: 'صيانة',
    equipment: 'جهاز الأشعة السينية - Philips MX450',
    provider: 'شركة الرعاية الطبية المتقدمة',
    subtotal: 1200,
    tax: 180,
    fees: 25,
    total: 1405
  };

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'credit_card',
      type: 'credit_card',
      name: 'Credit/Debit Cards',
      nameAr: 'البطاقات الائتمانية والخصم',
      icon: CreditCard,
      description: 'Pay securely with Visa, Mastercard, or Mada',
      descriptionAr: 'ادفع بأمان باستخدام فيزا أو ماستركارد أو مدى',
      processing_time: 'Instant',
      processing_timeAr: 'فوري',
      enabled: true
    },
    {
      id: 'bank_transfer',
      type: 'bank_transfer',
      name: 'Bank Transfer',
      nameAr: 'التحويل البنكي',
      icon: Building2,
      description: 'Direct bank transfer',
      descriptionAr: 'تحويل بنكي مباشر',
      processing_time: '1-3 business days',
      processing_timeAr: '1-3 أيام عمل',
      enabled: true
    },
    {
      id: 'stc_pay',
      type: 'digital_wallet',
      name: 'STC Pay',
      nameAr: 'محفظة STC Pay',
      icon: Smartphone,
      description: 'Pay with STC Pay digital wallet',
      descriptionAr: 'ادفع باستخدام محفظة STC Pay الرقمية',
      processing_time: 'Instant',
      processing_timeAr: 'فوري',
      enabled: true
    },
    {
      id: 'apple_pay',
      type: 'digital_wallet',
      name: 'Apple Pay',
      nameAr: 'Apple Pay',
      icon: Wallet,
      description: 'Pay with Apple Pay',
      descriptionAr: 'ادفع باستخدام Apple Pay',
      processing_time: 'Instant',
      processing_timeAr: 'فوري',
      enabled: true
    },
    {
      id: 'cash_on_delivery',
      type: 'cash_on_delivery',
      name: 'Cash on Delivery',
      nameAr: 'الدفع عند الاستلام',
      icon: Receipt,
      description: 'Pay when service is completed',
      descriptionAr: 'ادفع عند اكتمال الخدمة',
      fees: 15,
      processing_time: 'On completion',
      processing_timeAr: 'عند الإنجاز',
      enabled: true
    }
  ];

  const savedCards: SavedCard[] = [
    {
      id: '1',
      last4: '4532',
      brand: 'visa',
      expiryMonth: 12,
      expiryYear: 2026,
      isDefault: true
    },
    {
      id: '2',
      last4: '5678',
      brand: 'mastercard',
      expiryMonth: 8,
      expiryYear: 2025,
      isDefault: false
    }
  ];

  const transactionHistory = [
    {
      id: 'TXN-001',
      orderId: 'ORD-2024-001',
      amount: 1200,
      method: 'البطاقة الائتمانية',
      status: 'completed',
      statusAr: 'مكتمل',
      date: '2024-01-15T10:30:00Z'
    },
    {
      id: 'TXN-002',
      orderId: 'ORD-2024-002',
      amount: 800,
      method: 'STC Pay',
      status: 'pending',
      statusAr: 'قيد المعالجة',
      date: '2024-01-18T14:20:00Z'
    }
  ];

  const getCardBrandIcon = (brand: string) => {
    // In a real app, you'd have actual brand icons
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'mada':
        return '💳';
      default:
        return '💳';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handlePayment = async () => {
    try {
      // Real payment processing implementation
      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod: selectedPaymentMethod,
          amount: totalAmount,
          currency: 'USD',
          // Add other necessary payment data
        }),
      });

      if (!response.ok) {
        throw new Error('Payment processing failed');
      }

      const result = await response.json();
      
      if (result.success) {
        // Handle successful payment
        window.location.href = '/payment/success';
      } else {
        // Handle payment failure
        alert('Payment failed: ' + result.error);
      }
    } catch (error) {
      // Handle error
      alert('Payment processing error. Please try again.');
    }
  };

  return (
    <Layout title="الدفع والتحصيل">
      <div className="max-w-7xl mx-auto px-4 pb-16">
        
        {/* Payment Header */}
        <div className="glass-card rounded-3xl p-6 mb-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-success to-success/80 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-primary mb-4 text-arabic">الدفع الآمن</h1>
            <p className="text-muted-foreground text-arabic">
              نوفر عدة طرق دفع آمنة ومشفرة لضمان حماية معلوماتك المالية
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Payment Methods */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Order Summary */}
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-xl text-primary text-arabic">ملخص الطلب</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-primary text-arabic">{orderData.equipment}</h3>
                      <p className="text-sm text-muted-foreground text-arabic">{orderData.provider}</p>
                      <Badge className="bg-primary text-primary-foreground mt-1">
                        {orderData.typeAr}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">{orderData.subtotal} ريال</div>
                      <div className="text-xs text-muted-foreground">{orderData.id}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods Selection */}
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-xl text-primary text-arabic">اختر طريقة الدفع</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center space-x-2 space-x-reverse">
                        <RadioGroupItem value={method.id} id={method.id} />
                        <label
                          htmlFor={method.id}
                          className="flex-1 flex items-center justify-between p-4 glass rounded-lg cursor-pointer hover:bg-white/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <method.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-primary text-arabic">{method.nameAr}</h4>
                              <p className="text-sm text-muted-foreground text-arabic">{method.descriptionAr}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-muted-foreground text-arabic">
                                  {method.processing_timeAr}
                                </span>
                                {method.fees && (
                                  <span className="text-xs text-orange-600">
                                    رسوم: {method.fees} ريال
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-success" />
                            <span className="text-xs text-success text-arabic">آمن</span>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Saved Cards */}
            {selectedPaymentMethod === 'credit_card' && (
              <Card className="glass-card border-0">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg text-primary text-arabic">البطاقات المحفوظة</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAddCard(!showAddCard)}
                    className="glass-hover border-primary/30 text-arabic"
                  >
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة بطاقة
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {savedCards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => setSelectedCard(card.id)}
                        className={`p-4 glass rounded-lg cursor-pointer transition-colors border-2 ${
                          selectedCard === card.id ? 'border-primary' : 'border-transparent hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getCardBrandIcon(card.brand)}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">**** {card.last4}</span>
                                {card.isDefault && (
                                  <Badge variant="secondary" className="text-xs">افتراضي</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                انتهاء: {card.expiryMonth.toString().padStart(2, '0')}/{card.expiryYear}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
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

                  {/* Add New Card Form */}
                  {showAddCard && (
                    <div className="mt-6 p-4 bg-muted/20 rounded-lg">
                      <h4 className="font-semibold text-primary mb-4 text-arabic">إضافة بطاقة جديدة</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cardNumber" className="text-arabic">رقم البطاقة</Label>
                          <Input id="cardNumber" placeholder="1234 5678 9012 3456" className="glass" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cardName" className="text-arabic">اسم حامل البطاقة</Label>
                          <Input id="cardName" placeholder="أحمد محمد العلي" className="glass text-arabic" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expiryDate" className="text-arabic">تاريخ الانتهاء</Label>
                          <Input id="expiryDate" placeholder="MM/YY" className="glass" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv" className="text-arabic">رمز الأمان (CVV)</Label>
                          <Input id="cvv" placeholder="123" className="glass" />
                        </div>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <Button className="bg-primary hover:bg-primary/90 text-arabic">
                          حفظ البطاقة
                        </Button>
                        <Button variant="outline" onClick={() => setShowAddCard(false)}>
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Payment Summary Sidebar */}
          <div className="space-y-6">
            
            {/* Payment Total */}
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-lg text-primary text-arabic">إجمالي المبلغ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-arabic">المبلغ الأساسي</span>
                  <span>{orderData.subtotal} ريال</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-arabic">ضريبة القيمة المضافة (15%)</span>
                  <span>{orderData.tax} ريال</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-arabic">رسوم المعالجة</span>
                  <span>{orderData.fees} ريال</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-lg font-bold">
                  <span className="text-arabic">الإجمالي النهائي</span>
                  <span className="text-primary">{orderData.total} ريال</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Security */}
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-lg text-primary text-arabic">الأمان والحماية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-success" />
                  <span className="text-sm text-arabic">تشفير SSL 256-bit</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-success" />
                  <span className="text-sm text-arabic">معتمد من PCI DSS</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-sm text-arabic">حماية ضد الاحتيال</span>
                </div>
              </CardContent>
            </Card>

            {/* Complete Payment Button */}
            <Button 
              onClick={handlePayment}
              disabled={!selectedPaymentMethod}
              className="w-full bg-success hover:bg-success/90 text-white py-3 text-lg text-arabic"
            >
              <Lock className="ml-2 h-5 w-5" />
              إتمام الدفع الآمن
            </Button>

            {/* Payment Terms */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground text-arabic leading-relaxed">
                بالمتابعة، فإنك توافق على شروط الدفع وسياسة الاسترداد
              </p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <Card className="glass-card border-0 mt-8">
          <CardHeader>
            <CardTitle className="text-xl text-primary text-arabic">سجل المعاملات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactionHistory.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 glass rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary">{transaction.orderId}</h4>
                      <p className="text-sm text-muted-foreground text-arabic">{transaction.method}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary">{transaction.amount} ريال</div>
                    <Badge className={getStatusColor(transaction.status)}>
                      {transaction.statusAr}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}