import { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  User, 
  Send, 
  Phone, 
  Mail, 
  FileText,
  Headphones,
  Video,
  MessageSquare
} from "lucide-react";

interface ChatMessage {
  id: string;
  type: 'user' | 'bot' | 'agent';
  message: string;
  timestamp: Date;
  isTyping?: boolean;
}

export default function Support() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      message: 'مرحباً! أنا مساعد حلول الأجهزة الطبية الذكي. كيف يمكنني مساعدتك اليوم؟',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentMode, setCurrentMode] = useState<'bot' | 'agent'>('bot');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: newMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: currentMode,
        message: getBotResponse(newMessage),
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getBotResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('صيانة') || lowerMessage.includes('إصلاح')) {
      return 'يمكنني مساعدتك في طلب خدمة الصيانة. ما نوع الجهاز الذي تحتاج صيانته؟ يمكنك أيضاً تحديد موعد للفني من خلال الرابط التالي: /maintenance';
    }
    
    if (lowerMessage.includes('إيجار') || lowerMessage.includes('استئجار')) {
      return 'رائع! لدينا مجموعة واسعة من الأجهزة الطبية للإيجار. ما نوع الجهاز الذي تبحث عنه؟ يمكنك تصفح الأجهزة المتاحة هنا: /rental';
    }
    
    if (lowerMessage.includes('شراء') || lowerMessage.includes('شراء')) {
      return 'ممتاز! لدينا متجر شامل للأجهزة الطبية. هل تبحث عن نوع معين من الأجهزة؟ تفضل بزيارة متجرنا: /sales';
    }
    
    if (lowerMessage.includes('طلب') || lowerMessage.includes('ترتيب')) {
      return 'يمكنك تتبع طلبك من خلال ملفك الشخصي. إذا كان لديك رقم الطلب، يمكنني مساعدتك في التحقق من حالته.';
    }
    
    if (lowerMessage.includes('مشكلة') || lowerMessage.includes('خلل')) {
      return 'أعتذر للمشكلة التي تواجهها. يمكنني تحويلك إلى أحد ممثلي خدمة العملاء للحصول على مساعدة شخصية. هل تريد التحدث مع ممثل خدمة العملاء؟';
    }
    
    return 'شكراً لسؤالك. يمكنني مساعدتك في الصيانة والإيجار والمبيعات وتتبع الطلبات. كيف يمكنني مساعدتك تحديداً؟';
  };

  const switchToAgent = () => {
    setCurrentMode('agent');
    const agentMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'agent',
      message: 'مرحباً! أنا سارة من فريق خدمة العملاء. سأكون سعيدة لمساعدتك اليوم. كيف يمكنني خدمتك؟',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, agentMessage]);
  };

  const faqItems = [
    {
      question: 'كيف يمكنني طلب خدمة صيانة؟',
      answer: 'يمكنك طلب خدمة الصيانة من خلال صفحة الصيانة، حدد نوع الجهاز واشرح المشكلة وسيتم تعيين فني مؤهل للمساعدة.'
    },
    {
      question: 'ما هي مدة الضمان على الأجهزة؟',
      answer: 'تختلف مدة الضمان حسب نوع الجهاز والمصنع، وعادة تتراوح من سنة إلى 5 سنوات. يمكنك العثور على تفاصيل الضمان في صفحة المنتج.'
    },
    {
      question: 'هل يمكن إرجاع الأجهزة المستأجرة مبكراً؟',
      answer: 'نعم، يمكن إرجاع الأجهزة المستأجرة مبكراً مع دفع رسوم إضافية حسب شروط العقد. تواصل معنا لمعرفة التفاصيل.'
    },
    {
      question: 'كيف يتم توصيل الأجهزة؟',
      answer: 'نوفر خدمة توصيل سريعة وآمنة لجميع أنحاء المملكة. الأجهزة الصغيرة يتم توصيلها خلال 24-48 ساعة، والأجهزة الكبيرة قد تحتاج وقت أطول.'
    }
  ];

  const supportStats = {
    avgResponseTime: '< 5 دقائق',
    satisfactionRate: '98%',
    ticketsResolved: '12,450+',
    agentsAvailable: '24/7'
  };

  return (
    <Layout>
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="glass-card rounded-3xl p-8 mb-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center mx-auto mb-4">
                <Headphones className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-primary mb-4 text-arabic">مركز الدعم والمساعدة</h1>
              <p className="text-xl text-muted-foreground text-arabic leading-relaxed max-w-2xl mx-auto">
                فريق دعم متخصص متاح 24/7 لمساعدتك في جميع استفساراتك ومشاكلك التقنية
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{supportStats.avgResponseTime}</div>
                <p className="text-sm text-muted-foreground text-arabic">متوسط وقت الاستجابة</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{supportStats.satisfactionRate}</div>
                <p className="text-sm text-muted-foreground text-arabic">نسبة رضا العملاء</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{supportStats.ticketsResolved}</div>
                <p className="text-sm text-muted-foreground text-arabic">تذكرة تم حلها</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{supportStats.agentsAvailable}</div>
                <p className="text-sm text-muted-foreground text-arabic">خدمة متواصلة</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <Card className="glass-card border-0 h-[600px] flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-primary text-arabic flex items-center gap-2">
                      {currentMode === 'bot' ? (
                        <>
                          <Bot className="h-5 w-5" />
                          المساعد الذكي
                        </>
                      ) : (
                        <>
                          <User className="h-5 w-5" />
                          دعم مباشر
                        </>
                      )}
                    </CardTitle>
                    <Badge className={currentMode === 'bot' ? 'bg-primary' : 'bg-success'}>
                      {currentMode === 'bot' ? 'روبوت' : 'مباشر'}
                    </Badge>
                  </div>
                  {currentMode === 'bot' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={switchToAgent}
                      className="w-fit text-arabic"
                    >
                      التحدث مع ممثل خدمة العملاء
                    </Button>
                  )}
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map((message) => (
                      <div 
                        key={message.id} 
                        className={`flex ${message.type === 'user' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.type === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : message.type === 'bot'
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-success text-success-foreground'
                          }`}>
                            {message.type === 'user' ? (
                              <User className="h-4 w-4" />
                            ) : message.type === 'bot' ? (
                              <Bot className="h-4 w-4" />
                            ) : (
                              <Headphones className="h-4 w-4" />
                            )}
                          </div>
                          <div className={`glass rounded-2xl p-3 ${message.type === 'user' ? 'bg-primary/10' : 'bg-white/50'}`}>
                            <p className="text-sm text-arabic leading-relaxed">{message.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {message.timestamp.toLocaleTimeString('ar-SA', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div className="flex justify-end">
                        <div className="flex gap-3 max-w-[80%] flex-row-reverse">
                          <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div className="glass rounded-2xl p-3 bg-white/50">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Message Input */}
                  <div className="border-t border-border p-4">
                    <div className="flex gap-3">
                      <Input
                        placeholder="اكتب رسالتك هنا..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        className="glass text-arabic"
                      />
                      <Button 
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Support Options */}
            <div className="space-y-6">
              {/* Quick Contact */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg text-primary text-arabic">تواصل سريع</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start bg-primary hover:bg-primary/90 text-arabic">
                    <Phone className="ml-2 h-4 w-4" />
                    اتصال هاتفي فوري
                  </Button>
                  <Button variant="outline" className="w-full justify-start glass-hover border-primary/30 text-arabic">
                    <Mail className="ml-2 h-4 w-4" />
                    إرسال بريد إلكتروني
                  </Button>
                  <Button variant="outline" className="w-full justify-start glass-hover border-primary/30 text-arabic">
                    <MessageSquare className="ml-2 h-4 w-4" />
                    واتساب
                  </Button>
                </CardContent>
              </Card>

              {/* FAQ */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg text-primary text-arabic">الأسئلة الشائعة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {faqItems.slice(0, 3).map((faq, index) => (
                    <div key={index} className="glass rounded-lg p-3 cursor-pointer hover:bg-white/30 transition-colors">
                      <h4 className="font-semibold text-sm text-arabic mb-1">{faq.question}</h4>
                      <p className="text-xs text-muted-foreground text-arabic line-clamp-2">{faq.answer}</p>
                    </div>
                  ))}
                  <Button variant="link" className="w-full text-primary text-arabic">
                    عرض جميع الأسئلة الشائعة
                  </Button>
                </CardContent>
              </Card>

              {/* Help Resources */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg text-primary text-arabic">مصادر المساعدة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start glass-hover border-primary/30 text-arabic">
                    <FileText className="ml-2 h-4 w-4" />
                    دليل المستخدم
                  </Button>
                  <Button variant="outline" className="w-full justify-start glass-hover border-primary/30 text-arabic">
                    <Video className="ml-2 h-4 w-4" />
                    فيديوهات تعليمية
                  </Button>
                  <Button variant="outline" className="w-full justify-start glass-hover border-primary/30 text-arabic">
                    <FileText className="ml-2 h-4 w-4" />
                    مقالات المساعدة
                  </Button>
                </CardContent>
              </Card>

              {/* Support Hours */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg text-primary text-arabic">ساعات الدعم</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-arabic">دعم الدردشة</span>
                    <Badge className="bg-success text-success-foreground">24/7</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-arabic">الدعم الهاتفي</span>
                    <span className="text-sm">8:00 - 22:00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-arabic">البريد الإلكتروني</span>
                    <Badge className="bg-success text-success-foreground">24/7</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ Section */}
          <Card className="glass-card border-0 mt-8">
            <CardHeader>
              <CardTitle className="text-2xl text-primary text-arabic">الأسئلة الشائعة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {faqItems.map((faq, index) => (
                  <div key={index} className="glass rounded-xl p-4">
                    <h3 className="font-semibold text-primary mb-2 text-arabic">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground text-arabic leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}