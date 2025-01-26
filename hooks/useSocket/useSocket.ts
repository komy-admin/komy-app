
import { useEffect, useCallback } from 'react';
import SocketService from './socket';
import { SocketEvents } from './types';

export function useSocket() {
  useEffect(() => {
    const socketService = SocketService.getInstance({
      baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333',
    });
    socketService.connect();
    
    return () => socketService.cleanup();
  }, []);

  const on = useCallback(<T extends keyof SocketEvents>(
    event: T,
    callback: (payload: SocketEvents[T]) => void
  ) => {
    const socketService = SocketService.getInstance();
    // Ajoutez ces logs
    console.log('Registering event:', event);
    if (!socketService.socket?.connected) {
      console.warn('Socket not connected when registering:', event);
    }
    return socketService.on(event, callback);
  }, []);

  const emit = useCallback(<T extends keyof SocketEvents>(
    event: T,
    payload: SocketEvents[T]
  ) => {
    const socketService = SocketService.getInstance();
    return socketService.emit(event, payload);
  }, []);

  return { on, emit };
}