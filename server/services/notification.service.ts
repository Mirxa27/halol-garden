import { prisma } from '../config/database';
import { CacheService, CacheKeys, CacheTTL } from '../config/redis';
import { pusherServer } from '@/lib/pusher';
import { EmailService } from './email.service';
import { z } from 'zod';

// Notification types
export enum NotificationType {
  // Order related
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  
  // Payment related
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
  
  // Product related
  PRODUCT_APPROVED = 'PRODUCT_APPROVED',
  PRODUCT_REJECTED = 'PRODUCT_REJECTED',
  LOW_STOCK_ALERT = 'LOW_STOCK_ALERT',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  PRICE_DROP = 'PRICE_DROP',
  
  // Message related
  NEW_MESSAGE = 'NEW_MESSAGE',
  MESSAGE_REPLY = 'MESSAGE_REPLY',
  
  // System related
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  MAINTENANCE_SCHEDULED = 'MAINTENANCE_SCHEDULED',
  SECURITY_ALERT = 'SECURITY_ALERT',
  
  // User related
  WELCOME = 'WELCOME',
  ACCOUNT_VERIFIED = 'ACCOUNT_VERIFIED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  
  // Review related
  NEW_REVIEW = 'NEW_REVIEW',
  REVIEW_REPLY = 'REVIEW_REPLY',
  
  // Promotion related
  PROMOTION_STARTED = 'PROMOTION_STARTED',
  COUPON_EXPIRING = 'COUPON_EXPIRING'
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  WEBHOOK = 'WEBHOOK'
}

// Validation schemas
const CreateNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.nativeEnum(NotificationType),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  priority: z.nativeEnum(NotificationPriority).default(NotificationPriority.MEDIUM),
  channels: z.array(z.nativeEnum(NotificationChannel)).default([NotificationChannel.IN_APP]),
  data: z.record(z.any()).optional(),
  actionUrl: z.string().url().optional(),
  actionLabel: z.string().optional(),
  expiresAt: z.date().optional(),
  metadata: z.record(z.any()).optional()
});

const BulkNotificationSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
  type: z.nativeEnum(NotificationType),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  priority: z.nativeEnum(NotificationPriority).default(NotificationPriority.MEDIUM),
  channels: z.array(z.nativeEnum(NotificationChannel)).default([NotificationChannel.IN_APP]),
  data: z.record(z.any()).optional()
});

