import { memo, useCallback } from 'react';
import { Pressable } from 'react-native';
import { Badge, Text } from '~/components/ui';

interface RoomBadgeItemProps {
  room: any;
  isActive: boolean;
  onPress: (room: any) => void;
  keyPrefix?: string;
}

/**
 * Composant mémoïsé pour afficher un badge de room cliquable
 */
export const RoomBadgeItem = memo<RoomBadgeItemProps>(({
  room,
  isActive,
  onPress,
  keyPrefix = 'room'
}) => {
  // ✅ useCallback : Handler mémoïsé spécifique à cette room
  const handlePress = useCallback(() => {
    onPress(room);
  }, [room, onPress]);

  return (
    <Pressable onPress={handlePress}>
      <Badge
        variant="outline"
        className="mx-1"
        active={isActive}
        size="lg"
      >
        <Text>{room.name}</Text>
      </Badge>
    </Pressable>
  );
});

RoomBadgeItem.displayName = 'RoomBadgeItem';
