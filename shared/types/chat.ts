// Chat and Messaging Types
export enum ChatType {
  AI_ASSISTANT = 'ai_assistant',
  USER_TO_USER = 'user_to_user',
  SUPPORT = 'support',
  GROUP = 'group'
}

export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  AUDIO = 'audio',
  VIDEO = 'video',
  PRODUCT_CARD = 'product_card',
  ORDER_UPDATE = 'order_update',
  SYSTEM = 'system',
  AI_SUGGESTION = 'ai_suggestion'
}

export enum ChatbotIntent {
  GREETING = 'greeting',
  PRODUCT_INQUIRY = 'product_inquiry',
  PRODUCT_RECOMMENDATION = 'product_recommendation',
  PRICE_INQUIRY = 'price_inquiry',
  AVAILABILITY_CHECK = 'availability_check',
  ORDER_STATUS = 'order_status',
  RENTAL_INQUIRY = 'rental_inquiry',
  MAINTENANCE_REQUEST = 'maintenance_request',
  TECHNICAL_SUPPORT = 'technical_support',
  COMPLAINT = 'complaint',
  FEEDBACK = 'feedback',
  HUMAN_HANDOFF = 'human_handoff',
  UNKNOWN = 'unknown'
}

// Chat Session
export interface ChatSession {
  id: string;
  type: ChatType;
  participants: ChatParticipant[];
  title?: string;
  context?: ChatContext;
  messages: Message[];
  status: 'active' | 'archived' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
  metadata?: Record<string, any>;
}

// Chat Participant
export interface ChatParticipant {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  role: 'user' | 'ai' | 'support_agent' | 'admin';
  joinedAt: Date;
  lastSeenAt?: Date;
  isTyping?: boolean;
  isOnline?: boolean;
}

// Chat Context
export interface ChatContext {
  referenceType?: 'product' | 'order' | 'rental' | 'maintenance' | 'ticket';
  referenceId?: string;
  referenceData?: any;
  language: 'en' | 'ar';
  userType?: string;
  sessionSource?: 'web' | 'mobile' | 'api';
  pageUrl?: string;
  previousSessions?: string[];
}

// Message
export interface Message {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'ai' | 'support_agent' | 'system';
  type: MessageType;
  content: MessageContent;
  status: MessageStatus;
  timestamp: Date;
  editedAt?: Date;
  deletedAt?: Date;
  reactions?: MessageReaction[];
  replyTo?: string;
  metadata?: MessageMetadata;
}

// Message Content
export interface MessageContent {
  text?: string;
  html?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  duration?: number; // for audio/video in seconds
  productData?: ProductCardData;
  orderData?: OrderUpdateData;
  suggestions?: AISuggestion[];
  buttons?: QuickReplyButton[];
}

// Product Card Data
export interface ProductCardData {
  productId: string;
  name: string;
  image: string;
  price: number;
  currency: string;
  availability: string;
  link: string;
}

// Order Update Data
export interface OrderUpdateData {
  orderId: string;
  orderNumber: string;
  status: string;
  statusMessage: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
}

// AI Suggestion
export interface AISuggestion {
  type: 'product' | 'action' | 'information' | 'clarification';
  title: string;
  description?: string;
  data?: any;
  confidence?: number;
}

// Quick Reply Button
export interface QuickReplyButton {
  id: string;
  text: string;
  value: string;
  icon?: string;
  action?: 'reply' | 'link' | 'call' | 'email';
  url?: string;
}

// Message Reaction
export interface MessageReaction {
  userId: string;
  emoji: string;
  timestamp: Date;
}

