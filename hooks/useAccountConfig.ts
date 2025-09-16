import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '~/store';
import { sessionActions } from '~/store/slices/session.slice';
import { accountConfigApiService } from '~/api/account-config.api';
import { useCallback, useState } from 'react';

/**
 * Hook pour gérer la configuration du compte
 */
export const useAccountConfig = () => {
  const dispatch = useDispatch();
  const config = useSelector((state: RootState) => state.session.accountConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charger la configuration depuis l'API
   */
  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const accountConfig = await accountConfigApiService.getAccountConfig();
      dispatch(sessionActions.setAccountConfig({
        id: accountConfig.id,
        reminderMinutes: accountConfig.reminderMinutes,
        reminderNotificationsEnabled: accountConfig.reminderNotificationsEnabled
      }));
      return accountConfig;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de la configuration';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  /**
   * Mettre à jour la configuration
   */
  const updateConfig = useCallback(async (updates: {
    reminderMinutes?: number;
    reminderNotificationsEnabled?: boolean;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      // Récupérer l'ID depuis la config actuelle
      if (!config?.id) {
        throw new Error('Configuration non chargée');
      }
      // Utiliser la méthode update héritée de BaseApiService (PUT)
      const updatedConfig = await accountConfigApiService.update(config.id, updates);
      dispatch(sessionActions.setAccountConfig({
        id: updatedConfig.id,
        reminderMinutes: updatedConfig.reminderMinutes,
        reminderNotificationsEnabled: updatedConfig.reminderNotificationsEnabled
      }));
      return updatedConfig;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la configuration';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  // Fonctions pour compatibilité avec l'ancien code
  const isAlertEnabled = config?.reminderNotificationsEnabled ?? false;
  const alertValue = config?.reminderMinutes ?? 15;
  
  const updateAlertTime = useCallback(async (minutes: number) => {
    return updateConfig({ reminderMinutes: minutes });
  }, [updateConfig]);
  
  const toggleAlertEnabled = useCallback(async (enabled: boolean) => {
    return updateConfig({ reminderNotificationsEnabled: enabled });
  }, [updateConfig]);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // État
    config,
    isLoading,
    error,
    
    // Actions
    loadConfig,
    updateConfig,
    
    // Valeurs directes
    reminderMinutes: config?.reminderMinutes ?? 15,
    reminderNotificationsEnabled: config?.reminderNotificationsEnabled ?? false,
    
    // Compatibilité avec l'ancien code
    isAlertEnabled,
    alertValue,
    updateAlertTime,
    clearError,
  };
};