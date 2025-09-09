import React, { memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from '~/components/ui';
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
          {/* Tab Articles */}
          <Pressable
            style={[
              styles.tab,
              activeMainTab === 'ITEMS' && styles.activeTab
            ]}
            onPress={() => onMainTabChange('ITEMS')}
          >
            <Text style={[
              styles.tabText,
              activeMainTab === 'ITEMS' && styles.activeTabText
            ]}>
              Articles ({getTotalItemsCount()})
            </Text>
          </Pressable>

          {/* Tab Menus */}
          <Pressable
            style={[
              styles.tab,
              activeMainTab === 'MENUS' && styles.activeTab
            ]}
            onPress={() => onMainTabChange('MENUS')}
          >
            <Text style={[
              styles.tabText,
              activeMainTab === 'MENUS' && styles.activeTabText
            ]}>
              Menus ({getTotalMenusCount()})
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Sous-navigation par type d'item (visible seulement pour les articles) */}
      {activeMainTab === 'ITEMS' && (
        <View style={styles.subNavigation}>
          <View style={styles.categoryButtons}>
            {itemTypes.map((itemType) => (
              <Pressable
                key={itemType.id}
                style={[
                  styles.subCategoryButton,
                  activeItemType === itemType.id && styles.subCategoryButtonActive
                ]}
                onPress={() => onItemTypeChange(itemType.id)}
              >
                <Text style={[
                  styles.subCategoryButtonText,
                  activeItemType === itemType.id && styles.subCategoryButtonTextActive
                ]}>
                  {itemType.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
});

OrderLinesNavigation.displayName = 'OrderLinesNavigation';

const styles = StyleSheet.create({
  navigationContainer: {
    backgroundColor: '#ffffff',
  },
  mainNavigation: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: '#ffffff',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  activeTab: {
    backgroundColor: '#2A2E33',
    borderColor: '#2A2E33',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  subNavigation: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subCategoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subCategoryButtonActive: {
    backgroundColor: '#2A2E33',
    borderColor: '#2A2E33',
  },
  subCategoryButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
  subCategoryButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});