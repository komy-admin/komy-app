import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { 
  restaurantActions,
  selectAllMenus,
  selectActiveMenus,
  selectMenuById,
  selectMenuCategoryItems,
  selectAvailableMenuCategoryItems,
  selectMenusLoading,
  selectMenusError,
} from '~/store/restaurant';
import { menuApiService } from '~/api/menu.api';
import { menuCategoryApiService } from '~/api/menu-category.api';
import { menuCategoryItemApiService } from '~/api/menu-category-item.api';
import { Menu, MenuCategory, MenuCategoryItem } from '~/types/menu.types';

/**
 * Hook spécialisé pour la gestion des menus
 */
export const useMenus = () => {
  const dispatch = useDispatch();

  // Sélecteurs
  const allMenus = useSelector((state: any) => selectAllMenus({ menus: state.restaurant.menus }));
  const activeMenus = useSelector((state: any) => selectActiveMenus({ menus: state.restaurant.menus }));
  const loading = useSelector((state: any) => selectMenusLoading({ menus: state.restaurant.menus }));
  const error = useSelector((state: any) => selectMenusError({ menus: state.restaurant.menus }));

  // Actions asynchrones pour charger les données
  const loadAllMenus = useCallback(async () => {
    try {
      dispatch(restaurantActions.setLoadingMenus(true));
      const response = await menuApiService.getAll();
      
      // Extraire le tableau de données de la réponse
      const menus = Array.isArray(response?.data) ? response.data : [];
      
      dispatch(restaurantActions.setMenus({ menus }));
      return menus;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des menus';
      dispatch(restaurantActions.setErrorMenus(errorMessage));
      throw error;
    }
  }, [dispatch]);

  const loadActiveMenus = useCallback(async () => {
    try {
      dispatch(restaurantActions.setLoadingMenus(true));
      const response = await menuApiService.getActiveMenus();
      
      // S'assurer que la réponse est un tableau
      const menus = Array.isArray(response) ? response : [];
      
      dispatch(restaurantActions.setMenus({ menus }));
      return menus;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des menus actifs';
      dispatch(restaurantActions.setErrorMenus(errorMessage));
      throw error;
    }
  }, [dispatch]);

  const loadMenuCategoryItems = useCallback(async (menuCategoryId: string) => {
    try {
      console.log(`📡 API call: loadMenuCategoryItems pour ${menuCategoryId}`);
      const items = await menuCategoryItemApiService.getByMenuCategoryId(menuCategoryId);
      console.log(`📡 API response: ${items.length} items pour ${menuCategoryId}`);
      
      // Ne pas dispatcher setLoading pour éviter les re-renders
      // dispatch(restaurantActions.setMenuCategoryItems({ menuCategoryId, items }));
      return items;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des items de catégorie';
      console.error(`❌ Erreur loadMenuCategoryItems:`, errorMessage);
      dispatch(restaurantActions.setErrorMenus(errorMessage));
      throw error;
    }
  }, [dispatch]);

  const loadAvailableMenuCategoryItems = useCallback(async (menuCategoryId: string) => {
    try {
      dispatch(restaurantActions.setLoadingMenus(true));
      const items = await menuCategoryItemApiService.getAvailableByMenuCategoryId(menuCategoryId);
      dispatch(restaurantActions.setMenuCategoryItems({ menuCategoryId, items }));
      return items;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des items disponibles';
      dispatch(restaurantActions.setErrorMenus(errorMessage));
      throw error;
    }
  }, [dispatch]);

  // Actions CRUD pour les menus
  const createMenu = useCallback(async (menuData: Partial<Menu>) => {
    try {
      console.log('🍽️ Début création menu:', menuData);
      
      // Séparer les catégories des données du menu
      const { categories, ...menuDataWithoutCategories } = menuData;
      console.log('📝 Données menu sans catégories:', menuDataWithoutCategories);
      console.log('📋 Catégories à créer:', categories);
      
      // Étape 1: Créer le menu sans les catégories
      console.log('🔄 Étape 1: Création du menu principal...');
      const newMenu = await menuApiService.create(menuDataWithoutCategories);
      console.log('✅ Menu créé:', newMenu);
      
      // Étape 2: Créer les catégories si elles existent
      if (categories && categories.length > 0) {
        console.log(`🔄 Étape 2: Création de ${categories.length} catégorie(s)...`);
        const createdCategories: MenuCategory[] = [];
        
        for (const [index, category] of categories.entries()) {
          const categoryData = {
            ...category,
            menuId: newMenu.id, // Associer à l'ID du menu créé
            // Retirer l'ID s'il existe (pour la création)
            id: undefined,
          };
          
          console.log(`📤 Création catégorie ${index + 1}:`, categoryData);
          
          try {
            const createdCategory = await menuCategoryApiService.create(categoryData);
            console.log(`✅ Catégorie ${index + 1} créée:`, createdCategory);
            createdCategories.push(createdCategory);
          } catch (categoryError) {
            console.error(`❌ Erreur création catégorie ${index + 1}:`, categoryError);
            throw categoryError;
          }
        }
        
        // Mettre à jour le menu avec les catégories créées
        newMenu.categories = createdCategories;
        console.log('✅ Menu final avec catégories:', newMenu);
      } else {
        console.log('⚠️ Aucune catégorie à créer');
      }
      
      dispatch(restaurantActions.createMenu({ menu: newMenu }));
      console.log('✅ Menu ajouté au store Redux');
      return newMenu;
    } catch (error) {
      console.error('❌ Erreur lors de la création du menu:', error);
      throw error;
    }
  }, [dispatch]);

  const updateMenu = useCallback(async (menuId: string, menuData: Partial<Menu>) => {
    try {
      console.log('🔄 Début mise à jour menu:', menuId, menuData);
      
      // Séparer les catégories des données du menu
      const { categories, ...menuDataWithoutCategories } = menuData;
      console.log('📝 Données menu sans catégories:', menuDataWithoutCategories);
      console.log('📋 Catégories à gérer:', categories);
      
      // Étape 1: Mettre à jour le menu sans les catégories
      console.log('🔄 Étape 1: Mise à jour du menu principal...');
      const updatedMenu = await menuApiService.update(menuId, menuDataWithoutCategories);
      console.log('✅ Menu mis à jour:', updatedMenu);
      
      // Étape 2: Gérer les catégories si elles existent
      if (categories && categories.length > 0) {
        console.log(`🔄 Étape 2: Gestion de ${categories.length} catégorie(s)...`);
        
        // Pour une mise à jour complète, nous devons :
        // 1. Supprimer les anciennes catégories
        // 2. Créer les nouvelles catégories
        
        // TODO: Implémenter la suppression des anciennes catégories
        // Pour l'instant, on créé directement les nouvelles catégories
        
        const createdCategories: MenuCategory[] = [];
        
        for (const [index, category] of categories.entries()) {
          // Si la catégorie a un ID, on la met à jour, sinon on la crée
          if (category.id) {
            console.log(`🔄 Mise à jour catégorie ${index + 1}:`, category);
            try {
              const updatedCategory = await menuCategoryApiService.update(category.id, {
                ...category,
                menuId: updatedMenu.id,
              });
              console.log(`✅ Catégorie ${index + 1} mise à jour:`, updatedCategory);
              createdCategories.push(updatedCategory);
            } catch (categoryError) {
              console.error(`❌ Erreur mise à jour catégorie ${index + 1}:`, categoryError);
              throw categoryError;
            }
          } else {
            console.log(`📤 Création nouvelle catégorie ${index + 1}:`, category);
            const categoryData = {
              ...category,
              menuId: updatedMenu.id,
              id: undefined,
            };
            
            try {
              const createdCategory = await menuCategoryApiService.create(categoryData);
              console.log(`✅ Nouvelle catégorie ${index + 1} créée:`, createdCategory);
              createdCategories.push(createdCategory);
            } catch (categoryError) {
              console.error(`❌ Erreur création catégorie ${index + 1}:`, categoryError);
              throw categoryError;
            }
          }
        }
        
        // Mettre à jour le menu avec les catégories
        updatedMenu.categories = createdCategories;
        console.log('✅ Menu final avec catégories:', updatedMenu);
      } else {
        console.log('⚠️ Aucune catégorie à gérer');
      }
      
      dispatch(restaurantActions.updateMenu({ menu: updatedMenu }));
      console.log('✅ Menu mis à jour dans le store Redux');
      return updatedMenu;
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du menu:', error);
      throw error;
    }
  }, [dispatch]);

  const deleteMenu = useCallback(async (menuId: string) => {
    try {
      await menuApiService.delete(menuId);
      dispatch(restaurantActions.deleteMenu({ menuId }));
    } catch (error) {
      console.error('Erreur lors de la suppression du menu:', error);
      throw error;
    }
  }, [dispatch]);

  // Actions CRUD pour les menuCategoryItems
  const createMenuCategoryItem = useCallback(async (itemData: Partial<MenuCategoryItem>) => {
    try {
      const newItem = await menuCategoryItemApiService.create(itemData);
      dispatch(restaurantActions.createMenuCategoryItem({ menuCategoryItem: newItem }));
      return newItem;
    } catch (error) {
      console.error('Erreur lors de la création de l\'item de catégorie:', error);
      throw error;
    }
  }, [dispatch]);

  const updateMenuCategoryItem = useCallback(async (itemId: string, itemData: Partial<MenuCategoryItem>) => {
    try {
      const updatedItem = await menuCategoryItemApiService.update(itemId, itemData);
      dispatch(restaurantActions.updateMenuCategoryItem({ menuCategoryItem: updatedItem }));
      return updatedItem;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'item de catégorie:', error);
      throw error;
    }
  }, [dispatch]);

  const deleteMenuCategoryItem = useCallback(async (itemId: string) => {
    try {
      await menuCategoryItemApiService.delete(itemId);
      dispatch(restaurantActions.deleteMenuCategoryItem({ menuCategoryItemId: itemId }));
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
    return useSelector((state: any) => selectMenuCategoryItems(menuCategoryId)({ menus: state.restaurant.menus }));
  }, []);

  const getAvailableMenuCategoryItems = useCallback((menuCategoryId: string) => {
    return useSelector((state: any) => selectAvailableMenuCategoryItems(menuCategoryId)({ menus: state.restaurant.menus }));
  }, []);

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
    updateMenu,
    deleteMenu,
    
    // Actions CRUD pour les menuCategoryItems
    createMenuCategoryItem,
    updateMenuCategoryItem,
    deleteMenuCategoryItem,
    
    // Utilitaires
    getMenuById,
    getMenuCategoryItems,
    getAvailableMenuCategoryItems,
    isMenuAvailable,
    getMenuCategories,
    getRequiredCategories,
    getOptionalCategories,
  };
};