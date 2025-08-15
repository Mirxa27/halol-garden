import { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageCircle, 
  Send, 
  Search, 
  Phone, 
  Video,
  MoreVertical,
  Paperclip,
  Image,
  FileText,
  CheckCheck,
  Circle,
  Star,
  MapPin,
  Clock,
  User,
  Building
} from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
  status: 'sent' | 'delivered' | 'read';
  fileUrl?: string;
  fileName?: string;
}

interface Conversation {
  id: string;
  participant: {
    id: string;
    name: string;
    nameEn: string;
    type: 'customer' | 'provider';
    avatar?: string;
    rating?: number;
    location?: string;
    online: boolean;
    lastSeen?: Date;
  };
  lastMessage: Message;
  unreadCount: number;
  orderId?: string;
  orderType?: string;
}

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock conversations data
  const conversations: Conversation[] = [
    {
      id: '1',
      participant: {
        id: 'p1',
        name: 'شركة الرعاية الطبية المتقدمة',
        nameEn: 'Advanced Medical Care Co.',
        type: 'provider',
        rating: 4.9,
        location: 'الرياض',
        online: true
      },
      lastMessage: {
        id: 'm1',
        senderId: 'p1',
        senderName: 'شركة الرعاية الطبية المتقدمة',
        content: 'شكراً لك، سيتم البدء في أعمال الصيانة غداً في تمام الساعة 9 صباحاً',
        timestamp: new Date('2024-01-20T15:30:00Z'),
        type: 'text',
        status: 'read'
      },
      unreadCount: 0,
      orderId: 'ORD-2024-001',
      orderType: 'maintenance'
    },
    {
      id: '2',
      participant: {
        id: 'c1',
        name: 'د. سارة أحمد الخالد',
        nameEn: 'Dr. Sarah Ahmed Al-Khalid',
        type: 'customer',
        location: 'جدة',
        online: false,
        lastSeen: new Date('2024-01-20T14:15:00Z')
      },
      lastMessage: {
        id: 'm2',
        senderId: 'c1',
        senderName: 'د. سارة أحمد الخالد',
        content: 'هل يمكن تقديم عرض سعر لإيجار جهاز الموجات فوق الصوتية لمدة شهر؟',
        timestamp: new Date('2024-01-20T14:00:00Z'),
        type: 'text',
        status: 'delivered'
      },
      unreadCount: 2,
      orderId: 'REQ-2024-089',
      orderType: 'rental'
    },
    {
      id: '3',
      participant: {
        id: 'p2',
        name: 'مؤسسة التكنولوجيا الطبية',
        nameEn: 'Medical Technology Est.',
        type: 'provider',
        rating: 4.8,
        location: 'الدمام',
        online: true
      },
      lastMessage: {
        id: 'm3',
        senderId: 'current_user',
        senderName: 'أنت',
        content: 'ممتاز، أتطلع لاستلام الجهاز',
        timestamp: new Date('2024-01-20T13:45:00Z'),
        type: 'text',
        status: 'read'
      },
      unreadCount: 0,
      orderId: 'ORD-2024-002',
      orderType: 'sales'
    }
  ];

  // Mock messages for selected conversation
  const messages: Message[] = [
    {
      id: '1',
      senderId: 'current_user',
      senderName: 'أنت',
      content: 'مرحباً، أحتاج إلى صيانة عاجلة لجهاز الأشعة السينية',
      timestamp: new Date('2024-01-20T10:00:00Z'),
      type: 'text',
      status: 'read'
    },
    {
      id: '2',
      senderId: 'p1',
      senderName: 'شركة الرعاية الطبية المتقدمة',
      content: 'مرحباً بك، يمكننا مساعدتك. ما نوع المشكلة التي تواجهها؟',
      timestamp: new Date('2024-01-20T10:05:00Z'),
      type: 'text',
      status: 'read'
    },
    {
      id: '3',
      senderId: 'current_user',
      senderName: 'أنت',
      content: 'الجهاز لا يعمل بشكل صحيح ويظهر رسالة خطأ',
      timestamp: new Date('2024-01-20T10:10:00Z'),
      type: 'text',
      status: 'read'
    },
    {
      id: '4',
      senderId: 'current_user',
      senderName: 'أنت',
      content: 'diagnostic_report.pdf',
      timestamp: new Date('2024-01-20T10:15:00Z'),
      type: 'file',
      status: 'read',
      fileName: 'diagnostic_report.pdf'
    },
    {
      id: '5',
      senderId: 'p1',
      senderName: 'شركة الرعاية الطبية المتقدمة',
      content: 'شكراً لإرسال التقرير، سنقوم بمراجعته وإرسال الفني غداً',
      timestamp: new Date('2024-01-20T15:30:00Z'),
      type: 'text',
      status: 'read'
    }
  ];

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    // Here you would implement the actual message sending logic
    console.log('Sending message:', newMessage);
    setNewMessage('');
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Circle className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-primary" />;
      default:
        return null;
    }
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return '🔧';
      case 'rental':
        return '📅';
      case 'sales':
        return '🛒';
      default:
        return '📋';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    return date.toLocaleDateString('ar-SA');
  };

  return (
    <Layout title="الرسائل">
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
          
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-3xl h-full flex flex-col">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold text-primary mb-4 text-arabic">المحادثات</h2>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="البحث في المحادثات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="glass pr-10 text-arabic"
                    dir="rtl"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`p-4 border-b border-border cursor-pointer transition-colors hover:bg-white/10 ${
                      selectedConversation === conversation.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conversation.participant.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {conversation.participant.type === 'provider' ? (
                              <Building className="h-6 w-6" />
                            ) : (
                              <User className="h-6 w-6" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.participant.online && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-primary text-sm text-arabic truncate">
                            {conversation.participant.name}
                          </h3>
                          <div className="flex items-center gap-1">
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-primary text-primary-foreground h-5 w-5 p-0 text-xs flex items-center justify-center">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatTime(conversation.lastMessage.timestamp)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-1">
                          {conversation.participant.type === 'provider' && conversation.participant.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current text-success" />
                              <span className="text-xs text-muted-foreground">{conversation.participant.rating}</span>
                            </div>
                          )}
                          {conversation.participant.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{conversation.participant.location}</span>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground truncate text-arabic">
                          {conversation.lastMessage.senderId === 'current_user' ? 'أنت: ' : ''}
                          {conversation.lastMessage.content}
                        </p>
                        
                        {conversation.orderId && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs">{getOrderTypeIcon(conversation.orderType!)}</span>
                            <span className="text-xs text-primary font-medium">{conversation.orderId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {selectedConversationData ? (
              <div className="glass-card rounded-3xl h-full flex flex-col">
                
                {/* Chat Header */}
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConversationData.participant.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {selectedConversationData.participant.type === 'provider' ? (
                            <Building className="h-5 w-5" />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-primary text-arabic">
                          {selectedConversationData.participant.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {selectedConversationData.participant.online ? (
                            <span className="text-success text-arabic">متصل الآن</span>
                          ) : (
                            <span className="text-arabic">
                              آخر ظهور: {selectedConversationData.participant.lastSeen ? 
                                formatTime(selectedConversationData.participant.lastSeen) : 'غير معروف'
                              }
                            </span>
                          )}
                          {selectedConversationData.participant.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current text-success" />
                              <span>{selectedConversationData.participant.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="glass-hover rounded-full">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="glass-hover rounded-full">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="glass-hover rounded-full">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {selectedConversationData.orderId && (
                    <div className="mt-3 p-3 bg-primary/10 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <span>{getOrderTypeIcon(selectedConversationData.orderType!)}</span>
                        <span className="text-arabic">مرتبط بالطلب:</span>
                        <span className="font-medium text-primary">{selectedConversationData.orderId}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === 'current_user' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[70%] ${message.senderId === 'current_user' ? 'order-2' : 'order-1'}`}>
                        <div className={`glass rounded-2xl p-3 ${
                          message.senderId === 'current_user' 
                            ? 'bg-primary/10 ml-3' 
                            : 'bg-white/50 mr-3'
                        }`}>
                          {message.type === 'text' && (
                            <p className="text-sm text-arabic leading-relaxed">{message.content}</p>
                          )}
                          {message.type === 'file' && (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="text-sm text-primary">{message.fileName}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {message.timestamp.toLocaleTimeString('ar-SA', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            {message.senderId === 'current_user' && (
                              <div className="flex items-center gap-1">
                                {getMessageStatusIcon(message.status)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Avatar className={`h-8 w-8 ${message.senderId === 'current_user' ? 'order-1' : 'order-2'}`}>
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {message.senderId === 'current_user' ? 'أ' : 'ش'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-6 border-t border-border">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" className="glass-hover rounded-full">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="glass-hover rounded-full">
                      <Image className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex-1">
                      <Input
                        placeholder="اكتب رسالتك..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        className="glass text-arabic"
                        dir="rtl"
                      />
                    </div>
                    
                    <Button 
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-primary hover:bg-primary/90 rounded-full"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-3xl h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-primary mb-2 text-arabic">
                    اختر محادثة للبدء
                  </h3>
                  <p className="text-muted-foreground text-arabic">
                    اختر محادثة من القائمة للبدء في التواصل
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
