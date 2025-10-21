import React, { memo } from 'react';
import { View } from 'react-native';
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
 * Layout horizontal optimisé pour tablettes
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
      <View style={styles.horizontalLayout}>
        {/* Navigation principale ITEMS/MENUS */}
        <View style={styles.mainTabsHorizontal}>
          <SelectButton
            label="Menus"
            count={getTotalMenusCount()}
            isActive={activeMainTab === 'MENUS'}
            onPress={() => onMainTabChange('MENUS')}
            variant="pill"
            activeColor="#6366F1"
            activeBgColor="rgba(99, 102, 241, 0.12)"
          />
          <SelectButton
            label="Articles"
            count={getTotalItemsCount()}
            isActive={activeMainTab === 'ITEMS'}
            onPress={() => onMainTabChange('ITEMS')}
            variant="pill"
            activeColor="#6B7280"
            activeBgColor="rgba(107, 114, 128, 0.12)"
          />
        </View>

        {/* Séparateur vertical */}
        {activeMainTab === 'ITEMS' && (
          <View style={styles.verticalDivider} />
        )}

        {/* Types d'items (visible seulement pour les articles) */}
        {activeMainTab === 'ITEMS' && (
          <View style={styles.categoryButtonsHorizontal}>
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
        )}
      </View>
    </View>
  );
});

OrderLinesNavigation.displayName = 'OrderLinesNavigation';

const styles = {
  navigationContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  horizontalLayout: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
  },
  mainTabsHorizontal: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  verticalDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  categoryButtonsHorizontal: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    flex: 1,
  },
};