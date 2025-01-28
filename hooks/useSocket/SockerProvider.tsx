import React, { createContext, useEffect, useState } from 'react';
import { SocketService, socketService } from './socket';

// On type le contexte avec un état de connexion
interface SocketContextType {
  socket: SocketService | null;
  isConnected: boolean;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // On suit l'état de connexion
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initSocket = async () => {
      try {
        await socketService.connect(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333');
        setIsConnected(true);
        
        // Optionnel : gérer la déconnexion
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
      socketService.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketService, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};