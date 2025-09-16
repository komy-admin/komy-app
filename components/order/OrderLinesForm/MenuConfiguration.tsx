import React, { memo, useCallback } from 'react';
import { View, Pressable, Platform, StyleSheet, ScrollView } from 'react-native';
import { Text } from '~/components/ui';
import { Menu as MenuIcon } from 'lucide-react-native';
import { Menu } from '~/types/menu.types';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';

/**
 * Props pour le composant MenuConfiguration
 */
export interface MenuConfigurationProps {
  menu: Menu;
  tempMenuSelections: Record<string, string[]>;
  onUpdateTempMenuSelection: (categoryId: string, itemId: string, isSelected: boolean) => void;
  getMenuCategoryItems: (categoryId: string) => any[];
  getCategoryNameFromItemTypeId?: (itemTypeId: string) => string;
  itemTypes: ItemType[];
}

/**
 * Composant pour afficher une catégorie de menu en configuration
 */
interface MenuCategoryProps {
  category: any;
  index: number;
  selectedItems: string[];
  onToggleItem: (categoryId: string, itemId: string) => void;
  getMenuCategoryItems: (categoryId: string) => any[];
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
  const hasSupplementPrice = parseFloat(category.priceModifier?.toString() || '0') > 0;
  const menuCategoryItems = getMenuCategoryItems(category.id);
  
  console.log('🔍 MenuCategory received items:', {
    categoryId: category.id,
    categoryName,
    menuCategoryItemsLength: menuCategoryItems?.length,
    menuCategoryItems: menuCategoryItems?.slice(0, 2) // Juste les 2 premiers pour éviter de surcharger
  });

  const handleToggleItem = useCallback((itemId: string) => {
    onToggleItem(category.id, itemId);
  }, [category.id, onToggleItem]);

