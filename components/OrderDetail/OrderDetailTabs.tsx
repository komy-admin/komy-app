import React, { memo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SelectButton } from '~/components/ui';
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

export const OrderDetailTabs = memo<OrderDetailTabsProps>(({
  activeTab,
  onTabChange,
  itemTypes,
  counts,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Tab Tous */}
        <SelectButton
          label="Tous"
          count={counts.all}
          isActive={activeTab === 'ALL'}
          onPress={() => onTabChange('ALL')}
          variant="pill"
          activeColor="#6366F1"
          activeBgColor="rgba(99, 102, 241, 0.12)"
        />

        {/* Tab Menus */}
        <SelectButton
          label="Menus"
          count={counts.menus}
          isActive={activeTab === 'MENUS'}
          onPress={() => onTabChange('MENUS')}
          variant="pill"
          activeColor="#8B5CF6"
          activeBgColor="rgba(139, 92, 246, 0.12)"
        />

        {/* Séparateur */}
        <View style={styles.divider} />

        {/* Tabs pour chaque ItemType */}
        {itemTypes.map((itemType) => (
          <SelectButton
            key={itemType.id}
            label={itemType.name}
            count={counts[itemType.id] || 0}
            isActive={activeTab === itemType.id}
            onPress={() => onTabChange(itemType.id)}
            variant="pill"
            activeColor="#6B7280"
            activeBgColor="rgba(107, 114, 128, 0.12)"
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
