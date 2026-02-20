import { memo } from 'react';
import { View, ScrollView, StyleSheet, Platform, Pressable, Text as RNText } from 'react-native';
import { RoomBadgeItem } from './RoomBadgeItem';

interface RoomTabsHeaderProps {
  rooms: any[];
  currentRoomId: string | undefined;
  enrichedTables: any[];
  onRoomChange: (room: any) => void;
  onEditModePress: () => void;
}

export const RoomTabsHeader = memo<RoomTabsHeaderProps>(({
  rooms,
  currentRoomId,
  enrichedTables,
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
            enrichedTables={enrichedTables}
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
    backgroundColor: '#FBFBFB',
    height: 60,
    zIndex: 10,
  },
  scrollContent: {
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 8,
  },
  editButton: {
    backgroundColor: '#2A2E33',
    height: 60,
    width: 200,
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
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
