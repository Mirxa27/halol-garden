/**
 * WebSocket Server Implementation with Socket.io
 * Handles real-time communication for chat, notifications, and live updates
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { monitoring } from '../../client/lib/monitoring';
import { validateSchema } from '../../shared/validation/schemas';
import { messageSendSchema } from '../../shared/validation/schemas';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL!);
const pubClient = new Redis(process.env.REDIS_URL!);
const subClient = new Redis(process.env.REDIS_URL!);

// Types
interface AuthenticatedSocket extends Socket {
  userId?: string;
  userType?: string;
  sessionId?: string;
}

interface OnlineUser {
  userId: string;
  socketId: string;
  userType: string;
  connectedAt: Date;
  lastActivity: Date;
  status: 'online' | 'away' | 'busy' | 'offline';
}

interface ChatRoom {
  id: string;
  participants: string[];
  type: 'direct' | 'group' | 'support';
  createdAt: Date;
  lastActivity: Date;
}

interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

// WebSocket Server Class
export class WebSocketServer {
  private io: SocketServer;
  private onlineUsers: Map<string, OnlineUser> = new Map();
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socketIds
  private chatRooms: Map<string, ChatRoom> = new Map();
  private typingUsers: Map<string, Set<string>> = new Map(); // roomId -> userIds

  constructor(httpServer: HTTPServer) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
    });

    this.initialize();
    this.setupRedisSubscriptions();
  }

  private initialize() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = verify(token, process.env.JWT_SECRET!) as any;
        
        // Verify user exists
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, userType: true, status: true },
        });

        if (!user || user.status !== 'ACTIVE') {
          return next(new Error('Invalid user'));
        }

        socket.userId = user.id;
        socket.userType = user.userType;
        socket.sessionId = `${user.id}-${Date.now()}`;

        monitoring.info('WebSocket authentication successful', {
          userId: user.id,
          socketId: socket.id,
        });

        next();
      } catch (error) {
        monitoring.error('WebSocket authentication failed', error as Error);
        next(new Error('Authentication failed'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });
  }

  private async handleConnection(socket: AuthenticatedSocket) {
    const userId = socket.userId!;
    const socketId = socket.id;

    monitoring.info('WebSocket connection established', {
      userId,
      socketId,
      userType: socket.userType,
    });

    // Add to online users
    this.addOnlineUser(userId, socketId, socket.userType!);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Load and join user's chat rooms
    await this.loadUserChatRooms(socket);

    // Send pending notifications
    await this.sendPendingNotifications(socket);

    // Broadcast user online status
    this.broadcastUserStatus(userId, 'online');

    // Register event handlers
    this.registerEventHandlers(socket);

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      this.handleDisconnect(socket, reason);
    });
  }

  private registerEventHandlers(socket: AuthenticatedSocket) {
    // Chat events
    socket.on('chat:message', (data) => this.handleChatMessage(socket, data));
    socket.on('chat:typing', (data) => this.handleTyping(socket, data));
    socket.on('chat:stopTyping', (data) => this.handleStopTyping(socket, data));
    socket.on('chat:markRead', (data) => this.handleMarkRead(socket, data));
    socket.on('chat:createRoom', (data) => this.handleCreateRoom(socket, data));
    socket.on('chat:joinRoom', (data) => this.handleJoinRoom(socket, data));
    socket.on('chat:leaveRoom', (data) => this.handleLeaveRoom(socket, data));

    // Notification events
    socket.on('notification:read', (data) => this.handleNotificationRead(socket, data));
    socket.on('notification:readAll', () => this.handleNotificationReadAll(socket));

    // Presence events
    socket.on('presence:status', (data) => this.handlePresenceStatus(socket, data));
    socket.on('presence:getOnlineUsers', () => this.handleGetOnlineUsers(socket));

    // Order events
    socket.on('order:track', (data) => this.handleOrderTracking(socket, data));
    socket.on('order:update', (data) => this.handleOrderUpdate(socket, data));

    // Maintenance events
    socket.on('maintenance:subscribe', (data) => this.handleMaintenanceSubscribe(socket, data));
    socket.on('maintenance:update', (data) => this.handleMaintenanceUpdate(socket, data));

    // Analytics events
    socket.on('analytics:track', (data) => this.handleAnalyticsTrack(socket, data));
  }

  // ============ Chat Handlers ============

  private async handleChatMessage(socket: AuthenticatedSocket, data: any) {
    try {
      const validation = validateSchema(messageSendSchema, data);
      if (!validation.success) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      const { recipientId, content, type, attachments, replyToId } = validation.data;
      const senderId = socket.userId!;

      // Check if users can communicate
      const canCommunicate = await this.checkCommunicationPermission(senderId, recipientId);
      if (!canCommunicate) {
        socket.emit('error', { message: 'Communication not allowed' });
        return;
      }

      // Save message to database
      const message = await prisma.chatMessage.create({
        data: {
          senderId,
          recipientId,
          content,
          type,
          attachments,
          replyToId,
          status: 'SENT',
        },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, profileImage: true },
          },
          replyTo: true,
        },
      });

      // Emit to sender
      socket.emit('chat:messageSent', message);

      // Emit to recipient(s)
      const recipientSocketIds = this.userSockets.get(recipientId);
      if (recipientSocketIds) {
        recipientSocketIds.forEach(socketId => {
          this.io.to(socketId).emit('chat:messageReceived', message);
        });

        // Mark as delivered
        await prisma.chatMessage.update({
          where: { id: message.id },
          data: { status: 'DELIVERED', deliveredAt: new Date() },
        });
      }

      // Send push notification if recipient is offline
      if (!recipientSocketIds || recipientSocketIds.size === 0) {
        await this.sendPushNotification(recipientId, {
          title: `New message from ${message.sender.firstName}`,
          body: content.substring(0, 100),
          data: { messageId: message.id, senderId },
        });
      }

      monitoring.info('Chat message sent', {
        messageId: message.id,
        senderId,
        recipientId,
      });
    } catch (error) {
      monitoring.error('Failed to send chat message', error as Error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  private async handleTyping(socket: AuthenticatedSocket, data: { roomId: string }) {
    const userId = socket.userId!;
    const { roomId } = data;

    if (!this.typingUsers.has(roomId)) {
      this.typingUsers.set(roomId, new Set());
    }
    this.typingUsers.get(roomId)!.add(userId);

    socket.to(roomId).emit('chat:userTyping', { userId, roomId });
  }

  private async handleStopTyping(socket: AuthenticatedSocket, data: { roomId: string }) {
    const userId = socket.userId!;
    const { roomId } = data;

    if (this.typingUsers.has(roomId)) {
      this.typingUsers.get(roomId)!.delete(userId);
    }

    socket.to(roomId).emit('chat:userStoppedTyping', { userId, roomId });
  }

  private async handleMarkRead(socket: AuthenticatedSocket, data: { messageIds: string[] }) {
    try {
      const userId = socket.userId!;
      const { messageIds } = data;

      await prisma.chatMessage.updateMany({
        where: {
          id: { in: messageIds },
          recipientId: userId,
        },
        data: {
          status: 'READ',
          readAt: new Date(),
        },
      });

      socket.emit('chat:messagesMarkedRead', { messageIds });
    } catch (error) {
      monitoring.error('Failed to mark messages as read', error as Error);
    }
  }

  private async handleCreateRoom(socket: AuthenticatedSocket, data: any) {
    try {
      const { participantIds, type = 'group', name } = data;
      const creatorId = socket.userId!;

      // Create chat room in database
      const room = await prisma.chatRoom.create({
        data: {
          type,
          name,
          createdById: creatorId,
          participants: {
            create: [...participantIds, creatorId].map(id => ({
              userId: id,
            })),
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, profileImage: true },
              },
            },
          },
        },
      });

      // Add to local cache
      this.chatRooms.set(room.id, {
        id: room.id,
        participants: room.participants.map(p => p.userId),
        type: type as any,
        createdAt: room.createdAt,
        lastActivity: new Date(),
      });

      // Join all online participants to the room
      room.participants.forEach(participant => {
        const socketIds = this.userSockets.get(participant.userId);
        if (socketIds) {
          socketIds.forEach(socketId => {
            const participantSocket = this.io.sockets.sockets.get(socketId);
            if (participantSocket) {
              participantSocket.join(`room:${room.id}`);
            }
          });
        }
      });

      socket.emit('chat:roomCreated', room);
      socket.to(`room:${room.id}`).emit('chat:addedToRoom', room);
    } catch (error) {
      monitoring.error('Failed to create chat room', error as Error);
      socket.emit('error', { message: 'Failed to create room' });
    }
  }

  private async handleJoinRoom(socket: AuthenticatedSocket, data: { roomId: string }) {
    const { roomId } = data;
    socket.join(`room:${roomId}`);
    socket.emit('chat:joinedRoom', { roomId });
  }

  private async handleLeaveRoom(socket: AuthenticatedSocket, data: { roomId: string }) {
    const { roomId } = data;
    socket.leave(`room:${roomId}`);
    socket.emit('chat:leftRoom', { roomId });
  }

  // ============ Notification Handlers ============

  private async handleNotificationRead(socket: AuthenticatedSocket, data: { notificationId: string }) {
    try {
      const userId = socket.userId!;
      const { notificationId } = data;

      await prisma.notification.update({
        where: {
          id: notificationId,
          userId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      socket.emit('notification:markedRead', { notificationId });
    } catch (error) {
      monitoring.error('Failed to mark notification as read', error as Error);
    }
  }

  private async handleNotificationReadAll(socket: AuthenticatedSocket) {
    try {
      const userId = socket.userId!;

      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      socket.emit('notification:allMarkedRead');
    } catch (error) {
      monitoring.error('Failed to mark all notifications as read', error as Error);
    }
  }

  // ============ Presence Handlers ============

  private handlePresenceStatus(socket: AuthenticatedSocket, data: { status: string }) {
    const userId = socket.userId!;
    const { status } = data;

    const user = this.onlineUsers.get(userId);
    if (user) {
      user.status = status as any;
      user.lastActivity = new Date();
    }

    this.broadcastUserStatus(userId, status);
  }

  private handleGetOnlineUsers(socket: AuthenticatedSocket) {
    const onlineUsersList = Array.from(this.onlineUsers.values());
    socket.emit('presence:onlineUsers', onlineUsersList);
  }

  // ============ Order Handlers ============

  private async handleOrderTracking(socket: AuthenticatedSocket, data: { orderId: string }) {
    try {
      const { orderId } = data;
      const userId = socket.userId!;

      // Verify user has access to this order
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          OR: [
            { userId },
            { supplier: { userId } },
          ],
        },
      });

      if (!order) {
        socket.emit('error', { message: 'Order not found' });
        return;
      }

      // Subscribe to order updates
      socket.join(`order:${orderId}`);
      socket.emit('order:trackingStarted', { orderId });
    } catch (error) {
      monitoring.error('Failed to track order', error as Error);
    }
  }

  private async handleOrderUpdate(socket: AuthenticatedSocket, data: any) {
    try {
      const { orderId, status, location, notes } = data;

      // Emit update to all tracking this order
      this.io.to(`order:${orderId}`).emit('order:statusUpdate', {
        orderId,
        status,
        location,
        notes,
        timestamp: new Date(),
      });
    } catch (error) {
      monitoring.error('Failed to update order', error as Error);
    }
  }

  // ============ Maintenance Handlers ============

  private async handleMaintenanceSubscribe(socket: AuthenticatedSocket, data: { requestId: string }) {
    const { requestId } = data;
    socket.join(`maintenance:${requestId}`);
    socket.emit('maintenance:subscribed', { requestId });
  }

  private async handleMaintenanceUpdate(socket: AuthenticatedSocket, data: any) {
    const { requestId, status, notes, engineerId } = data;

    this.io.to(`maintenance:${requestId}`).emit('maintenance:statusUpdate', {
      requestId,
      status,
      notes,
      engineerId,
      timestamp: new Date(),
    });
  }

  // ============ Analytics Handlers ============

  private async handleAnalyticsTrack(socket: AuthenticatedSocket, data: any) {
    try {
      const userId = socket.userId!;
      
      await prisma.analyticsEvent.create({
        data: {
          userId,
          event: data.event,
          category: data.category,
          action: data.action,
          label: data.label,
          value: data.value,
          metadata: data.metadata,
          sessionId: socket.sessionId,
        },
      });

      monitoring.trackEvent(data.event, {
        userId,
        ...data.metadata,
      });
    } catch (error) {
      monitoring.error('Failed to track analytics event', error as Error);
    }
  }

  // ============ Helper Methods ============

  private addOnlineUser(userId: string, socketId: string, userType: string) {
    const now = new Date();
    
    this.onlineUsers.set(userId, {
      userId,
      socketId,
      userType,
      connectedAt: now,
      lastActivity: now,
      status: 'online',
    });

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  private removeOnlineUser(userId: string, socketId: string) {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds) {
      userSocketIds.delete(socketId);
      if (userSocketIds.size === 0) {
        this.userSockets.delete(userId);
        this.onlineUsers.delete(userId);
      }
    }
  }

  private async loadUserChatRooms(socket: AuthenticatedSocket) {
    try {
      const userId = socket.userId!;

      const rooms = await prisma.chatRoom.findMany({
        where: {
          participants: {
            some: { userId },
          },
        },
        include: {
          participants: true,
        },
      });

      rooms.forEach(room => {
        socket.join(`room:${room.id}`);
        
        this.chatRooms.set(room.id, {
          id: room.id,
          participants: room.participants.map(p => p.userId),
          type: room.type as any,
          createdAt: room.createdAt,
          lastActivity: room.updatedAt,
        });
      });

      socket.emit('chat:roomsLoaded', rooms);
    } catch (error) {
      monitoring.error('Failed to load user chat rooms', error as Error);
    }
  }

  private async sendPendingNotifications(socket: AuthenticatedSocket) {
    try {
      const userId = socket.userId!;

      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          isRead: false,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      if (notifications.length > 0) {
        socket.emit('notification:pending', notifications);
      }
    } catch (error) {
      monitoring.error('Failed to send pending notifications', error as Error);
    }
  }

  private broadcastUserStatus(userId: string, status: string) {
    // Get user's contacts
    this.io.emit('presence:userStatusChanged', { userId, status });
  }

  private async checkCommunicationPermission(senderId: string, recipientId: string): Promise<boolean> {
    // Implement business logic to check if users can communicate
    // For example, check if they are in the same organization, have a business relationship, etc.
    return true;
  }

  private async sendPushNotification(userId: string, notification: any) {
    // Implement push notification logic
    // This could use Firebase Cloud Messaging, Apple Push Notification Service, etc.
    monitoring.info('Push notification queued', { userId, notification });
  }

  private handleDisconnect(socket: AuthenticatedSocket, reason: string) {
    const userId = socket.userId!;
    const socketId = socket.id;

    monitoring.info('WebSocket disconnected', {
      userId,
      socketId,
      reason,
    });

    this.removeOnlineUser(userId, socketId);

    // Clear typing status
    this.typingUsers.forEach((users, roomId) => {
      if (users.has(userId)) {
        users.delete(userId);
        socket.to(roomId).emit('chat:userStoppedTyping', { userId, roomId });
      }
    });

    // Broadcast offline status if no more connections
    if (!this.userSockets.has(userId)) {
      this.broadcastUserStatus(userId, 'offline');
    }
  }

  // ============ Redis Pub/Sub for Scaling ============

  private setupRedisSubscriptions() {
    subClient.subscribe('chat:message', 'notification:send', 'order:update');

    subClient.on('message', async (channel, message) => {
      const data = JSON.parse(message);

      switch (channel) {
        case 'chat:message':
          await this.handleRedisMessage(data);
          break;
        case 'notification:send':
          await this.handleRedisNotification(data);
          break;
        case 'order:update':
          await this.handleRedisOrderUpdate(data);
          break;
      }
    });
  }

  private async handleRedisMessage(data: any) {
    const { recipientId, message } = data;
    const socketIds = this.userSockets.get(recipientId);
    
    if (socketIds) {
      socketIds.forEach(socketId => {
        this.io.to(socketId).emit('chat:messageReceived', message);
      });
    }
  }

  private async handleRedisNotification(data: any) {
    const { userId, notification } = data;
    const socketIds = this.userSockets.get(userId);
    
    if (socketIds) {
      socketIds.forEach(socketId => {
        this.io.to(socketId).emit('notification:new', notification);
      });
    }
  }

  private async handleRedisOrderUpdate(data: any) {
    const { orderId, update } = data;
    this.io.to(`order:${orderId}`).emit('order:statusUpdate', update);
  }

  // ============ Public Methods ============

  public async sendNotification(userId: string, notification: NotificationPayload) {
    const socketIds = this.userSockets.get(userId);
    
    if (socketIds) {
      socketIds.forEach(socketId => {
        this.io.to(socketId).emit('notification:new', notification);
      });
    } else {
      // User is offline, queue for later or send push notification
      await this.sendPushNotification(userId, notification);
    }

    // Publish to Redis for other server instances
    pubClient.publish('notification:send', JSON.stringify({ userId, notification }));
  }

  public async broadcastToRole(userType: string, event: string, data: any) {
    this.onlineUsers.forEach(user => {
      if (user.userType === userType) {
        const socketIds = this.userSockets.get(user.userId);
        if (socketIds) {
          socketIds.forEach(socketId => {
            this.io.to(socketId).emit(event, data);
          });
        }
      }
    });
  }

  public getOnlineUsersCount(): number {
    return this.onlineUsers.size;
  }

  public getActiveRoomsCount(): number {
    return this.chatRooms.size;
  }

  public async shutdown() {
    monitoring.info('Shutting down WebSocket server');
    
    // Close all connections
    this.io.disconnectSockets(true);
    
    // Close Redis connections
    await redis.quit();
    await pubClient.quit();
    await subClient.quit();
    
    // Close Prisma connection
    await prisma.$disconnect();
  }
}

// Export singleton instance
let wsServer: WebSocketServer | null = null;

export const initializeWebSocket = (httpServer: HTTPServer): WebSocketServer => {
  if (!wsServer) {
    wsServer = new WebSocketServer(httpServer);
  }
  return wsServer;
};

export const getWebSocketServer = (): WebSocketServer | null => {
  return wsServer;
};

export default WebSocketServer;