import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { RootState, entitiesActions } from '~/store';
import { itemApiService } from '~/api/item.api';
import { itemTypeApiService } from '~/api/item-type.api';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';

/**
 * Hook spécialisé pour la gestion du menu
 */
export const useMenu = () => {
  const dispatch = useDispatch();

  // Sélecteurs
  const items = useSelector((state: RootState) => Object.values(state.entities.items));
  const itemTypes = useSelector((state: RootState) => Object.values(state.entities.itemTypes));
  const loading = false; // Géré globalement maintenant
  const error = null; // Géré globalement maintenant

  // Actions asynchrones pour charger les données
  const loadItems = useCallback(async () => {
    try {
      const { data: items } = await itemApiService.getAll();
      dispatch(entitiesActions.setItems({ items }));
      return items;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement du menu';
      console.error('Erreur lors du chargement du menu:', errorMessage);
      throw error;
    }
  }, [dispatch]);

  const loadItemTypes = useCallback(async () => {
    try {
      const { data: itemTypes } = await itemTypeApiService.getAll();
      dispatch(entitiesActions.setItemTypes({ itemTypes }));
      return itemTypes;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des types d\'articles';
      console.error('Erreur lors du chargement des types d\'articles:', errorMessage);
      throw error;
    }
  }, [dispatch]);

  // Actions CRUD pour les items
  const createMenuItem = useCallback(async (itemData: Partial<Item>) => {
    try {
      const newItem = await itemApiService.create(itemData);
      dispatch(entitiesActions.createMenuItem({ item: newItem }));
      return newItem;
    } catch (error) {
      console.error('Erreur lors de la création de l\'article:', error);
      throw error;
    }
  }, [dispatch]);

  const updateMenuItem = useCallback(async (itemId: string, itemData: Partial<Item>) => {
    try {
      const updatedItem = await itemApiService.update(itemId, itemData);
      dispatch(entitiesActions.updateMenuItem({ item: updatedItem }));
      return updatedItem;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'article:', error);
      throw error;
    }
  }, [dispatch]);

  const deleteMenuItem = useCallback(async (itemId: string) => {
    try {
      await itemApiService.delete(itemId);
      dispatch(entitiesActions.deleteMenuItem({ itemId }));
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'article:', error);
      throw error;
    }
  }, [dispatch]);

  // Actions CRUD pour les itemTypes
  const createItemType = useCallback(async (itemTypeData: Partial<ItemType>) => {
    try {
      const newItemType = await itemTypeApiService.create(itemTypeData);
      dispatch(entitiesActions.createItemType({ itemType: newItemType }));
      return newItemType;
    } catch (error) {
      console.error('Erreur lors de la création du type d\'article:', error);
      throw error;
    }
  }, [dispatch]);

  const updateItemType = useCallback(async (itemTypeId: string, itemTypeData: Partial<ItemType>) => {
    try {
      const updatedItemType = await itemTypeApiService.update(itemTypeId, itemTypeData);
      dispatch(entitiesActions.updateItemType({ itemType: updatedItemType }));
      return updatedItemType;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du type d\'article:', error);
      throw error;
    }
  }, [dispatch]);

  const deleteItemType = useCallback(async (itemTypeId: string) => {
    try {
      await itemTypeApiService.delete(itemTypeId);
      dispatch(entitiesActions.deleteItemType({ itemTypeId }));
    } catch (error) {
      console.error('Erreur lors de la suppression du type d\'article:', error);
      throw error;
    }
  }, [dispatch]);

  // Utilitaires
  const getItemById = useCallback((itemId: string) => {
    return items.find(item => item.id === itemId) || null;
  }, [items]);

  const getItemTypeById = useCallback((itemTypeId: string) => {
    return itemTypes.find(itemType => itemType.id === itemTypeId) || null;
  }, [itemTypes]);

  const getItemsByType = useCallback((itemTypeId: string) => {
    return items.filter(item => item.itemType.id === itemTypeId);
  }, [items]);

  const getItemQuantityInOrder = useCallback((itemId: string, orderItems: any[]) => {
    return orderItems.filter(orderItem => orderItem.item.id === itemId).length;
  }, []);

  const toggleItemStatus = useCallback(async (itemId: string) => {
    try {
      const item = getItemById(itemId);
      if (!item) {
        throw new Error('Article non trouvé');
      }

      const updatedItem = await itemApiService.update(itemId, {
        isActive: !item.isActive
      });
      
      dispatch(entitiesActions.updateMenuItem({ item: updatedItem }));
      return updatedItem;
    } catch (error) {
      console.error('Erreur lors du changement de statut de l\'article:', error);
      throw error;
    }
  }, [dispatch, getItemById]);

  return {
    // Données
    items,
    itemTypes,
    
    // État
    loading,
    error,
    
    // Actions de chargement
    loadItems,
    loadItemTypes,
    
    // Actions CRUD items
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    
    // Actions CRUD itemTypes
    createItemType,
    updateItemType,
    deleteItemType,
    
    // Utilitaires
    getItemById,
    getItemTypeById,
    getItemsByType,
    getItemQuantityInOrder,
    toggleItemStatus,
  };
};