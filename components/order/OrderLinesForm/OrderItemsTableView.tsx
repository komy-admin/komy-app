import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Pressable, StyleSheet, LayoutChangeEvent, Text as RNText, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Text } from '~/components/ui';
import { Plus } from 'lucide-react-native';
import { Item } from '~/types/item.types';
import { Menu } from '~/types/menu.types';
import { ItemsByTypeGroup } from '~/hooks/order/useOrderLinesForm';
import { formatPrice, getContrastColor } from '~/lib/utils';
import { getMenuPrice } from '~/lib/color-utils';
import { TableFilterButton } from './TableFilterTooltip';

const MENUS_SECTION_KEY = '__MENUS__';

/**
 * Props pour le composant OrderItemsTableView
 */
export interface OrderItemsTableViewProps {
  items: Item[];
  itemsByType: ItemsByTypeGroup[];
  activeItemType: string;
  onActiveItemTypeChange: (itemType: string) => void;
  onOpenCustomization: (item: Item) => void;
  activeMenus: Menu[];
  handleMenuAdd: (menu: Menu) => void;
  activeMainTab: string;
  onMainTabChange: (tab: string) => void;
}

/**
 * Composant pour afficher une ligne d'item dans la table
 */
interface OrderItemRowProps {
  item: Item;
  onOpenCustomization: (item: Item) => void;
}

const OrderItemRow = memo<OrderItemRowProps>(({
  item,
  onOpenCustomization
}) => {
  const handleAdd = useCallback(() => {
    onOpenCustomization(item);
  }, [item, onOpenCustomization]);

  const itemColor = item.color || '#6B7280';
  const buttonBgColor = itemColor;
  const buttonIconColor = getContrastColor(itemColor);

  return (
    <Pressable
      style={styles.row}
      onPress={handleAdd}
    >
      <View style={styles.letterCell}>
        <View style={[styles.letterCircle, { backgroundColor: itemColor }]}>
          <Text style={[styles.letterText, { color: buttonIconColor }]}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.nameCell}>
        <Text
          style={styles.nameText}
          numberOfLines={1}
        >
          {item.name}
        </Text>
      </View>

      <View style={styles.priceCell}>
        <Text style={styles.priceText}>
          {formatPrice(item.price)}
        </Text>
      </View>

      <View style={styles.tagsCell}>
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 2).map((tag) => {
              const tagColor = (typeof tag === 'object' && 'color' in tag && typeof tag.color === 'string' ? tag.color : null) || '#6B7280';
              return (
                <View
                  key={tag.id}
                  style={[
                    styles.tagBadge,
                    { backgroundColor: `${tagColor}15` }
                  ]}
                >
                  <RNText
                    style={[styles.tagText, { color: tagColor }]}
                    numberOfLines={1}
                  >
                    {tag.name}
                  </RNText>
                </View>
              );
            })}
            {item.tags.length > 2 && (
              <Text style={styles.moreTagsText}>+{item.tags.length - 2}</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.actionCell}>
        <View
          style={[
            styles.addButton,
            { backgroundColor: buttonBgColor }
          ]}
        >
          <Plus size={20} color={buttonIconColor} strokeWidth={2.5} />
        </View>
      </View>
    </Pressable>
  );
});

OrderItemRow.displayName = 'OrderItemRow';

/**
 * Composant pour afficher une ligne de menu dans la table
 */
interface MenuRowProps {
  menu: Menu;
  onMenuAdd: (menu: Menu) => void;
}

const MenuRow = memo<MenuRowProps>(({
  menu,
  onMenuAdd
}) => {
  const menuColor = '#6366F1';

  return (
    <Pressable
      style={styles.row}
      onPress={() => onMenuAdd(menu)}
    >
      <View style={styles.letterCell}>
        <View style={[styles.letterCircle, { backgroundColor: menuColor }]}>
          <RNText style={styles.menuLetterText}>
            {menu.name.charAt(0).toUpperCase()}
          </RNText>
        </View>
      </View>

      <View style={styles.nameCell}>
        <RNText
          style={styles.nameText}
          numberOfLines={1}
        >
          {menu.name}
        </RNText>
        {menu.description && (
          <RNText
            style={styles.descriptionText}
            numberOfLines={1}
          >
            {menu.description}
          </RNText>
        )}
      </View>

      <View style={styles.priceCell}>
        <RNText style={styles.priceText}>
          À partir de {formatPrice(getMenuPrice(menu))}
        </RNText>
      </View>

      <View style={styles.tagsCell}>
        <RNText style={styles.categoriesText}>
          {menu.categories?.length || 0} catégorie{(menu.categories?.length || 0) > 1 ? 's' : ''}
        </RNText>
      </View>

      <View style={styles.actionCell}>
        <View style={[styles.addButton, { backgroundColor: menuColor }]}>
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
        </View>
      </View>
    </Pressable>
  );
});

MenuRow.displayName = 'MenuRow';

/**
 * Vue liste unifiée : menus + articles dans un seul scroll
 */
