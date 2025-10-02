import { useContext } from "react";
import { SocketContext } from "./SockerProvider";

export const useSocket = () => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }

  return context;
};

// Export des hooks et types WebSocket
export { useWebSocketSync, useWebSocketDebugger, useWebSocketReconnection } from './useWebSocketSync';
export { useInvalidationRefetch } from './useInvalidationRefetch';
export type { InvalidateEvent, ResourceName } from './websocket.config';