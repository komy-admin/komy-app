import { useState, useCallback, useEffect } from 'react';
import {
  MenuFormData,
  MenuCategoryFormData,
  LocalMenuCategoryItem,
} from '@/components/admin/MenuForm/MenuEditor/MenuEditor.types';
import { Menu, MenuCategoryItem } from '~/types/menu.types';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { AdminConfirmationContext } from '@/components/admin/AdminForm/AdminFormView';
import { useToast } from '~/components/ToastProvider';
import { centsToEuros, eurosToCents } from '~/lib/utils';

interface UseMenuEditorProps {
  menu?: Menu | null;
  items: Item[];
  itemTypes: ItemType[];
  onLoadMenuCategoryItems: (menuCategoryId: string) => MenuCategoryItem[];
  onCreateMenuCategoryItem?: (data: Partial<MenuCategoryItem>) => Promise<MenuCategoryItem>;
}

interface CategorySelection {
  value: string;
  label: string;
  id: string;
}

interface UseMenuEditorReturn {
  formData: MenuFormData;
  localCategoryItems: Record<number, LocalMenuCategoryItem[]>;
  categorySelections: Record<number, CategorySelection>;

  updateFormField: (field: keyof MenuFormData, value: MenuFormData[keyof MenuFormData]) => void;
  updateCategory: (index: number, field: keyof MenuCategoryFormData, value: string | boolean) => void;
  addCategory: () => void;
  removeCategory: (index: number, confirmationContext: AdminConfirmationContext | null) => void;

  addItemToCategoryDirect: (categoryIndex: number, itemId: string, supplement: number, isAvailable: boolean) => void;
  removeItemFromCategory: (categoryIndex: number, tempId: string) => void;
  updateItemInCategory: (categoryIndex: number, tempId: string, supplement: number, isAvailable: boolean) => void;
  toggleItemAvailability: (categoryIndex: number, tempId: string) => void;

  getMenuData: () => Menu;
  resetForm: () => void;
  restoreCategoryItems: (categoryIndex: number, snapshot: LocalMenuCategoryItem[]) => void;
}

