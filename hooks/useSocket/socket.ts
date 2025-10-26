import { io, Socket } from 'socket.io-client';
import { storageService } from '~/lib/storageService';

export class SocketService {
    private socket: Socket | null = null;
    private currentToken: string | null = null;

    async connect(url: string, sessionToken?: string): Promise<void> {
      const token = sessionToken || await storageService.getItem('sessionToken');

      if (!token) {
        console.error('[SocketService] No session token available');
        return;
      }

      // Si déjà connecté avec le même token, ne rien faire
      if (this.socket?.connected && this.currentToken === token) {
        console.log('[SocketService] Already connected with same token');
        return;
      }

      // Déconnecter proprement l'ancienne connexion si elle existe
      if (this.socket) {
        console.log('[SocketService] Disconnecting old socket before reconnect');
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }

      this.currentToken = token;

      return new Promise((resolve, reject) => {
        this.socket = io(url, {
          auth: { token },
          autoConnect: true
        });

        const onConnect = () => {
          console.log('[SocketService] Connected successfully');
          this.socket?.off('connect_error', onConnectError);
          resolve();
        };

        const onConnectError = (error: Error) => {
          console.error('[SocketService] Connection error:', error);
          this.socket?.off('connect', onConnect);
          reject(error);
        };

        this.socket.once('connect', onConnect);
        this.socket.once('connect_error', onConnectError);

        this.socket.on('disconnect', (reason) => {
          console.log('[SocketService] Disconnected:', reason);
        });
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
            console.log('[SocketService] Disconnecting socket');
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
            this.currentToken = null;
        }
    }
}

export const socketService = new SocketService();