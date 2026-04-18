import React, { memo, useCallback, useState } from 'react';
import { View, Pressable, TouchableOpacity, StyleSheet, ScrollView, Text as RNText } from 'react-native';
import { X } from 'lucide-react-native';
import { Menu } from '~/types/menu.types';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { SelectedTag } from '~/types/order-line.types';
import { formatPrice } from '~/lib/utils';
import { useToast } from '~/components/ToastProvider';
import { ItemCustomizationPanelContent } from '~/components/order/OrderLinesForm/ItemCustomizationPanelContent';

/**
 * Type pour une catégorie de menu
 */
interface MenuCategoryType {
  id: string;
  itemTypeId: string;
  priceModifier?: number;
  isRequired?: boolean;
  maxSelections?: number;
  items?: MenuCategoryItemType[];
}

/**
 * Type pour un item de catégorie de menu
 */
interface MenuCategoryItemType {
  id: string;
  item?: Item;
  itemId?: string;
  supplement?: number;
  isAvailable?: boolean;
}

/**
 * Type pour une sélection d'item de menu avec tags
 */
export interface MenuItemSelection {
  itemId: string;
  tags: any[];
  note?: string;
}

/**
 * Props pour le composant MenuConfiguration
 */
export interface MenuConfigurationProps {
  menu: Menu;
  tempMenuSelections: Record<string, MenuItemSelection[]>;
  onItemSelected: (categoryId: string, selection: MenuItemSelection) => void;
  onDeselectMenuItem: (categoryId: string, itemId: string) => void;
  items: Item[];
  itemTypes: ItemType[];
  onCancel?: () => void;
  onConfirm?: () => void;
}

/**
 * État interne de navigation : vue catégories ou vue customisation d'un item
 */
interface CustomizingItemState {
  item: Item;
  categoryId: string;
  categoryIndex: number;
  categoryName: string;
}

/**
 * Composant pour afficher une catégorie de menu en configuration
 */
interface MenuCategoryCardProps {
  category: MenuCategoryType;
  index: number;
  selectedItems: MenuItemSelection[];
  onToggleItem: (categoryId: string, item: Item) => void;
  categoryItems: MenuCategoryItemType[];
  categoryName: string;
  hasError?: boolean;
}

const MenuCategoryCard = memo<MenuCategoryCardProps>(({
  category,
  index,
  selectedItems,
  onToggleItem,
  categoryItems,
  categoryName,
  hasError,
}) => {
  const hasSupplementPrice = (category.priceModifier || 0) > 0;

  const handleToggleItem = useCallback((item: Item) => {
    onToggleItem(category.id, item);
  }, [category.id, onToggleItem]);

  if (!categoryItems || categoryItems.length === 0) {
    return (
      <View style={styles.categoryCard}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryHeaderContent}>
            <View style={styles.categoryNumberBadge}>
              <RNText style={styles.categoryNumberText}>{index + 1}</RNText>
            </View>
            <View style={styles.categoryHeaderInfo}>
              <RNText style={styles.categoryHeaderTitle}>{categoryName}</RNText>
              <RNText style={styles.categoryHeaderSubtitle}>
                Aucun article disponible
              </RNText>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.categoryCard, hasError && styles.categoryCardError]}>
      {/* Header de catégorie */}
      <View style={[styles.categoryHeader, hasError && styles.categoryHeaderError]}>
        <View style={styles.categoryHeaderContent}>
          <View style={[styles.categoryNumberBadge, hasError && styles.categoryNumberBadgeError]}>
            <RNText style={styles.categoryNumberText}>{index + 1}</RNText>
          </View>

          <View style={styles.categoryHeaderInfo}>
            <RNText style={styles.categoryHeaderTitle}>
              {categoryName}
            </RNText>
            <RNText style={[styles.categoryHeaderSubtitle, hasError && styles.categoryHeaderSubtitleError]}>
              {hasError
                ? 'Ce champ est requis'
                : `${category.isRequired ? 'Obligatoire' : 'Optionnel'} • ${selectedItems.length} / ${category.maxSelections || 1} sélection${(category.maxSelections || 1) > 1 ? 's' : ''}`
              }
            </RNText>
          </View>

          {hasSupplementPrice && (
            <View style={styles.categorySupplementTag}>
              <RNText style={styles.categorySupplementTagText}>
                + {formatPrice(category.priceModifier || 0)} de Supplément
              </RNText>
            </View>
          )}
        </View>
      </View>

      {/* Articles de la catégorie */}
      <View style={styles.categoryItemsList}>
        {categoryItems
          .filter((mci: MenuCategoryItemType) => mci.isAvailable)
          .map((menuCategoryItem: MenuCategoryItemType) => {
            const item = menuCategoryItem?.item;
            if (!item) return null;

            const supplement = menuCategoryItem.supplement || 0;
            const isSelected = selectedItems.some(s => s.itemId === item.id);

            return (
              <MenuItemCard
                key={menuCategoryItem.id}
                item={item}
                isSelected={isSelected}
                supplement={supplement}
                hasSupplementPrice={supplement > 0}
                onToggle={() => handleToggleItem(item)}
              />
            );
          })}
      </View>
    </View>
  );
});

