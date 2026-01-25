import { useEffect, useContext, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { SocketContext } from './SockerProvider';
import { entitiesActions, sessionActions } from '~/store';
import {
  WEBSOCKET_EVENT_MAP,
  WebSocketEvent,
  InvalidateEvent,
  formatEventPayload,
  getEventName,
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

    const listeners: Array<[string, (...args: any[]) => void]> = [];

    Object.entries(WEBSOCKET_EVENT_MAP).forEach(([model, actions]) => {
      Object.entries(actions).forEach(([eventType, reduxActionName]) => {
        const eventName = getEventName(model, eventType);

        const handler = (event: WebSocketEvent) => {
          try {
            const payload = formatEventPayload(model, eventType, event.data);
            const action = (entitiesActions as any)[reduxActionName] || (sessionActions as any)[reduxActionName];

            if (action) {
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
 * Hook pour logger les événements WebSocket (debug uniquement)
 * Utilise onAny pour éviter de muter les méthodes du socket
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

    // Utiliser onAny pour logger tous les événements reçus sans mutation
    const logReceive = (eventName: string, ...args: any[]) => {
      if (!eventName.startsWith('connect') && !eventName.startsWith('disconnect')) {
        console.log('📥 WebSocket receive:', eventName, args[0]);
      }
    };

    // Utiliser onAnyOutgoing pour logger les événements émis (si disponible)
    const logEmit = (eventName: string, ...args: any[]) => {
      console.log('🚀 WebSocket emit:', eventName, args[0]);
    };

    socket.onAny(logReceive);
    if (typeof socket.onAnyOutgoing === 'function') {
      socket.onAnyOutgoing(logEmit);
    }

    return () => {
      socket.offAny(logReceive);
      if (typeof socket.offAnyOutgoing === 'function') {
        socket.offAnyOutgoing(logEmit);
      }
    };
  }, [socketService, isConnected]);
};

/**
 * Hook pour gérer la reconnexion et la réconciliation des données
 * Utilise useRef pour éviter les re-renders infinis avec le callback
 */
export const useWebSocketReconnection = (onReconnect?: () => void) => {
  const context = useContext(SocketContext);
  const dispatch = useDispatch();
  const onReconnectRef = useRef(onReconnect);
  const hasConnectedOnce = useRef(false);

  // Mettre à jour la ref quand le callback change
  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

  if (!context) {
    return { isConnected: false };
  }

  const { socket: socketService, isConnected } = context;

  useEffect(() => {
    if (!socketService) return;

    const socket = socketService.getSocket();
    if (!socket) return;

    const handleConnect = () => {
      dispatch(sessionActions.setWebSocketConnected(true));

      // Ne déclencher le refetch que si c'est une REconnexion (pas la première connexion)
      if (hasConnectedOnce.current) {
        console.log('🔄 WebSocket reconnecté, réconciliation des données...');
        onReconnectRef.current?.();
      } else {
        console.log('✅ WebSocket connecté (première connexion)');
        hasConnectedOnce.current = true;
      }
    };

    const handleDisconnect = (reason: string) => {
      console.log('❌ WebSocket déconnecté:', reason);
      dispatch(sessionActions.setWebSocketConnected(false));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Si déjà connecté au moment du mount, mettre à jour le state
    if (socket.connected) {
      dispatch(sessionActions.setWebSocketConnected(true));
      hasConnectedOnce.current = true;
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socketService, dispatch]);

  return { isConnected };
};

/**
 * Hook pour écouter les événements d'invalidation du backend
 * Déclenche un refetch des ressources spécifiées
 */
export const useInvalidationListener = (
  refetchResources: (resources: string[]) => Promise<void>
) => {
  const context = useContext(SocketContext);
  const refetchResourcesRef = useRef(refetchResources);

  useEffect(() => {
    refetchResourcesRef.current = refetchResources;
  }, [refetchResources]);

  if (!context) return;

  const { socket: socketService, isConnected } = context;

  useEffect(() => {
    if (!socketService || !isConnected) return;

    const socket = socketService.getSocket();
    if (!socket) return;

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
  }, [socketService, isConnected]);
};