export const useMenuEditor = ({
  menu,
  items,
  itemTypes,
  onLoadMenuCategoryItems,
  onCreateMenuCategoryItem
}: UseMenuEditorProps): UseMenuEditorReturn => {
  const { showToast } = useToast();

  const [formData, setFormData] = useState<MenuFormData>({
    name: menu?.name || '',
    description: menu?.description || '',
    // Convertir centimes -> euros pour l'affichage
    basePrice: menu?.basePrice ? centsToEuros(menu.basePrice).toString() : '',
    isActive: menu?.isActive ?? true,
    vatRate: menu?.vatRate?.toString() || '10', // Default to 10% VAT
    categories: menu?.categories?.map(cat => ({
      id: cat.id,
      itemTypeId: cat.itemTypeId,
      isRequired: cat.isRequired,
      maxSelections: cat.maxSelections?.toString() || '1',
      // Convertir centimes -> euros pour l'affichage
      priceModifier: cat.priceModifier ? centsToEuros(cat.priceModifier).toString() : '0',
    })) || []
  });

  const [localCategoryItems, setLocalCategoryItems] = useState<Record<number, LocalMenuCategoryItem[]>>({});

  const [categorySelections, setCategorySelections] = useState<Record<number, CategorySelection>>({});


  // Charger les items une seule fois au montage si on est en mode édition
  useEffect(() => {
    if (menu?.id && menu.categories) {
      const loadInitialItems = () => {
        menu.categories.forEach((category, index) => {
          if (category.id) {
            const existingItems = onLoadMenuCategoryItems(category.id);
            const localItems = existingItems.map((item, itemIndex) => ({
              tempId: `existing-${category.id}-${itemIndex}`,
              originalId: item.id,
              itemId: item.itemId,
              // 💰 Convertir centimes -> euros pour l'affichage
              supplement: centsToEuros(typeof item.supplement === 'number' ? item.supplement : Number(item.supplement) || 0),
              isAvailable: item.isAvailable,
              item: items.find(i => i.id === item.itemId),
              isModified: false,
              isDeleted: false
            }));

            setLocalCategoryItems(prev => ({
              ...prev,
              [index]: localItems
            }));
          }
        });
      };

      loadInitialItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu?.id]); // Uniquement quand l'ID du menu change

  useEffect(() => {
    const selections: Record<number, CategorySelection> = {};
    formData.categories.forEach((cat, index) => {
      const itemType = itemTypes.find(type => type.id === cat.itemTypeId);
      if (itemType && itemType.id) {
        selections[index] = {
          value: itemType.name,
          label: itemType.name,
          id: itemType.id
        };
      }
    });
    setCategorySelections(selections);
  }, [formData.categories, itemTypes]);

  const updateFormField = useCallback((field: keyof MenuFormData, value: MenuFormData[keyof MenuFormData]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateCategory = useCallback((index: number, field: keyof MenuCategoryFormData, value: string | boolean) => {
    // Si on change le type de catégorie, on doit marquer tous les items comme supprimés
    if (field === 'itemTypeId') {
      const oldItemTypeId = formData.categories[index]?.itemTypeId;
      if (oldItemTypeId !== value && oldItemTypeId) {
        setLocalCategoryItems(prev => {
          const currentItems = prev[index] || [];
          const clearedItems = currentItems
            .filter(item => item.originalId)
            .map(item => ({ ...item, isDeleted: true }));

          return {
            ...prev,
            [index]: clearedItems
          };
        });
      }
    }

    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map((cat, i) =>
        i === index ? { ...cat, [field]: value } : cat
      )
    }));
  }, [formData.categories]);

  const addCategory = useCallback(() => {
    const newCategory: MenuCategoryFormData = {
      itemTypeId: '',
      isRequired: true,
      maxSelections: '1',
      priceModifier: '0',
    };

    const newCategoryIndex = formData.categories.length;

    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));

    // Initialiser le tableau d'items pour la nouvelle catégorie
    setLocalCategoryItems(prev => ({
      ...prev,
      [newCategoryIndex]: []
    }));

    showToast('Nouvelle catégorie ajoutée', 'success');
  }, [showToast, formData.categories.length]);

  const removeCategory = useCallback((index: number, confirmationContext: AdminConfirmationContext | null) => {
    const categoryToRemove = formData.categories[index];
    if (!categoryToRemove || !confirmationContext) return;

    const itemType = itemTypes.find(type => type.id === categoryToRemove.itemTypeId);
    const categoryName = itemType?.name || `Catégorie ${index + 1}`;

    confirmationContext.showConfirmation({
      entityName: categoryName,
      entityType: 'la catégorie',
      onCancel: () => confirmationContext.hideConfirmation(),
      onConfirm: async () => {
        setFormData(prev => ({
          ...prev,
          categories: prev.categories.filter((_, i) => i !== index)
        }));

        const reindexRecord = <T,>(record: Record<number, T>, removedIndex: number): Record<number, T> => {
          const result: Record<number, T> = {};
          Object.entries(record).forEach(([key, value]) => {
            const idx = parseInt(key);
            if (idx < removedIndex) result[idx] = value;
            else if (idx > removedIndex) result[idx - 1] = value;
          });
          return result;
        };

        setCategorySelections(prev => reindexRecord(prev, index));
        setLocalCategoryItems(prev => reindexRecord(prev, index));

        showToast('Catégorie supprimée', 'success');
      }
    });
  }, [formData.categories, itemTypes, showToast]);

  const removeItemFromCategory = useCallback((categoryIndex: number, tempId: string) => {
    const item = localCategoryItems[categoryIndex]?.find(i => i.tempId === tempId);

    // Toujours travailler en mode draft
    if (item?.originalId) {
      // Si l'item existe en base, le marquer comme supprimé (sera supprimé à la validation)
      setLocalCategoryItems(prev => ({
        ...prev,
        [categoryIndex]: prev[categoryIndex]?.map(i =>
          i.tempId === tempId
            ? { ...i, isDeleted: true }
            : i
        ) || []
      }));
    } else {
      // Si c'est un nouvel item non sauvegardé, le retirer complètement
      setLocalCategoryItems(prev => ({
        ...prev,
        [categoryIndex]: prev[categoryIndex]?.filter(i => i.tempId !== tempId) || []
      }));
    }

  }, [localCategoryItems]);

  const addItemToCategoryDirect = useCallback((categoryIndex: number, itemId: string, supplement: number, isAvailable: boolean) => {
    const existing = localCategoryItems[categoryIndex]?.find(item =>
      item.itemId === itemId && !item.isDeleted
    );

    if (existing) {
      showToast('Cet article est déjà dans la catégorie', 'error');
      return;
    }

    const selectedItem = items.find(i => i.id === itemId);

    const newItem: LocalMenuCategoryItem = {
      tempId: `new-${categoryIndex}-${Date.now()}`,
      itemId,
      supplement,
      isAvailable,
      item: selectedItem,
      isModified: false,
      isDeleted: false
    };

    setLocalCategoryItems(prev => {
      const newItems = [...(prev[categoryIndex] || []), newItem];
      return {
        ...prev,
        [categoryIndex]: newItems
      };
    });

  }, [localCategoryItems, items]);

  const updateItemInCategory = useCallback((categoryIndex: number, tempId: string, supplement: number, isAvailable: boolean) => {
    setLocalCategoryItems(prev => ({
      ...prev,
      [categoryIndex]: prev[categoryIndex]?.map(item =>
        item.tempId === tempId
          ? {
              ...item,
              supplement,
              isAvailable,
              isModified: true
            }
          : item
      ) || []
    }));

  }, []);

  const toggleItemAvailability = useCallback((categoryIndex: number, tempId: string) => {
    setLocalCategoryItems(prev => ({
      ...prev,
      [categoryIndex]: prev[categoryIndex]?.map(item =>
        item.tempId === tempId
          ? {
              ...item,
              isAvailable: !item.isAvailable,
              isModified: true
            }
          : item
      ) || []
    }));
  }, []);

  const getMenuData = useCallback((): Menu => {
    return {
      id: menu?.id,
      name: formData.name,
      description: formData.description,
      // Convertir euros -> centimes pour l'envoi API
      basePrice: eurosToCents(parseFloat(formData.basePrice)),
      isActive: formData.isActive,
      vatRate: parseFloat(formData.vatRate) || 10, // Include VAT rate
      categories: formData.categories.map((cat, index) => ({
        id: cat.id,
        menuId: menu?.id,
        itemTypeId: cat.itemTypeId,
        isRequired: cat.isRequired,
        maxSelections: parseInt(cat.maxSelections) || 1,
        // 💰 Convertir euros -> centimes pour l'envoi API
        priceModifier: eurosToCents(parseFloat(cat.priceModifier) || 0),
        itemType: itemTypes.find(type => type.id === cat.itemTypeId) ?? null,
        // 💰 Convertir les suppléments euros -> centimes pour l'envoi API
        localItems: (localCategoryItems[index] || []).map(item => ({
          ...item,
          supplement: eurosToCents(typeof item.supplement === 'number' ? item.supplement : parseFloat(item.supplement) || 0)
        }))
      } as any))
    } as Menu;
  }, [menu, formData, localCategoryItems, itemTypes]);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      basePrice: '',
      isActive: true,
      vatRate: '10', // Default to 10% VAT
      categories: []
    });
    setLocalCategoryItems({});
    setCategorySelections({});
  }, []);

  const restoreCategoryItems = useCallback((categoryIndex: number, snapshot: LocalMenuCategoryItem[]) => {
    setLocalCategoryItems(prev => ({
      ...prev,
      [categoryIndex]: snapshot,
    }));
  }, []);

  return {
    formData,
    localCategoryItems,
    categorySelections,

    updateFormField,
    updateCategory,
    addCategory,
    removeCategory,

    addItemToCategoryDirect,
    removeItemFromCategory,
    updateItemInCategory,
    toggleItemAvailability,

    getMenuData,
    resetForm,
    restoreCategoryItems,
  };
};