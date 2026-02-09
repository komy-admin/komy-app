import { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, ScrollView, LayoutChangeEvent, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Text } from '~/components/ui';
import { Plus } from 'lucide-react-native';
import { Item } from '~/types/item.types';
import { Menu } from '~/types/menu.types';
import { ItemsByTypeGroup } from '~/hooks/order/useOrderLinesForm';
import { getContrastColor, formatPrice } from '~/lib/utils';
import { getColorWithOpacity, getMenuPrice } from '~/lib/color-utils';
import { calculateOptimalCardWidth } from '~/lib/card-layout-utils';

const MENUS_SECTION_KEY = '__MENUS__';

/**
 * Props pour le composant OrderItemsCardView
 */
export interface OrderItemsCardViewProps {
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
 * Composant pour afficher un item individuel
 */
interface OrderItemRowProps {
  item: Item;
  onOpenCustomization: (item: Item) => void;
  cardWidth: number;
}

const OrderItemCard = memo<OrderItemRowProps>(({
  item,
  onOpenCustomization,
  cardWidth,
}) => {
  const handleAdd = useCallback(() => {
    onOpenCustomization(item);
  }, [item, onOpenCustomization]);

  const colors = useMemo(() => {
    const itemColor = item.color || '#6B7280';
    return {
      itemColor,
      headerBgColor: getColorWithOpacity(itemColor, 0.12),
      buttonIconColor: getContrastColor(itemColor)
    };
  }, [item.color]);

  const dynamicStyle = useMemo(() => ({
    width: cardWidth,
    minWidth: cardWidth,
    maxWidth: cardWidth,
    flexShrink: 0,
    flexGrow: 0,
    borderColor: colors.itemColor
  }), [cardWidth, colors.itemColor]);

  return (
    <Pressable
      style={[styles.itemCard, dynamicStyle]}
      onPress={handleAdd}
    >
      <View style={[
        styles.coloredHeader,
        { backgroundColor: colors.headerBgColor }
      ]}>
        <Text
          style={[
            styles.itemName,
            { color: colors.itemColor }
          ]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.itemPrice}>
          {formatPrice(item.price)}
        </Text>
      </View>

      <View style={styles.addButtonContainer}>
        <View style={[
          styles.addButton,
          { backgroundColor: colors.itemColor }
        ]}>
          <Plus size={22} color={colors.buttonIconColor} strokeWidth={3} />
        </View>
      </View>
    </Pressable>
  );
});

OrderItemCard.displayName = 'OrderItemCard';

/**
 * Composant pour afficher une carte de menu
 */
interface MenuCardProps {
  menu: Menu;
  onMenuAdd: (menu: Menu) => void;
  cardWidth: number;
}

const MenuCard = memo<MenuCardProps>(({
  menu,
  onMenuAdd,
  cardWidth,
}) => {
  const handleAdd = useCallback(() => {
    onMenuAdd(menu);
  }, [menu, onMenuAdd]);

  const dynamicStyle = useMemo(() => ({
    width: cardWidth,
    minWidth: cardWidth,
    maxWidth: cardWidth,
    flexShrink: 0,
    flexGrow: 0,
    borderColor: '#6366F1'
  }), [cardWidth]);

  return (
    <Pressable
      style={[styles.menuCard, dynamicStyle]}
      onPress={handleAdd}
    >
      <View style={[styles.menuHeader, MENU_COLORS.headerBg]}>
        <Text
          style={[styles.itemName, MENU_COLORS.text]}
          numberOfLines={2}
        >
          {menu.name}
        </Text>
        {menu.description && (
          <Text
            style={styles.menuDescription}
            numberOfLines={2}
          >
            {menu.description}
          </Text>
        )}
      </View>

      <View style={styles.menuPriceContainer}>
        <Text style={styles.menuPriceText}>
          À partir de {formatPrice(getMenuPrice(menu))}
        </Text>
      </View>

      <View style={styles.addButtonContainer}>
        <View style={[styles.addButton, MENU_COLORS.button]}>
          <Plus size={22} color="#FFFFFF" strokeWidth={3} />
        </View>
      </View>
    </Pressable>
  );
});

MenuCard.displayName = 'MenuCard';

/**
 * Vue cartes unifiée : menus + articles dans un seul scroll
 */
export const OrderItemsCardView = memo<OrderItemsCardViewProps>(({
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
  const [containerWidth, setContainerWidth] = useState<number>(() => {
    const windowWidth = Dimensions.get('window').width;
    return Math.max(0, windowWidth - 32);
  });

  const scrollViewRef = useRef<ScrollView>(null);
  const sectionPositions = useRef<Record<string, number>>({});
  const isProgrammaticScroll = useRef(false);
  const scrollTriggeredUpdate = useRef(false);
  const activeItemTypeRef = useRef(activeItemType);
  const activeMainTabRef = useRef(activeMainTab);
  activeItemTypeRef.current = activeItemType;
  activeMainTabRef.current = activeMainTab;

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  }, []);

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

  const cardWidth = useMemo(() => {
    return calculateOptimalCardWidth({
      containerWidth,
      padding: 0,
      gap: 12,
      minCardWidth: 180,
      maxCardWidth: 240,
    });
  }, [containerWidth]);

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

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        bounces={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Section Menus */}
        {filteredMenus.length > 0 && (
          <View onLayout={(e) => handleSectionLayout(MENUS_SECTION_KEY, e)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>Menus</Text>
            </View>
            <View
              style={styles.itemsGrid}
              onLayout={handleLayout}
            >
              {filteredMenus.map((menu) => (
                <MenuCard
                  key={menu.id}
                  menu={menu}
                  onMenuAdd={handleMenuAdd}
                  cardWidth={cardWidth}
                />
              ))}
            </View>
          </View>
        )}

        {/* Sections par itemType */}
        {itemsByType.map((group) => (
          <View
            key={group.itemType.id}
            onLayout={(e) => handleSectionLayout(group.itemType.id, e)}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{group.itemType.name}</Text>
            </View>
            <View
              style={styles.itemsGrid}
              onLayout={handleLayout}
            >
              {group.items.map((item) => (
                <OrderItemCard
                  key={item.id}
                  item={item}
                  onOpenCustomization={onOpenCustomization}
                  cardWidth={cardWidth}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

OrderItemsCardView.displayName = 'OrderItemsCardView';

const MENU_COLORS = {
  headerBg: { backgroundColor: 'rgba(99, 102, 241, 0.08)' },
  text: { color: '#6366F1' },
  button: { backgroundColor: '#6366F1' },
};

const COLORS = {
  background: '#FFFFFF',
  textSecondary: '#6B7280',
};

const styles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginBottom: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderRadius: 6,
  },
  sectionHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },

  // Item Card styles
  itemCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 160,
  },

  // Menu Card styles
  menuCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 180,
  },
  menuHeader: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  menuPriceContainer: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    height: 50,
    justifyContent: 'center',
  },
  menuPriceText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Header styles
  coloredHeader: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Prix
  priceContainer: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  itemPrice: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '800',
    textAlign: 'center',
  },

  // Bouton Ajouter
  addButtonContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
  },
  addButton: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
});
