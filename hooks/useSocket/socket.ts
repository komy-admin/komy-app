import { io, Socket } from 'socket.io-client';
import { storageService } from '~/lib/storageService';

export class SocketService {
    private socket: Socket | null = null;

    async connect(url: string, sessionToken?: string) {
      const token = sessionToken || await storageService.getItem('sessionToken');

      if (!token) {
        console.error('[SocketService] No session token available');
        return;
      }

      this.socket = io(url, {
        auth: { token }
      });

      this.socket.on('connect', () => {
          console.log('[SocketService] Connected');
      });

      this.socket.on('disconnect', (reason) => {
          console.log('[SocketService] Disconnected:', reason);
      });
    }

    emit(event: string, payload: any) {
        if (this.socket) {
          this.socket.emit(event, payload);
        } else {
            console.error('[SocketService] Socket is not connected');
        }
    }

    on(event: string, callback: (...args: any[]) => void) {
        if (this.socket) {
          this.socket.on(event, callback);
        }
    }

    off(event: string, callback?: (...args: any[]) => void) {
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

    getSocket() {
        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.offAny();
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();