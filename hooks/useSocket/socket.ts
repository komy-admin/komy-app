import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  connect() {
    if (this.socket?.connected) return;
    const BASE_URL = 'http://192.168.1.67:3333';
    this.socket = io(BASE_URL, {
      auth: { token: this.token },
      autoConnect: true,
      reconnection: true, // ????
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    // this.socket.on('connect_error', (error) => {
    //   console.error('Socket connection error:', error);
    // });

    // this.socket.on('disconnect', (reason) => {
    //   console.log('Socket disconnected:', reason);
    //   if (reason === 'io server disconnect') {
    //     this.socket?.connect();
    //   }
    // });
  }

  onOrderUpdate(callback: (order: any) => void) {
    this.socket?.on('order_update', callback);
    return () => this.socket?.off('order_update', callback);
  }

  onOrderReady(callback: (order: any) => void) {
    this.socket?.on('order_ready', callback);
    return () => this.socket?.off('order_ready', callback);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  isConnected(): boolean {
    return !!this.socket?.connected;
  }
}

export default SocketService;