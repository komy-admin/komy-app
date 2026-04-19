import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Pressable,
  Keyboard, Platform, ScrollView, Animated,
} from 'react-native';
import {
  X, ArrowLeftToLine, Plus, Trash2, Package, Eye, EyeOff, Lock,
} from 'lucide-react-native';
import { Menu, MenuCategoryItem } from '~/types/menu.types';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { NumberInput } from '~/components/ui/number-input';
import { VatRateSelector } from '~/components/ui/vat-rate-selector';
import { SelectButton } from '~/components/ui/select-button';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';
import { useMenuEditor } from '~/hooks/menu/useMenuEditor';
import { useToast } from '~/components/ToastProvider';
import { getColorWithOpacity, darkenColor } from '~/lib/color-utils';
import { useFormErrors } from '~/hooks/useFormErrors';
import { FormFieldError } from '~/components/ui/FormFieldError';
import { LocalMenuCategoryItem, MenuCategoryFormData } from './MenuEditor/MenuEditor.types';
import { colors } from '~/theme';

// ============================================================
// Types
// ============================================================

type PanelView = 'main' | 'category' | 'items';

interface MenuFormContentProps {
  menu: Menu | null;
  items: Item[];
  itemTypes: ItemType[];
  onSave: (menuData: Partial<Menu>) => Promise<void>;
  onCancel: () => void;
  onLoadMenuCategoryItems: (menuCategoryId: string) => MenuCategoryItem[];
  onCreateMenuCategoryItem: (data: Partial<MenuCategoryItem>) => Promise<MenuCategoryItem>;
}

// ============================================================
// Constants
// ============================================================

const supplementContainerStyle = { minHeight: 32 };
const flexStyle = { flex: 1 };

// ============================================================
// Inline delete overlay (second-click to confirm)
// ============================================================

const InlineDeleteOverlay: React.FC<{ onConfirm: () => void }> = ({ onConfirm }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.inlineDeleteOverlay, { opacity }]}>
      <Pressable onPress={onConfirm} style={styles.inlineDeleteOverlayButton}>
        <Trash2 size={16} color={colors.white} strokeWidth={2} />
        <Text style={styles.inlineDeleteOverlayText}>Supprimer</Text>
      </Pressable>
    </Animated.View>
  );
};

// ============================================================
// Component
// ============================================================

