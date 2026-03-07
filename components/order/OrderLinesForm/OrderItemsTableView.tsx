import { memo, useCallback, useMemo, useRef } from 'react';
import { View, Pressable, StyleSheet, SectionList, Text as RNText } from 'react-native';
import { Text } from '~/components/ui';
import { Plus, ListFilter } from 'lucide-react-native';
import { Item } from '~/types/item.types';
import { Menu } from '~/types/menu.types';
import { ItemsByTypeGroup } from '~/hooks/order/useOrderLinesForm';
import { useScrollSync, MENUS_SECTION_KEY, ScrollSyncSection } from '~/hooks/order/useScrollSync';
import { formatPrice, getContrastColor } from '~/lib/utils';
import { getMenuPrice } from '~/lib/color-utils';


const ITEM_HEIGHT = 58;
const SECTION_HEADER_HEIGHT = 38;

interface TableSection {
  key: string;
  title: string;
  data: (Item | Menu)[];
  type: 'menu' | 'item';
}

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
        <Text style={styles.priceText} numberOfLines={1}>
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
  const handleAdd = useCallback(() => {
    onMenuAdd(menu);
  }, [menu, onMenuAdd]);

  return (
    <Pressable
      style={styles.row}
      onPress={handleAdd}
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

      <View style={[styles.priceCell, styles.menuPriceCell]}>
        <RNText style={styles.menuPriceLabel} numberOfLines={1}>
          À partir de
        </RNText>
        <RNText style={styles.priceText} numberOfLines={1}>
          {formatPrice(getMenuPrice(menu))}
        </RNText>
      </View>

      <View style={styles.tagsCell}>
        <RNText style={styles.categoriesText} numberOfLines={1}>
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
 * Vue liste unifiée : menus + articles dans un seul scroll (SectionList virtualisée)
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
  const sectionListRef = useRef<SectionList<Item | Menu, TableSection>>(null);

  const filteredMenus = useMemo(() => {
    return activeMenus.filter(menu => menu.isActive);
  }, [activeMenus]);

  const sections: TableSection[] = useMemo(() => {
    const result: TableSection[] = [];
    if (filteredMenus.length > 0) {
      result.push({
        key: MENUS_SECTION_KEY,
        title: 'Menus',
        data: filteredMenus,
        type: 'menu',
      });
    }
    for (const group of itemsByType) {
      if (group.items.length > 0) {
        result.push({
          key: group.itemType.id,
          title: group.itemType.name,
          data: group.items,
          type: 'item',
        });
      }
    }
    return result;
  }, [filteredMenus, itemsByType]);

  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;

  // Scroll sync bidirectionnel via hook partagé
  const getSections = useCallback((): ScrollSyncSection[] => {
    let offset = 0;
    return sectionsRef.current.map(section => {
      const sectionOffset = offset;
      offset += SECTION_HEADER_HEIGHT + section.data.length * ITEM_HEIGHT;
      return { key: section.key, offset: sectionOffset };
    });
  }, []);

  const scrollToSection = useCallback((sectionKey: string) => {
    const sectionIndex = sectionsRef.current.findIndex(s => s.key === sectionKey);
    if (sectionIndex === -1) return;
    sectionListRef.current?.scrollToLocation({
      sectionIndex,
      itemIndex: 0,
      viewOffset: SECTION_HEADER_HEIGHT,
      animated: true,
    });
  }, []);

  const { handleScroll } = useScrollSync({
    activeItemType,
    activeMainTab,
    onActiveItemTypeChange,
    onMainTabChange,
    getSections,
    scrollToSection,
  });

  // RN SectionList flat index = per section: 1 (header) + data.length + 1 (footer)
  const getItemLayout = useCallback((_data: unknown, index: number) => {
    const currentSections = sectionsRef.current;
    let flatIndex = 0;
    let pixelOffset = 0;

    for (let sectionIdx = 0; sectionIdx < currentSections.length; sectionIdx++) {
      const sectionData = currentSections[sectionIdx].data;

      // Section header
      if (flatIndex === index) {
        return { length: SECTION_HEADER_HEIGHT, offset: pixelOffset, index };
      }
      flatIndex++;
      pixelOffset += SECTION_HEADER_HEIGHT;

      // Section items
      if (index < flatIndex + sectionData.length) {
        const itemIdx = index - flatIndex;
        return {
          length: ITEM_HEIGHT,
          offset: pixelOffset + itemIdx * ITEM_HEIGHT,
          index,
        };
      }
      flatIndex += sectionData.length;
      pixelOffset += sectionData.length * ITEM_HEIGHT;

      // Section footer (RN internal, length 0 but occupies a flat index slot)
      if (flatIndex === index) {
        return { length: 0, offset: pixelOffset, index };
      }
      flatIndex++;
    }
    // Fallback
    return { length: ITEM_HEIGHT, offset: 0, index };
  }, []);

  const renderItem = useCallback(({ item, section, index }: { item: Item | Menu; section: TableSection; index: number }) => {
    const bgStyle = index % 2 === 0 ? styles.evenRow : styles.oddRow;
    if (section.type === 'menu') {
      return (
        <View style={bgStyle}>
          <MenuRow menu={item as Menu} onMenuAdd={handleMenuAdd} />
        </View>
      );
    }
    return (
      <View style={bgStyle}>
        <OrderItemRow item={item as Item} onOpenCustomization={onOpenCustomization} />
      </View>
    );
  }, [handleMenuAdd, onOpenCustomization]);

  const renderSectionHeader = useCallback(({ section }: { section: TableSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  ), []);

  const keyExtractor = useCallback((item: Item | Menu) => item.id.toString(), []);

  if (items.length === 0 && filteredMenus.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Aucun article disponible
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header de la table */}
      <View style={styles.header}>
        <View style={styles.filterCell}>
          <View style={styles.filterIcon}>
            <ListFilter size={17} color="#2A2E33" strokeWidth={2.5} />
          </View>
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
      <SectionList
        ref={sectionListRef}
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        stickySectionHeadersEnabled={false}
        removeClippedSubviews={true}
        initialNumToRender={30}
        maxToRenderPerBatch={15}
        windowSize={7}
      />
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
    height: SECTION_HEADER_HEIGHT,
    justifyContent: 'center' as const,
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
  filterIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
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
    flex: 2,
    padding: 16,
  },
  menuPriceCell: {
    paddingVertical: 8,
  },
  menuPriceLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 14,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#2A2E33',
  },
  tagsCell: {
    flex: 2,
    padding: 16,
    overflow: 'hidden',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
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
