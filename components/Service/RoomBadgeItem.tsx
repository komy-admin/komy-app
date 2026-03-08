import { memo, useCallback } from 'react';
import { Pressable, View, Text as RNText, StyleSheet, Platform } from 'react-native';

interface RoomBadgeItemProps {
  room: any;
  isActive: boolean;
  orderCount: number;
  onPress: (room: any) => void;
  showInactiveIndicator?: boolean;
}

export const RoomBadgeItem = memo<RoomBadgeItemProps>(({
  room,
  isActive,
  orderCount,
  onPress,
  showInactiveIndicator = false,
}) => {
  const handlePress = useCallback(() => {
    onPress(room);
  }, [room, onPress]);

  const roomColor = room.color || '#6366F1';
  const isInactive = showInactiveIndicator && !room.isActive;

  return (
    <Pressable onPress={handlePress}>
      {({ pressed }) => (
        <View style={[styles.tab, pressed && { opacity: 0.6 }]}>
          <RNText
            style={[
              styles.name,
              isActive && styles.nameActive,
              isInactive && styles.nameInactive,
            ]}
            numberOfLines={1}
          >
            {room.name}
          </RNText>
          <RNText style={[
            styles.stats,
            isActive && styles.statsActive,
            isInactive && styles.statsInactive,
          ]}>
            {orderCount} commande{orderCount !== 1 ? 's' : ''}
          </RNText>
          <View
            style={[
              styles.indicator,
              isActive && { backgroundColor: roomColor },
            ]}
          />
        </View>
      )}
    </Pressable>
  );
});

RoomBadgeItem.displayName = 'RoomBadgeItem';

const styles = StyleSheet.create({
  tab: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 0,
    justifyContent: 'flex-end',
    ...Platform.select({
      web: { cursor: 'pointer' as any },
    }),
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  nameActive: {
    fontWeight: '700',
    color: '#2A2E33',
  },
  nameInactive: {
    color: '#C7C7CC',
    textDecorationLine: 'line-through' as const,
  },
  stats: {
    fontSize: 11,
    fontWeight: '500',
    color: '#C4C9D1',
    marginTop: 2,
  },
  statsActive: {
    color: '#9CA3AF',
  },
  statsInactive: {
    color: '#D1D5DB',
  },
  indicator: {
    height: 3,
    alignSelf: 'stretch',
    borderRadius: 1.5,
    marginTop: 8,
    marginHorizontal: -16,
    backgroundColor: 'transparent',
  },
});
