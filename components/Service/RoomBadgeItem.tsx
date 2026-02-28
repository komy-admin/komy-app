import { memo, useCallback, useMemo } from 'react';
import { Pressable, View, Text as RNText, StyleSheet, Platform } from 'react-native';
import { Utensils, ConciergeBell } from 'lucide-react-native';

interface RoomBadgeItemProps {
  room: any;
  isActive: boolean;
  enrichedTables: any[];
  onPress: (room: any) => void;
  showInactiveIndicator?: boolean;
}

export const RoomBadgeItem = memo<RoomBadgeItemProps>(({
  room,
  isActive,
  enrichedTables,
  onPress,
  showInactiveIndicator = false,
}) => {
  const handlePress = useCallback(() => {
    onPress(room);
  }, [room, onPress]);

  const stats = useMemo(() => {
    const roomTables = enrichedTables.filter((t: any) => t.roomId === room.id);
    const totalTables = roomTables.length;
    const activeOrders = roomTables.filter((t: any) => t.orders && t.orders.length > 0).length;
    return { totalTables, activeOrders };
  }, [enrichedTables, room.id]);

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.card,
        showInactiveIndicator && !room.isActive && styles.cardInactive,
        isActive && styles.cardActive,
      ]}
    >
      <View style={styles.cardContent}>
        <View style={styles.nameRow}>
          <RNText
            style={[
              styles.name,
              showInactiveIndicator && !room.isActive && styles.nameInactive,
            ]}
            numberOfLines={1}
          >
            {room.name}
          </RNText>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Utensils size={12} color="rgba(42,46,51,0.4)" />
            <RNText style={styles.statText}>
              {stats.totalTables}
            </RNText>
          </View>
          <View style={styles.stat}>
            <ConciergeBell size={12} color="rgba(42,46,51,0.4)" />
            <RNText style={styles.statText}>
              {stats.activeOrders}
            </RNText>
          </View>
        </View>
      </View>
      <View style={[
        styles.halfCircle,
        { backgroundColor: showInactiveIndicator && !room.isActive ? '#D1D5DB' : (room.color || '#6366F1') }
      ]} />
    </Pressable>
  );
});

RoomBadgeItem.displayName = 'RoomBadgeItem';

const styles = StyleSheet.create({
  card: {
    borderRadius: 6,
    marginHorizontal: 4,
    backgroundColor: '#E5E5EA',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      web: { cursor: 'pointer' as any },
    }),
  },
  cardActive: {
    borderWidth: 2,
    borderColor: '#2A2E33',
  },
  cardContent: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  halfCircle: {
    width: 14,
    height: 28,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2A2E33',
  },
  nameInactive: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through' as const,
  },
  cardInactive: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderStyle: 'dashed' as const,
    borderColor: '#C7C7CC',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(42,46,51,0.4)',
  },
});
