import { ScrollView, View, StyleSheet } from "react-native";
import { getStatusColor, getStatusText } from "~/lib/utils";
import { Order } from "~/types/order.types";
import { Status } from "~/types/status.enum";
import { Text } from "../ui";
import OrderCard from "./OrderCard";

export default function OrderColumn({ orders = [], status, onStatusChange, overdueOrderItemIds = [] }: {
  orders: Order[]; 
  status: Status;
  onStatusChange: (order: Order, newStatus: Status) => void;
  overdueOrderItemIds?: string[];
}) {

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: getStatusColor(status) }]}>
        <Text style={styles.headerTitle}>
          {getStatusText(status)}
        </Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{orders?.length || 0}</Text>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {orders && orders.length > 0 ? (
          orders.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              status={status} 
              onStatusChange={onStatusChange}
              overdueOrderItemIds={overdueOrderItemIds}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune commande</Text>
            <Text style={styles.emptySubText}>à afficher</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2E33',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: 'rgba(42, 46, 51, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2A2E33',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
    marginTop: 4,
  },
});