import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Layers } from 'lucide-react-native';

interface RoomCardProps {
  roomName: string;
  capacity: {
    current: number;
  };
  EditMode: () => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  roomName,
  capacity,
  EditMode,
}) => {

  return (
    <Pressable 
      style={styles.container}
      pointerEvents="box-none"
    >
      <View style={styles.leftContent}>
        <View style={styles.iconContainer}>
          <Layers size={20} color="#1A1A1A" strokeWidth={1.5} />
        </View>
        <View style={styles.roomInfo}>
          <Text style={styles.roomName}>{roomName}</Text>
          <Text style={styles.capacity}>
            {capacity.current} tables
          </Text>
        </View>
      </View>

      <Pressable
        style={styles.editButton}
        onPress={EditMode}
      >
        <Text style={styles.editButtonText}>Ajouter une table</Text>
      </Pressable>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: 340,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FBFBFB',
    borderRadius: 100,
    borderColor: '#E5E7EB',
    borderWidth: 1.5,
    elevation: 0,
    margin: 12,
    pointerEvents: 'box-none',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomInfo: {
    marginLeft: 10,
  },
  roomName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  capacity: {
    fontSize: 13,
    color: '#666666',
    marginTop: 1,
  },
  editButton: {
    backgroundColor: '#2A2E33',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
  },
  editButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
});