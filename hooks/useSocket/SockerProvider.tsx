import React, { createContext, useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '~/store';
import { SocketService, socketService } from './socket';
import { InvalidateEvent } from './websocket.config';
import { useInvalidationRefetch } from './useInvalidationRefetch';

interface SocketContextType {
  socket: SocketService | null;
  isConnected: boolean;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, sessionToken } = useSelector((state: RootState) => state.session);
  const { refetchResources } = useInvalidationRefetch();
  const refetchResourcesRef = useRef(refetchResources);

  useEffect(() => {
    refetchResourcesRef.current = refetchResources;
  }, [refetchResources]);

  useEffect(() => {
    const initSocket = async () => {
      if (!isAuthenticated || !sessionToken) {
        if (isConnected) {
          socketService.disconnect();
          setIsConnected(false);
        }
        return;
      }

      if (socketService.isConnected()) {
        return;
      }

      try {
        await socketService.connect(
          process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333',
          sessionToken
        );

        setIsConnected(true);
        socketService.on('disconnect', () => setIsConnected(false));
      } catch (error) {
        console.error('[SocketProvider] Connection failed:', error);
        setIsConnected(false);
      }
    };

    initSocket();

    return () => {
      if (isConnected) {
        socketService.disconnect();
      }
    };
  }, [isAuthenticated, sessionToken]);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket || !isConnected) return;

    const handleInvalidate = (data: InvalidateEvent | InvalidateEvent[]) => {
      const events = Array.isArray(data) ? data : [data];
      events.forEach((event) => {
        refetchResourcesRef.current(event.resources).catch((error) => {
          console.error('[Invalidation] Refetch error:', error);
        });
      });
    };

    socket.on('invalidate', handleInvalidate);

    return () => {
      socket.off('invalidate', handleInvalidate);
    };
  }, [isConnected]);

  return (
    <SocketContext.Provider value={{ socket: socketService, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};