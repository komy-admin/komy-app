import React, { forwardRef, useImperativeHandle, useState, useCallback, useEffect, useMemo } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { Plus, Settings } from 'lucide-react-native';
import { Text } from '~/components/ui';
import { SectionHeader } from '~/components/admin/SectionHeader';
import { MenuBasicInfo } from './MenuBasicInfo';
import { CategoryEditor } from './CategoryEditor';
import { CategoryItemAssignment } from './CategoryItemAssignment';
import { ItemSelectionPanelContent } from './ItemSelectionPanel';
import { SlidePanel } from '~/components/ui/SlidePanel';
import { MenuEditorProps, MenuEditorRef, LocalMenuCategoryItem } from './MenuEditor.types';
import { useMenuEditor } from '~/hooks/menu/useMenuEditor';
import { useToast } from '~/components/ToastProvider';
import { AdminFormData } from '~/components/admin/AdminFormView';
import { Menu } from '~/types/menu.types';
import { usePanelPortal } from '~/hooks/usePanelPortal';

export const MenuEditor = forwardRef<MenuEditorRef, MenuEditorProps>(({
  menu,
  items,
  itemTypes,
  onLoadMenuCategoryItems,
  onCreateMenuCategoryItem,
  scrollViewRef,
  confirmationContext,
}, ref) => {
  const { showToast } = useToast();
  const { renderPanel, clearPanel } = usePanelPortal();
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});
  const [panelVisible, setPanelVisible] = useState(false);
  const [panelCategoryIndex, setPanelCategoryIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<LocalMenuCategoryItem | null>(null);

  const {
    formData,
    errors,
    localCategoryItems,

    updateFormField,
    updateCategory,
    addCategory,
    removeCategory,
    validateForm,

    addItemToCategoryDirect,
    removeItemFromCategory,
    updateItemInCategory,
    toggleItemAvailability,

    getMenuData,
    resetForm
  } = useMenuEditor({
    menu,
    items,
    itemTypes,
    onLoadMenuCategoryItems,
    onCreateMenuCategoryItem
  });

  const toggleCategoryExpansion = useCallback((index: number) => {
    setExpandedCategories(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  }, []);

  const handleAddCategory = useCallback(() => {
    addCategory();
    const newIndex = formData.categories.length;
    setExpandedCategories(prev => ({
      ...prev,
      [newIndex]: true
    }));

    setTimeout(() => {
      scrollViewRef?.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [addCategory, formData.categories.length, scrollViewRef]);

  const handleRemoveCategory = useCallback((index: number) => {
    removeCategory(index, confirmationContext);

    const newExpanded: Record<number, boolean> = {};
    Object.entries(expandedCategories).forEach(([key, value]) => {
      const idx = parseInt(key);
      if (idx < index) {
        newExpanded[idx] = value;
      } else if (idx > index) {
        newExpanded[idx - 1] = value;
      }
    });
    setExpandedCategories(newExpanded);
  }, [removeCategory, confirmationContext, expandedCategories]);

  const getCategoryItems = useCallback((itemTypeId: string) => {
    return items.filter(item =>
      item.itemType?.id === itemTypeId &&
      item.isActive
    );
  }, [items]);

  const handleOpenAddPanel = useCallback((categoryIndex: number) => {
    setPanelCategoryIndex(categoryIndex);
    setEditingItem(null);
    setPanelVisible(true);
  }, []);

  const handleOpenEditPanel = useCallback((categoryIndex: number, item: LocalMenuCategoryItem) => {
    setPanelCategoryIndex(categoryIndex);
    setEditingItem(item);
    setPanelVisible(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setPanelVisible(false);
    setPanelCategoryIndex(null);
    setEditingItem(null);
  }, []);

  const handleSelectItem = useCallback((itemId: string, supplement: number, isAvailable: boolean) => {
    if (panelCategoryIndex === null) return;

    if (editingItem) {
      // Mode édition
      updateItemInCategory(panelCategoryIndex, editingItem.tempId, supplement, isAvailable);
    } else {
      // Mode ajout
      addItemToCategoryDirect(panelCategoryIndex, itemId, supplement, isAvailable);
    }
    // Panel will be closed by child via onClose after onSelectItem
  }, [panelCategoryIndex, editingItem, addItemToCategoryDirect, updateItemInCategory]);

  // Memoize currentCategoryItems to prevent infinite loop
  // Filter out items that are already assigned to this category
  const currentCategoryItems = useMemo(() => {
    if (panelCategoryIndex === null) return [];

    const allItems = getCategoryItems(formData.categories[panelCategoryIndex]?.itemTypeId);
    const assignedItemIds = (localCategoryItems[panelCategoryIndex] || [])
      .filter(item => !item.isDeleted)
      .map(item => item.itemId);

    return allItems.filter(item => !assignedItemIds.includes(item.id));
  }, [panelCategoryIndex, formData.categories, getCategoryItems, localCategoryItems]);

  // Memoize editData to prevent infinite loop
  const editData = useMemo(() => {
    if (!editingItem) return undefined;
    return {
      itemId: editingItem.itemId,
      itemName: editingItem.item?.name || '',
      supplement: editingItem.supplement.toString(),
      isAvailable: editingItem.isAvailable,
    };
  }, [editingItem]);

  // Sync panel avec le portal global
  useEffect(() => {
    if (panelVisible && panelCategoryIndex !== null) {
      renderPanel(
        <SlidePanel visible={true} onClose={handleClosePanel} width={430}>
          <ItemSelectionPanelContent
            availableItems={currentCategoryItems}
            onClose={handleClosePanel}
            onSelectItem={handleSelectItem}
            mode={editingItem ? 'edit' : 'add'}
            editData={editData}
          />
        </SlidePanel>
      );
    } else if (!panelVisible) {
      clearPanel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      clearPanel();
    };
  }, [panelVisible, panelCategoryIndex, currentCategoryItems, editingItem, editData]);

  useImperativeHandle(ref, () => ({
    getFormData: (): AdminFormData<Menu> => {
      const newErrors = validateForm();
      const isValid = Object.keys(newErrors).length === 0;

      if (!isValid) {
        showToast('Veuillez corriger les erreurs dans le formulaire', 'error');
      }

      const menuData = isValid ? getMenuData() : null;

      return {
        data: menuData!,
        isValid,
        errors: newErrors
      };
    },

    resetForm: () => {
      resetForm();
      setExpandedCategories({});
    },

    validateForm: () => {
      const newErrors = validateForm();
      if (Object.keys(newErrors).length > 0) {
        showToast(Object.values(newErrors)[0] as string, 'error');
      }
      return Object.keys(newErrors).length === 0;
    }
  }), [validateForm, showToast, getMenuData, resetForm]);

  return (
    <View style={styles.container}>
      <View style={styles.formGrid}>
        <MenuBasicInfo
          formData={formData}
          errors={errors}
          onUpdateField={updateFormField}
        />

        <View style={styles.section}>
          <SectionHeader
            icon={Settings}
            title="2. Catégories et articles"
            subtitle="Configurez les catégories du menu et assignez des articles"
          />

          {errors.categories && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errors.categories}</Text>
            </View>
          )}

          <View style={styles.categoriesList}>
            {formData.categories.map((category, index) => {
              const isExpanded = expandedCategories[index] ?? false;
              const allCategoryItems = getCategoryItems(category.itemTypeId);
              const currentCategoryItems = localCategoryItems[index] || [];

              // Filter out items that are already assigned to this category
              const assignedItemIds = currentCategoryItems
                .filter(item => !item.isDeleted)
                .map(item => item.itemId);
              const availableCategoryItems = allCategoryItems.filter(item => !assignedItemIds.includes(item.id));

              return (
                <View key={index}>
                  <CategoryEditor
                    category={category}
                    categoryIndex={index}
                    itemTypes={itemTypes}
                    errors={errors}
                    isExpanded={isExpanded}
                    onToggleExpand={() => toggleCategoryExpansion(index)}
                    onUpdateCategory={updateCategory}
                    onRemoveCategory={handleRemoveCategory}
                  >
                    {category.itemTypeId && (
                      <CategoryItemAssignment
                        categoryIndex={index}
                        localItems={currentCategoryItems}
                        availableItems={availableCategoryItems}
                        onOpenAddPanel={() => handleOpenAddPanel(index)}
                        onOpenEditPanel={(item) => handleOpenEditPanel(index, item)}
                        onRemoveItem={(tempId) => removeItemFromCategory(index, tempId)}
                        onToggleItemAvailability={(tempId) => toggleItemAvailability(index, tempId)}
                      />
                    )}
                  </CategoryEditor>
                </View>
              );
            })}
          </View>

          <Pressable onPress={handleAddCategory} style={styles.addCategoryButton}>
            <Plus size={20} color="#3B82F6" />
            <Text style={styles.addCategoryButtonText}>Ajouter une catégorie</Text>
          </Pressable>
        </View>

        {/* Panel rendu via usePanelPortal - pas de rendu local nécessaire */}
      </View>
    </View>
  );
});

MenuEditor.displayName = 'MenuEditor';

export type { MenuEditorProps, MenuEditorRef } from './MenuEditor.types';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formGrid: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    ...Platform.select({
      ios: { elevation: 2 },
      android: { elevation: 0.5 },
      web: { elevation: 2 },
    }),
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 14,
  },
  categoriesList: {
    marginBottom: 16,
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
  },
  addCategoryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 8,
  },
});