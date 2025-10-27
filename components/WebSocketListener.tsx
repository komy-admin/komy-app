import { useAccountConfigSync } from '~/hooks/useSocket/useAccountConfigSync';
import { useWebSocketSync, useWebSocketDebugger } from '~/hooks/useSocket/useWebSocketSync';

/**
 * Composant qui initialise les listeners WebSocket
 * Doit être placé dans l'arbre de composants après l'authentification
 */
export const WebSocketListener: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialise tous les listeners WebSocket pour synchroniser avec Redux
  useWebSocketSync();

  // Initialise le listener pour accountConfig (déconnexion auto si teamEnabled = false)
  useAccountConfigSync();
  // Active les logs WebSocket en développement
  useWebSocketDebugger();

  // Ce composant ne rend rien, il initialise juste les listeners
  return <>{children}</>;
};