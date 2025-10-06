import { useEffect, useContext } from 'react';
import { useDispatch } from 'react-redux';
import { SocketContext } from './SockerProvider';
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
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error('useWebSocketSync must be used within a SocketProvider');
  }

  const { socket: socketService, isConnected } = context;

  useEffect(() => {
    if (!socketService || !isConnected) return;

    const socket = socketService.getSocket();
    if (!socket) return;

    const listeners: Array<[string, Function]> = [];

    Object.entries(WEBSOCKET_EVENT_MAP).forEach(([model, actions]) => {
      Object.entries(actions).forEach(([eventType, reduxActionName]) => {
        const eventName = getEventName(model, eventType);

        const handler = (event: WebSocketEvent) => {
          try {
            const payload = formatEventPayload(model, eventType, event.data);
            const action = (entitiesActions as any)[reduxActionName] || (sessionActions as any)[reduxActionName];

            if (action) {
              console.log(`[WebSocket] ${reduxActionName}:`, payload);
              dispatch(action(payload));
            } else {
              console.warn(`[WebSocket] Action not found: ${reduxActionName}`);
            }
          } catch (error) {
            console.error(`[WebSocket] Error handling ${eventName}:`, error);
          }
        };

        socket.on(eventName, handler);
        listeners.push([eventName, handler]);
      });
    });

    return () => {
      listeners.forEach(([eventName, handler]) => {
        socket.off(eventName, handler);
      });
    };
  }, [socketService, isConnected, dispatch]);

  return {
    isConnected,
    socket: socketService,
  };
};

/**
 * Hook pour logger tous les événements WebSocket (debug uniquement)
 */
export const useWebSocketDebugger = () => {
  const context = useContext(SocketContext);
  if (!context) return;

  const { socket: socketService, isConnected } = context;

  useEffect(() => {
    if (!socketService || !isConnected || process.env.NODE_ENV !== 'development') {
      return;
    }

    const socket = socketService.getSocket();
    if (!socket) return;

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
  }, [socketService, isConnected]);
};

/**
 * Hook pour gérer la reconnexion et la réconciliation des données
 */
export const useWebSocketReconnection = (onReconnect?: () => void) => {
  const context = useContext(SocketContext);
  const dispatch = useDispatch();

  if (!context) {
    return { isConnected: false };
  }

  const { socket: socketService, isConnected } = context;

  useEffect(() => {
    if (!socketService) return;

    const socket = socketService.getSocket();
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
  }, [socketService, dispatch, onReconnect]);

  return { isConnected };
};