import React, { memo, useCallback } from 'react';
import { View, Pressable, Platform, StyleSheet, ScrollView, Text as RNText } from 'react-native';
import { Menu as MenuIcon } from 'lucide-react-native';
import { Menu } from '~/types/menu.types';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { formatPrice } from '~/lib/utils';

/**
 * Type pour une catégorie de menu
 */
interface MenuCategoryType {
  id: string;
  itemTypeId: string;
  priceModifier?: number;
  isRequired?: boolean;
  maxSelections?: number;
}

/**
 * Type pour un item de catégorie de menu
 */
interface MenuCategoryItem {
  id: string;
  item?: Item;
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
  onSelectMenuItem: (item: Item, categoryId: string) => void;
  onDeselectMenuItem: (categoryId: string, itemId: string) => void;
  getMenuCategoryItems: (categoryId: string) => MenuCategoryItem[];
  getCategoryNameFromItemTypeId?: (itemTypeId: string) => string;
  itemTypes: ItemType[];
  onCancel?: () => void;
  onConfirm?: () => void;
  isValid?: boolean;
}

/**
 * Composant pour afficher une catégorie de menu en configuration
 */
interface MenuCategoryProps {
  category: MenuCategoryType;
  index: number;
  selectedItems: MenuItemSelection[];
  onToggleItem: (categoryId: string, item: Item) => void;
  getMenuCategoryItems: (categoryId: string) => MenuCategoryItem[];
  getCategoryName: (itemTypeId: string) => string;
}

const MenuCategory = memo<MenuCategoryProps>(({
  category,
  index,
  selectedItems,
  onToggleItem,
  getMenuCategoryItems,
  getCategoryName
}) => {
  const categoryName = getCategoryName(category.itemTypeId);
  const hasSupplementPrice = (category.priceModifier || 0) > 0;
  const menuCategoryItems = getMenuCategoryItems(category.id);

  const handleToggleItem = useCallback((item: Item) => {
    onToggleItem(category.id, item);
  }, [category.id, onToggleItem]);

  if (!menuCategoryItems || menuCategoryItems.length === 0) {
    return (
      <View key={category.id} style={styles.categoryCard}>
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
    <View key={category.id} style={styles.categoryCard}>
      {/* Header de catégorie */}
      <View style={styles.categoryHeader}>
        <View style={styles.categoryHeaderContent}>
          <View style={styles.categoryNumberBadge}>
            <RNText style={styles.categoryNumberText}>{index + 1}</RNText>
          </View>

          <View style={styles.categoryHeaderInfo}>
            <RNText style={styles.categoryHeaderTitle}>
              {categoryName}
            </RNText>
            <RNText style={styles.categoryHeaderSubtitle}>
              {category.isRequired ? 'Obligatoire' : 'Optionnel'} • {selectedItems.length} / {category.maxSelections || 1} sélection{(category.maxSelections || 1) > 1 ? 's' : ''}
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
        {menuCategoryItems
          .filter((item: MenuCategoryItem) => item.isAvailable)
          .map((menuCategoryItem: MenuCategoryItem) => {
            const item = menuCategoryItem?.item;
            if (!item) return null;

            const supplement = menuCategoryItem.supplement || 0;
            const isSelected = selectedItems.some(s => s.itemId === item.id);
            const hasSupplementPrice = supplement > 0;

            return (
              <MenuItemCard
                key={menuCategoryItem.id}
                item={item}
                isSelected={isSelected}
                supplement={supplement}
                hasSupplementPrice={hasSupplementPrice}
                onToggle={() => handleToggleItem(item)}
              />
            );
          })}
      </View>
    </View>
  );
});

MenuCategory.displayName = 'MenuCategory';

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
 * Interface complète pour configurer un menu avec ses catégories et articles
 *
 * @param props - Props du composant
 * @returns Composant de configuration de menu mémorisé
 */
export const MenuConfiguration = memo<MenuConfigurationProps>(({
  menu,
  tempMenuSelections,
  onSelectMenuItem,
  onDeselectMenuItem,
  getMenuCategoryItems,
  getCategoryNameFromItemTypeId,
  itemTypes,
  onCancel,
  onConfirm,
  isValid,
}) => {

  // Fonction pour obtenir le nom d'une catégorie
  const getCategoryName = useCallback((itemTypeId: string): string => {
    if (getCategoryNameFromItemTypeId) {
      return getCategoryNameFromItemTypeId(itemTypeId);
    }

    // Fallback: chercher dans itemTypes
    const itemType = itemTypes.find(type => type.id === itemTypeId);
    return itemType?.name || 'Catégorie inconnue';
  }, [getCategoryNameFromItemTypeId, itemTypes]);

  const handleToggleItem = useCallback((categoryId: string, item: Item) => {
    const selections = tempMenuSelections[categoryId] || [];
    const isSelected = selections.some(s => s.itemId === item.id);

    if (isSelected) {
      // Désélectionner l'item
      onDeselectMenuItem(categoryId, item.id);
    } else {
      // Sélectionner l'item -> ouvrir la modale de customisation
      onSelectMenuItem(item, categoryId);
    }
  }, [tempMenuSelections, onSelectMenuItem, onDeselectMenuItem]);

  if (!menu) return null;

  return (
    <View style={styles.container}>
      {/* Header de configuration */}
      <View style={styles.configHeader}>
        <View style={styles.sectionHeaderInline}>
          <View style={styles.sectionIconContainer}>
            <MenuIcon size={20} color="#2A2E33" />
          </View>
          <View style={styles.sectionHeaderText}>
            <RNText style={styles.sectionHeaderTitle}>
              Configuration "{menu.name}"
            </RNText>
            <RNText style={styles.sectionHeaderSubtitle}>
              Personnalisez votre sélection d'articles
            </RNText>
          </View>
        </View>
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
              return (
                <MenuCategory
                  key={category.id}
                  category={category}
                  index={index}
                  selectedItems={selectedItems}
                  onToggleItem={handleToggleItem}
                  getMenuCategoryItems={getMenuCategoryItems}
                  getCategoryName={getCategoryName}
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

      {/* Footer avec boutons Annuler / Valider */}
      {(onCancel || onConfirm) && (
        <View style={styles.configFooter}>
          <Pressable style={styles.configCancelButton} onPress={onCancel}>
            <RNText style={styles.configCancelButtonText}>Annuler</RNText>
          </Pressable>
          <Pressable
            style={[styles.configConfirmButton, !isValid && styles.configConfirmButtonDisabled]}
            onPress={onConfirm}
            disabled={!isValid}
          >
            <RNText style={styles.configConfirmButtonText}>
              Valider le menu
            </RNText>
          </Pressable>
        </View>
      )}
    </View>
  );
});

MenuConfiguration.displayName = 'MenuConfiguration';

const COLORS = {
  primary: '#2A2E33',
  success: '#059669',
  warning: '#F59E0B',
  text: '#2A2E33',
  textSecondary: '#6B7280',
  background: '#FFFFFF',
  border: '#E5E7EB',
  backgroundGray: '#F3F4F6',
  selectedBackground: '#FEF3C7',
  selectedBorder: '#F59E0B'
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // Configuration Header
  configHeader: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  sectionHeaderInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  sectionHeaderText: {
    flex: 1,
  },

  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  sectionHeaderSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
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
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  categoryHeader: {
    backgroundColor: COLORS.backgroundGray,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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

  // Footer
  configFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  configCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  configCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  configConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  configConfirmButtonDisabled: {
    opacity: 0.5,
  },
  configConfirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.background,
  },
});