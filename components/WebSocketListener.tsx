import { useRestaurantSocket } from '~/hooks/useRestaurantSocket';

/**
 * Composant qui initialise les listeners WebSocket
 * Doit être placé dans l'arbre de composants après l'authentification
 */
export const WebSocketListener: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialise tous les listeners WebSocket pour synchroniser avec Redux
  useRestaurantSocket();
  
  // Ce composant ne rend rien, il initialise juste les listeners
  return <>{children}</>;
};