export const MenuFormContent: React.FC<MenuFormContentProps> = ({
  menu,
  items,
  itemTypes,
  onSave,
  onCancel,
  onLoadMenuCategoryItems,
  onCreateMenuCategoryItem,
}) => {
  const { showToast } = useToast();
  const isEditing = !!menu;

  // Navigation
  const [currentView, setCurrentView] = useState<PanelView>('main');
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const formErrors = useFormErrors({
    'menu.name': 'name',
    'menu.basePrice': 'basePrice',
    'menu.description': 'description',
    'menu.vatRate': 'vatRate',
  });

  // Inline delete confirmation (category + article)
  const [pendingDeleteCategoryIndex, setPendingDeleteCategoryIndex] = useState<number | null>(null);
  const [pendingDeleteItemTempId, setPendingDeleteItemTempId] = useState<string | null>(null);

  // Track if current category is newly added (not yet validated)
  const [isNewCategory, setIsNewCategory] = useState(false);

  // Track which items have supplement input open
  const [openSupplements, setOpenSupplements] = useState<Set<string>>(new Set());

  // Snapshot of items before entering selection grid (for undo on back)
  const itemsSnapshotRef = useRef<LocalMenuCategoryItem[] | null>(null);

  // Snapshot of entire category state for undo on back (existing categories only)
  const categorySnapshotRef = useRef<{
    categoryData: MenuCategoryFormData;
    categoryItems: LocalMenuCategoryItem[];
  } | null>(null);

  // Description height
  const [descriptionHeight, setDescriptionHeight] = useState(44);

  // Business logic hook
  const editor = useMenuEditor({
    menu,
    items,
    itemTypes,
    onLoadMenuCategoryItems,
    onCreateMenuCategoryItem,
  });

  // ============================================================
  // Navigation handlers
  // ============================================================

  const navigateToCategory = useCallback((index: number) => {
    setIsNewCategory(false);
    setOpenSupplements(new Set());
    // Snapshot category state for undo on back
    categorySnapshotRef.current = {
      categoryData: { ...editor.formData.categories[index] },
      categoryItems: [...(editor.localCategoryItems[index] || [])].map(i => ({ ...i })),
    };
    setActiveCategoryIndex(index);
    setCurrentView('category');
  }, [editor.formData.categories, editor.localCategoryItems]);

  const handleAddCategory = useCallback(() => {
    editor.addCategory();
    formErrors.clearError('categories');
    const newIndex = editor.formData.categories.length;
    setIsNewCategory(true);
    setOpenSupplements(new Set());
    setActiveCategoryIndex(newIndex);
    setCurrentView('category');
  }, [editor]);

  const navigateBackToMain = useCallback(() => {
    if (isNewCategory && activeCategoryIndex !== null) {
      // Nouvelle catégorie non validée → on la supprime
      editor.removeCategory(activeCategoryIndex);
    } else if (!isNewCategory && activeCategoryIndex !== null && categorySnapshotRef.current) {
      // Catégorie existante → restaurer le snapshot (annuler les modifications)
      const snapshot = categorySnapshotRef.current;
      const updatedCategories = [...editor.formData.categories];
      updatedCategories[activeCategoryIndex] = snapshot.categoryData;
      editor.updateFormField('categories', updatedCategories);
      editor.restoreCategoryItems(activeCategoryIndex, snapshot.categoryItems);
    }
    categorySnapshotRef.current = null;
    setIsNewCategory(false);
    setOpenSupplements(new Set());
    setActiveCategoryIndex(null);
    setCurrentView('main');
  }, [isNewCategory, activeCategoryIndex, editor]);

  const navigateToItems = useCallback(() => {
    // Snapshot current items before entering selection
    if (activeCategoryIndex !== null) {
      itemsSnapshotRef.current = [...(editor.localCategoryItems[activeCategoryIndex] || [])];
    }
    setCurrentView('items');
  }, [activeCategoryIndex, editor.localCategoryItems]);

  const navigateBackToCategory = useCallback(() => {
    // Restore snapshot (cancel selection changes)
    if (activeCategoryIndex !== null && itemsSnapshotRef.current !== null) {
      editor.restoreCategoryItems(activeCategoryIndex, itemsSnapshotRef.current);
    }
    itemsSnapshotRef.current = null;
    setCurrentView('category');
  }, [activeCategoryIndex, editor]);

  const validateItemsSelection = useCallback(() => {
    // Keep changes, clear snapshot
    itemsSnapshotRef.current = null;
    setOpenSupplements(new Set());
    setCurrentView('category');
  }, []);

  // ============================================================
  // Category delete (local confirmation adapter)
  // ============================================================

  const handleRequestDeleteCategory = useCallback((index: number) => {
    setPendingDeleteCategoryIndex(prev => prev === index ? null : index);
  }, []);

  const handleConfirmDeleteCategory = useCallback((index: number) => {
    editor.removeCategory(index);
    formErrors.clearError('categories');
    setPendingDeleteCategoryIndex(null);

    if (activeCategoryIndex === index) {
      navigateBackToMain();
    }
  }, [editor, formErrors, activeCategoryIndex, navigateBackToMain]);

  // ============================================================
  // Save handler
  // ============================================================

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    formErrors.clearAll();

    const menuData = editor.getMenuData();
    setIsSaving(true);
    try {
      await onSave(menuData);
    } catch (error) {
      formErrors.handleError({ error, showToast, fallback: 'Erreur lors de la sauvegarde du menu' });
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, editor, onSave, formErrors, showToast]);

  // ============================================================
  // RENDER: Items selection view
  // ============================================================

  if (currentView === 'items' && activeCategoryIndex !== null) {
    const category = editor.formData.categories[activeCategoryIndex];
    const categoryItems = (editor.localCategoryItems[activeCategoryIndex] || []).filter(i => !i.isDeleted);
    const allTypeItems = items.filter(i => i.itemType?.id === category?.itemTypeId);
    const assignedIds = categoryItems.map(ci => ci.itemId);

    return (
      <View style={styles.panelContent}>
        <View style={styles.panelHeaderBack}>
          <Pressable onPress={navigateBackToCategory} style={styles.backButtonIcon}>
            <ArrowLeftToLine size={20} color={colors.brand.dark} />
          </Pressable>
          <View style={styles.backTitleContainer}>
            <Text style={styles.backTitle} numberOfLines={1}>Sélectionner des articles</Text>
            <Text style={styles.backSubtitle} numberOfLines={1}>
              Sélection des articles
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >

          {allTypeItems.length > 0 ? (
            <View style={styles.itemsGrid}>
              {allTypeItems.map((item) => {
                const isAssigned = assignedIds.includes(item.id);
                const itemColor = item.color || '#6B7280';
                return (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.itemGridCard,
                      isAssigned
                        ? {
                            backgroundColor: getColorWithOpacity(itemColor, 0.08),
                            borderColor: itemColor,
                            borderStyle: 'solid' as const,
                          }
                        : styles.itemGridCardInactive,
                    ]}
                    onPress={() => {
                      if (isAssigned) {
                        const localItem = categoryItems.find(ci => ci.itemId === item.id);
                        if (localItem) editor.removeItemFromCategory(activeCategoryIndex, localItem.tempId);
                      } else {
                        editor.addItemToCategoryDirect(activeCategoryIndex, item.id, 0, true);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.itemGridCardName,
                        isAssigned
                          ? { color: darkenColor(itemColor, 0.35) }
                          : styles.itemGridCardNameInactive,
                      ]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Package size={24} color={colors.gray[300]} />
              <Text style={styles.emptyStateText}>Aucun article dans ce type</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.panelFooter}>
          <TouchableOpacity style={styles.cancelButton} onPress={navigateBackToCategory}>
            <Text style={styles.cancelButtonText}>Retour</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButtonBlue} onPress={validateItemsSelection}>
            <Text style={styles.saveButtonText}>
              Valider ({assignedIds.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================================
  // RENDER: Category edit view
  // ============================================================

  if (currentView === 'category' && activeCategoryIndex !== null) {
    const category = editor.formData.categories[activeCategoryIndex];
    const categoryItems = (editor.localCategoryItems[activeCategoryIndex] || []).filter(i => !i.isDeleted);
    const itemType = itemTypes.find(t => t.id === category?.itemTypeId);

    if (!category) {
      navigateBackToMain();
      return null;
    }

    return (
      <View style={styles.panelContent}>
        <View style={styles.panelHeaderBack}>
          <Pressable onPress={navigateBackToMain} style={styles.backButtonIcon}>
            <ArrowLeftToLine size={20} color={colors.brand.dark} />
          </Pressable>
          <View style={styles.backTitleContainer}>
            <Text style={styles.backTitle} numberOfLines={1}>
              {`Catégorie ${activeCategoryIndex + 1}${itemType ? ` - ${itemType.name}` : ''}`}
            </Text>
            <Text style={styles.backSubtitle} numberOfLines={1}>
              Configuration de la catégorie
            </Text>
          </View>
        </View>

        <KeyboardAwareScrollViewWrapper
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          bottomOffset={20}
          scrollEventThrottle={16}
        >
          <Pressable style={flexStyle} onPress={() => { setPendingDeleteItemTempId(null); if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
            {/* Type d'article */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Type d'article</Text>
              <View style={styles.itemTypeWrap}>
                {itemTypes.map((type) => (
                  <SelectButton
                    key={type.id}
                    label={type.name}
                    isActive={category.itemTypeId === type.id}
                    onPress={() => editor.updateCategory(activeCategoryIndex, 'itemTypeId', type.id)}
                    variant="sub"
                  />
                ))}
              </View>
            </View>

            {/* Configuration */}
            <View style={styles.formRow}>
              <View style={styles.formRowField}>
                <Text style={styles.formLabel}>Sélections max</Text>
                <NumberInput
                  value={category.maxSelections ? parseInt(category.maxSelections, 10) : null}
                  onChangeText={(val) =>
                    editor.updateCategory(activeCategoryIndex, 'maxSelections', val !== null ? val.toString() : '')
                  }
                  decimalPlaces={0}
                  min={1}
                  max={99}
                  placeholder="1"
                  style={styles.formInput}
                />
              </View>
              <View style={styles.formRowField}>
                <Text style={styles.formLabel}>Supplément (€)</Text>
                <NumberInput
                  value={category.priceModifier ? parseFloat(category.priceModifier) : null}
                  onChangeText={(val) =>
                    editor.updateCategory(activeCategoryIndex, 'priceModifier', val !== null ? val.toString() : '0')
                  }
                  decimalPlaces={2}
                  min={0}
                  placeholder="0.00"
                  style={styles.formInput}
                />
              </View>
            </View>

            {/* Obligatoire */}
            <View style={styles.formGroup}>
              <TouchableOpacity
                style={[styles.toggleOption, category.isRequired && styles.toggleOptionWarning]}
                onPress={() => editor.updateCategory(activeCategoryIndex, 'isRequired', !category.isRequired)}
                activeOpacity={1}
              >
                <View style={[styles.toggleIndicator, category.isRequired && styles.toggleIndicatorWarning]} />
                <Text style={[styles.toggleText, category.isRequired && styles.toggleTextWarning]}>
                  {category.isRequired ? 'Obligatoire' : 'Optionnel'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Articles */}
            {category.itemTypeId ? (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Articles ({categoryItems.length})
                </Text>

                {(() => {
                  const hasArticles = items.some(i => i.itemType?.id === category.itemTypeId);
                  return (
                    <>
                      <TouchableOpacity
                        style={[styles.addArticlesButton, !hasArticles && styles.addArticlesButtonDisabled]}
                        onPress={hasArticles ? navigateToItems : undefined}
                        activeOpacity={hasArticles ? 0.7 : 1}
                      >
                        {hasArticles
                          ? <Plus size={18} color={colors.neutral[500]} strokeWidth={2} />
                          : <Lock size={16} color={colors.gray[400]} strokeWidth={2} />
                        }
                        <Text style={[styles.addArticlesText, !hasArticles && styles.addArticlesTextDisabled]}>
                          Sélectionner des articles
                        </Text>
                      </TouchableOpacity>
                      {!hasArticles && (
                        <Text style={styles.addArticlesHint}>
                          Aucun article dans ce type. Créez des articles d'abord.
                        </Text>
                      )}
                    </>
                  );
                })()}

                {/* Liste des articles assignés */}
                {categoryItems.length > 0 && (
                  <View style={styles.assignedItemsList}>
                    {categoryItems.map((ci) => {
                      const item = items.find(i => i.id === ci.itemId);
                      if (!item) return null;
                      const itemColor = item.color || '#6B7280';
                      return (
                        <View
                          key={ci.tempId}
                          style={[
                            styles.assignedItemCard,
                            { borderColor: itemColor, position: 'relative', overflow: 'hidden' },
                          ]}
                        >
                          <Text style={styles.assignedItemName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <View style={styles.assignedItemControls}>
                            {ci.supplement > 0 || openSupplements.has(ci.tempId) ? (
                              <View style={styles.supplementContainer}>
                                <NumberInput
                                  value={ci.supplement || null}
                                  onChangeText={(val) =>
                                    editor.updateItemInCategory(activeCategoryIndex, ci.tempId, val ?? 0, ci.isAvailable)
                                  }
                                  decimalPlaces={2}
                                  min={0}
                                  placeholder="0.00"
                                  currency="€"
                                  style={styles.assignedItemSupplement}
                                  containerStyle={supplementContainerStyle}
                                />
                              </View>
                            ) : (
                              <Pressable
                                style={styles.supplementButton}
                                onPress={() => setOpenSupplements(() => {
                                  const next = new Set<string>();
                                  categoryItems.forEach(item => {
                                    if (item.supplement > 0) next.add(item.tempId);
                                  });
                                  next.add(ci.tempId);
                                  return next;
                                })}
                              >
                                <Text style={styles.supplementButtonText}>Supplément</Text>
                              </Pressable>
                            )}
                            <Pressable
                              style={[
                                styles.assignedItemToggle,
                                ci.isAvailable ? styles.assignedItemToggleActive : styles.assignedItemToggleInactive,
                              ]}
                              onPress={() =>
                                editor.updateItemInCategory(activeCategoryIndex, ci.tempId, ci.supplement, !ci.isAvailable)
                              }
                            >
                              {ci.isAvailable
                                ? <Eye size={16} color={colors.success.base} strokeWidth={2} />
                                : <EyeOff size={16} color={colors.gray[400]} strokeWidth={2} />
                              }
                            </Pressable>
                            <Pressable
                              style={styles.assignedItemRemove}
                              onPress={() => setPendingDeleteItemTempId(prev => prev === ci.tempId ? null : ci.tempId)}
                            >
                              <X size={16} color={colors.error.base} strokeWidth={2} />
                            </Pressable>
                          </View>
                          {pendingDeleteItemTempId === ci.tempId && (
                            <InlineDeleteOverlay onConfirm={() => {
                              editor.removeItemFromCategory(activeCategoryIndex, ci.tempId);
                              setPendingDeleteItemTempId(null);
                            }} />
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Sélectionnez un type d'article</Text>
              </View>
            )}
          </Pressable>
        </KeyboardAwareScrollViewWrapper>

        <View style={styles.panelFooter}>
          <TouchableOpacity style={styles.cancelButton} onPress={navigateBackToMain}>
            <Text style={styles.cancelButtonText}>Retour</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButtonBlue, !category.itemTypeId && styles.saveButtonDisabled]}
            onPress={() => {
              categorySnapshotRef.current = null;
              setIsNewCategory(false);
              setActiveCategoryIndex(null);
              setCurrentView('main');
            }}
            disabled={!category.itemTypeId}
          >
            <Text style={styles.saveButtonText}>Valider</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================================
  // RENDER: Main view
  // ============================================================

  const getCategoryName = (cat: MenuCategoryFormData) => {
    return itemTypes.find(t => t.id === cat.itemTypeId)?.name || 'Non configurée';
  };

  const getCategoryItemCount = (index: number) => {
    return (editor.localCategoryItems[index] || []).filter(i => !i.isDeleted).length;
  };

  return (
    <View style={styles.panelContent}>
      <View style={styles.panelHeader}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.panelTitle} numberOfLines={1} ellipsizeMode="tail">
            {isEditing ? 'Modifier le menu' : 'Nouveau menu'}
          </Text>
          <Text style={styles.panelSubtitle} numberOfLines={2} ellipsizeMode="tail">
            {isEditing ? 'Modifier les informations du menu' : 'Créez un menu avec des catégories d\'articles'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onCancel}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={colors.neutral[500]} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollViewWrapper
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bottomOffset={20}
        scrollEventThrottle={16}
      >
        <Pressable style={flexStyle} onPress={() => { setPendingDeleteCategoryIndex(null); if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
          {/* Nom */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nom du menu</Text>
            <TextInput
              style={[styles.formInput, formErrors.hasError('name') && styles.formInputError]}
              value={editor.formData.name}
              onChangeText={(text) => { editor.updateFormField('name', text); formErrors.clearError('name'); }}
              placeholder="Ex: Menu Déjeuner"
              placeholderTextColor={colors.neutral[400]}
            />
            <FormFieldError message={formErrors.getError('name')} />
          </View>

          {/* Prix + Statut */}
          <View style={styles.formRow}>
            <View style={styles.formRowField}>
              <Text style={styles.formLabel}>Prix de base (€)</Text>
              <NumberInput
                value={editor.formData.basePrice ? parseFloat(editor.formData.basePrice) : null}
                onChangeText={(val) => { editor.updateFormField('basePrice', val !== null ? val.toString() : ''); formErrors.clearError('basePrice'); }}
                decimalPlaces={2}
                min={0}
                placeholder="0.00"
                style={[styles.formInput, formErrors.hasError('basePrice') && styles.formInputError]}
              />
              <FormFieldError message={formErrors.getError('basePrice')} />
            </View>
            <View style={styles.formRowField}>
              <Text style={styles.formLabel}>Statut</Text>
              <TouchableOpacity
                style={[styles.toggleOption, editor.formData.isActive && styles.toggleOptionActive]}
                onPress={() => editor.updateFormField('isActive', !editor.formData.isActive)}
                activeOpacity={1}
              >
                <View style={[styles.toggleIndicator, editor.formData.isActive && styles.toggleIndicatorActive]} />
                <Text style={[styles.toggleText, editor.formData.isActive && styles.toggleTextActive]}>
                  {editor.formData.isActive ? 'Actif' : 'Inactif'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* TVA */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Taux de TVA</Text>
            <VatRateSelector
              value={editor.formData.vatRate ? parseFloat(editor.formData.vatRate) : 10}
              onChange={(value) => editor.updateFormField('vatRate', value ? value.toString() : '10')}
              disabled={false}
            />
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.textArea, { height: descriptionHeight }]}
              value={editor.formData.description}
              onChangeText={(text) => editor.updateFormField('description', text)}
              placeholder="Ex: Un menu complet avec entrée, plat et dessert..."
              placeholderTextColor={colors.neutral[400]}
              multiline
              scrollEnabled={false}
              onContentSizeChange={(e) => {
                setDescriptionHeight(Math.max(44, e.nativeEvent.contentSize.height));
              }}
            />
          </View>

          <View style={styles.divider} />

          {/* Catégories */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Catégories</Text>
            {editor.formData.categories.map((cat, index) => {
              const typeName = getCategoryName(cat);
              const itemCount = getCategoryItemCount(index);

              const hasError = formErrors.hasError(`categories.${index}`);
              return (
                <View key={cat.id || `new-${index}`} style={styles.categoryCardWrapper}>
                  <View style={[styles.categoryCard, hasError && styles.categoryCardError, { position: 'relative', overflow: 'hidden' }]}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{index + 1}</Text>
                    </View>
                    <View style={styles.categoryCardInfo}>
                      <Text style={styles.categoryCardTitle} numberOfLines={1}>{typeName}</Text>
                      <View style={styles.categoryCardTags}>
                        <View style={[
                          styles.categoryTag,
                          cat.isRequired ? styles.categoryTagRequired : styles.categoryTagOptional,
                        ]}>
                          <Text style={[
                            styles.categoryTagText,
                            cat.isRequired ? styles.categoryTagTextRequired : styles.categoryTagTextOptional,
                          ]}>
                            {cat.isRequired ? 'Obligatoire' : 'Optionnel'}
                          </Text>
                        </View>
                        <Text style={styles.categoryCardItemCount}>
                          {itemCount} article{itemCount > 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.categoryCardActions}>
                      <Pressable
                        style={styles.categoryEditButton}
                        onPress={() => navigateToCategory(index)}
                      >
                        <Text style={styles.categoryEditButtonText}>Modifier</Text>
                      </Pressable>
                      <Pressable
                        style={styles.categoryDeleteButton}
                        onPress={() => handleRequestDeleteCategory(index)}
                      >
                        <Trash2 size={16} color={colors.error.base} strokeWidth={2} />
                      </Pressable>
                    </View>
                    {pendingDeleteCategoryIndex === index && (
                      <InlineDeleteOverlay onConfirm={() => handleConfirmDeleteCategory(index)} />
                    )}
                  </View>
                  <FormFieldError message={hasError ? formErrors.getError(`categories.${index}`) : undefined} />
                </View>
              );
            })}

            {/* Ajouter une catégorie */}
            <TouchableOpacity
              style={[
                styles.addCategoryButton,
                formErrors.hasError('categories') && editor.formData.categories.length === 0 && styles.addCategoryButtonError,
              ]}
              onPress={handleAddCategory}
            >
              <Plus size={18} color={formErrors.hasError('categories') && editor.formData.categories.length === 0 ? colors.error.base : colors.neutral[500]} strokeWidth={2} />
              <Text style={[
                styles.addCategoryText,
                formErrors.hasError('categories') && editor.formData.categories.length === 0 && styles.addCategoryTextError,
              ]}>Ajouter une catégorie</Text>
            </TouchableOpacity>
            {formErrors.hasError('categories') && editor.formData.categories.length === 0 && (
              <FormFieldError message={formErrors.getError('categories')} />
            )}
          </View>
        </Pressable>
      </KeyboardAwareScrollViewWrapper>

      {/* Footer */}
      <View style={styles.panelFooter}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  panelContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    gap: 16,
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  closeButton: {
    flexShrink: 0,
    marginTop: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  panelHeaderBack: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    height: 89,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  backButtonIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: colors.gray[100],
    height: '100%',
  },
  backTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  backTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.brand.dark,
    letterSpacing: 0.3,
  },
  backSubtitle: {
    fontSize: 13,
    color: colors.neutral[500],
    marginTop: 1,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 4,
  },
  panelSubtitle: {
    fontSize: 13,
    color: colors.neutral[500],
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 10,
  },
  formInput: {
    height: 44,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: colors.neutral[800],
  },
  formInputError: {
    borderColor: colors.error.base,
    backgroundColor: colors.error.bg,
  },
  textArea: {
    textAlignVertical: 'top',
    ...Platform.select({
      ios: { paddingTop: 12, minHeight: 44 },
      android: { minHeight: 44, paddingTop: 12 },
      web: { minHeight: 44, paddingTop: 12 } as any,
    }),
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  formRowField: {
    flex: 1,
  },
  formHint: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 6,
    lineHeight: 16,
  },
  itemTypeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginTop: 4,
    marginBottom: 16,
  },

  // Toggles
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  toggleOptionActive: {
    backgroundColor: colors.success.bg,
    borderColor: colors.success.border,
  },
  toggleOptionWarning: {
    backgroundColor: colors.warning.border,
    borderColor: colors.warning.base,
  },
  toggleIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gray[400],
    marginRight: 12,
  },
  toggleIndicatorActive: {
    backgroundColor: colors.success.base,
  },
  toggleIndicatorWarning: {
    backgroundColor: colors.warning.base,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[500],
  },
  toggleTextActive: {
    color: colors.success.text,
  },
  toggleTextWarning: {
    color: colors.warning.text,
  },

  // Category cards (main view) — iso RoomModeSelection
  categoryCardWrapper: {
    marginBottom: 8,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[100],
    gap: 12,
  },
  categoryBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.neutral[800],
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  categoryCardInfo: {
    flex: 1,
  },
  categoryCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 2,
  },
  categoryCardTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryTagRequired: {
    backgroundColor: colors.warning.border,
  },
  categoryTagOptional: {
    backgroundColor: colors.neutral[200],
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryTagTextRequired: {
    color: colors.warning.text,
  },
  categoryTagTextOptional: {
    color: colors.neutral[500],
  },
  categoryCardItemCount: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  categoryCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryEditButton: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.brand.dark,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  categoryEditButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  categoryDeleteButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.error.bg,
    borderWidth: 1,
    borderColor: colors.error.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  categoryCardError: {
    borderColor: colors.error.base,
    backgroundColor: colors.error.bg,
  },

  // Inline delete overlay
  inlineDeleteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  inlineDeleteOverlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
    width: '100%',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  inlineDeleteOverlayText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },

  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderStyle: 'dashed',
    gap: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  addCategoryButtonError: {
    borderColor: colors.error.base,
    backgroundColor: colors.error.bg,
  },
  addCategoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  addCategoryTextError: {
    color: colors.error.base,
  },

  // Articles section (category view)
  addArticlesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderStyle: 'dashed',
    gap: 8,
    marginBottom: 6,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  addArticlesText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  addArticlesButtonDisabled: {
    opacity: 0.6,
    borderStyle: 'solid',
    borderColor: colors.gray[200],
    backgroundColor: colors.gray[100],
  },
  addArticlesTextDisabled: {
    color: colors.gray[400],
  },
  addArticlesHint: {
    fontSize: 11,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: 2,
  },

  // Assigned items list (category view)
  assignedItemsList: {
    gap: 8,
  },
  assignedItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 8,
  },
  assignedItemName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  assignedItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  supplementContainer: {
    width: 120,
  },
  supplementButton: {
    width: 120,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  supplementButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.neutral[500],
    letterSpacing: 0.2,
  },
  assignedItemSupplement: {
    height: 32,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 6,
    paddingHorizontal: 6,
    fontSize: 12,
    color: colors.neutral[800],
    textAlign: 'center' as const,
  },
  assignedItemToggle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  assignedItemToggleActive: {
    backgroundColor: colors.success.bg,
    borderColor: '#A7F3D0',
  },
  assignedItemToggleInactive: {
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[200],
  },
  assignedItemRemove: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.error.bg,
    borderWidth: 1,
    borderColor: colors.error.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },

  // Items grid (items selection view)
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  itemGridCard: {
    width: '47%',
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 12,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  itemGridCardInactive: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[200],
    borderStyle: 'dashed' as const,
  },
  itemGridCardName: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
  itemGridCardNameInactive: {
    color: colors.neutral[400],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 13,
    color: colors.neutral[400],
    textAlign: 'center',
  },

  // Footer
  panelFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.brand.dark,
    gap: 8,
  },
  saveButtonBlue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.brand.dark,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
});
