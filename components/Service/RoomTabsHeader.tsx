import { memo } from 'react';
import { View, ScrollView, StyleSheet, Platform, Pressable, Text as RNText } from 'react-native';
import { LayoutDashboard, LayoutGrid } from 'lucide-react-native';
import { RoomBadgeItem } from './RoomBadgeItem';

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
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {rooms.map((room) => (
          <RoomBadgeItem
            key={room.id}
            room={room}
            isActive={room.id === currentRoomId}
            orderCount={orderCountByRoom[room.id] || 0}
            onPress={onRoomChange}
          />
        ))}
      </ScrollView>

      {/* Separator */}
      <View style={styles.separator} />

      {/* View mode toggle */}
      <View style={styles.toggleContainer}>
        <Pressable
          onPress={() => onViewModeChange('rooms')}
          style={[styles.toggleButton, viewMode === 'rooms' && styles.toggleButtonActive]}
        >
          <LayoutDashboard
            size={18}
            color={viewMode === 'rooms' ? '#3B82F6' : '#9CA3AF'}
            strokeWidth={2}
          />
        </Pressable>
        <Pressable
          onPress={() => onViewModeChange('orders')}
          style={[styles.toggleButton, viewMode === 'orders' && styles.toggleButtonActive]}
        >
          <LayoutGrid
            size={18}
            color={viewMode === 'orders' ? '#3B82F6' : '#9CA3AF'}
            strokeWidth={2}
          />
        </Pressable>
      </View>

      {viewMode === 'rooms' && (
        <Pressable
          onPress={onEditModePress}
          style={styles.editButton}
        >
          <RNText style={styles.editButtonText}>
            MODE ÉDITION
          </RNText>
        </Pressable>
      )}
    </View>
  );
});

RoomTabsHeader.displayName = 'RoomTabsHeader';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    height: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'flex-end',
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
  editButton: {
    backgroundColor: '#2A2E33',
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' as any },
    }),
  },
  editButtonText: {
    fontSize: 14,
    color: '#FBFBFB',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
