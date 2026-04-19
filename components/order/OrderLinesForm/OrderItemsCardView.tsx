import { memo, useCallback, useMemo, useState, useRef } from 'react';
import { View, Pressable, StyleSheet, LayoutChangeEvent, Platform, Text as RNText } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Text, SectionDivider } from '~/components/ui';
import { Item } from '~/types/item.types';
import { Menu } from '~/types/menu.types';
import { ItemsByTypeGroup } from '~/hooks/order/useOrderLinesForm';
import { useScrollSync, MENUS_SECTION_KEY, ScrollSyncSection } from '~/hooks/order/useScrollSync';
import { formatPrice } from '~/lib/utils';
import { getColorWithOpacity, getMenuPrice, darkenColor } from '~/lib/color-utils';
import { calculateOptimalColumns, chunkArray } from '~/lib/card-layout-utils';
import { shadows, colors } from '~/theme';

// Constantes de couleurs
const MENU_COLOR = colors.success.base;
const MENU_TEXT_COLOR = darkenColor(MENU_COLOR, 0.35);
const MENU_BG_COLOR = getColorWithOpacity(MENU_COLOR, 0.08);

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
interface OrderItemCardProps {
  item: Item;
  onOpenCustomization: (item: Item) => void;
}

const OrderItemCard = memo<OrderItemCardProps>(({
  item,
  onOpenCustomization,
}) => {
  const handleAdd = useCallback(() => {
    onOpenCustomization(item);
  }, [item, onOpenCustomization]);

  const cardColors = useMemo(() => {
    const itemColor = item.color || colors.gray[500];
    return {
      bgColor: getColorWithOpacity(itemColor, 0.1),
      borderColor: itemColor,
      textColor: darkenColor(itemColor, 0.35),
    };
  }, [item.color]);

  return (
    <Pressable onPress={handleAdd} style={styles.cardPressable}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: cardColors.bgColor,
            borderColor: cardColors.borderColor,
          },
        ]}
      >
        <View style={styles.glassOverlay}>
          <View style={styles.cardContent}>
            <View style={styles.cardNameArea}>
              <RNText
                style={[styles.cardName, { color: cardColors.textColor }]}
                numberOfLines={2}
              >
                {item.name}
              </RNText>
            </View>

            <RNText style={styles.itemPriceLabel}>
              {formatPrice(item.price)}
            </RNText>
          </View>
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
}

