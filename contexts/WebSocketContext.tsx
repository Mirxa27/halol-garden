'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import io, { Socket } from 'socket.io-client';
import { toast } from '@/components/ui/use-toast';

interface WebSocketContextType {
  socket: Socket | null;
  connected: boolean;
  notifications: Notification[];
  onlineUsers: string[];
  sendMessage: (event: string, data: any) => void;
  subscribeToEvent: (event: string, callback: (data: any) => void) => void;
  unsubscribeFromEvent: (event: string, callback: (data: any) => void) => void;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    const newSocket = io(socketUrl, {
      auth: {
        token: session.user.id,
      },
      transports: ['websocket', 'polling'],
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnected(false);
    });

    // Notification events
    newSocket.on('notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      
      // Show toast for new notifications
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.type === 'error' ? 'destructive' : 'default',
      });

      // Play notification sound
      if ('Audio' in window) {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(() => {});
      }
    });

    // Online users
    newSocket.on('users:online', (users: string[]) => {
      setOnlineUsers(users);
    });

    newSocket.on('user:joined', (userId: string) => {
      setOnlineUsers(prev => [...prev, userId]);
    });

    newSocket.on('user:left', (userId: string) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [session]);

  const sendMessage = (event: string, data: any) => {
    if (socket && connected) {
      socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected');
    }
  };

  const subscribeToEvent = (event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const unsubscribeFromEvent = (event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        connected,
        notifications,
        onlineUsers,
        sendMessage,
        subscribeToEvent,
        unsubscribeFromEvent,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}