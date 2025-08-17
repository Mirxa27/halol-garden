/**
 * React Hook for WebSocket Integration
 * Provides real-time communication capabilities with automatic reconnection and state management
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../lib/auth';
import { monitoring } from '../lib/monitoring';
import { cache } from '../lib/cache';

// Types
export interface WebSocketConfig {
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  transports?: string[];
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'PRODUCT_LINK' | 'ORDER_LINK';
  attachments?: string[];
  status: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ';
  timestamp: Date;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  replyTo?: Message;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  isRead: boolean;
}

export interface OnlineUser {
  userId: string;
  userType: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastActivity: Date;
}

export interface ChatRoom {
  id: string;
  name?: string;
  type: 'direct' | 'group' | 'support';
  participants: any[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: Error | null;
  reconnectAttempt: number;
}

interface WebSocketEvents {
  // Chat events
  onMessage: (message: Message) => void;
  onMessageSent: (message: Message) => void;
  onMessageDelivered: (messageId: string) => void;
  onMessageRead: (messageId: string) => void;
  onTyping: (data: { userId: string; roomId: string }) => void;
  onStopTyping: (data: { userId: string; roomId: string }) => void;
  onRoomCreated: (room: ChatRoom) => void;
  onAddedToRoom: (room: ChatRoom) => void;
  
  // Notification events
  onNotification: (notification: Notification) => void;
  onNotificationRead: (notificationId: string) => void;
  
  // Presence events
  onUserStatusChanged: (data: { userId: string; status: string }) => void;
  onOnlineUsers: (users: OnlineUser[]) => void;
  
  // Order events
  onOrderUpdate: (data: any) => void;
  
  // Maintenance events
  onMaintenanceUpdate: (data: any) => void;
}

// WebSocket Hook
export function useWebSocket(
  config: WebSocketConfig = {},
  events: Partial<WebSocketEvents> = {}
) {
  const { token, isAuthenticated } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    reconnectAttempt: 0,
  });

  const [messages, setMessages] = useState<Map<string, Message[]>>(new Map());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<string>>>(new Map());
  const [unreadCount, setUnreadCount] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection
  const connect = useCallback(() => {
    if (!isAuthenticated || !token) {
      monitoring.warn('Cannot connect WebSocket: not authenticated');
      return;
    }

    if (socketRef.current?.connected) {
      monitoring.info('WebSocket already connected');
      return;
    }

    setState(prev => ({ ...prev, connecting: true, error: null }));

    const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
      auth: { token },
      transports: config.transports || ['websocket', 'polling'],
      reconnection: config.reconnection !== false,
      reconnectionAttempts: config.reconnectionAttempts || 5,
      reconnectionDelay: config.reconnectionDelay || 1000,
    });

    // Connection events
    socketInstance.on('connect', () => {
      monitoring.info('WebSocket connected', { socketId: socketInstance.id });
      setState({
        connected: true,
        connecting: false,
        error: null,
        reconnectAttempt: 0,
      });
    });

    socketInstance.on('disconnect', (reason) => {
      monitoring.info('WebSocket disconnected', { reason });
      setState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
      }));
    });

    socketInstance.on('connect_error', (error) => {
      monitoring.error('WebSocket connection error', error);
      setState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        error,
      }));
    });

    socketInstance.on('reconnect_attempt', (attempt) => {
      setState(prev => ({
        ...prev,
        reconnectAttempt: attempt,
      }));
    });

    // Chat events
    socketInstance.on('chat:messageReceived', (message: Message) => {
      handleMessageReceived(message);
      events.onMessage?.(message);
    });

    socketInstance.on('chat:messageSent', (message: Message) => {
      handleMessageSent(message);
      events.onMessageSent?.(message);
    });

    socketInstance.on('chat:messageDelivered', (data: { messageId: string }) => {
      updateMessageStatus(data.messageId, 'DELIVERED');
      events.onMessageDelivered?.(data.messageId);
    });

    socketInstance.on('chat:messagesMarkedRead', (data: { messageIds: string[] }) => {
      data.messageIds.forEach(id => {
        updateMessageStatus(id, 'READ');
        events.onMessageRead?.(id);
      });
    });

    socketInstance.on('chat:userTyping', (data) => {
      handleUserTyping(data);
      events.onTyping?.(data);
    });

    socketInstance.on('chat:userStoppedTyping', (data) => {
      handleUserStoppedTyping(data);
      events.onStopTyping?.(data);
    });

    socketInstance.on('chat:roomsLoaded', (rooms: ChatRoom[]) => {
      setChatRooms(rooms);
    });

    socketInstance.on('chat:roomCreated', (room: ChatRoom) => {
      setChatRooms(prev => [...prev, room]);
      events.onRoomCreated?.(room);
    });

    socketInstance.on('chat:addedToRoom', (room: ChatRoom) => {
      setChatRooms(prev => [...prev, room]);
      events.onAddedToRoom?.(room);
    });

    // Notification events
    socketInstance.on('notification:new', (notification: Notification) => {
      handleNewNotification(notification);
      events.onNotification?.(notification);
    });

    socketInstance.on('notification:pending', (pendingNotifications: Notification[]) => {
      setNotifications(pendingNotifications);
      updateUnreadCount(pendingNotifications);
    });

    socketInstance.on('notification:markedRead', (data: { notificationId: string }) => {
      markNotificationRead(data.notificationId);
      events.onNotificationRead?.(data.notificationId);
    });

    socketInstance.on('notification:allMarkedRead', () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    });

    // Presence events
    socketInstance.on('presence:userStatusChanged', (data) => {
      updateUserStatus(data);
      events.onUserStatusChanged?.(data);
    });

    socketInstance.on('presence:onlineUsers', (users: OnlineUser[]) => {
      setOnlineUsers(users);
      events.onOnlineUsers?.(users);
    });

    // Order events
    socketInstance.on('order:statusUpdate', (data) => {
      events.onOrderUpdate?.(data);
    });

    // Maintenance events
    socketInstance.on('maintenance:statusUpdate', (data) => {
      events.onMaintenanceUpdate?.(data);
    });

    // Error handling
    socketInstance.on('error', (error) => {
      monitoring.error('WebSocket error', error);
      setState(prev => ({ ...prev, error }));
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);
  }, [isAuthenticated, token, config, events]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setState({
        connected: false,
        connecting: false,
        error: null,
        reconnectAttempt: 0,
      });
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (
    recipientId: string,
    content: string,
    type: Message['type'] = 'TEXT',
    attachments?: string[],
    replyToId?: string
  ): Promise<void> => {
    if (!socketRef.current?.connected) {
      throw new Error('WebSocket not connected');
    }

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      senderId: 'current-user', // This should come from auth store
      recipientId,
      content,
      type,
      attachments,
      status: 'SENDING',
      timestamp: new Date(),
    };

    // Optimistically add message
    handleMessageSent(tempMessage);

    socketRef.current.emit('chat:message', {
      recipientId,
      content,
      type,
      attachments,
      replyToId,
    });
  }, []);

  // Mark messages as read
  const markMessagesRead = useCallback((messageIds: string[]) => {
    if (!socketRef.current?.connected) return;
    
    socketRef.current.emit('chat:markRead', { messageIds });
  }, []);

  // Typing indicators
  const startTyping = useCallback((roomId: string) => {
    if (!socketRef.current?.connected) return;
    
    socketRef.current.emit('chat:typing', { roomId });
  }, []);

  const stopTyping = useCallback((roomId: string) => {
    if (!socketRef.current?.connected) return;
    
    socketRef.current.emit('chat:stopTyping', { roomId });
  }, []);

  // Create chat room
  const createRoom = useCallback((participantIds: string[], type: ChatRoom['type'] = 'group', name?: string) => {
    if (!socketRef.current?.connected) {
      throw new Error('WebSocket not connected');
    }

    socketRef.current.emit('chat:createRoom', {
      participantIds,
      type,
      name,
    });
  }, []);

  // Join/Leave room
  const joinRoom = useCallback((roomId: string) => {
    if (!socketRef.current?.connected) return;
    
    socketRef.current.emit('chat:joinRoom', { roomId });
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    if (!socketRef.current?.connected) return;
    
    socketRef.current.emit('chat:leaveRoom', { roomId });
  }, []);

  // Mark notification as read
  const markNotificationRead = useCallback((notificationId: string) => {
    if (!socketRef.current?.connected) return;
    
    socketRef.current.emit('notification:read', { notificationId });
    
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    
    updateUnreadCount();
  }, []);

  // Mark all notifications as read
  const markAllNotificationsRead = useCallback(() => {
    if (!socketRef.current?.connected) return;
    
    socketRef.current.emit('notification:readAll');
  }, []);

  // Update presence status
  const updateStatus = useCallback((status: OnlineUser['status']) => {
    if (!socketRef.current?.connected) return;
    
    socketRef.current.emit('presence:status', { status });
  }, []);

  // Get online users
  const getOnlineUsers = useCallback(() => {
    if (!socketRef.current?.connected) return;
    
    socketRef.current.emit('presence:getOnlineUsers');
  }, []);

  // Track order
  const trackOrder = useCallback((orderId: string) => {
    if (!socketRef.current?.connected) return;
    
    socketRef.current.emit('order:track', { orderId });
  }, []);

  // Subscribe to maintenance updates
  const subscribeMaintenance = useCallback((requestId: string) => {
    if (!socketRef.current?.connected) return;
    
    socketRef.current.emit('maintenance:subscribe', { requestId });
  }, []);

  // Helper functions
  const handleMessageReceived = (message: Message) => {
    setMessages(prev => {
      const roomMessages = prev.get(message.senderId) || [];
      return new Map(prev).set(message.senderId, [...roomMessages, message]);
    });

    // Update unread count for room
    setChatRooms(prev => 
      prev.map(room => {
        if (room.participants.some(p => p.id === message.senderId)) {
          return { ...room, unreadCount: room.unreadCount + 1, lastMessage: message };
        }
        return room;
      })
    );

    // Cache message
    cache.set(`message:${message.id}`, message, { ttl: 24 * 60 * 60 * 1000 });
  };

  const handleMessageSent = (message: Message) => {
    setMessages(prev => {
      const roomMessages = prev.get(message.recipientId) || [];
      return new Map(prev).set(message.recipientId, [...roomMessages, message]);
    });
  };

  const updateMessageStatus = (messageId: string, status: Message['status']) => {
    setMessages(prev => {
      const newMessages = new Map(prev);
      newMessages.forEach((messages, key) => {
        const updatedMessages = messages.map(m => 
          m.id === messageId ? { ...m, status } : m
        );
        newMessages.set(key, updatedMessages);
      });
      return newMessages;
    });
  };

  const handleUserTyping = (data: { userId: string; roomId: string }) => {
    setTypingUsers(prev => {
      const newTyping = new Map(prev);
      const roomTyping = newTyping.get(data.roomId) || new Set();
      roomTyping.add(data.userId);
      newTyping.set(data.roomId, roomTyping);
      return newTyping;
    });
  };

  const handleUserStoppedTyping = (data: { userId: string; roomId: string }) => {
    setTypingUsers(prev => {
      const newTyping = new Map(prev);
      const roomTyping = newTyping.get(data.roomId);
      if (roomTyping) {
        roomTyping.delete(data.userId);
        if (roomTyping.size === 0) {
          newTyping.delete(data.roomId);
        } else {
          newTyping.set(data.roomId, roomTyping);
        }
      }
      return newTyping;
    });
  };

  const handleNewNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }

    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        tag: notification.id,
      });
    }
  };

  const updateUserStatus = (data: { userId: string; status: string }) => {
    setOnlineUsers(prev => 
      prev.map(user => 
        user.userId === data.userId 
          ? { ...user, status: data.status as OnlineUser['status'] }
          : user
      )
    );
  };

  const updateUnreadCount = (notificationList?: Notification[]) => {
    const list = notificationList || notifications;
    const count = list.filter(n => !n.isRead).length;
    setUnreadCount(count);
  };

  // Auto-connect on mount if configured
  useEffect(() => {
    if (config.autoConnect !== false && isAuthenticated) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [isAuthenticated]);

  return {
    // Connection state
    socket,
    connected: state.connected,
    connecting: state.connecting,
    error: state.error,
    reconnectAttempt: state.reconnectAttempt,

    // Data
    messages,
    notifications,
    onlineUsers,
    chatRooms,
    typingUsers,
    unreadCount,

    // Connection methods
    connect,
    disconnect,

    // Chat methods
    sendMessage,
    markMessagesRead,
    startTyping,
    stopTyping,
    createRoom,
    joinRoom,
    leaveRoom,

    // Notification methods
    markNotificationRead,
    markAllNotificationsRead,

    // Presence methods
    updateStatus,
    getOnlineUsers,

    // Order/Maintenance methods
    trackOrder,
    subscribeMaintenance,
  };
}

// Convenience hooks for specific features
export function useChat(recipientId?: string) {
  const ws = useWebSocket();
  const messages = recipientId ? ws.messages.get(recipientId) || [] : [];
  const typingUsers = recipientId ? ws.typingUsers.get(recipientId) : undefined;

  return {
    messages,
    typingUsers: typingUsers ? Array.from(typingUsers) : [],
    sendMessage: (content: string, type?: Message['type'], attachments?: string[]) => 
      recipientId ? ws.sendMessage(recipientId, content, type, attachments) : Promise.reject('No recipient'),
    markRead: (messageIds: string[]) => ws.markMessagesRead(messageIds),
    startTyping: () => recipientId && ws.startTyping(recipientId),
    stopTyping: () => recipientId && ws.stopTyping(recipientId),
  };
}

export function useNotifications() {
  const ws = useWebSocket();
  
  return {
    notifications: ws.notifications,
    unreadCount: ws.unreadCount,
    markRead: ws.markNotificationRead,
    markAllRead: ws.markAllNotificationsRead,
  };
}

export function usePresence() {
  const ws = useWebSocket();
  
  return {
    onlineUsers: ws.onlineUsers,
    updateStatus: ws.updateStatus,
    getOnlineUsers: ws.getOnlineUsers,
    isUserOnline: (userId: string) => ws.onlineUsers.some(u => u.userId === userId && u.status === 'online'),
  };
}

export default useWebSocket;