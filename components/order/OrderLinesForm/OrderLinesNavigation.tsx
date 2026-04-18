import { memo } from 'react';
import { View, Pressable, ScrollView, Platform, Text as RNText } from 'react-native';
import { ItemType } from '~/types/item-type.types';
import { LayoutGrid, List, Menu } from 'lucide-react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { AVAILABLE_ICONS } from '~/components/ui/IconSelector';
import { ViewModeToggle } from '~/components/ui/ViewModeToggle';
import { shadows } from '~/theme';

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
      <ViewModeToggle
        options={[
          { value: 'card', icon: LayoutGrid },
          { value: 'list', icon: List },
        ]}
        value={viewMode}
        onChange={onViewModeChange}
        orientation="vertical"
      />

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
              size={18}
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
                  size={18}
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
    ...shadows.left,
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
    paddingTop: 6,
    paddingBottom: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    width: 68,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    } as any),
  },
  navItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  navIconWrapper: {
    width: 32,
    height: 32,
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
    marginTop: 0,
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
