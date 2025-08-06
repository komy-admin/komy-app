import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { 
  restaurantActions,
  selectAllItemTypes,
  selectMenuLoading,
  selectMenuError,
} from '~/store/restaurant';
import { itemTypeApiService } from '~/api/item-type.api';
import { ItemType } from '~/types/item-type.types';

export const useItemTypes = () => {
  const dispatch = useDispatch();
  
  // Récupérer les données depuis le store
  const itemTypes = useSelector((state: any) => selectAllItemTypes({ menu: state.restaurant.menu }));
  const loading = useSelector((state: any) => selectMenuLoading({ menu: state.restaurant.menu }));
  const error = useSelector((state: any) => selectMenuError({ menu: state.restaurant.menu }));

  const clearError = useCallback(() => {
    dispatch(restaurantActions.setErrorMenu(''));
  }, [dispatch]);

  const createItemType = useCallback(async (data: Partial<ItemType>): Promise<ItemType> => {
    try {
      dispatch(restaurantActions.setLoadingMenu(true));
      const newItemType = await itemTypeApiService.create(data);
      
      // Ajouter au store
      dispatch(restaurantActions.createItemType({ itemType: newItemType }));
      dispatch(restaurantActions.setLoadingMenu(false));
      
      return newItemType;
    } catch (err) {
      const errorMessage = 'Erreur lors de la création du type d\'article';
      dispatch(restaurantActions.setErrorMenu(errorMessage));
      console.error('Error creating item type:', err);
      throw err;
    }
  }, [dispatch]);

  const updateItemType = useCallback(async (id: string, data: Partial<ItemType>): Promise<ItemType> => {
    try {
      dispatch(restaurantActions.setLoadingMenu(true));
      const updatedItemType = await itemTypeApiService.update(id, data);
      
      // Mettre à jour dans le store
      dispatch(restaurantActions.updateItemType({ itemType: updatedItemType }));
      dispatch(restaurantActions.setLoadingMenu(false));
      
      return updatedItemType;
    } catch (err) {
      const errorMessage = 'Erreur lors de la modification du type d\'article';
      dispatch(restaurantActions.setErrorMenu(errorMessage));
      console.error('Error updating item type:', err);
      throw err;
    }
  }, [dispatch]);

  const deleteItemType = useCallback(async (id: string): Promise<void> => {
    try {
      dispatch(restaurantActions.setLoadingMenu(true));
      await itemTypeApiService.delete(id);
      
      // Supprimer du store (utilise itemTypeId selon le slice)
      dispatch(restaurantActions.deleteItemType({ itemTypeId: id }));
      dispatch(restaurantActions.setLoadingMenu(false));
    } catch (err) {
      const errorMessage = 'Erreur lors de la suppression du type d\'article';
      dispatch(restaurantActions.setErrorMenu(errorMessage));
      console.error('Error deleting item type:', err);
      throw err;
    }
  }, [dispatch]);

  return {
    itemTypes,
    loading,
    error,
    clearError,
    createItemType,
    updateItemType,
    deleteItemType
  };
};