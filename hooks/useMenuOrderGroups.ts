import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '~/store';
import { restaurantActions, selectOptimizedMenuOrderGroupsByOrderId, selectOptimizedMenuOrderGroupById, selectMenuOrderGroupsWithItems } from '~/store/restaurant';
import { menuOrderGroupApiService } from '~/api/menu-order-group.api';
import { MenuOrderGroup } from '~/types/menu-order-group.types';

export const useMenuOrderGroups = () => {
  const dispatch = useDispatch();
  const { menuOrderGroups, isLoading, error } = useSelector(
    (state: RootState) => state.restaurant.menuOrderGroups
  );

  // Initialiser les MenuOrderGroups
  const initializeMenuOrderGroups = useCallback(async () => {
    try {
      dispatch(restaurantActions.setMenuOrderGroups([])); // Vide pendant le chargement
      const result = await menuOrderGroupApiService.getAll();
      dispatch(restaurantActions.setMenuOrderGroups(result.data));
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des MenuOrderGroups:', error);
    }
  }, [dispatch]);

  // Ajouter un nouveau MenuOrderGroup (pour les créations en temps réel)
  const addMenuOrderGroup = useCallback((group: MenuOrderGroup) => {
    dispatch(restaurantActions.addMenuOrderGroup(group));
  }, [dispatch]);

  // ✅ OPTIMISÉ : Utilise les sélecteurs memoizés avec index pré-calculé
  const getMenuOrderGroupsByOrderId = useSelector(selectOptimizedMenuOrderGroupsByOrderId);
  const getMenuOrderGroupById = useSelector(selectOptimizedMenuOrderGroupById);
  const getMenuOrderGroupsWithItems = useSelector(selectMenuOrderGroupsWithItems);

  return {
    menuOrderGroups,
    isLoading,
    error,
    initializeMenuOrderGroups,
    addMenuOrderGroup,
    getMenuOrderGroupsByOrderId,
    getMenuOrderGroupById,
    getMenuOrderGroupsWithItems,
  };
};