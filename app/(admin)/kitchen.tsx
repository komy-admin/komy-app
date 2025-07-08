import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Order } from "~/types/order.types";
import { Status } from "~/types/status.enum";
import OrderColumn from '~/components/Kitchen/OrderColumn';
import { OrderItem } from '~/types/order-item.types';
import { useOrders, useRestaurant } from '~/hooks/useRestaurant';
import { useSelector } from 'react-redux';
import { selectAllOrderItems } from '~/store/restaurant';
import { useToast } from '~/components/ToastProvider';

const AVAILABLE_STATUSES = [
  Status.PENDING,
  Status.INPROGRESS,
  Status.READY,
];

function useOrderGrouping(orders: Order[], orderItems: OrderItem[]) {
  const groupedOrders = useMemo(() => {
    const orderMap = new Map();

    orderItems.forEach(item => {
      const order = orders.find(o => o.id === item.orderId);
      if (!order) return;

      const key = `${order.id}-${item.status}`;
      if (!orderMap.has(key)) {
        orderMap.set(key, { ...order, status: item.status, orderItems: [item] });
      } else {
        orderMap.get(key).orderItems.push(item);
      }
    });

    return orderMap;
  }, [orders, orderItems]);

  return groupedOrders;
}

export default function KitchenPage() {
  // Initialiser la connexion WebSocket via useRestaurant
  const { isLoading: globalLoading } = useRestaurant();

  // Utilisation des hooks Redux
  const { orders, loading, error, updateOrderItemStatus } = useOrders();
  const orderItems = useSelector((state: any) => selectAllOrderItems({ orders: state.restaurant.orders }));
  const { showToast } = useToast();

  // Filtrer les commandes et items selon les statuts disponibles en cuisine
  const kitchenOrders = useMemo(() => {
    return orders.filter(order =>
      order.orderItems.some(item => AVAILABLE_STATUSES.includes(item.status))
    );
  }, [orders]);

  const kitchenOrderItems = useMemo(() => {
    return orderItems.filter(item => AVAILABLE_STATUSES.includes(item.status));
  }, [orderItems]);

  const groupedOrders = useOrderGrouping(kitchenOrders, kitchenOrderItems);

  const handleStatusChange = async (order: Order, newStatus: Status) => {
    try {
      await updateOrderItemStatus(order.orderItems.map(oi => oi.id), newStatus);
      // Ne pas afficher le toast de succès ici - le WebSocket confirmera la mise à jour
    } catch (error: any) {
      console.error('Error updating status:', error);
      
      // Gestion d'éerreur spécifique pour le 500
      if (error.response?.status === 500) {
        showToast('Erreur serveur temporaire, l\'API est en cours de correction', 'error');
      } else if (error.response?.status === 404) {
        showToast('Commande introuvable', 'error');
      } else if (error.response?.status === 403) {
        showToast('Vous n\'avez pas les droits pour cette action', 'error');
      } else {
        showToast('Impossible de mettre à jour le statut, veuillez réessayer', 'error');
      }
    }
  };

  if (loading || globalLoading || error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          {loading || globalLoading ? 'Chargement...' : error || 'Erreur lors du chargement'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cuisine</Text>
        <Text style={styles.headerSubtitle}>Gestion des commandes en temps réel</Text>
      </View>

      <View style={styles.columnsContainer}>
        {AVAILABLE_STATUSES.map((status, index) => (
          <OrderColumn
            key={status}
            orders={Array.from(groupedOrders.values())
              .filter(order => order.status === status)}
            status={status}
            onStatusChange={handleStatusChange}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFBFB',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBFBFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#2A2E33',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A2E33',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  columnsContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
});