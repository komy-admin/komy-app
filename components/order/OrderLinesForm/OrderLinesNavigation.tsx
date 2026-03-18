import { memo } from 'react';
import { View, Pressable, ScrollView, Platform, Text as RNText } from 'react-native';
import { ItemType } from '~/types/item-type.types';
import { LayoutGrid, List, Menu } from 'lucide-react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { AVAILABLE_ICONS } from '~/components/ui/IconSelector';

const ACTIVE_COLOR = '#2A2E33';
const INACTIVE_COLOR = '#9CA3AF';

/**
 * Props pour le composant OrderLinesNavigation
 */
export interface OrderLinesNavigationProps {
  activeMainTab: string;
  onMainTabChange: (tab: string) => void;
  activeItemType: string;
  onItemTypeChange: (itemType: string) => void;
  itemTypes: ItemType[];
  isConfiguringMenu?: boolean;
  viewMode: 'card' | 'list';
  onViewModeChange: (mode: 'card' | 'list') => void;
}

/**
 * Composant de navigation verticale pour OrderLinesForm
 * Sidebar droite avec switch card/list, MENUS, et itemTypes avec icônes
 */
export const OrderLinesNavigation = memo<OrderLinesNavigationProps>(({
  activeMainTab,
  onMainTabChange,
  activeItemType,
  onItemTypeChange,
  itemTypes,
  isConfiguringMenu = false,
  viewMode,
  onViewModeChange
}) => {
  if (isConfiguringMenu) {
    return null;
  }

  return (
    <View style={styles.sidebar}>
      {/* Switch Card / List en haut */}
      <View style={styles.viewModeSection}>
        <Pressable
          style={[
            styles.viewModeButton,
            viewMode === 'card' && styles.viewModeButtonActive
          ]}
          onPress={() => onViewModeChange('card')}
        >
          <LayoutGrid
            size={20}
            color={viewMode === 'card' ? ACTIVE_COLOR : INACTIVE_COLOR}
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
            color={viewMode === 'list' ? ACTIVE_COLOR : INACTIVE_COLOR}
            strokeWidth={2}
          />
        </Pressable>
      </View>

      {/* Séparateur */}
      <View style={styles.horizontalDivider} />

      {/* MENUS + ItemTypes dans le même scroll */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.itemTypesScroll}
        contentContainerStyle={styles.itemTypesContent}
      >
        {/* MENUS */}
        <Pressable
          style={[
            styles.navItem,
            activeMainTab === 'MENUS' && styles.navItemActive
          ]}
          onPress={() => onMainTabChange('MENUS')}
        >
          <View style={styles.navIconWrapper}>
            <Menu
              size={22}
              color={activeMainTab === 'MENUS' ? ACTIVE_COLOR : INACTIVE_COLOR}
              strokeWidth={2}
            />
          </View>
          <RNText
            style={[
              styles.navLabel,
              activeMainTab === 'MENUS' && styles.navLabelActive
            ]}
            numberOfLines={1}
          >
            MENUS
          </RNText>
        </Pressable>

        {/* Séparateur */}
        <View style={styles.horizontalDivider} />

        {/* ItemTypes */}
        {itemTypes.map((itemType) => {
          const isActive = activeMainTab === 'ITEMS' && activeItemType === itemType.id;
          const iconData = AVAILABLE_ICONS.find(i => i.name === itemType.icon);
          const iconName = iconData?.name || 'silverware-fork-knife';

          return (
            <Pressable
              key={itemType.id}
              style={[
                styles.navItem,
                isActive && styles.navItemActive
              ]}
              onPress={() => {
                if (activeMainTab !== 'ITEMS') {
                  onMainTabChange('ITEMS');
                }
                onItemTypeChange(itemType.id);
              }}
            >
              <View style={styles.navIconWrapper}>
                <MaterialCommunityIcons
                  name={iconName as any}
                  size={22}
                  color={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
                />
              </View>
              <RNText
                style={[
                  styles.navLabel,
                  isActive && styles.navLabelActive
                ]}
                numberOfLines={1}
              >
                {itemType.name}
              </RNText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

OrderLinesNavigation.displayName = 'OrderLinesNavigation';

const styles = {
  sidebar: {
    width: 82,
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    paddingTop: 12,
    alignItems: 'center' as const,
  },

  // View mode switch
  viewModeSection: {
    gap: 4,
    alignItems: 'center' as const,
    paddingHorizontal: 8,
  },
  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
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

  // Divider
  horizontalDivider: {
    width: 48,
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },

  // Nav items
  navItem: {
    alignItems: 'center' as const,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    width: 72,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    } as any),
  },
  navItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  navIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'transparent',
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: INACTIVE_COLOR,
    textAlign: 'center' as const,
    marginTop: 2,
    letterSpacing: 0.3,
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      userSelect: 'none',
    } as any),
  },
  navLabelActive: {
    color: ACTIVE_COLOR,
    fontWeight: '700' as const,
  },

  // ItemTypes scroll
  itemTypesScroll: {
    flex: 1,
    width: '100%' as const,
  },
  itemTypesContent: {
    alignItems: 'center' as const,
    gap: 2,
    paddingBottom: 20,
  },
};
