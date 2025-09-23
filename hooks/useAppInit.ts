import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '~/store';
import { sessionActions, selectAppInitialized } from '~/store/slices/session.slice';
import { useRooms } from './useRooms';
import { useOrders } from './useOrders';
import { useMenu } from './useMenu';
import { useMenus } from './useMenus';
import { useUsers } from './useUsers';
import { accountConfigApiService } from '~/api/account-config.api';

interface InitializationProgress {
  rooms: boolean;
  tables: boolean;
  itemTypes: boolean;
  items: boolean;
  menus: boolean;
  orders: boolean;
  users: boolean;
  accountConfig: boolean;
}

interface InitializationState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  progress: InitializationProgress;
  finalizationProgress: number;
  isFinalizingStage: boolean;
}

const INITIAL_PROGRESS: InitializationProgress = {
  rooms: false,
  tables: false,
  itemTypes: false,
  items: false,
  menus: false,
  orders: false,
  users: false,
  accountConfig: false,
};

const COMPLETED_PROGRESS: InitializationProgress = {
  rooms: true,
  tables: true,
  itemTypes: true,
  items: true,
  menus: true,
  orders: true,
  users: true,
  accountConfig: true,
};

const createInitialState = (): InitializationState => ({
  isInitialized: false,
  isLoading: false,
  error: null,
  progress: INITIAL_PROGRESS,
  finalizationProgress: 0,
  isFinalizingStage: false
});

const createCompletedState = (): InitializationState => ({
  isInitialized: true,
  isLoading: false,
  error: null,
  progress: COMPLETED_PROGRESS,
  finalizationProgress: 100,
  isFinalizingStage: false
});

/**
 * Hook pour l'initialisation globale de l'application
 * Se lance automatiquement au premier rendu et charge toutes les données
 */
