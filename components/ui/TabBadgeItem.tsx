import { View, Text as RNText, StyleSheet, Platform } from 'react-native';
import { colors } from '~/theme';

interface TabBadgeItemProps {
  name: string;
  stats: string;
  isActive: boolean;
  activeColor?: string;
  isInactive?: boolean;
}

export function TabBadgeItem({
  name,
  stats,
  isActive,
  activeColor = colors.brand.dark,
  isInactive = false,
}: TabBadgeItemProps) {
  return (
    <View style={styles.tab}>
      <View style={styles.content}>
        <RNText
          style={[
            styles.name,
            isInactive && styles.nameInactive,
          ]}
          numberOfLines={1}
        >
          {name}
        </RNText>
        <RNText style={[
          styles.stats,
          isActive && styles.statsActive,
          isInactive && styles.statsInactive,
        ]}>
          {stats}
        </RNText>
      </View>
      <View
        style={[
          styles.indicator,
          isActive && { backgroundColor: activeColor },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tab: {
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 16,
    ...Platform.select({
      web: { cursor: 'pointer' as any },
    }),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.brand.dark,
  },
  nameInactive: {
    color: colors.gray[300],
    textDecorationLine: 'line-through' as const,
  },
  stats: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.gray[300],
    marginTop: 2,
  },
  statsActive: {
    color: colors.gray[400],
  },
  statsInactive: {
    color: colors.gray[300],
  },
  indicator: {
    height: 3,
    alignSelf: 'stretch',
    borderRadius: 1.5,
    marginHorizontal: -16,
    backgroundColor: 'transparent',
  },
});
