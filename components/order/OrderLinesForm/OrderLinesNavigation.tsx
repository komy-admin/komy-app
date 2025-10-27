import React, { memo } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { SelectButton } from '~/components/ui';
import { ItemType } from '~/types/item-type.types';
import { LayoutGrid, List } from 'lucide-react-native';

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
  viewMode: 'card' | 'list';
  onViewModeChange: (mode: 'card' | 'list') => void;
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
  isConfiguringMenu = false,
  viewMode,
  onViewModeChange
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScrollView}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {itemTypes.map((itemType) => (
              <SelectButton
                key={itemType.id}
                label={itemType.name}
                isActive={activeItemType === itemType.id}
                onPress={() => onItemTypeChange(itemType.id)}
                variant="sub"
              />
            ))}
          </ScrollView>
        )}

        {/* Spacer flexible quand on est en mode MENUS (pas d'itemTypes) */}
        {activeMainTab === 'MENUS' && (
          <View style={{ flex: 1 }} />
        )}

        {/* Séparateur vertical */}
        <View style={styles.verticalDivider} />

        {/* Switch View Mode */}
        <View style={styles.viewModeSwitch}>
          <Pressable
            style={[
              styles.viewModeButton,
              viewMode === 'card' && styles.viewModeButtonActive
            ]}
            onPress={() => onViewModeChange('card')}
          >
            <LayoutGrid
              size={20}
              color={viewMode === 'card' ? '#6366F1' : '#9CA3AF'}
              strokeWidth={2}
            />
          </Pressable>
          <Pressable
            style={[
              styles.viewModeButton,
              viewMode === 'list' && styles.viewModeButtonActive
            ]}
            onPress={() => onViewModeChange('list')}
          >
            <List
              size={20}
              color={viewMode === 'list' ? '#6366F1' : '#9CA3AF'}
              strokeWidth={2}
            />
          </Pressable>
        </View>
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
  categoryScrollView: {
    flex: 1,
    maxHeight: 44,
  },
  categoryScrollContent: {
    flexDirection: 'row' as const,
    gap: 8,
    alignItems: 'center' as const,
    paddingRight: 8,
  },
  viewModeSwitch: {
    flexDirection: 'row' as const,
    gap: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  viewModeButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'transparent',
  },
  viewModeButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
};