// Message Metadata
export interface MessageMetadata {
  aiModel?: string;
  aiConfidence?: number;
  intent?: ChatbotIntent;
  entities?: Entity[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  language?: string;
  translated?: boolean;
  originalLanguage?: string;
}

// Entity
export interface Entity {
  type: string;
  value: string;
  confidence: number;
  position?: {
    start: number;
    end: number;
  };
}

// AI Chatbot Configuration
export interface ChatbotConfig {
  id: string;
  name: string;
  description?: string;
  model: AIModel;
  personality: ChatbotPersonality;
  capabilities: ChatbotCapabilities;
  knowledgeBase: KnowledgeBase;
  responseSettings: ResponseSettings;
  escalationRules: EscalationRule[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// AI Model
export interface AIModel {
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  modelName: string;
  version?: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

// Chatbot Personality
export interface ChatbotPersonality {
  name: string;
  avatar?: string;
  tone: 'professional' | 'friendly' | 'casual' | 'formal';
  language: 'en' | 'ar' | 'bilingual';
  greetingMessage: LocalizedText;
  farewellMessage: LocalizedText;
  errorMessage: LocalizedText;
  waitingMessage: LocalizedText;
  transferMessage: LocalizedText;
}

// Localized Text
export interface LocalizedText {
  en: string;
  ar: string;
}

// Chatbot Capabilities
export interface ChatbotCapabilities {
  productSearch: boolean;
  productRecommendation: boolean;
  priceNegotiation: boolean;
  orderTracking: boolean;
  rentalBooking: boolean;
  maintenanceScheduling: boolean;
  technicalSupport: boolean;
  paymentProcessing: boolean;
  documentGeneration: boolean;
  languageTranslation: boolean;
  voiceInput: boolean;
  voiceOutput: boolean;
}

// Knowledge Base
export interface KnowledgeBase {
  documents: KnowledgeDocument[];
  faqs: FAQ[];
  productCatalog: boolean;
  orderHistory: boolean;
  userPreferences: boolean;
  companyPolicies: boolean;
  technicalManuals: boolean;
  lastUpdated: Date;
}

// Knowledge Document
export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  language: 'en' | 'ar';
  version: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// FAQ
export interface FAQ {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
  category: string;
  keywords: string[];
  helpful: number;
  notHelpful: number;
  views: number;
}

// Response Settings
export interface ResponseSettings {
  responseTime: number; // target response time in seconds
  typingIndicator: boolean;
  typingSpeed: number; // characters per second
  maxResponseLength: number;
  includeEmojis: boolean;
  includeSources: boolean;
  fallbackBehavior: 'apologize' | 'transfer' | 'suggest_alternatives';
}

// Escalation Rule
export interface EscalationRule {
  id: string;
  name: string;
  trigger: EscalationTrigger;
  action: EscalationAction;
  priority: number;
  active: boolean;
}

// Escalation Trigger
export interface EscalationTrigger {
  type: 'keyword' | 'sentiment' | 'intent' | 'failure_count' | 'user_request';
  value: string | number;
  condition?: 'equals' | 'contains' | 'greater_than' | 'less_than';
}

// Escalation Action
export interface EscalationAction {
  type: 'transfer_to_human' | 'notify_supervisor' | 'create_ticket' | 'schedule_callback';
  target?: string;
  message?: string;
  metadata?: Record<string, any>;
}

// Support Ticket
export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  category: TicketCategory;
  subcategory?: string;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  attachments?: TicketAttachment[];
  assignedTo?: string;
  assignedTeam?: string;
  chatSessionId?: string;
  relatedTickets?: string[];
  resolution?: string;
  satisfactionRating?: number;
  feedback?: string;
  tags: string[];
  sla: SLA;
  timeline: TicketTimeline[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}

// Ticket Category
export enum TicketCategory {
  TECHNICAL = 'technical',
  BILLING = 'billing',
  PRODUCT = 'product',
  ORDER = 'order',
  RENTAL = 'rental',
  MAINTENANCE = 'maintenance',
  COMPLAINT = 'complaint',
  GENERAL = 'general'
}

// Ticket Priority
export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

// Ticket Status
export enum TicketStatus {
  NEW = 'new',
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING_CUSTOMER = 'pending_customer',
  PENDING_INTERNAL = 'pending_internal',
  ON_HOLD = 'on_hold',
  ESCALATED = 'escalated',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REOPENED = 'reopened'
}

// Ticket Attachment
export interface TicketAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

// SLA (Service Level Agreement)
export interface SLA {
  responseTime: number; // in minutes
  resolutionTime: number; // in hours
  responseDeadline: Date;
  resolutionDeadline: Date;
  breached: boolean;
  breachTime?: Date;
}

// Ticket Timeline
export interface TicketTimeline {
  id: string;
  action: string;
  description: string;
  performedBy: string;
  performedAt: Date;
  metadata?: Record<string, any>;
}

// Chat Analytics
export interface ChatAnalytics {
  overview: ChatOverview;
  aiPerformance: AIPerformance;
  userSatisfaction: UserSatisfaction;
  conversationMetrics: ConversationMetrics;
  intentAnalysis: IntentAnalysis;
}

// Chat Overview
export interface ChatOverview {
  totalSessions: number;
  activeSessions: number;
  totalMessages: number;
  uniqueUsers: number;
  averageSessionDuration: number; // in minutes
  peakHours: PeakHour[];
}

// Peak Hour
export interface PeakHour {
  hour: number;
  dayOfWeek: string;
  sessionCount: number;
  messageCount: number;
}

// AI Performance
export interface AIPerformance {
  totalInteractions: number;
  successfulResolutions: number;
  resolutionRate: number; // percentage
  averageConfidence: number;
  fallbackRate: number; // percentage
  escalationRate: number; // percentage
  averageResponseTime: number; // in seconds
  intentAccuracy: number; // percentage
}

// User Satisfaction
export interface UserSatisfaction {
  averageRating: number; // out of 5
  totalRatings: number;
  nps: number; // Net Promoter Score
  csat: number; // Customer Satisfaction Score
  feedbackSentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

// Conversation Metrics
export interface ConversationMetrics {
  averageMessagesPerSession: number;
  averageTurns: number;
  completionRate: number; // percentage
  abandonmentRate: number; // percentage
  repeatUserRate: number; // percentage
  topConversationPaths: ConversationPath[];
}

// Conversation Path
export interface ConversationPath {
  path: string[];
  count: number;
  averageDuration: number;
  completionRate: number;
}

// Intent Analysis
export interface IntentAnalysis {
  topIntents: IntentStat[];
  intentDistribution: Record<ChatbotIntent, number>;
  unrecognizedQueries: UnrecognizedQuery[];
  intentConfusion: IntentConfusion[];
}

// Intent Stat
export interface IntentStat {
  intent: ChatbotIntent;
  count: number;
  percentage: number;
  averageConfidence: number;
  successRate: number;
}

// Unrecognized Query
export interface UnrecognizedQuery {
  query: string;
  count: number;
  suggestedIntent?: ChatbotIntent;
  lastOccurrence: Date;
}

// Intent Confusion
export interface IntentConfusion {
  predictedIntent: ChatbotIntent;
  actualIntent: ChatbotIntent;
  count: number;
  examples: string[];
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

// Notification Type
export enum NotificationType {
  MESSAGE = 'message',
  ORDER_UPDATE = 'order_update',
  RENTAL_REMINDER = 'rental_reminder',
  MAINTENANCE_SCHEDULE = 'maintenance_schedule',
  PAYMENT_DUE = 'payment_due',
  PROMOTION = 'promotion',
  SYSTEM = 'system',
  ALERT = 'alert'
}