export const OrderItemsTableView = memo<OrderItemsTableViewProps>(({
  items,
  itemsByType,
  activeItemType,
  onActiveItemTypeChange,
  onOpenCustomization,
  activeMenus,
  handleMenuAdd,
  activeMainTab,
  onMainTabChange,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionPositions = useRef<Record<string, number>>({});
  const isProgrammaticScroll = useRef(false);
  const scrollTriggeredUpdate = useRef(false);
  const activeItemTypeRef = useRef(activeItemType);
  const activeMainTabRef = useRef(activeMainTab);
  activeItemTypeRef.current = activeItemType;
  activeMainTabRef.current = activeMainTab;

  const handleSectionLayout = useCallback((sectionKey: string, event: LayoutChangeEvent) => {
    const { y } = event.nativeEvent.layout;
    sectionPositions.current[sectionKey] = y;
  }, []);

  // Auto-scroll vers la section active
  useEffect(() => {
    if (scrollTriggeredUpdate.current) {
      scrollTriggeredUpdate.current = false;
      return;
    }
    const targetKey = activeMainTab === 'MENUS' ? MENUS_SECTION_KEY : activeItemType;
    if (targetKey && sectionPositions.current[targetKey] !== undefined) {
      isProgrammaticScroll.current = true;
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, sectionPositions.current[targetKey] - 12),
        animated: true,
      });
      setTimeout(() => { isProgrammaticScroll.current = false; }, 400);
    }
  }, [activeItemType, activeMainTab]);

  // Scroll handler : détecte la section visible
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isProgrammaticScroll.current) return;
    const scrollY = event.nativeEvent.contentOffset.y;
    const entries = Object.entries(sectionPositions.current).sort((a, b) => a[1] - b[1]);
    if (entries.length === 0) return;
    let currentSection = entries[0][0];
    for (const [key, position] of entries) {
      if (position <= scrollY + 50) {
        currentSection = key;
      }
    }
    if (!currentSection) return;

    if (currentSection === MENUS_SECTION_KEY) {
      if (activeMainTabRef.current !== 'MENUS') {
        scrollTriggeredUpdate.current = true;
        onMainTabChange('MENUS');
      }
    } else {
      if (activeMainTabRef.current !== 'ITEMS' || currentSection !== activeItemTypeRef.current) {
        scrollTriggeredUpdate.current = true;
        if (activeMainTabRef.current !== 'ITEMS') {
          onMainTabChange('ITEMS');
        }
        onActiveItemTypeChange(currentSection);
      }
    }
  }, [onActiveItemTypeChange, onMainTabChange]);

  const filteredMenus = useMemo(() => {
    return activeMenus.filter(menu => menu.isActive);
  }, [activeMenus]);

  if (items.length === 0 && filteredMenus.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Aucun article disponible
        </Text>
      </View>
    );
  }

  let globalRowIndex = 0;

  return (
    <View style={styles.container}>
      {/* Header de la table */}
      <View style={styles.header}>
        <View style={styles.filterCell}>
          <TableFilterButton activeFiltersCount={0} />
        </View>
        <View style={styles.nameCell}>
          <Text style={styles.headerText}>Nom</Text>
        </View>
        <View style={styles.priceCell}>
          <Text style={styles.headerText}>Prix</Text>
        </View>
        <View style={styles.tagsCell}>
          <Text style={styles.headerText}>Tags</Text>
        </View>
        <View style={styles.actionCell}>
          <Text style={styles.headerText}>Action</Text>
        </View>
      </View>

      {/* Contenu de la table */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Pressable>
          {/* Section Menus */}
          {filteredMenus.length > 0 && (
            <View onLayout={(e) => handleSectionLayout(MENUS_SECTION_KEY, e)}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>Menus</Text>
              </View>
              {filteredMenus.map((menu) => {
                const rowIndex = globalRowIndex++;
                return (
                  <View
                    key={menu.id}
                    style={rowIndex % 2 === 0 ? styles.evenRow : styles.oddRow}
                  >
                    <MenuRow
                      menu={menu}
                      onMenuAdd={handleMenuAdd}
                    />
                  </View>
                );
              })}
            </View>
          )}

          {/* Sections par itemType */}
          {itemsByType.map((group) => {
            const sectionRows = group.items.map((item) => {
              const rowIndex = globalRowIndex++;
              return (
                <View
                  key={item.id}
                  style={rowIndex % 2 === 0 ? styles.evenRow : styles.oddRow}
                >
                  <OrderItemRow
                    item={item}
                    onOpenCustomization={onOpenCustomization}
                  />
                </View>
              );
            });

            return (
              <View
                key={group.itemType.id}
                onLayout={(e) => handleSectionLayout(group.itemType.id, e)}
              >
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>{group.itemType.name}</Text>
                </View>
                {sectionRows}
              </View>
            );
          })}
        </Pressable>
      </ScrollView>
    </View>
  );
});

OrderItemsTableView.displayName = 'OrderItemsTableView';

const COLORS = {
  background: '#FFFFFF',
  textSecondary: '#6B7280',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Section header
  sectionHeader: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingLeft: 24,
    paddingVertical: 10,
  },
  sectionHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },

  // Header
  header: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F5F5',
    minHeight: 52,
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#2A2E33',
    textDecorationLine: 'underline',
  },

  // Row
  row: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F4F5F5',
    alignItems: 'center',
    height: 58,
  },
  evenRow: {
    backgroundColor: '#FFFFFF',
  },
  oddRow: {
    backgroundColor: '#F8F9FA',
  },

  // Cells
  filterCell: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterCell: {
    width: 64,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0,
  },
  menuLetterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0,
  },
  nameCell: {
    flex: 3,
    padding: 16,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#2A2E33',
  },
  descriptionText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    lineHeight: 16,
    marginTop: 2,
  },
  priceCell: {
    flex: 1.5,
    padding: 16,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#2A2E33',
  },
  tagsCell: {
    flex: 2.5,
    padding: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 0,
    maxWidth: 100,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  moreTagsText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  categoriesText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  actionCell: {
    flex: 1,
    padding: 16,
    alignItems: 'flex-end',
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
});
