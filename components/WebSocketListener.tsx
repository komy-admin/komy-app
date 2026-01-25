import { useAccountConfigSync } from "~/hooks/useSocket/useAccountConfigSync";
import {
  useWebSocketSync,
  useWebSocketDebugger,
  useWebSocketReconnection,
} from "~/hooks/useSocket/useWebSocketSync";
import { useForceLogout } from "~/hooks/useSocket/useForceLogout";
import { useInvalidationRefetch } from "~/hooks/useSocket/useInvalidationRefetch";

/**
 * Composant qui initialise les listeners WebSocket
 * Doit être placé dans l'arbre de composants après l'authentification
 */
export const WebSocketListener: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { refetchAll } = useInvalidationRefetch();

  // Initialise tous les listeners WebSocket pour synchroniser avec Redux
  useWebSocketSync();

  // Gestion de la reconnexion avec refetch automatique des données
  useWebSocketReconnection(refetchAll);

  // Initialise le listener pour accountConfig (déconnexion auto si teamEnabled = false)
  useAccountConfigSync();

  // Active les logs WebSocket en développement
  useWebSocketDebugger();

  // Initialise le listener pour la déconnexion forcée (multi-device)
  useForceLogout();

  return <>{children}</>;
};
