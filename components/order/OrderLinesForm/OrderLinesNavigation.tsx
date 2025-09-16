import React, { memo } from 'react';
import { View, Platform } from 'react-native';
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

// Styles universels (web + mobile)
const universalStyles = {
  mainButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 48,
    ...(Platform.OS === 'web' && {
      display: 'flex',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    })
  },
  mainButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
    textAlign: 'center' as const,
    letterSpacing: 0.3,
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif'
    })
  },
  subButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 36,
    minWidth: 80,
    ...(Platform.OS === 'web' && {
      display: 'flex',
      cursor: 'pointer'
    })
  },
  subButtonText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#6b7280',
    textAlign: 'center' as const,
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif'
    })
  }
};

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

  // Helper universel pour tous les boutons
  const renderButton = (
    type: 'main' | 'sub',
    isActive: boolean,
    content: string,
    onPress: () => void,
    key?: string
  ) => {
    const isMain = type === 'main';
    const baseButtonStyle = isMain ? universalStyles.mainButton : universalStyles.subButton;
    const baseTextStyle = isMain ? universalStyles.mainButtonText : universalStyles.subButtonText;

    const activeStyles = isActive ? {
      backgroundColor: '#2A2E33',
      borderColor: '#2A2E33'
    } : {};

    const activeTextStyles = isActive ? {
      color: '#FFFFFF',
      fontWeight: isMain ? '700' : '600'
    } : {};

    return (
      <div
        key={key}
        style={{
          ...baseButtonStyle,
          ...activeStyles
        }}
        onClick={onPress}
      >
        <span style={{
          ...baseTextStyle,
          ...activeTextStyles
        }}>
          {content}
        </span>
      </div>
    );
  };

  return (
    <View style={styles.navigationContainer}>
      {/* Navigation principale ITEMS/MENUS */}
      <View style={styles.mainNavigation}>
        <View style={styles.tabsContainer}>
          {renderButton('main', activeMainTab === 'MENUS', `Menus (${getTotalMenusCount()})`, () => onMainTabChange('MENUS'))}
          {renderButton('main', activeMainTab === 'ITEMS', `Articles (${getTotalItemsCount()})`, () => onMainTabChange('ITEMS'))}
        </View>
      </View>

      {/* Sous-navigation par type d'item (visible seulement pour les articles) */}
      {activeMainTab === 'ITEMS' && (
        <View style={styles.subNavigation}>
          <View style={styles.categoryButtons}>
            {itemTypes.map((itemType) =>
              renderButton(
                'sub',
                activeItemType === itemType.id,
                itemType.name,
                () => onItemTypeChange(itemType.id),
                itemType.id
              )
            )}
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