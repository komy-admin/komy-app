import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { RootState, entitiesActions } from '~/store';
import { selectItemTypes } from '~/store/selectors';
import { itemTypeApiService } from '~/api/item-type.api';
import { ItemType } from '~/types/item-type.types';

export const useItemTypes = () => {
  const dispatch = useDispatch();
  
  // Récupérer les données depuis le store
  const itemTypes: ItemType[] = useSelector(selectItemTypes);
  const loading = false; // Géré globalement maintenant
  const error = null; // Géré globalement maintenant

  const clearError = useCallback(() => {
    // Error géré globalement maintenant
  }, [dispatch]);

  const createItemType = useCallback(async (data: Partial<ItemType>): Promise<ItemType> => {
    try {
      // Loading géré globalement maintenant
      const newItemType = await itemTypeApiService.create(data);
      
      // Ajouter au store
      dispatch(entitiesActions.createItemType({ itemType: newItemType }));
      // Loading géré globalement maintenant
      
      return newItemType;
    } catch (err) {
      throw err;
    }
  }, [dispatch]);

  const updateItemType = useCallback(async (id: string, data: Partial<ItemType>): Promise<ItemType> => {
    try {
      // Loading géré globalement maintenant
      const updatedItemType = await itemTypeApiService.update(id, data);
      
      // Mettre à jour dans le store
      dispatch(entitiesActions.updateItemType({ itemType: updatedItemType }));
      // Loading géré globalement maintenant
      
      return updatedItemType;
    } catch (err) {
      throw err;
    }
  }, [dispatch]);

  const deleteItemType = useCallback(async (id: string): Promise<void> => {
    try {
      // Loading géré globalement maintenant
      await itemTypeApiService.delete(id);
      
      // Supprimer du store (utilise itemTypeId selon le slice)
      dispatch(entitiesActions.deleteItemType({ itemTypeId: id }));
      // Loading géré globalement maintenant
    } catch (err) {
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