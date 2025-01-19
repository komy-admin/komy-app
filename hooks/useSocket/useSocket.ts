import { useEffect, useRef } from 'react';
import SocketService from '~/hooks/useSocket/socket';
import { storageService } from '~/lib/storageService';

export const useSocket = () => {
  const socketRef = useRef<SocketService | null>(null);
  const initializeSocket = async () => {
    if (!socketRef.current) {
      const token = await storageService.getItem('token');
      if (!token) throw new Error('No auth token found');
      
      socketRef.current = new SocketService(token);
    }
  };
  initializeSocket();

  useEffect(() => {
    socketRef.current?.connect();

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return socketRef.current;
};