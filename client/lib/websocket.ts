import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  id: string;
  content: string;
  type: string;
  senderId: string;
  sessionId: string;
  createdAt: string;
  isEdited: boolean;
  metadata?: any;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
}

interface SocketEvents {
  // Connection events
  connect: () => void;
  disconnect: () => void;
  
  // Chat events
  joinedChat: (data: { sessionId: string }) => void;
  newMessage: (message: ChatMessage) => void;
  userJoined: (data: { userId: string; userInfo: any }) => void;
  userLeft: (data: { userId: string; userInfo: any }) => void;
  userTyping: (data: { userId: string; userInfo: any; isTyping: boolean }) => void;
  userOffline: (data: { userId: string }) => void;
  
  // Notifications
  notification: (notification: any) => void;
  
  // Error handling
  error: (error: { message: string }) => void;
}

export class WebSocketClient {
  private socket: Socket | null = null;
  private token: string | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    // Initialize token from localStorage or session
    this.token = this.getAuthToken();
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    }
    return null;
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected || !this.token) {
        if (this.isConnected) resolve();
        else reject(new Error('No authentication token available'));
        return;
      }

      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
      
      this.socket = io(socketUrl, {
        auth: {
          token: this.token,
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connect');
        resolve();
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        this.emit('disconnect');
        this.handleReconnection();
      });

      this.socket.on('connect_error', (error) => {
        reject(error);
      });

      // Set up event forwarding
      this.setupEventForwarding();
    });
  }

  private setupEventForwarding() {
    if (!this.socket) return;

    const events = [
      'joinedChat',
      'newMessage',
      'userJoined',
      'userLeft',
      'userTyping',
      'userOffline',
      'notification',
      'error',
    ];

    events.forEach(event => {
      this.socket?.on(event, (data) => {
        this.emit(event, data);
      });
    });
  }

  private handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      setTimeout(() => {
        this.connect().catch(() => {
          // Will retry again if this fails
        });
      }, delay);
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Chat methods
  public joinChat(sessionId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('joinChat', sessionId);
    }
  }

  public leaveChat(sessionId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leaveChat', sessionId);
    }
  }

  public sendMessage(data: {
    sessionId: string;
    content: string;
    type?: string;
    metadata?: any;
  }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('sendMessage', data);
    }
  }

  public sendTypingIndicator(sessionId: string, isTyping: boolean) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', { sessionId, isTyping });
    }
  }

  public reactToMessage(messageId: string, reaction: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('reactToMessage', { messageId, reaction });
    }
  }

  // Event listener methods
  public on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Utility methods
  public updateAuthToken(token: string) {
    this.token = token;
    if (this.isConnected) {
      // Reconnect with new token
      this.disconnect();
      this.connect();
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
}

// Singleton instance
let socketClientInstance: WebSocketClient | null = null;

export function getSocketClient(): WebSocketClient {
  if (!socketClientInstance) {
    socketClientInstance = new WebSocketClient();
  }
  return socketClientInstance;
}

// React hook for using WebSocket in components
export function useWebSocket() {
  const socketClient = getSocketClient();
  
  return {
    connect: () => socketClient.connect(),
    disconnect: () => socketClient.disconnect(),
    joinChat: (sessionId: string) => socketClient.joinChat(sessionId),
    leaveChat: (sessionId: string) => socketClient.leaveChat(sessionId),
    sendMessage: (data: any) => socketClient.sendMessage(data),
    sendTypingIndicator: (sessionId: string, isTyping: boolean) => 
      socketClient.sendTypingIndicator(sessionId, isTyping),
    reactToMessage: (messageId: string, reaction: string) => 
      socketClient.reactToMessage(messageId, reaction),
    on: (event: string, callback: Function) => socketClient.on(event as any, callback as any),
    off: (event: string, callback: Function) => socketClient.off(event as any, callback as any),
    isConnected: socketClient.getConnectionStatus(),
  };
}