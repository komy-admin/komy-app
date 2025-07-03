import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '~/store';
import { useRooms } from './useRooms';
import { useOrders } from './useOrders';
import { useMenu } from './useMenu';
import { useTables } from './useTables';
import { useUsers } from './useUsers';
import { restaurantActions } from '~/store/restaurant';
import { Room } from '@/types/room.types';
import { ItemType } from '@/types/item-type.types';
import { User } from '@/types/user.types';

interface InitializationState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  progress: {
    rooms: boolean;
    tables: boolean;
    itemTypes: boolean;
    items: boolean;
    orders: boolean;
    users: boolean;
  };
}

/**
 * Hook pour l'initialisation globale de l'application
 * Se lance automatiquement au premier rendu et charge toutes les données
 */
export const useAppInit = () => {
  const dispatch = useDispatch();
  const { token, userProfile } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = !!(token && userProfile);
  
  // Hooks spécialisés
  const { loadRooms } = useRooms();
  const { loadOrdersForRoom } = useOrders();
  const { loadItemTypes, loadItems } = useMenu();
  const { loadTables } = useTables();
  const { loadUsers } = useUsers();

  // État d'initialisation
  const [state, setState] = useState<InitializationState>({
    isInitialized: false,
    isLoading: false,
    error: null,
    progress: {
      rooms: false,
      tables: false,
      itemTypes: false,
      items: false,
      orders: false,
      users: false,
    }
  });

  const updateProgress = (key: keyof InitializationState['progress'], value: boolean) => {
    setState(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        [key]: value
      }
    }));
  };

  const initializeApp = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('❌ Utilisateur non authentifié, initialisation annulée');
      return; // Ne pas initialiser si pas connecté
    }
    
    if (state.isInitialized || state.isLoading) {
      return; // Éviter les doubles initialisations
    }

    console.log('🚀 Début de l\'initialisation de l\'application...');
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      // Étape 1: Charger les données de base en parallèle
      console.log('📦 Chargement des données de base...');
      
      // Vérifier les droits utilisateur pour charger les users
      const canLoadUsers = userProfile && ['superadmin', 'admin', 'manager'].includes(userProfile);
      
      const promises: Promise<any>[] = [
        loadRooms().then(result => {
          updateProgress('rooms', true);
          console.log('✅ Salles chargées:', result.length);
          return result;
        }),
        loadItemTypes().then(result => {
          updateProgress('itemTypes', true);
          console.log('✅ Types d\'articles chargés:', result.length);
          return result;
        }),
      ];
      
      // Charger les users seulement si l'utilisateur a les droits
      if (canLoadUsers) {
        promises.push(
          loadUsers().then(result => {
            updateProgress('users', true);
            console.log('✅ Utilisateurs chargés:', result.length);
            return result;
          })
        );
      } else {
        updateProgress('users', true);
        console.log('⚠️ Pas de droits pour charger les utilisateurs (profil:', userProfile, ')');
      }
      
      const results = await Promise.all(promises);
      const [rooms, itemTypes, users = []] = results;

      // Étape 2: Charger les tables (dépend des rooms)
      console.log('🪑 Chargement des tables...');
      const tables = await loadTables().then(result => {
        updateProgress('tables', true);
        console.log('✅ Tables chargées:', result.length);
        return result;
      });

      // Étape 3: Charger le menu complet (dépend des itemTypes)
      console.log('🍽️ Chargement du menu...');
      const items = await loadItems().then(result => {
        updateProgress('items', true);
        console.log('✅ Articles du menu chargés:', result.length);
        return result;
      });

      // Étape 4: Charger les commandes de la première salle
      if (rooms.length > 0) {
        console.log(`📝 Chargement des commandes pour la salle: ${rooms[0].name}`);
        const orders = await loadOrdersForRoom(rooms[0].id).then(result => {
          updateProgress('orders', true);
          console.log('✅ Commandes chargées:', result.length);
          return result;
        });
      } else {
        updateProgress('orders', true);
        console.log('⚠️ Aucune salle trouvée, pas de commandes à charger');
      }

      // Étape 5: Marquer l'initialisation comme terminée
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        error: null
      }));

      // Déclencher la synchronisation WebSocket
      dispatch(restaurantActions.setConnected(true));
      
      console.log('🎉 Initialisation terminée avec succès !');
      
      return {
        rooms,
        tables,
        itemTypes,
        items,
        users,
        success: true
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      throw error;
    }
  }, [
    isAuthenticated,
    state.isInitialized, 
    state.isLoading, 
    loadRooms, 
    loadTables, 
    loadItemTypes, 
    loadItems, 
    loadOrdersForRoom,
    loadUsers,
    dispatch
  ]);

  // Initialisation automatique quand l'utilisateur se connecte
  useEffect(() => {
    if (isAuthenticated) {
      initializeApp();
    } else {
      // Reset de l'état quand l'utilisateur se déconnecte
      setState({
        isInitialized: false,
        isLoading: false,
        error: null,
        progress: {
          rooms: false,
          tables: false,
          itemTypes: false,
          items: false,
          orders: false,
          users: false,
        }
      });
    }
  }, [isAuthenticated, initializeApp]);

  // Fonction pour réinitialiser manuellement
  const reinitializeApp = useCallback(async () => {
    console.log('🔄 Réinitialisation manuelle de l\'application...');
    setState(prev => ({
      ...prev,
      isInitialized: false
    }));
    return initializeApp();
  }, [initializeApp]);

  // Fonction pour changer de salle
  const switchRoom = useCallback(async (roomId: string) => {
    try {
      console.log(`🔄 Changement de salle vers: ${roomId}`);
      await loadOrdersForRoom(roomId);
      console.log('✅ Commandes de la nouvelle salle chargées');
    } catch (error) {
      console.error('❌ Erreur lors du changement de salle:', error);
      throw error;
    }
  }, [loadOrdersForRoom]);

  const getProgressPercentage = () => {
    const completed = Object.values(state.progress).filter(Boolean).length;
    const total = Object.keys(state.progress).length;
    return Math.round((completed / total) * 100);
  };

  return {
    // État d'initialisation
    isInitialized: state.isInitialized,
    isLoading: state.isLoading,
    error: state.error,
    progress: state.progress,
    progressPercentage: getProgressPercentage(),
    
    // Actions
    initializeApp,
    reinitializeApp,
    switchRoom,
  };
};