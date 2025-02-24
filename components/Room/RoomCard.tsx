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
          <Layers size={24} color="#1A1A1A" strokeWidth={1.5} />
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
    minWidth: 500,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FBFBFB',
    borderRadius: 100,
    borderColor: '#F1F1F1',
    borderWidth: 2,
    elevation: 3,
    margin: 16,
    pointerEvents: 'box-none',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomInfo: {
    marginLeft: 12,
  },
  roomName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  capacity: {
    fontSize: 16,
    color: '#666666',
    marginTop: 2,
  },
  editButton: {
    backgroundColor: '#2A2E33',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});