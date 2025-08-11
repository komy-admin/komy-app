import { useCallback, useState } from 'react';
import { menuApiService } from '~/api/menu.api';
import { 
  Menu, 
  MenuCategory, 
  MenuCategoryItem, 
  MenuPriceCalculationRequest, 
  MenuPriceCalculationResponse 
} from '~/types/menu.types';

/**
 * Hook spécialisé pour les calculs de prix des menus
 */
export const useMenuCalculator = () => {
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Calculer le prix d'un menu avec les sélections données
  const calculateMenuPrice = useCallback(async (
    menuId: string, 
    selectedCategories: string[], 
    selectedItems: Array<{ itemId: string; menuCategoryItemId: string }>
  ): Promise<MenuPriceCalculationResponse | null> => {
    try {
      setCalculatingPrice(true);
      setCalculationError(null);

      const request: MenuPriceCalculationRequest = {
        menuId,
        selectedCategories,
        selectedItems
      };

      const result = await menuApiService.calculatePrice(request);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du calcul du prix';
      setCalculationError(errorMessage);
      console.error('Erreur lors du calcul du prix du menu:', error);
      return null;
    } finally {
      setCalculatingPrice(false);
    }
  }, []);

  // Valider qu'une sélection de menu est complète selon les règles
  const validateMenuSelection = useCallback((
    menu: Menu,
    selectedCategories: string[],
    selectedItemsByCategory: Record<string, string[]> // categoryId -> itemIds[]
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Vérifier chaque catégorie du menu
    menu.categories.forEach(category => {
      const selectedItems = selectedItemsByCategory[category.id] || [];
      
      // Vérifier les catégories obligatoires
      if (category.isRequired && selectedItems.length === 0) {
        errors.push(`La catégorie "${category.itemType.name}" est obligatoire`);
      }
      
      // Vérifier le nombre maximum de sélections
      if (selectedItems.length > category.maxSelections) {
        errors.push(`Maximum ${category.maxSelections} sélection(s) autorisée(s) pour "${category.itemType.name}"`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Calculer le prix minimum d'un menu (seulement les catégories obligatoires avec les items les moins chers)
  const calculateMinimumMenuPrice = useCallback((
    menu: Menu,
    menuCategoryItems: Record<string, MenuCategoryItem[]> // categoryId -> items[]
  ): number => {
    let totalPrice = menu.basePrice;

    menu.categories.forEach(category => {
      if (category.isRequired) {
        // Ajouter le modificateur de prix de la catégorie
        totalPrice += category.priceModifier;
        
        // Trouver l'item le moins cher dans cette catégorie
        const categoryItems = menuCategoryItems[category.id] || [];
        const availableItems = categoryItems.filter(item => item.isAvailable);
        
        if (availableItems.length > 0) {
          const cheapestItem = availableItems.reduce((min, item) => 
            item.supplement < min.supplement ? item : min
          );
          totalPrice += cheapestItem.supplement;
        }
      }
    });

    return totalPrice;
  }, []);

  // Calculer le prix maximum d'un menu (toutes les catégories avec les items les plus chers)
  const calculateMaximumMenuPrice = useCallback((
    menu: Menu,
    menuCategoryItems: Record<string, MenuCategoryItem[]> // categoryId -> items[]
  ): number => {
    let totalPrice = menu.basePrice;

    menu.categories.forEach(category => {
      // Ajouter le modificateur de prix de la catégorie
      totalPrice += category.priceModifier;
      
      // Trouver les items les plus chers dans cette catégorie (jusqu'à maxSelections)
      const categoryItems = menuCategoryItems[category.id] || [];
      const availableItems = categoryItems.filter(item => item.isAvailable);
      
      if (availableItems.length > 0) {
        // Trier par supplément décroissant
        const sortedItems = availableItems.sort((a, b) => 
          b.supplement - a.supplement
        );
        
        // Prendre jusqu'à maxSelections items
        const selectedItems = sortedItems.slice(0, category.maxSelections);
        selectedItems.forEach(item => {
          totalPrice += item.supplement;
        });
      }
    });

    return totalPrice;
  }, []);

  // Vérifier si un item est disponible dans une catégorie
  const isItemAvailableInCategory = useCallback((
    categoryId: string,
    itemId: string,
    menuCategoryItems: Record<string, MenuCategoryItem[]>
  ): boolean => {
    const categoryItems = menuCategoryItems[categoryId] || [];
    const item = categoryItems.find(item => item.itemId === itemId);
    return item?.isAvailable || false;
  }, []);

  // Obtenir le supplément d'un item dans une catégorie spécifique
  const getItemSupplementInCategory = useCallback((
    categoryId: string,
    itemId: string,
    menuCategoryItems: Record<string, MenuCategoryItem[]>
  ): number => {
    const categoryItems = menuCategoryItems[categoryId] || [];
    const item = categoryItems.find(item => item.itemId === itemId);
    return item ? item.supplement : 0;
  }, []);

  // Calculer le prix d'une sélection locale (sans appel API)
  const calculateLocalMenuPrice = useCallback((
    menu: Menu,
    selectedItemsByCategory: Record<string, string[]>, // categoryId -> itemIds[]
    menuCategoryItems: Record<string, MenuCategoryItem[]> // categoryId -> items[]
  ): { basePrice: number; categoryModifiers: number; itemSupplements: number; totalPrice: number } => {
    let basePrice = menu.basePrice;
    let categoryModifiers = 0;
    let itemSupplements = 0;

    menu.categories.forEach(category => {
      const selectedItemIds = selectedItemsByCategory[category.id] || [];
      
      if (selectedItemIds.length > 0) {
        // Ajouter le modificateur de catégorie
        categoryModifiers += category.priceModifier;
        
        // Ajouter les suppléments des items sélectionnés
        selectedItemIds.forEach(itemId => {
          const supplement = getItemSupplementInCategory(category.id, itemId, menuCategoryItems);
          itemSupplements += supplement;
        });
      }
    });

    const totalPrice = basePrice + categoryModifiers + itemSupplements;

    return {
      basePrice,
      categoryModifiers,
      itemSupplements,
      totalPrice
    };
  }, [getItemSupplementInCategory]);

  return {
    // État
    calculatingPrice,
    calculationError,
    
    // Actions principales
    calculateMenuPrice,
    
    // Utilitaires de validation
    validateMenuSelection,
    
    // Calculs de prix
    calculateMinimumMenuPrice,
    calculateMaximumMenuPrice,
    calculateLocalMenuPrice,
    
    // Utilitaires
    isItemAvailableInCategory,
    getItemSupplementInCategory,
  };
};