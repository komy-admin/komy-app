import { io, Socket } from 'socket.io-client';
import { SocketEvents } from './types';
import { storageService } from '~/lib/storageService';

export class SocketService {
    private socket: Socket | null = null;

    async connect(url: string) {
      const token = await storageService.getItem('token');
      this.socket = io(url, {
        auth: { token }
      });

      this.socket.on('connect', () => {
          console.log('Connected to socket server');
      });

      this.socket.on('disconnect', () => {
          console.log('Disconnected from socket server');
      });
    }

    emit<K extends keyof SocketEvents>(event: K, payload: SocketEvents[K]) {
        if (this.socket) {
          console.log('Emiting event:', event);
          this.socket.emit(event, payload);
        } else {
            console.error('Socket is not connected');
        }
    }

    on<K extends keyof SocketEvents>(event: K, callback: (payload: SocketEvents[K]) => void) {
        if (this.socket) {
          console.log('Registering event:', event);
          this.socket.on(event, callback);
        } else {
            console.error('Socket is not connected');
        }
    }

    off<K extends keyof SocketEvents>(event: K, callback?: (payload: SocketEvents[K]) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off(event, callback);
            } else {
                this.socket.off(event);
            }
        }
    }

    isConnected() {
        return this.socket?.connected || false;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

export const socketService = new SocketService();