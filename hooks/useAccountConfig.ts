import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '~/store';
// TODO: Implement account config in new store
// import { setAccountConfig } from '@/store/account-config.slice';
import { accountConfigApiService } from '~/api/account-config.api';
import { useCallback, useState } from 'react';

/**
 * Hook pour gérer la configuration du compte
 * TODO: This needs to be reimplemented with the new store structure
 */
export const useAccountConfig = () => {
  const dispatch = useDispatch();
  // TODO: Add accountConfig to the new store structure
  const config = null; // useSelector((state: RootState) => state.accountConfig);
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
      // TODO: Dispatch to new store
      // dispatch(setAccountConfig({
      //   id: accountConfig.id,
      //   reminderMinutes: accountConfig.reminderMinutes,
      //   reminderNotificationsEnabled: accountConfig.reminderNotificationsEnabled
      // }));
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
      const updatedConfig = await accountConfigApiService.updateAccountConfig(updates);
      // TODO: Dispatch to new store
      // dispatch(setAccountConfig({
      //   id: updatedConfig.id,
      //   reminderMinutes: updatedConfig.reminderMinutes,
      //   reminderNotificationsEnabled: updatedConfig.reminderNotificationsEnabled
      // }));
      return updatedConfig;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la configuration';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

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
  };
};