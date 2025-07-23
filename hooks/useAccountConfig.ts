import { useSelector } from 'react-redux';
import { useAppDispatch } from '~/store/hooks';
import { RootState } from '~/store';
import { setReminderConfig } from '~/store/config.slice';
import { accountConfigApiService } from '~/api/account-config.api';
import { useCallback, useState } from 'react';

/**
 * Hook pour gérer la configuration du compte
 */
export const useAccountConfig = () => {
  const dispatch = useAppDispatch();
  const config = useSelector((state: RootState) => state.config);
  const { userProfile } = useSelector((state: RootState) => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vérifier si l'utilisateur peut modifier la config
  const canUpdate = userProfile && ['admin', 'superadmin'].includes(userProfile as string);

  /**
   * Charger la configuration depuis l'API
   */
  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await accountConfigApiService.getAccountConfig();
      dispatch(setReminderConfig(data));
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de la configuration';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  /**
   * Mettre à jour la configuration des alertes
   * Les droits et validations sont gérés par le middleware backend
   */
  const updateAlertTime = useCallback(async (id: string, data: { reminderNotificationsEnabled: boolean, reminderMinutes: number }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await accountConfigApiService.update(id , data);
      
      // Mettre à jour le store avec la réponse du serveur
      dispatch(setReminderConfig(response));
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  /**
   * Activer/Désactiver les alertes sans changer la valeur
   */
  const toggleAlerts = useCallback(async (id: string, enabled: boolean) => {
    return updateAlertTime(id, { reminderNotificationsEnabled: enabled, reminderMinutes: config.reminderMinutes });
  }, [updateAlertTime, config.reminderMinutes]);

  /**
   * Changer seulement la valeur des alertes (garde l'état enabled)
   */
  const setAlertValue = useCallback(async (id: string, value: number) => {
    return updateAlertTime(id, { reminderNotificationsEnabled: config.reminderNotificationsEnabled, reminderMinutes: value });
  }, [updateAlertTime, config.reminderNotificationsEnabled]);

  return {
    // État
    config,
    isLoading,
    error,
    
    // Actions
    loadConfig,
    updateAlertTime,
    toggleAlerts,
    setAlertValue,
    
    // Helpers
    isAlertEnabled: config.reminderNotificationsEnabled,
    alertValue: config.reminderMinutes,
    clearError: () => setError(null)
  };
};