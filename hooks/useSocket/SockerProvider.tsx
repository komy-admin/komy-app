import React, { createContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '~/store';
import { SocketService, socketService } from './socket';

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

  useEffect(() => {
    const initSocket = async () => {
      // Only connect if user is authenticated with a session token
      if (!isAuthenticated || !sessionToken) {
        console.log('[SocketProvider] Skipping WebSocket connection - user not authenticated');
        // Disconnect if already connected (e.g., user logged out)
        if (isConnected) {
          socketService.disconnect();
          setIsConnected(false);
        }
        return;
      }

      try {
        console.log('[SocketProvider] User authenticated, connecting to WebSocket with sessionToken...');
        // Pass the sessionToken directly to the connect method
        await socketService.connect(
          process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333',
          sessionToken
        );
        setIsConnected(true);

        socketService.on('disconnect', () => {
          setIsConnected(false);
        });
      } catch (error) {
        console.error('Socket connection failed:', error);
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

  return (
    <SocketContext.Provider value={{ socket: socketService, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};