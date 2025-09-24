import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useSocket } from './index';
import { entitiesActions, sessionActions } from '~/store';
import { 
  WEBSOCKET_EVENT_MAP, 
  WebSocketEvent,
  formatEventPayload,
  getEventName,
  getReduxAction 
} from './websocket.config';

/**
 * Hook générique pour synchroniser les événements WebSocket avec le store Redux
 * Remplace les 305 lignes de useRestaurantSocket par une approche configurée
 */
export const useWebSocketSync = () => {
  const dispatch = useDispatch();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('🔌 WebSocket non connecté, skip listeners');
      return;
    }

    console.log('🔌 Configuration des listeners WebSocket génériques...');
    const listeners: Array<[string, Function]> = [];

    // Parcourir la configuration et enregistrer les listeners
    Object.entries(WEBSOCKET_EVENT_MAP).forEach(([model, actions]) => {
      Object.entries(actions).forEach(([eventType, reduxActionName]) => {
        const eventName = getEventName(model, eventType);
        
        const handler = (event: WebSocketEvent) => {
          try {
            // Log conditionnel selon le type d'événement
            const emoji = eventType.includes('created') ? '🆕' :
                         eventType.includes('updated') ? '📝' :
                         eventType.includes('deleted') ? '🗑️' :
                         eventType.includes('batch') ? '📦' : '📡';
            
            console.log(`${emoji} ${eventName}:`, event.data?.id || event.dataId || 'batch');
            
            // Formater le payload selon le type d'événement
            const payload = formatEventPayload(model, eventType, event.data);
            
            // Dispatcher l'action Redux correspondante
            const action = (entitiesActions as any)[reduxActionName] || (sessionActions as any)[reduxActionName];
            if (action) {
              dispatch(action(payload));
              
              // Log spécial pour les suppressions automatiques
              if (eventType === 'deleted' && event.data?.reason) {
                console.log(`⚠️ Suppression automatique: ${event.data.reason}`);
              }
            } else {
              console.warn(`❌ Action Redux non trouvée: ${reduxActionName}`);
            }
          } catch (error) {
            console.error(`❌ Erreur lors du traitement de ${eventName}:`, error);
          }
        };
        
        // Enregistrer le listener
        (socket as any).on(eventName, handler);
        listeners.push([eventName, handler]);
      });
    });

    console.log(`✅ ${listeners.length} listeners WebSocket enregistrés`);

    // Log des événements écoutés pour debug
    if (process.env.NODE_ENV === 'development') {
      const eventNames = listeners.map(([name]) => name);
      console.log('📡 Événements écoutés:', eventNames);
    }

    // Cleanup - Supprimer tous les listeners
    return () => {
      console.log('🔌 Nettoyage des listeners WebSocket...');
      listeners.forEach(([eventName, handler]) => {
        (socket as any).off(eventName, handler);
      });
      console.log(`✅ ${listeners.length} listeners supprimés`);
    };
  }, [socket, isConnected, dispatch]);

  return {
    isConnected,
    socket,
  };
};

/**
 * Hook pour logger tous les événements WebSocket (debug uniquement)
 */
export const useWebSocketDebugger = () => {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected || process.env.NODE_ENV !== 'development') {
      return;
    }

    // Logger tous les événements pour debug
    const originalEmit = socket.emit;
    socket.emit = function(...args: any[]) {
      console.log('🚀 WebSocket emit:', args[0], args[1]);
      return originalEmit.apply(socket, args);
    };

    const originalOn = socket.on;
    socket.on = function(event: string, handler: Function) {
      const wrappedHandler = (...args: any[]) => {
        if (!event.startsWith('connect') && !event.startsWith('disconnect')) {
          console.log('📥 WebSocket receive:', event, args[0]);
        }
        return handler(...args);
      };
      return originalOn.call(socket, event, wrappedHandler);
    };

    return () => {
      socket.emit = originalEmit;
      socket.on = originalOn;
    };
  }, [socket, isConnected]);
};

/**
 * Hook pour gérer la reconnexion et la réconciliation des données
 */
export const useWebSocketReconnection = (onReconnect?: () => void) => {
  const { socket, isConnected } = useSocket();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!socket) return;

    const handleReconnect = () => {
      console.log('🔄 WebSocket reconnecté, réconciliation des données...');
      
      // Mettre à jour le statut de connexion
      dispatch(sessionActions.setWebSocketConnected(true));
      
      // Callback optionnel pour re-fetch les données
      onReconnect?.();
    };

    const handleDisconnect = () => {
      console.log('❌ WebSocket déconnecté');
      dispatch(sessionActions.setWebSocketConnected(false));
    };

    socket.on('connect', handleReconnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleReconnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, dispatch, onReconnect]);

  return { isConnected };
};