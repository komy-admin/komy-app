import { useWebSocketSync } from '~/hooks/useSocket/useWebSocketSync';
import { useAccountConfigSync } from '~/hooks/useSocket/useAccountConfigSync';
import { useForceLogout } from '~/hooks/useSocket/useForceLogout';

/**
 * Composant qui initialise les listeners WebSocket
 * Doit être placé dans l'arbre de composants après l'authentification
 */
export const WebSocketListener: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialise tous les listeners WebSocket pour synchroniser avec Redux
  useWebSocketSync();

  // Initialise le listener pour accountConfig (déconnexion auto si teamEnabled = false)
  useAccountConfigSync();

  // Initialise le listener pour la déconnexion forcée (multi-device)
  useForceLogout();

  // Ce composant ne rend rien, il initialise juste les listeners
  return <>{children}</>;
};