import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '~/store';
import { sessionActions, selectAppInitialized, selectIsAppInitializing, selectInitializationProgress, selectProgressPercentage } from '~/store/slices/session.slice';
import { useRooms } from './useRooms';
import { useOrders } from './useOrders';
import { useMenu } from './useMenu';
import { useMenus } from './useMenus';
import { useUsers } from './useUsers';
import { usePayments } from './usePayments';
import { accountConfigApiService } from '~/api/account-config.api';
import { tagApiService } from '~/api/tag.api';
import { entitiesActions } from '~/store/slices/entities.slice';

export interface InitializationProgress {
  rooms: boolean;
  tables: boolean;
  itemTypes: boolean;
  items: boolean;
  menus: boolean;
  orders: boolean;
  payments: boolean;
  users: boolean;
  accountConfig: boolean;
  tags: boolean;
  // Signature d'index pour résoudre l'erreur TS
  [key: string]: boolean;
}

const INITIAL_PROGRESS: InitializationProgress = {
  rooms: false,
  tables: false,
  itemTypes: false,
  items: false,
  menus: false,
  orders: false,
  payments: false,
  users: false,
  accountConfig: false,
  tags: false,
};

/**
 * Hook simplifié pour l'initialisation globale de l'application
 * Utilise uniquement Redux pour l'état global, état local minimal pour UI
 */
export const useAppInit = () => {
  const dispatch = useDispatch();
  const { sessionToken, user, authToken, isPinVerified } = useSelector((state: RootState) => state.session);
  const appInitialized = useSelector(selectAppInitialized);
  const isAppInitializing = useSelector(selectIsAppInitializing);
  const progressFromRedux = useSelector(selectInitializationProgress);
  const progressPercentage = useSelector(selectProgressPercentage);

  // Check if user is properly authenticated
  const canInitialize = !!(
    (sessionToken && user) ||
    (authToken && user && isPinVerified)
  );

  // Hooks spécialisés pour charger les données
  const { loadRooms } = useRooms();
  const { loadAllOrders } = useOrders();
  const { loadItemTypes, loadItems } = useMenu();
  const { loadAllMenus } = useMenus();
  const { loadUsers } = useUsers();
  // Note: Les paiements sont maintenant chargés via Redux automatiquement

  // Plus d'état local, tout est dans Redux maintenant

  // Convertir la progression Redux en format attendu par l'UI
  const progress: InitializationProgress = {
    ...INITIAL_PROGRESS,
    ...progressFromRedux
  };

  const updateProgress = (key: keyof InitializationProgress, value: boolean) => {
    dispatch(sessionActions.setInitializationProgress({ key: String(key), value }));
  };

  const initializeApp = useCallback(async () => {
    // Vérifications préliminaires
    if (!canInitialize || appInitialized || isAppInitializing) {
      return;
    }

    // Marquer le début dans Redux
    dispatch(sessionActions.setAppInitializing(true));

    const startTime = Date.now();
    const MIN_LOADING_TIME = 2000;

    try {
      // Étape 1: Configuration du compte
      try {
        const accountConfig = await accountConfigApiService.getAccountConfig();
        dispatch(sessionActions.setAccountConfig({
          id: accountConfig.id,
          reminderMinutes: accountConfig.reminderMinutes,
          reminderNotificationsEnabled: accountConfig.reminderNotificationsEnabled,
          teamEnabled: accountConfig.teamEnabled,
          kitchenEnabled: accountConfig.kitchenEnabled,
          barEnabled: accountConfig.barEnabled,
          kitchenViewMode: accountConfig.kitchenViewMode,
          barViewMode: accountConfig.barViewMode
        }));
        updateProgress('accountConfig', true);
      } catch (error) {
        console.error('Erreur lors du chargement de la configuration:', error);
        updateProgress('accountConfig', true);
      }

      // Étape 2: Données de base en parallèle
      const canLoadUsers = user?.profil && ['superadmin', 'admin', 'manager'].includes(user.profil);

      const promises: Promise<any>[] = [
        loadRooms().then(result => {
          updateProgress('rooms', true);
          updateProgress('tables', true); // Tables chargées via rooms
          return result;
        }),
        loadItemTypes().then(result => {
          updateProgress('itemTypes', true);
          return result;
        }),
        // Charger les tags
        tagApiService.getAll().then(response => {
          // L'API retourne { meta, data }, extraire le tableau data
          const tags = Array.isArray(response) ? response : response.data || [];
          dispatch(entitiesActions.setTags({ tags }));
          updateProgress('tags', true);
          return tags;
        }).catch(error => {
          console.error('Erreur lors du chargement des tags:', error);
          updateProgress('tags', true);
        }),
      ];

      if (canLoadUsers) {
        promises.push(
          loadUsers().then(result => {
            updateProgress('users', true);
            return result;
          })
        );
      } else {
        updateProgress('users', true);
      }

      await Promise.all(promises);

      // Étape 3: Menu, commandes et paiements
      await Promise.all([
        loadItems().then(result => {
          updateProgress('items', true);
          return result;
        }),
        loadAllMenus().then(result => {
          updateProgress('menus', true);
          return result;
        }),
        loadAllOrders().then(result => {
          updateProgress('orders', true);
          return result;
        })
      ]);

      // Les paiements sont maintenant chargés automatiquement via Redux
      updateProgress('payments', true);

      // Phase de finalisation si temps minimum pas écoulé
      const elapsedTime = Date.now() - startTime;
      const remainingTime = MIN_LOADING_TIME - elapsedTime;

      if (remainingTime > 0) {
        const progressInterval = 50;
        const totalSteps = Math.floor(remainingTime / progressInterval);
        let currentStep = 0;

        const progressTimer = setInterval(() => {
          currentStep++;
          const progressPercent = Math.min((currentStep / totalSteps) * 100, 100);
          dispatch(sessionActions.setFinalizationProgress(progressPercent));

          if (currentStep >= totalSteps) {
            clearInterval(progressTimer);
          }
        }, progressInterval);

        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      // Forcer 100% avant la transition
      dispatch(sessionActions.setFinalizationProgress(100));

      // Marquer comme terminé dans Redux
      dispatch(sessionActions.setAppInitialized(true));
      dispatch(sessionActions.setAppInitializing(false));

      // Activer WebSocket
      dispatch(sessionActions.setWebSocketConnected(true));

    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);

      // Reset flags en cas d'erreur
      dispatch(sessionActions.setAppInitialized(false));
      dispatch(sessionActions.setAppInitializing(false));

      throw error;
    }
  }, [canInitialize, appInitialized, isAppInitializing, dispatch, user?.profil, loadRooms, loadItemTypes, loadUsers, loadItems, loadAllMenus, loadAllOrders]);

  // Démarrage automatique de l'initialisation
  useEffect(() => {
    if (canInitialize && user?.profil && !appInitialized && !isAppInitializing) {
      initializeApp();
    }
  }, [canInitialize, user?.profil, appInitialized, isAppInitializing, initializeApp]);

  // Fonction de réinitialisation manuelle
  const reinitializeApp = useCallback(async () => {
    dispatch(sessionActions.setAppInitialized(false));
    dispatch(sessionActions.setAppInitializing(false));
    return initializeApp();
  }, [initializeApp, dispatch]);

  return {
    // Données de progression pour l'UI
    progress,
    progressPercentage,

    // Actions
    initializeApp,
    reinitializeApp,
  };
};