
import { io, Socket } from 'socket.io-client';
import { SocketConfig, EventType, SocketEvents } from './types';
import { storageService } from '~/lib/storageService';

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService | null = null;
  private config: SocketConfig;

  private constructor(config: SocketConfig) {
    this.config = config;
  }

  static getInstance(config?: SocketConfig): SocketService {
    if (!SocketService.instance && config) {
      SocketService.instance = new SocketService(config);
    } else if (!SocketService.instance) {
      throw new Error('SocketService must be initialized with config');
    }
    return SocketService.instance;
  }

  async connect() {
    if (this.socket?.connected) return;

    const token = await storageService.getItem('token');

    if (!token) {
      console.error('No token found');
      return;
    }

    this.socket = io(this.config.baseUrl, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: this.config.reconnectionDelay || 1000,
      reconnectionDelayMax: this.config.reconnectionDelayMax || 5000,
      reconnectionAttempts: this.config.reconnectionAttempts || 5
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect' || reason === 'transport close') {
        setTimeout(() => this.connect(), 1000);
      }
    });
  }

  on<T extends keyof SocketEvents>(
    event: T, 
    callback: (data: SocketEvents[T]) => void
  ) {
    this.socket?.on(event as string, callback as (args: any) => void);
    return () => this.socket?.off(event as string, callback as (args: any) => void);
  }
 

  emit<T extends keyof SocketEvents>(
    event: T,
    payload: SocketEvents[T]
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.socket?.emit(event, payload, (response: any) => {
        resolve(response.success);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  cleanup() {
    this.disconnect();
    SocketService.instance = null;
  }
}

export default SocketService;