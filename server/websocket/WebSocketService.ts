import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const jwtSecret = process.env['JWT_SECRET'] || 'fallback-secret-change-in-production';
        const decoded = jwt.verify(token, jwtSecret) as any;
        
        // Verify user exists
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            userType: true,
            status: true,
          },
        });

        if (!user || user.status !== 'ACTIVE') {
          return next(new Error('Authentication error: Invalid user'));
        }

        socket.userId = user.id;
        socket.userInfo = user;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const userId = socket.userId;
      
      // Store user connection
      this.connectedUsers.set(userId, socket.id);
      
      // Join user to their personal room
      socket.join(`user:${userId}`);
      
      // Handle joining chat sessions
      socket.on('joinChat', async (sessionId: string) => {
        try {
          // Verify user has access to this chat session
          const participant = await prisma.chatParticipant.findFirst({
            where: {
              sessionId,
              userId,
            },
          });

          if (!participant) {
            socket.emit('error', { message: 'Access denied to chat session' });
            return;
          }

          // Join the chat room
          socket.join(`chat:${sessionId}`);
          
          // Notify others in the chat
          socket.to(`chat:${sessionId}`).emit('userJoined', {
            userId,
            userInfo: socket.userInfo,
          });

          socket.emit('joinedChat', { sessionId });
        } catch (error) {
          socket.emit('error', { message: 'Failed to join chat' });
        }
      });

      // Handle leaving chat sessions
      socket.on('leaveChat', (sessionId: string) => {
        socket.leave(`chat:${sessionId}`);
        socket.to(`chat:${sessionId}`).emit('userLeft', {
          userId,
          userInfo: socket.userInfo,
        });
      });

      // Handle sending messages
      socket.on('sendMessage', async (data: {
        sessionId: string;
        content: string;
        type?: string;
        metadata?: any;
      }) => {
        try {
          // Verify user has access to this chat session
          const participant = await prisma.chatParticipant.findFirst({
            where: {
              sessionId: data.sessionId,
              userId,
            },
          });

          if (!participant) {
            socket.emit('error', { message: 'Access denied to chat session' });
            return;
          }

          // Create message in database
          const message = await prisma.chatMessage.create({
            data: {
              sessionId: data.sessionId,
              senderId: userId,
              content: data.content,
              type: data.type || 'TEXT',
              metadata: data.metadata || {},
            },
            include: {
              session: {
                include: {
                  participants: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          firstName: true,
                          lastName: true,
                          profileImage: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });

          // Update session timestamp
          await prisma.chatSession.update({
            where: { id: data.sessionId },
            data: { updatedAt: new Date() },
          });

          // Format message for sending
          const formattedMessage = {
            id: message.id,
            content: message.content,
            type: message.type,
            senderId: message.senderId,
            sessionId: message.sessionId,
            createdAt: message.createdAt,
            isEdited: message.isEdited,
            metadata: message.metadata,
            sender: message.session.participants.find(p => p.userId === userId)?.user,
          };

          // Send to all users in the chat session
          this.io.to(`chat:${data.sessionId}`).emit('newMessage', formattedMessage);

          // Send push notification to offline users (implement later)
          await this.sendPushNotificationsToOfflineUsers(data.sessionId, formattedMessage);

        } catch (error) {
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing', (data: { sessionId: string; isTyping: boolean }) => {
        socket.to(`chat:${data.sessionId}`).emit('userTyping', {
          userId,
          userInfo: socket.userInfo,
          isTyping: data.isTyping,
        });
      });

      // Handle message reactions
      socket.on('reactToMessage', async (data: {
        messageId: string;
        reaction: string;
      }) => {
        try {
          // Implement message reactions logic here
          // For now, just broadcast to the session
          const message = await prisma.chatMessage.findUnique({
            where: { id: data.messageId },
            select: { sessionId: true },
          });

          if (message) {
            socket.to(`chat:${message.sessionId}`).emit('messageReaction', {
              messageId: data.messageId,
              userId,
              reaction: data.reaction,
            });
          }
        } catch (error) {
          socket.emit('error', { message: 'Failed to react to message' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.connectedUsers.delete(userId);
        
        // Notify all chat sessions this user was in
        this.notifyUserOffline(userId);
      });
    });
  }

  private async sendPushNotificationsToOfflineUsers(sessionId: string, message: any) {
    try {
      // Get all participants in the session
      const participants = await prisma.chatParticipant.findMany({
        where: { sessionId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Find offline users (not in connectedUsers)
      const offlineUsers = participants.filter(p => 
        p.userId !== message.senderId && 
        !this.connectedUsers.has(p.userId)
      );

      // Send notifications to offline users
      for (const participant of offlineUsers) {
        await this.sendPushNotification(participant.user, message);
      }
    } catch (error) {
      // Log error but don't throw
    }
  }

  private async sendPushNotification(user: any, message: any) {
    // Implement push notification logic (email, SMS, etc.)
    // For now, create a notification record
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'MESSAGE',
          title: 'New Message',
          message: `${message.sender?.firstName} sent you a message`,
          data: {
            messageId: message.id,
            sessionId: message.sessionId,
          },
        },
      });
    } catch (error) {
      // Log error but don't throw
    }
  }

  private notifyUserOffline(userId: string) {
    // Notify all relevant chat sessions that user went offline
    this.io.emit('userOffline', { userId });
  }

  // Public method to send notifications
  public sendNotificationToUser(userId: string, notification: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification', notification);
    }
  }

  // Public method to get online users
  public getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // Public method to check if user is online
  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}

// Extend Socket interface to include user info
declare module 'socket.io' {
  interface Socket {
    userId: string;
    userInfo: any;
  }
}