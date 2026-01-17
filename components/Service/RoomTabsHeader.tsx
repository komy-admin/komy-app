import { memo } from 'react';
import { View, ScrollView, StyleSheet, Platform, Pressable, Text as RNText } from 'react-native';
import { RoomBadgeItem } from './RoomBadgeItem';

interface RoomTabsHeaderProps {
  rooms: any[];
  currentRoomId: string | undefined;
  onRoomChange: (room: any) => void;
  onEditModePress: () => void;
}

/**
 * Header mémoïsé affichant les tabs de rooms avec bouton édition
 */
export const RoomTabsHeader = memo<RoomTabsHeaderProps>(({
  rooms,
  currentRoomId,
  onRoomChange,
  onEditModePress
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        className="flex-row p-2 flex-1"
      >
        {rooms.map((room, index) => (
          <RoomBadgeItem
            key={`${room.name}-badge-${index}`}
            room={room}
            isActive={room.id === currentRoomId}
            onPress={onRoomChange}
            keyPrefix="badge"
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
    height: 50,
    zIndex: 10,
    elevation: 5,
    ...Platform.select({
      android: {
        shadowColor: 'transparent',
      },
    }),
  },
  scrollContent: {
    alignItems: 'center',
    height: '100%',
  },
  editButton: {
    backgroundColor: '#2A2E33',
    borderRadius: 0,
    height: 50,
    width: 200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
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
