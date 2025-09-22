import React, { ReactNode, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { socketService } from '~/hooks/useSocket/socket';
import { useWebSocketSync, useWebSocketReconnection } from '~/hooks/useSocket/useWebSocketSync';
import { sessionActions } from '~/store';
import { RootState } from '~/store';

interface WebSocketProviderProps {
  children: ReactNode;
}

/**
 * Provider pour initialiser la connexion WebSocket une seule fois à la racine de l'app
 * Gère la connexion, la déconnexion et la synchronisation automatique avec Redux
 */
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.session.sessionToken);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  // Initialisation de la connexion WebSocket
  useEffect(() => {
    if (!token || !apiUrl) {
      console.log('🔌 WebSocket: En attente du token ou de l\'URL API');
      return;
    }

    console.log('🚀 Initialisation de la connexion WebSocket...');
    
    // Connecter au serveur WebSocket
    socketService.connect(apiUrl).then(() => {
      console.log('✅ WebSocket connecté avec succès');
      dispatch(sessionActions.setWebSocketConnected(true));
    }).catch((error) => {
      console.error('❌ Erreur de connexion WebSocket:', error);
      dispatch(sessionActions.setWebSocketConnected(false));
    });

    // Listeners de connexion/déconnexion
    socketService.on('connect' as any, () => {
      console.log('✅ WebSocket: Événement connect reçu');
      dispatch(sessionActions.setWebSocketConnected(true));
      dispatch(sessionActions.updateLastSyncTime());
    });

    socketService.on('disconnect' as any, () => {
      console.log('❌ WebSocket: Événement disconnect reçu');
      dispatch(sessionActions.setWebSocketConnected(false));
    });

    socketService.on('error' as any, (error: any) => {
      console.error('❌ WebSocket: Erreur:', error);
    });

    // Cleanup - Déconnexion lors du démontage
    return () => {
      console.log('🔌 WebSocket: Déconnexion...');
      socketService.disconnect();
      dispatch(sessionActions.setWebSocketConnected(false));
    };
  }, [token, apiUrl, dispatch]);

  // Hook pour synchroniser automatiquement les événements WebSocket avec Redux
  useWebSocketSync();

  // Hook pour gérer la reconnexion
  useWebSocketReconnection(() => {
    console.log('🔄 Reconnexion détectée, vous pouvez re-fetch les données si nécessaire');
    // Ici on pourrait déclencher un re-fetch des données initiales si nécessaire
    // Par exemple: dispatch(fetchInitialData());
  });

  return <>{children}</>;
};

/**
 * Context optionnel pour exposer des méthodes WebSocket aux composants enfants
 */
export const WebSocketContext = React.createContext<{
  emit: (event: string, data: any) => void;
  isConnected: boolean;
}>({
  emit: () => {},
  isConnected: false,
});

/**
 * Provider amélioré avec contexte (optionnel)
 */
export const WebSocketProviderWithContext: React.FC<WebSocketProviderProps> = ({ children }) => {
  const isConnected = useSelector((state: RootState) => 
    state.session.isWebSocketConnected
  );

  const emit = (event: string, data: any) => {
    socketService.emit(event as any, data);
  };

  return (
    <WebSocketProvider>
      <WebSocketContext.Provider value={{ emit, isConnected }}>
        {children}
      </WebSocketContext.Provider>
    </WebSocketProvider>
  );
};

/**
 * Hook pour utiliser le contexte WebSocket
 */
export const useWebSocketContext = () => {
  const context = React.useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext doit être utilisé dans un WebSocketProvider');
  }
  return context;
};