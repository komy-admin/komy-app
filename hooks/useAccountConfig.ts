import { useSelector } from 'react-redux';
import { useAppDispatch } from '~/store/hooks';
import { RootState } from '~/store';
import { setAlertTimeConfig } from '~/store/config.slice';
import { configApiService, ConfigModule } from '~/api/account-config.api';
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
      const configData = await configApiService.getConfig();
      dispatch(setAlertTimeConfig(configData.alert_time_minutes));
      return configData;
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
  const updateAlertTime = useCallback(async (enabled: boolean, value: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await configApiService.updateConfig({
        alert_time_minutes: { enabled, value }
      });
      
      // Mettre à jour le store avec la réponse du serveur
      dispatch(setAlertTimeConfig(response.config.alert_time_minutes));
      
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
  const toggleAlerts = useCallback(async (enabled: boolean) => {
    return updateAlertTime(enabled, config.alertTimeMinutes.value);
  }, [updateAlertTime, config.alertTimeMinutes.value]);

  /**
   * Changer seulement la valeur des alertes (garde l'état enabled)
   */
  const setAlertValue = useCallback(async (value: number) => {
    return updateAlertTime(config.alertTimeMinutes.enabled, value);
  }, [updateAlertTime, config.alertTimeMinutes.enabled]);

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
    isAlertEnabled: config.alertTimeMinutes.enabled,
    alertValue: config.alertTimeMinutes.value,
    clearError: () => setError(null)
  };
};