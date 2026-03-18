import { memo, useMemo } from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { LayoutDashboard, LayoutGrid } from 'lucide-react-native';
import { TabsHeader } from '~/components/ui/TabsHeader';
import { TabBadgeItem } from '~/components/ui/TabBadgeItem';
import { HeaderActionButton } from '~/components/ui/HeaderActionButton';

type ServiceViewMode = 'rooms' | 'orders';

interface RoomTabsHeaderProps {
  rooms: any[];
  currentRoomId: string | undefined;
  orderCountByRoom: Record<string, number>;
  onRoomChange: (room: any) => void;
  onEditModePress: () => void;
  viewMode: ServiceViewMode;
  onViewModeChange: (mode: ServiceViewMode) => void;
}

export const RoomTabsHeader = memo<RoomTabsHeaderProps>(({
  rooms,
  currentRoomId,
  orderCountByRoom,
  onRoomChange,
  onEditModePress,
  viewMode,
  onViewModeChange,
}) => {
  const rightSlot = useMemo(() => (
    <>
      <View style={styles.separator} />
      <View style={styles.toggleContainer}>
        <Pressable
          onPress={() => onViewModeChange('rooms')}
          style={[styles.toggleButton, viewMode === 'rooms' && styles.toggleButtonActive]}
        >
          <LayoutDashboard
            size={18}
            color={viewMode === 'rooms' ? '#2A2E33' : '#9CA3AF'}
            strokeWidth={2}
          />
        </Pressable>
        <Pressable
          onPress={() => onViewModeChange('orders')}
          style={[styles.toggleButton, viewMode === 'orders' && styles.toggleButtonActive]}
        >
          <LayoutGrid
            size={18}
            color={viewMode === 'orders' ? '#2A2E33' : '#9CA3AF'}
            strokeWidth={2}
          />
        </Pressable>
      </View>
      {viewMode === 'rooms' && (
        <HeaderActionButton label="MODE ÉDITION" onPress={onEditModePress} />
      )}
    </>
  ), [viewMode, onViewModeChange, onEditModePress]);

  return (
    <TabsHeader rightSlot={rightSlot} style={styles.header}>
      {rooms.map((room) => {
        const count = orderCountByRoom[room.id] || 0;
        return (
          <Pressable key={room.id} onPress={() => onRoomChange(room)}>
            {({ pressed }) => (
              <View style={pressed ? styles.pressed : undefined}>
                <TabBadgeItem
                  name={room.name}
                  stats={`${count} commande${count !== 1 ? 's' : ''}`}
                  isActive={room.id === currentRoomId}
                  activeColor={room.color || '#6366F1'}
                />
              </View>
            )}
          </Pressable>
        );
      })}
    </TabsHeader>
  );
});

RoomTabsHeader.displayName = 'RoomTabsHeader';

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
  },
  pressed: {
    opacity: 0.6,
  },
  separator: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  toggleButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    ...Platform.select({
      web: { cursor: 'pointer' as any },
    }),
  } as any,
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});
