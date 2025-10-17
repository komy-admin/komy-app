import { useState, useCallback, useEffect } from 'react';
import {
  MenuFormData,
  MenuCategoryFormData,
  LocalMenuCategoryItem,
  CategoryItemFormData
} from '~/components/Menu/MenuEditor/MenuEditor.types';
import { Menu, MenuCategoryItem } from '~/types/menu.types';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { useToast } from '~/components/ToastProvider';
import { centsToEuros, eurosToCents } from '~/lib/utils';

interface UseMenuEditorProps {
  menu?: Menu | null;
  items: Item[];
  itemTypes: ItemType[];
  onLoadMenuCategoryItems: (menuCategoryId: string) => MenuCategoryItem[];
  onCreateMenuCategoryItem?: (data: Partial<MenuCategoryItem>) => Promise<MenuCategoryItem>;
}

interface UseMenuEditorReturn {
  formData: MenuFormData;
  errors: Record<string, string>;
  localCategoryItems: Record<number, LocalMenuCategoryItem[]>;
  categorySelections: Record<number, any>;
  showAddItemForm: Record<string, boolean>;
  itemFormData: Record<string, CategoryItemFormData>;
  editingItem: { categoryIndex: number; tempId: string } | null;
  editItemData: { supplement: string; isAvailable: boolean };
  
  updateFormField: (field: keyof MenuFormData, value: any) => void;
  updateCategory: (index: number, field: keyof MenuCategoryFormData, value: any) => void;
  addCategory: () => void;
  removeCategory: (index: number, confirmationContext: any) => void;
  validateForm: () => Record<string, string>;
  
  toggleAddItemForm: (categoryIndex: number) => void;
  updateItemFormData: (categoryIndex: number, field: keyof CategoryItemFormData, value: any) => void;
  addItemToCategory: (categoryIndex: number) => void;
  addItemToCategoryDirect: (categoryIndex: number, itemId: string, supplement: number, isAvailable: boolean) => void;
  removeItemFromCategory: (categoryIndex: number, tempId: string) => void;
  updateItemInCategory: (categoryIndex: number, tempId: string, supplement: number, isAvailable: boolean) => void;
  startEditingItem: (categoryIndex: number, tempId: string) => void;
  updateEditItemData: (field: 'supplement' | 'isAvailable', value: any) => void;
  saveEditedItem: () => void;
  cancelEditingItem: () => void;
  toggleItemAvailability: (categoryIndex: number, tempId: string) => void;
  
  getMenuData: () => Menu | null;
  resetForm: () => void;
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
    // 💰 Convertir centimes -> euros pour l'affichage
    basePrice: menu?.basePrice ? centsToEuros(menu.basePrice).toString() : '',
    isActive: menu?.isActive ?? true,
    categories: menu?.categories?.map(cat => ({
      id: cat.id,
      itemTypeId: cat.itemTypeId,
      isRequired: cat.isRequired,
      maxSelections: cat.maxSelections?.toString() || '1',
      // 💰 Convertir centimes -> euros pour l'affichage
      priceModifier: cat.priceModifier ? centsToEuros(cat.priceModifier).toString() : '0',
    })) || []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [localCategoryItems, setLocalCategoryItems] = useState<Record<number, LocalMenuCategoryItem[]>>({});