MenuCategoryCard.displayName = 'MenuCategoryCard';

/**
 * Composant pour afficher un item de menu dans la configuration
 */
interface MenuItemCardProps {
  item: Item;
  isSelected: boolean;
  supplement: number;
  hasSupplementPrice: boolean;
  onToggle: () => void;
}

const MenuItemCard = memo<MenuItemCardProps>(({
  item,
  isSelected,
  supplement,
  hasSupplementPrice,
  onToggle
}) => {
  return (
    <Pressable
      style={[
        styles.menuItemCard,
        isSelected && styles.menuItemCardSelected
      ]}
      onPress={onToggle}
    >
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemInfo}>
          <View style={styles.menuItemNameRow}>
            <RNText style={styles.menuItemName}>
              {item.name}
            </RNText>

            {hasSupplementPrice && (
              <View style={styles.menuItemSupplement}>
                <RNText style={styles.menuItemSupplementText}>
                  +{formatPrice(supplement)}
                </RNText>
              </View>
            )}
          </View>
        </View>

        <View style={styles.menuItemActions}>
          <View style={[
            styles.menuItemCheckbox,
            isSelected && styles.menuItemCheckboxSelected
          ]}>
            {isSelected && (
              <RNText style={styles.menuItemCheckboxIcon}>✓</RNText>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
});

MenuItemCard.displayName = 'MenuItemCard';

/**
 * Composant principal de configuration de menu
 * Gère deux vues internes :
 * 1. Liste des catégories (par défaut)
 * 2. Customisation d'un item (tags/notes) avec retour arrière
 */
export const MenuConfiguration: React.FC<MenuConfigurationProps> = ({
  menu,
  tempMenuSelections,
  onItemSelected,
  onDeselectMenuItem,
  items,
  itemTypes,
  onCancel,
  onConfirm,
}) => {
  const { showToast } = useToast();

  // Navigation interne : null = vue catégories, sinon = vue customisation
  const [customizingItem, setCustomizingItem] = useState<CustomizingItemState | null>(null);

  // Validation visuelle des catégories requises
  const [showErrors, setShowErrors] = useState(false);

  // Fonction pour obtenir le nom d'une catégorie depuis son itemTypeId
  const getCategoryName = useCallback((itemTypeId: string): string => {
    const itemType = itemTypes.find(type => type.id === itemTypeId);
    return itemType?.name || 'Catégorie inconnue';
  }, [itemTypes]);

  // Résoudre les items d'une catégorie (remplacer les itemId par des items complets)
  const getCategoryItems = useCallback((category: MenuCategoryType): MenuCategoryItemType[] => {
    if (!category.items) return [];
    return category.items.map((mci: MenuCategoryItemType) => {
      if (!mci.item && mci.itemId) {
        const fullItem = items.find((i) => i.id === mci.itemId);
        return { ...mci, item: fullItem };
      }
      return mci;
    });
  }, [items]);

  // Toggle item : gère sélection directe ou ouverture de la customisation
  const handleToggleItem = useCallback((categoryId: string, item: Item) => {
    const selections = tempMenuSelections[categoryId] || [];
    const isSelected = selections.some(s => s.itemId === item.id);

    if (isSelected) {
      onDeselectMenuItem(categoryId, item.id);
      return;
    }

    // Vérifier maxSelections
    const category = menu.categories?.find((c: any) => c.id === categoryId);
    const maxSelections = category?.maxSelections || 1;
    if (selections.length >= maxSelections && maxSelections > 1) return;

    // Récupérer l'item complet avec ses tags
    const fullItem = items.find(i => i.id === item.id) || item;
    const hasTags = fullItem.tags && fullItem.tags.length > 0;

    if (!fullItem.hasNote && !hasTags) {
      // Sélection directe sans customisation
      onItemSelected(categoryId, { itemId: fullItem.id, tags: [], note: undefined });
      setShowErrors(false);
    } else {
      // Ouvrir la sous-vue de customisation
      const catIndex = (menu.categories?.findIndex((c: any) => c.id === categoryId) ?? 0) + 1;
      const catName = getCategoryName(category?.itemTypeId || '');
      setCustomizingItem({
        item: fullItem,
        categoryId,
        categoryIndex: catIndex,
        categoryName: catName,
      });
    }
  }, [tempMenuSelections, onDeselectMenuItem, onItemSelected, menu, items, getCategoryName]);

  // Confirmer la customisation d'un item de menu
  const handleCustomizationConfirm = useCallback((customization: { tags: SelectedTag[]; note?: string }) => {
    if (!customizingItem) return;
    onItemSelected(customizingItem.categoryId, {
      itemId: customizingItem.item.id,
      tags: customization.tags,
      note: customization.note,
    });
    setCustomizingItem(null);
    setShowErrors(false);
  }, [customizingItem, onItemSelected]);

  // Retour à la vue catégories
  const handleCustomizationBack = useCallback(() => {
    setCustomizingItem(null);
  }, []);

  // Vérifier si une catégorie requise n'a pas de sélection
  const isCategoryMissing = useCallback((category: MenuCategoryType): boolean => {
    if (!category.isRequired) return false;
    const selections = tempMenuSelections[category.id];
    return !selections || selections.length === 0;
  }, [tempMenuSelections]);

  // Valider et confirmer le menu
  const handleConfirm = useCallback(() => {
    const categories = menu.categories || [];
    const hasMissing = categories.some(isCategoryMissing);
    // Au moins 1 article sélectionné au total
    const totalSelections = Object.values(tempMenuSelections).reduce(
      (sum, s) => sum + (s?.length || 0), 0
    );

    if (hasMissing || totalSelections === 0) {
      setShowErrors(true);
      showToast('Veuillez remplir les catégories requises', 'error');
      return;
    }
    onConfirm?.();
  }, [menu, tempMenuSelections, isCategoryMissing, onConfirm, showToast]);

  if (!menu) return null;

  // ====================================================================
  // VUE CUSTOMISATION D'UN ITEM
  // ====================================================================
  if (customizingItem) {
    return (
      <ItemCustomizationPanelContent
        item={customizingItem.item}
        availableTags={customizingItem.item.tags || []}
        onConfirm={handleCustomizationConfirm}
        onCancel={handleCustomizationBack}
        headerTitle={`Catégorie ${customizingItem.categoryIndex} - ${customizingItem.categoryName}`}
        headerSubtitle={customizingItem.item.name}
        onBack={handleCustomizationBack}
      />
    );
  }

  // ====================================================================
  // VUE CATÉGORIES (par défaut)
  // ====================================================================
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <RNText style={styles.title}>Configuration "{menu.name}"</RNText>
          <RNText style={styles.subtitle}>Personnalisez votre sélection d'articles</RNText>
        </View>
        <TouchableOpacity
          onPress={onCancel}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.closeButton}
        >
          <X size={24} color="#64748B" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Configuration content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        bounces={false}
      >
        {menu.categories && menu.categories.length > 0 ? (
          <View style={styles.categoriesContainer}>
            {menu.categories.map((category: MenuCategoryType, index: number) => {
              const selectedItems = tempMenuSelections[category.id] || [];
              const categoryItems = getCategoryItems(category);
              const categoryName = getCategoryName(category.itemTypeId);
              return (
                <MenuCategoryCard
                  key={category.id}
                  category={category}
                  index={index}
                  selectedItems={selectedItems}
                  onToggleItem={handleToggleItem}
                  categoryItems={categoryItems}
                  categoryName={categoryName}
                  hasError={showErrors && isCategoryMissing(category)}
                />
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <RNText style={styles.emptyStateTitle}>Aucune catégorie disponible</RNText>
            <RNText style={styles.emptyStateSubtitle}>
              Ce menu n'a pas encore de catégories configurées
            </RNText>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <RNText style={styles.cancelButtonText}>Annuler</RNText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
        >
          <RNText style={styles.confirmButtonText}>Valider le menu</RNText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const COLORS = {
  primary: '#2A2E33',
  success: '#059669',
  warning: '#F59E0B',
  text: '#2A2E33',
  textSecondary: '#6B7280',
  background: '#FFFFFF',
  border: '#E2E8F0',
  backgroundGray: '#F3F4F6',
  selectedBackground: '#ECFDF5',
  selectedBorder: '#059669'
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // Header (iso with other panel forms)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#FAFAFA',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },

  // Categories Container
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Category Styles
  categoryCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginBottom: 16,
    overflow: 'hidden',
  },
  categoryCardError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },

  categoryHeader: {
    backgroundColor: COLORS.backgroundGray,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryHeaderError: {
    backgroundColor: '#FEE2E2',
    borderBottomColor: '#FECACA',
  },

  categoryHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  categoryNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryNumberBadgeError: {
    backgroundColor: '#EF4444',
  },

  categoryNumberText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '700',
  },

  categoryHeaderInfo: {
    flex: 1,
  },

  categoryHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 1,
    letterSpacing: 0.3,
  },

  categoryHeaderSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  categoryHeaderSubtitleError: {
    color: '#EF4444',
    fontWeight: '600',
  },

  categorySupplementTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'center',
  },

  categorySupplementTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4338CA',
  },

  categoryItemsList: {
    paddingVertical: 8,
  },

  // Menu Item Card
  menuItemCard: {
    marginHorizontal: 8,
    marginVertical: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  menuItemCardSelected: {
    backgroundColor: COLORS.selectedBackground,
    borderColor: COLORS.selectedBorder,
  },

  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  menuItemInfo: {
    flex: 1,
  },

  menuItemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  menuItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.2,
    flex: 1,
  },

  menuItemSupplement: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  menuItemSupplementText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },

  menuItemActions: {
    marginLeft: 12,
  },

  menuItemCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuItemCheckboxSelected: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },

  menuItemCheckboxIcon: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Empty State
  emptyStateContainer: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },

  emptyStateSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Footer (iso with other panel forms)
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  confirmButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#2A2E33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