export class NotificationService {
  /**
   * Create a single notification
   */
  static async create(data: z.infer<typeof CreateNotificationSchema>) {
    const validatedData = CreateNotificationSchema.parse(data);
    
    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId: validatedData.userId,
        type: validatedData.type,
        title: validatedData.title,
        message: validatedData.message,
        priority: validatedData.priority,
        data: validatedData.data || {},
        actionUrl: validatedData.actionUrl,
        actionLabel: validatedData.actionLabel,
        expiresAt: validatedData.expiresAt,
        metadata: validatedData.metadata || {},
        isRead: false
      }
    });

    // Send through requested channels
    const promises = validatedData.channels.map(channel => 
      this.sendThroughChannel(notification, channel)
    );
    
    await Promise.allSettled(promises);

    // Update unread count in cache
    await this.updateUnreadCount(validatedData.userId);

    return notification;
  }

  /**
   * Create bulk notifications
   */
  static async createBulk(data: z.infer<typeof BulkNotificationSchema>) {
    const validatedData = BulkNotificationSchema.parse(data);
    
    const notifications = await prisma.$transaction(async (tx) => {
      const created = await Promise.all(
        validatedData.userIds.map(userId =>
          tx.notification.create({
            data: {
              userId,
              type: validatedData.type,
              title: validatedData.title,
              message: validatedData.message,
              priority: validatedData.priority,
              data: validatedData.data || {},
              isRead: false
            }
          })
        )
      );
      
      return created;
    });

    // Send through channels (async, don't wait)
    Promise.allSettled(
      notifications.flatMap(notification =>
        validatedData.channels.map(channel =>
          this.sendThroughChannel(notification, channel)
        )
      )
    );

    // Update unread counts
    await Promise.all(
      validatedData.userIds.map(userId => this.updateUnreadCount(userId))
    );

    return notifications;
  }

  /**
   * Send notification through specific channel
   */
  private static async sendThroughChannel(
    notification: any,
    channel: NotificationChannel
  ): Promise<void> {
    try {
      switch (channel) {
        case NotificationChannel.IN_APP:
          await this.sendInAppNotification(notification);
          break;
        
        case NotificationChannel.EMAIL:
          await this.sendEmailNotification(notification);
          break;
        
        case NotificationChannel.SMS:
          await this.sendSMSNotification(notification);
          break;
        
        case NotificationChannel.PUSH:
          await this.sendPushNotification(notification);
          break;
        
        case NotificationChannel.WEBHOOK:
          await this.sendWebhookNotification(notification);
          break;
      }
    } catch (error) {
      console.error(`Failed to send notification through ${channel}:`, error);
      // Log but don't throw - notification already saved in DB
    }
  }

  /**
   * Send in-app notification (real-time via Pusher)
   */
  private static async sendInAppNotification(notification: any): Promise<void> {
    if (!pusherServer) return;

    try {
      await pusherServer.trigger(
        `user-${notification.userId}`,
        'new-notification',
        {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          data: notification.data,
          actionUrl: notification.actionUrl,
          actionLabel: notification.actionLabel,
          createdAt: notification.createdAt
        }
      );
    } catch (error) {
      console.error('Pusher notification failed:', error);
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(notification: any): Promise<void> {
    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: notification.userId },
      select: { email: true, firstName: true, lastName: true }
    });

    if (!user) return;

    // Determine email template based on notification type
    const template = this.getEmailTemplate(notification.type);
    
    await EmailService.send({
      to: user.email,
      subject: notification.title,
      template,
      data: {
        user,
        notification,
        actionUrl: notification.actionUrl || `${process.env.NEXT_PUBLIC_APP_URL}/notifications`
      }
    });
  }

  /**
   * Send SMS notification
   */
  private static async sendSMSNotification(notification: any): Promise<void> {
    // Get user phone
    const user = await prisma.user.findUnique({
      where: { id: notification.userId },
      select: { phoneNumber: true }
    });

    if (!user?.phoneNumber) return;

    // SMS implementation would go here
    // For now, just log it
    console.log(`SMS to ${user.phoneNumber}: ${notification.message}`);
    
    // In production, integrate with SMS service like Twilio:
    // await twilioClient.messages.create({
    //   body: notification.message,
    //   to: user.phoneNumber,
    //   from: process.env.TWILIO_PHONE_NUMBER
    // });
  }

  /**
   * Send push notification
   */
  private static async sendPushNotification(notification: any): Promise<void> {
    // Get user's push tokens
    const pushTokens = await prisma.pushToken.findMany({
      where: { 
        userId: notification.userId,
        isActive: true
      }
    });

    if (pushTokens.length === 0) return;

    // Push notification implementation would go here
    // For now, just log it
    console.log(`Push notification to ${pushTokens.length} devices: ${notification.title}`);
    
    // In production, integrate with FCM or similar:
    // await fcm.sendMulticast({
    //   tokens: pushTokens.map(t => t.token),
    //   notification: {
    //     title: notification.title,
    //     body: notification.message
    //   },
    //   data: notification.data
    // });
  }

  /**
   * Send webhook notification
   */
  private static async sendWebhookNotification(notification: any): Promise<void> {
    // Get user's webhook configurations
    const webhooks = await prisma.webhookConfig.findMany({
      where: {
        userId: notification.userId,
        isActive: true,
        events: {
          has: notification.type
        }
      }
    });

    for (const webhook of webhooks) {
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': webhook.secret || '',
            'X-Notification-Type': notification.type
          },
          body: JSON.stringify({
            event: notification.type,
            notification,
            timestamp: new Date().toISOString()
          })
        });

        if (!response.ok) {
          console.error(`Webhook failed for ${webhook.url}: ${response.status}`);
        }
      } catch (error) {
        console.error(`Webhook error for ${webhook.url}:`, error);
      }
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId // Ensure user owns the notification
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    // Update unread count
    await this.updateUnreadCount(userId);
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    // Clear unread count
    await CacheService.set(
      `${CacheKeys.NOTIFICATIONS}unread:${userId}`,
      0,
      CacheTTL.MEDIUM
    );
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      type?: NotificationType;
      priority?: NotificationPriority;
    } = {}
  ) {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type,
      priority
    } = options;

    const where: any = { userId };
    
    if (unreadOnly) {
      where.isRead = false;
    }
    
    if (type) {
      where.type = type;
    }
    
    if (priority) {
      where.priority = priority;
    }

    // Exclude expired notifications
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } }
    ];

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { isRead: 'asc' },
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.notification.count({ where })
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    // Check cache first
    const cached = await CacheService.get<number>(
      `${CacheKeys.NOTIFICATIONS}unread:${userId}`
    );
    
    if (cached !== null) {
      return cached;
    }

    // Get from database
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    // Cache the result
    await CacheService.set(
      `${CacheKeys.NOTIFICATIONS}unread:${userId}`,
      count,
      CacheTTL.MEDIUM
    );

    return count;
  }

  /**
   * Update unread count in cache
   */
  private static async updateUnreadCount(userId: string): Promise<void> {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    await CacheService.set(
      `${CacheKeys.NOTIFICATIONS}unread:${userId}`,
      count,
      CacheTTL.MEDIUM
    );

    // Send real-time update
    if (pusherServer) {
      await pusherServer.trigger(
        `user-${userId}`,
        'unread-count-updated',
        { count }
      );
    }
  }

  /**
   * Delete notification
   */
  static async delete(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.delete({
      where: {
        id: notificationId,
        userId // Ensure user owns the notification
      }
    });

    await this.updateUnreadCount(userId);
  }

  /**
   * Delete old notifications
   */
  static async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        OR: [
          { createdAt: { lt: cutoffDate } },
          { expiresAt: { lt: new Date() } }
        ]
      }
    });

    return result.count;
  }

  /**
   * Get email template based on notification type
   */
  private static getEmailTemplate(type: NotificationType): string {
    const templates: Record<NotificationType, string> = {
      [NotificationType.ORDER_CREATED]: 'order-confirmation',
      [NotificationType.ORDER_SHIPPED]: 'order-shipped',
      [NotificationType.ORDER_DELIVERED]: 'order-delivered',
      [NotificationType.ORDER_CANCELLED]: 'order-cancelled',
      [NotificationType.PAYMENT_RECEIVED]: 'payment-received',
      [NotificationType.PAYMENT_FAILED]: 'payment-failed',
      [NotificationType.REFUND_PROCESSED]: 'refund-processed',
      [NotificationType.PRODUCT_APPROVED]: 'product-approved',
      [NotificationType.PRODUCT_REJECTED]: 'product-rejected',
      [NotificationType.LOW_STOCK_ALERT]: 'low-stock-alert',
      [NotificationType.NEW_MESSAGE]: 'new-message',
      [NotificationType.WELCOME]: 'welcome',
      [NotificationType.ACCOUNT_VERIFIED]: 'account-verified',
      [NotificationType.PASSWORD_CHANGED]: 'password-changed',
      [NotificationType.NEW_REVIEW]: 'new-review',
      [NotificationType.SYSTEM_ANNOUNCEMENT]: 'system-announcement',
      [NotificationType.PROMOTION_STARTED]: 'promotion-started',
      [NotificationType.COUPON_EXPIRING]: 'coupon-expiring',
      [NotificationType.OUT_OF_STOCK]: 'out-of-stock',
      [NotificationType.PRICE_DROP]: 'price-drop',
      [NotificationType.MESSAGE_REPLY]: 'message-reply',
      [NotificationType.MAINTENANCE_SCHEDULED]: 'maintenance-scheduled',
      [NotificationType.SECURITY_ALERT]: 'security-alert',
      [NotificationType.PROFILE_UPDATED]: 'profile-updated',
      [NotificationType.REVIEW_REPLY]: 'review-reply'
    };

    return templates[type] || 'default-notification';
  }

  /**
   * Get notification preferences for a user
   */
  static async getUserPreferences(userId: string) {
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    if (!preferences) {
      // Return default preferences
      return {
        userId,
        email: true,
        sms: false,
        push: true,
        inApp: true,
        types: Object.values(NotificationType),
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        }
      };
    }

    return preferences;
  }

  /**
   * Update notification preferences
   */
  static async updateUserPreferences(
    userId: string,
    preferences: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
      inApp?: boolean;
      types?: NotificationType[];
      quietHours?: {
        enabled: boolean;
        start: string;
        end: string;
      };
    }
  ) {
    return await prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...preferences
      },
      update: preferences
    });
  }
}

export default NotificationService;