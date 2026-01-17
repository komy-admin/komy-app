import { memo, useMemo, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SelectButton } from '~/components/ui';
import { OrderDetailTabItem } from './OrderDetailTabItem';
import { ItemType } from '~/types/item-type.types';

export interface OrderDetailTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  itemTypes: ItemType[];
  counts: {
    all: number;
    menus: number;
    [itemTypeId: string]: number;
  };
}

// ✅ Constantes pour les couleurs (facilitent le theming et la maintenance)
const TAB_COLORS = {
  ALL: {
    activeColor: '#6366F1',
    activeBgColor: 'rgba(99, 102, 241, 0.12)',
  },
  MENUS: {
    activeColor: '#8B5CF6',
    activeBgColor: 'rgba(139, 92, 246, 0.12)',
  },
  ITEM_TYPE: {
    activeColor: '#6B7280',
    activeBgColor: 'rgba(107, 114, 128, 0.12)',
  },
} as const;

export const OrderDetailTabs = memo<OrderDetailTabsProps>(({
  activeTab,
  onTabChange,
  itemTypes,
  counts,
}) => {
  // ✅ useMemo : Filtrer les itemTypes avec count > 0 (évite .filter() à chaque render)
  const filteredItemTypes = useMemo(
    () => itemTypes.filter((itemType) => (counts[itemType.id] || 0) > 0),
    [itemTypes, counts]
  );

  // ✅ useMemo : Vérifier s'il y a des itemTypes avec count > 0 (évite .some() à chaque render)
  const hasItemTypesWithCount = useMemo(
    () => filteredItemTypes.length > 0,
    [filteredItemTypes]
  );

  // ✅ useCallback : Handler pour "Tous" (mémoïsé)
  const handleAllTabPress = useCallback(() => {
    onTabChange('ALL');
  }, [onTabChange]);

  // ✅ useCallback : Handler pour "Menus" (mémoïsé)
  const handleMenusTabPress = useCallback(() => {
    onTabChange('MENUS');
  }, [onTabChange]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}
      >
        {/* Tab Tous */}
        <SelectButton
          label="Tous"
          count={counts.all}
          isActive={activeTab === 'ALL'}
          onPress={handleAllTabPress}
          variant="pill"
          activeColor={TAB_COLORS.ALL.activeColor}
          activeBgColor={TAB_COLORS.ALL.activeBgColor}
        />

        {/* Tab Menus */}
        <SelectButton
          label="Menus"
          count={counts.menus}
          isActive={activeTab === 'MENUS'}
          onPress={handleMenusTabPress}
          variant="pill"
          activeColor={TAB_COLORS.MENUS.activeColor}
          activeBgColor={TAB_COLORS.MENUS.activeBgColor}
        />

        {/* Séparateur - affiché seulement si il y a des itemTypes avec count > 0 */}
        {hasItemTypesWithCount && <View style={styles.divider} />}

        {/* ✅ Tabs pour chaque ItemType - composant mémoïsé avec handler propre */}
        {filteredItemTypes.map((itemType) => (
          <OrderDetailTabItem
            key={itemType.id}
            itemTypeId={itemType.id}
            label={itemType.name}
            count={counts[itemType.id] || 0}
            isActive={activeTab === itemType.id}
            activeColor={TAB_COLORS.ITEM_TYPE.activeColor}
            activeBgColor={TAB_COLORS.ITEM_TYPE.activeBgColor}
            onTabChange={onTabChange}
          />
        ))}
      </ScrollView>
    </View>
  );
});

OrderDetailTabs.displayName = 'OrderDetailTabs';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingRight: 8,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
});