  const [showAddItemForm, setShowAddItemForm] = useState<Record<string, boolean>>({});
  const [itemFormData, setItemFormData] = useState<Record<string, CategoryItemFormData>>({});
  const [categorySelections, setCategorySelections] = useState<Record<number, any>>({});
  const [editingItem, setEditingItem] = useState<{ categoryIndex: number; tempId: string } | null>(null);
  const [editItemData, setEditItemData] = useState<{ supplement: string; isAvailable: boolean }>({ 
    supplement: '0', 
    isAvailable: true 
  });


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
    const selections: Record<number, any> = {};
    formData.categories.forEach((cat, index) => {
      const itemType = itemTypes.find(type => type.id === cat.itemTypeId);
      if (itemType) {
        selections[index] = {
          value: itemType.name,
          label: itemType.name,
          id: itemType.id
        };
      }
    });
    setCategorySelections(selections);
  }, [formData.categories, itemTypes]);

  const validateForm = useCallback((): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est obligatoire';
    }

    const basePrice = parseFloat(formData.basePrice);
    if (!formData.basePrice || isNaN(basePrice) || basePrice < 0) {
      newErrors.basePrice = 'Le prix de base doit être un nombre positif';
    }

    if (formData.categories.length === 0) {
      newErrors.categories = 'Au moins une catégorie est requise';
    }

    formData.categories.forEach((category, index) => {
      if (!category.itemTypeId) {
        newErrors[`category_${index}_type`] = 'Type d\'item requis';
      }

      const maxSelections = parseInt(category.maxSelections);
      if (!category.maxSelections.trim() || isNaN(maxSelections) || maxSelections < 1) {
        newErrors[`category_${index}_max`] = 'Au moins 1 sélection requise';
      }

      const priceModifier = parseFloat(category.priceModifier);
      if (isNaN(priceModifier) || priceModifier < 0) {
        newErrors[`category_${index}_price`] = 'Le modificateur de prix doit être un nombre positif ou zéro';
      }
    });

    setErrors(newErrors);
    return newErrors;
  }, [formData]);

  const updateFormField = useCallback((field: keyof MenuFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateCategory = useCallback((index: number, field: keyof MenuCategoryFormData, value: any) => {
    // Si on change le type de catégorie, on doit marquer tous les items comme supprimés
    if (field === 'itemTypeId') {
      const oldItemTypeId = formData.categories[index].itemTypeId;
      if (oldItemTypeId !== value && oldItemTypeId) {
        setLocalCategoryItems(prev => {
          const currentItems = prev[index] || [];
          // Marquer tous les items existants comme supprimés et retirer les nouveaux
          const clearedItems = currentItems
            .filter(item => item.originalId) // Garder seulement ceux qui existent en base
            .map(item => ({ ...item, isDeleted: true })); // Les marquer comme supprimés

          return {
            ...prev,
            [index]: clearedItems
          };
        });
        showToast('Articles de la catégorie précédente retirés', 'info');
      }
    }

    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map((cat, i) =>
        i === index ? { ...cat, [field]: value } : cat
      )
    }));
  }, [formData.categories, showToast]);

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

  const removeCategory = useCallback((index: number, confirmationContext: any) => {
    const categoryToRemove = formData.categories[index];
    const itemType = itemTypes.find(type => type.id === categoryToRemove.itemTypeId);
    const categoryName = itemType?.name || `Catégorie ${index + 1}`;

    if (!confirmationContext) {
      return;
    }

    confirmationContext.showConfirmation({
      entityName: categoryName,
      entityType: 'la catégorie',
      onConfirm: async () => {
        setFormData(prev => ({
          ...prev,
          categories: prev.categories.filter((_, i) => i !== index)
        }));

        const newSelections: Record<number, any> = {};
        Object.entries(categorySelections).forEach(([key, value]) => {
          const idx = parseInt(key);
          if (idx < index) {
            newSelections[idx] = value;
          } else if (idx > index) {
            newSelections[idx - 1] = value;
          }
        });
        setCategorySelections(newSelections);

        const newLocalItems: Record<number, LocalMenuCategoryItem[]> = {};
        Object.entries(localCategoryItems).forEach(([key, value]) => {
          const idx = parseInt(key);
          if (idx < index) {
            newLocalItems[idx] = value;
          } else if (idx > index) {
            newLocalItems[idx - 1] = value;
          }
        });
        setLocalCategoryItems(newLocalItems);

        showToast('Catégorie supprimée', 'success');
      }
    });
  }, [formData.categories, itemTypes, categorySelections, localCategoryItems, showToast]);

  const toggleAddItemForm = useCallback((categoryIndex: number) => {
    const key = `category_${categoryIndex}`;
    setShowAddItemForm(prev => ({
      ...prev,
      [key]: !prev[key]
    }));

    if (!itemFormData[key]) {
      setItemFormData(prev => ({
        ...prev,
        [key]: {
          itemId: '',
          supplement: '0',
          isAvailable: true
        }
      }));
    }
  }, [itemFormData]);

  const updateItemFormData = useCallback((categoryIndex: number, field: keyof CategoryItemFormData, value: any) => {
    const key = `category_${categoryIndex}`;
    setItemFormData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  }, []);

  const addItemToCategory = useCallback(async (categoryIndex: number) => {
    const key = `category_${categoryIndex}`;
    const formItem = itemFormData[key];

    if (!formItem?.itemId) {
      showToast('Veuillez sélectionner un article', 'error');
      return;
    }

    const existing = localCategoryItems[categoryIndex]?.find(item =>
      item.itemId === formItem.itemId && !item.isDeleted
    );

    if (existing) {
      showToast('Cet article est déjà dans la catégorie', 'error');
      return;
    }

    const selectedItem = items.find(i => i.id === formItem.itemId);
    const supplement = parseFloat(formItem.supplement) || 0;

    // Toujours travailler en mode draft jusqu'à la validation finale
    // Ajouter l'item localement (mode draft)
    const newItem: LocalMenuCategoryItem = {
      tempId: `new-${categoryIndex}-${Date.now()}`,
      itemId: formItem.itemId,
      supplement,
      isAvailable: formItem.isAvailable,
      item: selectedItem,
      isModified: false,
      isDeleted: false
    };

    setLocalCategoryItems(prev => {
      // Créer une nouvelle référence pour forcer le re-render
      const newItems = [...(prev[categoryIndex] || []), newItem];
      const updated = {
        ...prev,
        [categoryIndex]: newItems
      };
      return updated;
    });

    showToast('Article ajouté (sera sauvegardé à la validation)', 'success');

    setShowAddItemForm(prev => ({
      ...prev,
      [key]: false
    }));

    setItemFormData(prev => ({
      ...prev,
      [key]: {
        itemId: '',
        supplement: '0',
        isAvailable: true
      }
    }));
  }, [itemFormData, localCategoryItems, items, showToast, formData.categories, menu, onCreateMenuCategoryItem]);

  const removeItemFromCategory = useCallback(async (categoryIndex: number, tempId: string) => {
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

    showToast('Article retiré (sera sauvegardé à la validation)', 'success');
  }, [localCategoryItems, showToast]);

  const startEditingItem = useCallback((categoryIndex: number, tempId: string) => {
    const item = localCategoryItems[categoryIndex]?.find(i => i.tempId === tempId);
    if (item) {
      setEditingItem({ categoryIndex, tempId });
      setEditItemData({
        supplement: item.supplement.toString(),
        isAvailable: item.isAvailable
      });
    }
  }, [localCategoryItems]);

  const updateEditItemData = useCallback((field: 'supplement' | 'isAvailable', value: any) => {
    setEditItemData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const saveEditedItem = useCallback(() => {
    if (!editingItem) return;

    const { categoryIndex, tempId } = editingItem;

    setLocalCategoryItems(prev => ({
      ...prev,
      [categoryIndex]: prev[categoryIndex]?.map(item =>
        item.tempId === tempId
          ? {
              ...item,
              supplement: parseFloat(editItemData.supplement) || 0,
              isAvailable: editItemData.isAvailable,
              isModified: true
            }
          : item
      ) || []
    }));

    setEditingItem(null);
    setEditItemData({ supplement: '0', isAvailable: true });
    showToast('Article modifié avec succès', 'success');
  }, [editingItem, editItemData, showToast]);

  const cancelEditingItem = useCallback(() => {
    setEditingItem(null);
    setEditItemData({ supplement: '0', isAvailable: true });
  }, []);

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

    showToast('Article ajouté (sera sauvegardé à la validation)', 'success');
  }, [localCategoryItems, items, showToast]);

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

    showToast('Article modifié avec succès', 'success');
  }, [showToast]);

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

  const getMenuData = useCallback((): Menu | null => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      return null;
    }

    return {
      id: menu?.id,
      name: formData.name,
      description: formData.description,
      // 💰 Convertir euros -> centimes pour l'envoi API
      basePrice: eurosToCents(parseFloat(formData.basePrice)),
      isActive: formData.isActive,
      categories: formData.categories.map((cat, index) => ({
        id: cat.id,
        menuId: menu?.id,
        itemTypeId: cat.itemTypeId,
        isRequired: cat.isRequired,
        maxSelections: parseInt(cat.maxSelections) || 1,
        // 💰 Convertir euros -> centimes pour l'envoi API
        priceModifier: eurosToCents(parseFloat(cat.priceModifier) || 0),
        itemType: itemTypes.find(type => type.id === cat.itemTypeId)!,
        // 💰 Convertir les suppléments euros -> centimes pour l'envoi API
        localItems: (localCategoryItems[index] || []).map(item => ({
          ...item,
          supplement: eurosToCents(typeof item.supplement === 'number' ? item.supplement : parseFloat(item.supplement) || 0)
        }))
      } as any))
    } as Menu;
  }, [menu, formData, localCategoryItems, itemTypes, validateForm]);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      basePrice: '',
      isActive: true,
      categories: []
    });
    setLocalCategoryItems({});
    setErrors({});
    setCategorySelections({});
  }, []);

  return {
    formData,
    errors,
    localCategoryItems,
    categorySelections,
    showAddItemForm,
    itemFormData,
    editingItem,
    editItemData,
    
    updateFormField,
    updateCategory,
    addCategory,
    removeCategory,
    validateForm,
    
    toggleAddItemForm,
    updateItemFormData,
    addItemToCategory,
    addItemToCategoryDirect,
    removeItemFromCategory,
    updateItemInCategory,
    startEditingItem,
    updateEditItemData,
    saveEditedItem,
    cancelEditingItem,
    toggleItemAvailability,
    
    getMenuData,
    resetForm
  };
};