const MenuCard = memo<MenuCardProps>(({
  menu,
  onMenuAdd,
}) => {
  const handleAdd = useCallback(() => {
    onMenuAdd(menu);
  }, [menu, onMenuAdd]);

  return (
    <Pressable onPress={handleAdd} style={styles.cardPressable}>
      <View
        style={[
          styles.card,
          styles.menuCard,
        ]}
      >
        <View style={styles.glassOverlay}>
          <View style={styles.cardContent}>
            <View style={styles.cardNameArea}>
              <RNText
                style={[styles.cardName, styles.menuNameColor]}
                numberOfLines={2}
              >
                {menu.name}
              </RNText>
              {menu.description && (
                <RNText
                  style={styles.menuDescription}
                  numberOfLines={2}
                >
                  {menu.description}
                </RNText>
              )}
            </View>

            <RNText style={styles.menuPriceLabel}>
              À partir de {formatPrice(getMenuPrice(menu))}
            </RNText>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

MenuCard.displayName = 'MenuCard';

/**
 * Vue cartes unifiée : menus + articles dans un seul scroll
 * Utilise des rows explicites avec flex:1 pour éviter les problèmes
 * de flexWrap + largeur fixe (sub-pixel rendering, colonne fantôme).
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
  const lastMeasuredWidth = useRef(0);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const scrollViewRef = useRef<ScrollView>(null);
  const sectionPositions = useRef<Record<string, number>>({});

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const contentWidth = event.nativeEvent.layout.width - 32;
    if (contentWidth > 0 && Math.abs(contentWidth - lastMeasuredWidth.current) > 2) {
      lastMeasuredWidth.current = contentWidth;
      setContainerWidth(contentWidth);
    }
  }, []);

  const handleSectionLayout = useCallback((sectionKey: string, event: LayoutChangeEvent) => {
    sectionPositions.current[sectionKey] = event.nativeEvent.layout.y;
  }, []);

  const getSections = useCallback((): ScrollSyncSection[] => {
    return Object.entries(sectionPositions.current)
      .map(([key, offset]) => ({ key, offset }))
      .sort((a, b) => a.offset - b.offset);
  }, []);

  const scrollToSection = useCallback((sectionKey: string) => {
    const offset = sectionPositions.current[sectionKey];
    if (offset === undefined) return;
    scrollViewRef.current?.scrollTo({
      y: Math.max(0, offset - 12),
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

  const numColumns = useMemo(() => {
    return calculateOptimalColumns({
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

  const isMeasured = containerWidth > 0;

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.scrollContainer}
      contentContainerStyle={styles.gridContainer}
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      onLayout={handleLayout}
    >
      {isMeasured && (
      <View>
        {/* Section Menus */}
        {filteredMenus.length > 0 && (
          <View onLayout={(e) => handleSectionLayout(MENUS_SECTION_KEY, e)}>
            <SectionDivider title="Menus" borderRadius={6} style={{ marginBottom: 12 }} />
            <View style={styles.sectionGrid}>
              {chunkArray(filteredMenus, numColumns).map((row, rowIdx) => (
                <View key={rowIdx} style={styles.gridRow}>
                  {row.map((menu) => (
                    <MenuCard
                      key={menu.id}
                      menu={menu}
                      onMenuAdd={handleMenuAdd}
                    />
                  ))}
                  {row.length < numColumns && Array.from({ length: numColumns - row.length }, (_, i) => (
                    <View key={`spacer-${i}`} style={styles.cardPressable} />
                  ))}
                </View>
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
            <SectionDivider title={group.itemType.name} borderRadius={6} style={{ marginBottom: 12 }} />
            <View style={styles.sectionGrid}>
              {chunkArray(group.items, numColumns).map((row, rowIdx) => (
                <View key={rowIdx} style={styles.gridRow}>
                  {row.map((item) => (
                    <OrderItemCard
                      key={item.id}
                      item={item}
                      onOpenCustomization={onOpenCustomization}
                    />
                  ))}
                  {row.length < numColumns && Array.from({ length: numColumns - row.length }, (_, i) => (
                    <View key={`spacer-${i}`} style={styles.cardPressable} />
                  ))}
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
      )}
    </ScrollView>
  );
});

OrderItemsCardView.displayName = 'OrderItemsCardView';

const styles = StyleSheet.create({
  // Containers
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  gridContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sectionGrid: {
    gap: 12,
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray[500],
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Card pressable wrapper — flex:1 fills row evenly
  cardPressable: {
    flex: 1,
  },

  // Card base
  card: {
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 130,
    backgroundColor: colors.white,
    overflow: 'hidden' as const,
    ...shadows.all,
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
      transition: 'opacity 0.15s ease, transform 0.15s ease',
    } as any : {}),
  },
  // Menu Card overrides
  menuCard: {
    backgroundColor: MENU_BG_COLOR,
    borderColor: MENU_COLOR,
  },

  // Glass overlay
  glassOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 9,
  },

  // Card content
  cardContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
    gap: 12,
  },
  cardNameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  menuNameColor: {
    color: MENU_TEXT_COLOR,
  },
  menuDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.gray[400],
    letterSpacing: 0.8,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 2,
  },

  // Prix article : gris foncé
  itemPriceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[500],
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  // Prix menu "À partir de" : gris clair
  menuPriceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[400],
    letterSpacing: 0.8,
    textAlign: 'center',
  },
});
