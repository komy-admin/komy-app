import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState, logout } from '~/store';
import { useAppDispatch } from '~/store/hooks';
import { UserProfile } from '~/types/user.types';

/**
 * Hook pour gérer la déconnexion automatique des users non-admin quand teamEnabled = false
 * Surveille les changements de accountConfig.teamEnabled dans le Redux store
 */
export const useAccountConfigSync = () => {
  const dispatch = useAppDispatch();
  const { accountConfig, user } = useSelector((state: RootState) => state.session);
  const previousTeamEnabled = useRef(accountConfig?.teamEnabled);

  useEffect(() => {
    // Détecter le changement de teamEnabled
    if (
      previousTeamEnabled.current !== false &&
      accountConfig?.teamEnabled === false &&
      user &&
      user.profil !== UserProfile.ADMIN &&
      user.profil !== UserProfile.SUPERADMIN
    ) {
      console.log('🔴 teamEnabled désactivé, déconnexion du user:', user.profil);
      dispatch(logout());
    }

    // Mettre à jour la référence
    previousTeamEnabled.current = accountConfig?.teamEnabled;
  }, [accountConfig?.teamEnabled, user, dispatch]);
};
