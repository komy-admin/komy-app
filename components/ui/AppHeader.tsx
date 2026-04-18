import { ReactNode } from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { shadows } from '~/theme';

interface AppHeaderProps {
  tabs?: ReactNode;
  rightSlot?: ReactNode;
  height?: number;
  backgroundColor?: string;
  style?: ViewStyle;
}

/**
 * Unified screen header for the app (service, menu, team, room edition, …).
 *
 * Visual signature:
 *   - fixed height (default 61)
 *   - bottom border + `shadows.bottom`
 *   - white background (overridable)
 *
 * Layout:
 *   - if `tabs` provided → rendered inside a horizontal ScrollView (left, flex:1)
 *   - else → a flex:1 spacer fills the left, pushing `rightSlot` to the right
 */
export function AppHeader({
  tabs,
  rightSlot,
  height = 61,
  backgroundColor = '#FFFFFF',
  style,
}: AppHeaderProps) {
  return (
    <View style={[styles.container, { height, backgroundColor }, style]}>
      {tabs ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs}
        </ScrollView>
      ) : (
        <View style={styles.spacer} />
      )}
      {rightSlot}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...shadows.bottom,
  } as ViewStyle,
  tabsScroll: {
    flex: 1,
  },
  tabsContent: {
    alignItems: 'flex-end',
  },
  spacer: {
    flex: 1,
  },
});
