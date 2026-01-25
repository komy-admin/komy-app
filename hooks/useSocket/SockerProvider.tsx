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

/**
 * Provider WebSocket - Gère uniquement la connexion/déconnexion
 * Les listeners sont gérés dans WebSocketListener pour éviter les doubles instanciations
 */
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, sessionToken } = useSelector((state: RootState) => state.session);

  useEffect(() => {
    const initSocket = async () => {
      if (!isAuthenticated || !sessionToken) {
        if (socketService.isConnected()) {
          console.log('[SocketProvider] User logged out, disconnecting socket');
          socketService.disconnect();
          setIsConnected(false);
        }
        return;
      }

      try {
        console.log('[SocketProvider] Connecting socket with token...');
        await socketService.connect(
          process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333',
          sessionToken
        );

        console.log('[SocketProvider] Socket connected, setting state');
        setIsConnected(true);
      } catch (error) {
        console.error('[SocketProvider] Connection failed:', error);
        setIsConnected(false);
      }
    };

    initSocket();
  }, [isAuthenticated, sessionToken]);

  return (
    <SocketContext.Provider value={{ socket: socketService, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};