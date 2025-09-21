import React, { memo } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { SelectButton } from '~/components/ui';
import { ItemType } from '~/types/item-type.types';

/**
 * Props pour le composant OrderLinesNavigation
 */
export interface OrderLinesNavigationProps {
  activeMainTab: string;
  onMainTabChange: (tab: string) => void;
  activeItemType: string;
  onItemTypeChange: (itemType: string) => void;
  itemTypes: ItemType[];
  getTotalItemsCount: () => number;
  getTotalMenusCount: () => number;
  isConfiguringMenu?: boolean;
}

/**
 * Composant de navigation pour OrderLinesForm
 * Gère les tabs principales (ITEMS/MENUS) et la sous-navigation par type d'item
 *
 * @param props - Props du composant
 * @returns Composant de navigation mémorisé
 */

export const OrderLinesNavigation = memo<OrderLinesNavigationProps>(({
  activeMainTab,
  onMainTabChange,
  activeItemType,
  onItemTypeChange,
  itemTypes,
  getTotalItemsCount,
  getTotalMenusCount,
  isConfiguringMenu = false
}) => {
  // Ne pas afficher la navigation pendant la configuration de menu
  if (isConfiguringMenu) {
    return null;
  }

  return (
    <View style={styles.navigationContainer}>
      {/* Navigation principale ITEMS/MENUS */}
      <View style={styles.mainNavigation}>
        <View style={styles.tabsContainer}>
          <SelectButton
            label={`Menus (${getTotalMenusCount()})`}
            isActive={activeMainTab === 'MENUS'}
            onPress={() => onMainTabChange('MENUS')}
            variant="main"
            flex
          />
          <SelectButton
            label={`Articles (${getTotalItemsCount()})`}
            isActive={activeMainTab === 'ITEMS'}
            onPress={() => onMainTabChange('ITEMS')}
            variant="main"
            flex
          />
        </View>
      </View>

      {/* Sous-navigation par type d'item (visible seulement pour les articles) */}
      {activeMainTab === 'ITEMS' && (
        <View style={styles.subNavigation}>
          <View style={styles.categoryButtons}>
            {itemTypes.map((itemType) => (
              <SelectButton
                key={itemType.id}
                label={itemType.name}
                isActive={activeItemType === itemType.id}
                onPress={() => onItemTypeChange(itemType.id)}
                variant="sub"
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
});

OrderLinesNavigation.displayName = 'OrderLinesNavigation';

const styles = {
  navigationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...(Platform.OS !== 'web' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    })
  },
  mainNavigation: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  tabsContainer: {
    flexDirection: 'row' as const,
    flex: 1,
    gap: 12,
  },
  subNavigation: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  categoryButtons: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
};