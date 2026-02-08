import { useAccountConfigSync } from "~/hooks/useSocket/useAccountConfigSync";
import {
  useWebSocketSync,
  useWebSocketDebugger,
  useWebSocketReconnection,
  useInvalidationListener,
} from "~/hooks/useSocket/useWebSocketSync";
import { useForceLogout } from "~/hooks/useSocket/useForceLogout";
import { useInvalidationRefetch } from "~/hooks/useSocket/useInvalidationRefetch";

/**
 * Composant qui initialise tous les listeners WebSocket
 * Point d'entrée unique pour éviter les doubles instanciations de hooks
 */
export const WebSocketListener: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Source unique pour le refetch - instancié une seule fois ici
  const { refetchAll, refetchResources } = useInvalidationRefetch();

  // Listeners CRUD (order_created, table_updated, etc.)
  useWebSocketSync();

  // Listener pour les événements d'invalidation du backend
  useInvalidationListener(refetchResources);

  // Gestion de la reconnexion avec refetch automatique
  useWebSocketReconnection(refetchAll);

  // Déconnexion auto si teamEnabled = false
  useAccountConfigSync();

  // Logs WebSocket en développement
  useWebSocketDebugger();

  // Déconnexion forcée multi-device
  useForceLogout();

  return <>{children}</>;
};