export const useAppInit = () => {
  const dispatch = useDispatch();
  const { sessionToken, user } = useSelector((state: RootState) => state.session);
  const appInitialized = useSelector(selectAppInitialized);
  // Simple check: need sessionToken and user
  const canInitialize = !!(sessionToken && user);

  // Hooks spécialisés
  const { loadRooms } = useRooms();
  const { loadAllOrders, loadOrdersForRoom } = useOrders();
  const { loadItemTypes, loadItems } = useMenu();
  const { loadAllMenus } = useMenus();
  const { loadUsers } = useUsers();

  // État d'initialisation
  const [state, setState] = useState<InitializationState>(createInitialState);

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
    // Vérifications préliminaires synchrones
    if (!canInitialize) {
      console.log('❌ Utilisateur non authentifié, initialisation annulée');
      return;
    }

    if (state.isInitialized || state.isLoading || state.error) {
      return; // Éviter les doubles initialisations et les re-tentatives automatiques après erreur
    }
    // Marquer immédiatement comme en cours d'initialisation dans Redux pour éviter la double initialisation
    dispatch(sessionActions.setAppInitialized(true));

    console.log('🚀 Début de l\'initialisation de l\'application...');

    const startTime = Date.now();
    const MIN_LOADING_TIME = 2000; // 2 secondes minimum

    setState(prev => ({
      ...prev,
      isInitialized: false,  // Force false to display the loader
      isLoading: true,
      error: null
    }));

    try {
      // Étape 0: Charger la configuration globale du compte
      console.log('⚙️ Chargement de la configuration...');
      try {
        // Charger la configuration depuis l'API backend
        const accountConfig = await accountConfigApiService.getAccountConfig();
        dispatch(sessionActions.setAccountConfig({
          id: accountConfig.id,
          reminderMinutes: accountConfig.reminderMinutes,
          reminderNotificationsEnabled: accountConfig.reminderNotificationsEnabled
        }));
        updateProgress('accountConfig', true);
        console.log('✅ Configuration chargée');
      } catch (error) {
        console.error('⚠️ Erreur lors du chargement de la configuration:', error);
        updateProgress('accountConfig', true);
      }

      // Étape 1: Charger les données de base en parallèle
      console.log('📦 Chargement des données de base...');
      
      // Vérifier les droits utilisateur pour charger les users
      const canLoadUsers = user?.profil && ['superadmin', 'admin', 'manager'].includes(user.profil);
      
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
        console.log('⚠️ Pas de droits pour charger les utilisateurs (profil:', user?.profil, ')');
      }
      
      const results = await Promise.all(promises);
      const [rooms, itemTypes, users = []] = results;

      // Étape 2: Tables déjà chargées via loadRooms()
      console.log('🪑 Tables déjà chargées via les rooms');
      updateProgress('tables', true);

      // Étape 3: Charger le menu complet et les menus structurés (dépend des itemTypes)
      console.log('🍽️ Chargement du menu et des menus...');
      const [items, menus] = await Promise.all([
        loadItems().then(result => {
          updateProgress('items', true);
          console.log('✅ Articles du menu chargés:', result.length);
          return result;
        }),
        loadAllMenus().then(result => {
          updateProgress('menus', true);
          console.log('✅ Menus structurés chargés:', Array.isArray(result) ? result.length : 0);
          return result;
        }).catch(error => {
          console.error('⚠️ Erreur lors du chargement des menus:', error);
          updateProgress('menus', true);
          return [];
        })
      ]);

      // Étape 5: Charger toutes les commandes (toutes salles)
      console.log('📝 Chargement de toutes les commandes...');
      const orders = await loadAllOrders().then(result => {
        updateProgress('orders', true);
        console.log('✅ Toutes les commandes chargées:', result.length);
        return result;
      }).catch(error => {
        console.error('⚠️ Erreur lors du chargement des commandes:', error);
        updateProgress('orders', true);
        return [];
      });

      // Calculer le temps écoulé et commencer la finalisation si nécessaire
      const elapsedTime = Date.now() - startTime;
      const remainingTime = MIN_LOADING_TIME - elapsedTime;

      if (remainingTime > 0) {
        console.log(`⏳ Phase de finalisation: ${remainingTime}ms`);

        // Marquer le début de la phase de finalisation
        setState(prev => ({
          ...prev,
          isFinalizingStage: true,
          finalizationProgress: 0
        }));

        // Animation progressive de 0% à 100% pendant le temps restant
        const progressInterval = 50; // Mise à jour toutes les 50ms
        const totalSteps = Math.floor(remainingTime / progressInterval);
        let currentStep = 0;

        const progressTimer = setInterval(() => {
          currentStep++;
          const progressPercent = Math.min((currentStep / totalSteps) * 100, 100);

          setState(prev => ({
            ...prev,
            finalizationProgress: progressPercent
          }));

          if (currentStep >= totalSteps) {
            clearInterval(progressTimer);
          }
        }, progressInterval);

        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      // Marquer comme terminé
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        error: null,
        progress: {
          rooms: true,
          tables: true,
          itemTypes: true,
          items: true,
          menus: true,
          orders: true,
          users: true,
          accountConfig: true,
        }
      }));
      setState(createCompletedState());

      // Marquer l'app comme initialisée APRÈS le chargement complet des données
      dispatch(sessionActions.setAppInitialized(true));

      // Déclencher la synchronisation WebSocket
      dispatch(sessionActions.setWebSocketConnected(true));

      console.log('🎉 Initialisation terminée avec succès !');

      return {
        rooms,
        itemTypes,
        items,
        menus,
        users,
        orders,
        success: true
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);

      // Remettre le flag à false en cas d'erreur pour permettre une nouvelle tentative
      dispatch(sessionActions.setAppInitialized(false));

      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({
        ...prev,
        isLoading: false,
        isInitialized: false,
        error: errorMessage
      }));

      throw error;
    }
  }, [
    canInitialize,
    loadRooms, 
    loadItemTypes, 
    loadItems,
    loadAllMenus,
    loadAllOrders,
    loadOrdersForRoom,
    loadUsers,
    dispatch,
    user?.profil
  ]);

  // Initialisation automatique quand l'utilisateur se connecte
  useEffect(() => {
    console.log(`🔍 [useAppInit] Effect déclenché:`, {
      isAuthenticated: canInitialize,
      userProfil: user?.profil,
      userId: user?.id,
      appInitialized,
      stateIsInitialized: state.isInitialized
    });

    if (canInitialize && user?.profil && !appInitialized) {
      console.log('🔄 Démarrage initialisation app (première fois seulement)');
      initializeApp();
    } else if (!canInitialize) {
      console.log('🔄 Reset état - utilisateur déconnecté');
      dispatch(sessionActions.setAppInitialized(false));
      setState(createInitialState());
    } else if (canInitialize && user?.profil && appInitialized && !state.isInitialized) {
      console.log('🔄 App déjà initialisée dans Redux, synchronisation du state local');
      setState(createCompletedState());
    } else {
      console.log('🚫 Conditions non remplies pour initialisation:', {
        isAuthenticated: canInitialize,
        hasProfil: !!user?.profil,
        alreadyInitialized: appInitialized
      });
    }
  }, [canInitialize, user?.profil, user?.id, appInitialized, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fonction pour réinitialiser manuellement
  const reinitializeApp = useCallback(async () => {
    console.log('🔄 Réinitialisation manuelle de l\'application...');
    dispatch(sessionActions.setAppInitialized(false));
    setState(createInitialState());
    return initializeApp();
  }, [initializeApp, dispatch]);

  // Fonction pour changer de salle
  const switchRoom = useCallback(async (roomId: string) => {
    try {
      console.log(`🔄 Changement de salle vers: ${roomId}`);
      await loadOrdersForRoom();
      console.log('✅ Commandes de la nouvelle salle chargées');
    } catch (error) {
      console.error('❌ Erreur lors du changement de salle:', error);
      throw error;
    }
  }, [loadOrdersForRoom]);

  const getProgressPercentage = () => {
    const completed = Object.values(state.progress).filter(Boolean).length;
    const total = Object.keys(state.progress).length;
    const baseProgress = Math.round((completed / total) * 90); // 90% max pour les étapes normales

    if (state.isFinalizingStage) {
      // Phase finale : 90% + progression de finalisation (0-10%)
      return Math.min(90 + Math.round(state.finalizationProgress * 0.1), 100);
    }

    return baseProgress;
  };

  return {
    // État d'initialisation
    isInitialized: state.isInitialized,
    isLoading: state.isLoading,
    error: state.error,
    progress: state.progress,
    progressPercentage: getProgressPercentage(),
    isFinalizingStage: state.isFinalizingStage,

    // Actions
    initializeApp,
    reinitializeApp,
    switchRoom,
  };
};