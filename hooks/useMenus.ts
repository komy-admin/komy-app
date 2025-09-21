import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { RootState, entitiesActions } from '~/store';
import { selectMenus, selectActiveMenus, selectItems, selectAllMenuCategoryItems } from '~/store/selectors';
import { menuApiService } from '~/api/menu.api';
import { menuCategoryApiService } from '~/api/menu-category.api';
import { menuCategoryItemApiService } from '~/api/menu-category-item.api';
import { Menu, MenuCategory, MenuCategoryItem, MenuBulkUpdateRequest, MenuBulkCreateRequest } from '~/types/menu.types';

/**
 * Hook spécialisé pour la gestion des menus
 */
export const useMenus = () => {
  const dispatch = useDispatch();

  // Sélecteurs
  const allMenus = useSelector(selectMenus);
  const activeMenus = useSelector(selectActiveMenus);
  const items = useSelector(selectItems);
  const loading = false; // Géré globalement maintenant
  const error = null; // Géré globalement maintenant
  
  // Sélecteur pour tous les MenuCategoryItems (pour éviter useSelector dans callbacks)
  // Note: MenuCategoryItems are nested within menu.categories[].items, not stored separately
  const allMenuCategoryItems = useSelector(selectAllMenuCategoryItems);

  // Actions asynchrones pour charger les données
  const loadAllMenus = useCallback(async () => {
    try {
      // Loading géré globalement maintenant
      const response = await menuApiService.getAll();
      
      // Extraire le tableau de données de la réponse
      const menus = Array.isArray(response?.data) ? response.data : [];
      
      dispatch(entitiesActions.setMenus({ menus }));
      
      // Extraire les MenuCategoryItems déjà présents dans la réponse API
      for (const menu of menus) {
        if (menu.categories && menu.categories.length > 0) {
          for (const category of menu.categories) {
            if (category.id && category.items && Array.isArray(category.items)) {
              // Les items sont déjà dans la réponse, pas besoin d'appel API !
              dispatch(entitiesActions.setMenuCategoryItems({ 
                menuCategoryId: category.id, 
                items: category.items 
              }));
            }
          }
        }
      }
      
      return menus;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des menus';
      console.error('Erreur lors de l\'opération menus:', errorMessage);
      throw error;
    }
  }, [dispatch]);

  const loadActiveMenus = useCallback(async () => {
    try {
      // Loading géré globalement maintenant
      const response = await menuApiService.getActiveMenus();
      
      // S'assurer que la réponse est un tableau
      const menus = Array.isArray(response) ? response : [];
      
      dispatch(entitiesActions.setMenus({ menus }));
      return menus;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des menus actifs';
      console.error('Erreur lors de l\'opération menus:', errorMessage);
      throw error;
    }
  }, [dispatch]);


  const loadAvailableMenuCategoryItems = useCallback(async (menuCategoryId: string) => {
    try {
      // Loading géré globalement maintenant
      const items = await menuCategoryItemApiService.getAvailableByMenuCategoryId(menuCategoryId);
      dispatch(entitiesActions.setMenuCategoryItems({ menuCategoryId, items }));
      return items;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des items disponibles';
      console.error('Erreur lors de l\'opération menus:', errorMessage);
      throw error;
    }
  }, [dispatch]);

  // Actions CRUD pour les menus
  const createMenu = useCallback(async (menuData: Partial<Menu>) => {
    try {
      
      // Séparer les catégories des données du menu
      const { categories, ...menuDataWithoutCategories } = menuData;
      
      // Étape 1: Créer le menu sans les catégories
      const newMenu = await menuApiService.create(menuDataWithoutCategories);
      
      // Étape 2: Créer les catégories si elles existent
      if (categories && categories.length > 0) {
        const createdCategories: MenuCategory[] = [];
        
        for (const [index, category] of categories.entries()) {
          const categoryData = {
            ...category,
            menuId: newMenu.id, // Associer à l'ID du menu créé
            // Retirer l'ID s'il existe (pour la création)
            id: undefined,
          };
          
          
          try {
            const createdCategory = await menuCategoryApiService.create(categoryData);
            createdCategories.push(createdCategory);
          } catch (categoryError) {
            console.error(`❌ Erreur création catégorie ${index + 1}:`, categoryError);
            throw categoryError;
          }
        }
        
        // Mettre à jour le menu avec les catégories créées
        newMenu.categories = createdCategories;
      } else {
      }
      
      dispatch(entitiesActions.createMenu({ menu: newMenu }));
      return newMenu;
    } catch (error) {
      console.error('❌ Erreur lors de la création du menu:', error);
      throw error;
    }
  }, [dispatch]);

  const updateMenu = useCallback(async (menuId: string, menuData: Partial<Menu>) => {
    try {
      
      // Séparer les catégories des données du menu
      const { categories, ...menuDataWithoutCategories } = menuData;
      
      // Étape 1: Mettre à jour le menu sans les catégories
      const updatedMenu = await menuApiService.update(menuId, menuDataWithoutCategories);
      
      // Étape 2: Gérer les catégories si elles existent
      if (categories && categories.length > 0) {
        
        // Pour une mise à jour complète, nous devons :
        // 1. Supprimer les anciennes catégories
        // 2. Créer les nouvelles catégories
        
        // TODO: Implémenter la suppression des anciennes catégories
        // Pour l'instant, on créé directement les nouvelles catégories
        
        const createdCategories: MenuCategory[] = [];
        
        for (const [index, category] of categories.entries()) {
          // Si la catégorie a un ID, on la met à jour, sinon on la crée
          if (category.id) {
            try {
              const updatedCategory = await menuCategoryApiService.update(category.id, {
                ...category,
                menuId: updatedMenu.id,
              });
              createdCategories.push(updatedCategory);
            } catch (categoryError) {
              console.error(`❌ Erreur mise à jour catégorie ${index + 1}:`, categoryError);
              throw categoryError;
            }
          } else {
            const categoryData = {
              ...category,
              menuId: updatedMenu.id,
              id: undefined,
            };
            
            try {
              const createdCategory = await menuCategoryApiService.create(categoryData);
              createdCategories.push(createdCategory);
            } catch (categoryError) {
              console.error(`❌ Erreur création catégorie ${index + 1}:`, categoryError);
              throw categoryError;
            }
          }
        }
        
        // Mettre à jour le menu avec les catégories
        updatedMenu.categories = createdCategories;
      } else {
      }
      
      dispatch(entitiesActions.updateMenu({ menu: updatedMenu }));
      return updatedMenu;
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du menu:', error);
      throw error;
    }
  }, [dispatch]);

  const deleteMenu = useCallback(async (menuId: string) => {
    try {
      await menuApiService.delete(menuId);
      dispatch(entitiesActions.deleteMenu({ menuId }));
    } catch (error) {
      console.error('Erreur lors de la suppression du menu:', error);
      throw error;
    }
  }, [dispatch]);

  // ✅ Nouvelle méthode pour création bulk (menu + catégories + items en 1 requête)
  const createMenuBulk = useCallback(async (menuData: MenuBulkCreateRequest) => {
    try {
      
      const createdMenu = await menuApiService.createBulk(menuData);
      
      // Ajouter au store Redux avec le menu complet
      dispatch(entitiesActions.createMenu({ menu: createdMenu }));
      
      // Extraire et stocker les MenuCategoryItems créés
      if (createdMenu.categories && createdMenu.categories.length > 0) {
        for (const category of createdMenu.categories) {
          if (category.id && category.items && Array.isArray(category.items)) {
            dispatch(entitiesActions.setMenuCategoryItems({ 
              menuCategoryId: category.id, 
              items: category.items 
            }));
          }
        }
      }
      
      return createdMenu;
    } catch (error) {
      console.error('❌ Erreur lors de la création bulk du menu:', error);
      throw error;
    }
  }, [dispatch]);

  // ✅ Nouvelle méthode pour mise à jour bulk (menu + catégories + items en 1 requête)
  const updateMenuBulk = useCallback(async (menuId: string, menuData: MenuBulkUpdateRequest) => {
    try {
      
      const updatedMenu = await menuApiService.updateBulk(menuId, menuData);
      
      // Mettre à jour le store Redux avec le menu complet
      dispatch(entitiesActions.updateMenu({ menu: updatedMenu }));
      
      // Extraire et stocker les MenuCategoryItems mis à jour
      if (updatedMenu.categories && updatedMenu.categories.length > 0) {
        for (const category of updatedMenu.categories) {
          if (category.id && category.items && Array.isArray(category.items)) {
            dispatch(entitiesActions.setMenuCategoryItems({ 
              menuCategoryId: category.id, 
              items: category.items 
            }));
          }
        }
      }
      
      return updatedMenu;
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour bulk du menu:', error);
      throw error;
    }
  }, [dispatch]);

  // Actions CRUD pour les menuCategoryItems
  const createMenuCategoryItem = useCallback(async (itemData: Partial<MenuCategoryItem>) => {
    try {
      const newItem = await menuCategoryItemApiService.create(itemData);

      if (newItem.itemId && !newItem.item) {
        const itemFromStore = items.find(i => i.id === newItem.itemId);
        if (itemFromStore) {
          newItem.item = itemFromStore;
        }
      }

      dispatch(entitiesActions.createMenuCategoryItem({ menuCategoryItem: newItem }));
      return newItem;
    } catch (error) {
      console.error('Erreur lors de la création de l\'item de catégorie:', error);
      throw error;
    }
  }, [dispatch, items]);

  const updateMenuCategoryItem = useCallback(async (itemId: string, itemData: Partial<MenuCategoryItem>) => {
    try {
      const updatedItem = await menuCategoryItemApiService.update(itemId, itemData);

      if (updatedItem.itemId && !updatedItem.item) {
        const itemFromStore = items.find(i => i.id === updatedItem.itemId);
        if (itemFromStore) {
          updatedItem.item = itemFromStore;
        }
      }

      dispatch(entitiesActions.updateMenuCategoryItem({ menuCategoryItem: updatedItem }));
      return updatedItem;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'item de catégorie:', error);
      throw error;
    }
  }, [dispatch, items]);

  const deleteMenuCategoryItem = useCallback(async (itemId: string) => {
    try {
      await menuCategoryItemApiService.delete(itemId);
      dispatch(entitiesActions.deleteMenuCategoryItem({ menuCategoryItemId: itemId }));
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'item de catégorie:', error);
      throw error;
    }
  }, [dispatch]);

  // Utilitaires
  const getMenuById = useCallback((menuId: string) => {
    return allMenus.find(menu => menu.id === menuId) || null;
  }, [allMenus]);

  const getMenuCategoryItems = useCallback((menuCategoryId: string) => {
    return allMenuCategoryItems[menuCategoryId] || [];
  }, [allMenuCategoryItems]);

  const loadMenuCategoryItems = useCallback((menuCategoryId: string) => {
    return getMenuCategoryItems(menuCategoryId);
  }, [getMenuCategoryItems]);


  const hasMenuCategoryItems = useCallback((menuCategoryId: string) => {
    const items = allMenuCategoryItems[menuCategoryId] || [];
    return items.length > 0;
  }, [allMenuCategoryItems]);

  const getAvailableMenuCategoryItems = useCallback((menuCategoryId: string) => {
    const items = allMenuCategoryItems[menuCategoryId] || [];
    return items.filter((item: MenuCategoryItem) => item.isAvailable);
  }, [allMenuCategoryItems]);

  const isMenuAvailable = useCallback((menuId: string) => {
    const menu = getMenuById(menuId);
    return Boolean(menu?.isActive);
  }, [getMenuById]);

  const getMenuCategories = useCallback((menuId: string) => {
    const menu = getMenuById(menuId);
    return menu?.categories || [];
  }, [getMenuById]);

  const getRequiredCategories = useCallback((menuId: string) => {
    const categories = getMenuCategories(menuId);
    return categories.filter(category => category.isRequired);
  }, [getMenuCategories]);

  const getOptionalCategories = useCallback((menuId: string) => {
    const categories = getMenuCategories(menuId);
    return categories.filter(category => !category.isRequired);
  }, [getMenuCategories]);

  return {
    // Données
    allMenus,
    activeMenus,
    
    // État
    loading,
    error,
    
    // Actions de chargement
    loadAllMenus,
    loadActiveMenus,
    loadMenuCategoryItems,
    loadAvailableMenuCategoryItems,
    
    // Actions CRUD pour les menus
    createMenu,
    createMenuBulk,
    updateMenu,
    updateMenuBulk,
    deleteMenu,
    
    // Actions CRUD pour les menuCategoryItems
    createMenuCategoryItem,
    updateMenuCategoryItem,
    deleteMenuCategoryItem,
    
    // Utilitaires
    getMenuById,
    getMenuCategoryItems,
    hasMenuCategoryItems,
    getAvailableMenuCategoryItems,
    isMenuAvailable,
    getMenuCategories,
    getRequiredCategories,
    getOptionalCategories,
  };
};