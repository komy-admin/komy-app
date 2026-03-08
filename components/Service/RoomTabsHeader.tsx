import { memo } from 'react';
import { View, ScrollView, StyleSheet, Platform, Pressable, Text as RNText } from 'react-native';
import { RoomBadgeItem } from './RoomBadgeItem';

interface RoomTabsHeaderProps {
  rooms: any[];
  currentRoomId: string | undefined;
  orderCountByRoom: Record<string, number>;
  onRoomChange: (room: any) => void;
  onEditModePress: () => void;
}

export const RoomTabsHeader = memo<RoomTabsHeaderProps>(({
  rooms,
  currentRoomId,
  orderCountByRoom,
  onRoomChange,
  onEditModePress
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
      <Pressable
        onPress={onEditModePress}
        style={styles.editButton}
      >
        <RNText style={styles.editButtonText}>
          MODE ÉDITION
        </RNText>
      </Pressable>
    </View>
  );
});

RoomTabsHeader.displayName = 'RoomTabsHeader';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 10,
  },
  scrollContent: {
    alignItems: 'flex-end',
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
    fontSize: 12,
    color: '#FBFBFB',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