  if (!menuCategoryItems || menuCategoryItems.length === 0) {
    return (
      <View key={category.id} style={styles.categoryCard}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryHeaderContent}>
            <View style={styles.categoryNumberBadge}>
              <Text style={styles.categoryNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.categoryHeaderInfo}>
              <Text style={styles.categoryHeaderTitle}>{categoryName}</Text>
              <Text style={styles.categoryHeaderSubtitle}>
                Aucun article disponible
              </Text>
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
          {Platform.OS === 'web' ? (
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#2A2E33',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '16px'
            }}>
              <span style={{
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: '700',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                {index + 1}
              </span>
            </div>
          ) : (
            <View style={styles.categoryNumberBadge}>
              <Text style={styles.categoryNumberText}>{index + 1}</Text>
            </View>
          )}
          
          <View style={styles.categoryHeaderInfo}>
            {Platform.OS === 'web' ? (
              <>
                <span style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#2A2E33',
                  marginBottom: '1px',
                  letterSpacing: '0.3px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  display: 'block'
                }}>
                  {categoryName}
                </span>
                <span style={{
                  fontSize: '13px',
                  color: '#6B7280',
                  fontWeight: '500',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  {category.isRequired ? 'Obligatoire' : 'Optionnel'} • {selectedItems.length} / {category.maxSelections || 1} sélection{(category.maxSelections || 1) > 1 ? 's' : ''}
                </span>
              </>
            ) : (
              <>
                <Text style={styles.categoryHeaderTitle}>
                  {categoryName}
                </Text>
                <Text style={styles.categoryHeaderSubtitle}>
                  {category.isRequired ? 'Obligatoire' : 'Optionnel'} • {selectedItems.length} / {category.maxSelections || 1} sélection{(category.maxSelections || 1) > 1 ? 's' : ''}
                </Text>
              </>
            )}
          </View>
          
          {hasSupplementPrice && (
            Platform.OS === 'web' ? (
              <div style={{
                backgroundColor: '#EEF2FF',
                paddingLeft: '8px',
                paddingRight: '8px',
                paddingTop: '4px',
                paddingBottom: '4px',
                borderRadius: '6px',
                alignSelf: 'center'
              }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#4338CA',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  + {category.priceModifier} € de Supplément
                </span>
              </div>
            ) : (
              <View style={styles.categorySupplementTag}>
                <Text style={styles.categorySupplementTagText}>
                  + {category.priceModifier} € de Supplément
                </Text>
              </View>
            )
          )}
        </View>
      </View>

      {/* Articles de la catégorie */}
      <View style={styles.categoryItemsList}>
        {menuCategoryItems
          .filter((item: any) => item.isAvailable)
          .map((menuCategoryItem: any) => {
            const item = menuCategoryItem?.item;
            if (!item) return null;

            const supplement = parseFloat(menuCategoryItem.supplement || '0');
            const isSelected = selectedItems.includes(item.id);
            const hasSupplementPrice = supplement > 0;

            return (
              <MenuItemCard
                key={menuCategoryItem.id}
                item={item}
                isSelected={isSelected}
                supplement={supplement}
                hasSupplementPrice={hasSupplementPrice}
                onToggle={() => handleToggleItem(item.id)}
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
            {Platform.OS === 'web' ? (
              <span style={{
                fontSize: '15px',
                fontWeight: '700',
                color: '#1E293B',
                letterSpacing: '0.2px',
                flex: 1,
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                {item.name}
              </span>
            ) : (
              <Text style={styles.menuItemName}>
                {item.name}
              </Text>
            )}
            
            {hasSupplementPrice && (
              Platform.OS === 'web' ? (
                <div style={{
                  backgroundColor: '#FEF3C7',
                  paddingLeft: '8px',
                  paddingRight: '8px',
                  paddingTop: '4px',
                  paddingBottom: '4px',
                  borderRadius: '6px'
                }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#92400E',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
                    +{supplement.toFixed(2)}€
                  </span>
                </div>
              ) : (
                <View style={styles.menuItemSupplement}>
                  <Text style={styles.menuItemSupplementText}>
                    +{supplement.toFixed(2)}€
                  </Text>
                </View>
              )
            )}
          </View>
        </View>

        <View style={styles.menuItemActions}>
          <View style={[
            styles.menuItemCheckbox,
            isSelected && styles.menuItemCheckboxSelected
          ]}>
            {isSelected && (
              <Text style={styles.menuItemCheckboxIcon}>✓</Text>
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
  onUpdateTempMenuSelection,
  getMenuCategoryItems,
  getCategoryNameFromItemTypeId,
  itemTypes
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

  const handleToggleItem = useCallback((categoryId: string, itemId: string) => {
    const selectedItems = tempMenuSelections[categoryId] || [];
    const isSelected = selectedItems.includes(itemId);
    onUpdateTempMenuSelection(categoryId, itemId, !isSelected);
  }, [tempMenuSelections, onUpdateTempMenuSelection]);

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
            {Platform.OS === 'web' ? (
              <>
                <span style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#2A2E33',
                  letterSpacing: '0.5px',
                  marginBottom: '4px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  display: 'block'
                }}>
                  Configuration "{menu.name}"
                </span>
                <span style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  fontWeight: '500',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  Personnalisez votre sélection d'articles
                </span>
              </>
            ) : (
              <>
                <Text style={styles.sectionHeaderTitle}>
                  Configuration "{menu.name}"
                </Text>
                <Text style={styles.sectionHeaderSubtitle}>
                  Personnalisez votre sélection d'articles
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Sections de catégories avec scroll */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {menu.categories && menu.categories.map((category, index) => {
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
      </ScrollView>
    </View>
  );
});

MenuConfiguration.displayName = 'MenuConfiguration';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  configHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionHeaderInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2E33',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionHeaderSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryCard: {
    marginVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2A2E33',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  categoryHeaderInfo: {
    flex: 1,
  },
  categoryHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2E33',
    marginBottom: 1,
    letterSpacing: 0.3,
  },
  categoryHeaderSubtitle: {
    fontSize: 13,
    color: '#6B7280',
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
    padding: 16,
    gap: 12,
  },
  menuItemCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
  },
  menuItemCardSelected: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0ea5e9',
    borderWidth: 2,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  menuItemCheckboxSelected: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  menuItemCheckboxIcon: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});