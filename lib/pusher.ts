import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
export const pusherServer = process.env.PUSHER_APP_ID ? new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
  useTLS: true,
}) : null;

// Client-side Pusher instance
export const getPusherClient = () => {
  if (typeof window === 'undefined') return null;
  
  if (!process.env.NEXT_PUBLIC_PUSHER_KEY) {
    console.warn('Pusher key not configured');
    return null;
  }

  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
    authEndpoint: '/api/pusher/auth',
    auth: {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    },
  });
};

// WebSocket fallback configuration
export const wsConfig = {
  url: process.env.NEXT_PUBLIC_WS_URL || 'wss://localhost:3001',
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000,
};