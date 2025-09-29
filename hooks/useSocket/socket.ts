import { io, Socket } from 'socket.io-client';
import { SocketEvents } from './types';
import { storageService } from '~/lib/storageService';

export class SocketService {
    private socket: Socket | null = null;

    async connect(url: string, sessionToken?: string) {
      // Use provided sessionToken or try to get from storage
      const token = sessionToken || await storageService.getItem('sessionToken');

      if (!token) {
        console.error('[SocketService] No session token available for WebSocket connection');
        return;
      }

      console.log('[SocketService] Connecting to WebSocket with session token');
      this.socket = io(url, {
        auth: {
          token  // Pass sessionToken in auth object as expected by backend
        }
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