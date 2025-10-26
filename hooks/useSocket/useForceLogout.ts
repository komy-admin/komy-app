import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '~/store';
import { useAppDispatch } from '~/store/hooks';
import { logout } from '~/store/slices/session.slice';
import { useSocket } from './index';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Hook pour gérer la déconnexion forcée en temps réel
 * Écoute l'événement user_updated et vérifie le flag forceLogout
 * Utilisé pour empêcher les connexions multi-devices
 */
export const useForceLogout = () => {
  const dispatch = useAppDispatch();
  const currentUser = useSelector((state: RootState) => state.session.user);
  const { socket: socketService, isConnected } = useSocket();
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!socketService || !isConnected || !currentUser) {
      hasTriggered.current = false;
      return;
    }

    const socket = socketService.getSocket();
    if (!socket) return;

    const handleUserUpdate = async (event: any) => {
      // Vérifier si c'est le bon user et si metadata contient forceLogout
      console.log('Received user_updated event:', event);
      if (
        event.data?.forceLogout === true &&
        (event.data?.id === currentUser.id || event.data?.$attributes?.id === currentUser.id) &&
        !hasTriggered.current
      ) {
        hasTriggered.current = true;

        // Haptic feedback pour alerter l'utilisateur
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        // Déconnecter immédiatement
        dispatch(logout());

        // Message explicatif
        const message = 'Vous avez été déconnecté car votre compte est maintenant utilisé sur un autre appareil.';

        // Afficher l'alerte après la déconnexion
        setTimeout(() => {
          Alert.alert('Déconnexion', message, [{ text: 'OK', style: 'default' }]);
        }, 500);
      }
    };

    socket.on('user_updated', handleUserUpdate);

    return () => {
      socket.off('user_updated', handleUserUpdate);
    };
  }, [socketService, isConnected, currentUser, dispatch]);
};
