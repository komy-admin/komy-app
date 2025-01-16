import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Lock, Utensils } from 'lucide-react-native';
import { Table } from '~/types/table.types';
import { Order } from '~/types/order.types';
import { getStatusText } from '~/lib/utils';

interface StartOrderCardProps {
  table: Table;
  order?: Order;
  onStartPress: () => void;
  isLocked?: boolean;
}

export default function StartOrderCard({ 
  table, 
  order, 
  onStartPress, 
  isLocked = false 
}: StartOrderCardProps) {
  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        <View style={styles.leftContent}>
          <View style={styles.iconContainer}>
            <Utensils size={24} color="#1A1A1A" strokeWidth={1.5} />
          </View>
          <View style={styles.tableInfo}>
            <Text style={styles.tableName}>TABLE {table.name}</Text>
            {!order && <Text style={styles.tableStatus}>Libre</Text>}
            {order && <Text style={styles.tableStatus}>{ getStatusText(order.status) }</Text>}
          </View>
        </View>

        <View style={styles.rightContent}>
          {isLocked && (
            <View style={styles.lockContainer}>
              <Lock size={20} color="#666666" strokeWidth={1.5} />
            </View>
          )}
          <Pressable 
            style={styles.startButton}
            onPress={onStartPress}
          >
            <Text style={styles.startButtonText}>
              {order ? 'Continue' : 'Start'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableInfo: {
    marginLeft: 12,
  },
  tableName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  tableStatus: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockContainer: {
    marginRight: 16,
  },
  startButton: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
  },
  startButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});