import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Order } from "~/types/order.types";
import { Status } from "~/types/status.enum";
import OrderColumn from '~/components/Kitchen/OrderColumn';
import { OrderLine, OrderLineType } from '~/types/order-line.types';
import { useOrders, useRestaurant } from '~/hooks/useRestaurant';
import { useOrderLines } from '~/hooks/useOrderLines';
import { useSelector } from 'react-redux';
import { selectAllKitchenItems } from '~/store/restaurant';
import { useToast } from '~/components/ToastProvider';
import { RootState } from '~/store';

const AVAILABLE_STATUSES = [
  Status.PENDING,
  Status.INPROGRESS,
  Status.READY,
];

function useOrderGrouping(orders: Order[], kitchenItems: any[], overdueOrderIds: string[], overdueOrderItemIds: string[]) {
  const groupedOrders = useMemo(() => {
    const orderMap = new Map();

    kitchenItems.forEach(item => {
      const order = orders.find(o => o.id === item.orderId);
      if (!order) return;

      const key = `${order.id}-${item.status}`;

      if (!orderMap.has(key)) {
        // Vérifier si au moins un item de ce groupe est en retard
        const hasOverdueItems = kitchenItems
          .filter((ki: any) => ki.orderId === order.id && ki.status === item.status)
          .some((ki: any) => overdueOrderItemIds.includes(ki.id));

        orderMap.set(key, {
          ...order,
          status: item.status,
          kitchenItems: [item],
          isOverdue: hasOverdueItems
        });
      } else {
        orderMap.get(key).kitchenItems.push(item);
        // Recalculer si le groupe a des items en retard
        const hasOverdueItems = orderMap.get(key).kitchenItems
          .some((ki: any) => overdueOrderItemIds.includes(ki.id));
        orderMap.get(key).isOverdue = hasOverdueItems;
      }
    });

    // Trier pour mettre les commandes en retard en premier
    const sortedEntries = Array.from(orderMap.entries()).sort(([, a], [, b]) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return 0;
    });

    return new Map(sortedEntries);
  }, [orders, kitchenItems, overdueOrderIds, overdueOrderItemIds]);

  return groupedOrders;
}

export default function KitchenPage() {
  // Utilisation des hooks Redux + initialisation WebSocket
  const { orders, loading, error, updateOrderItemStatus } = useOrders();
  const { updateOrderLineItemStatus } = useOrderLines();

  // IMPORTANT: Initialiser la connexion WebSocket
  const { isLoading: globalLoading } = useRestaurant();
  const kitchenItems = useSelector(selectAllKitchenItems);
  const { overdueOrderIds, overdueOrderItemIds } = useSelector((state: RootState) => state.accountConfig);
  const { showToast } = useToast();

  // Filtrer les items selon les statuts disponibles en cuisine
  const filteredKitchenItems = useMemo(() => {

    const filtered = kitchenItems.filter(item => {
      const shouldInclude = AVAILABLE_STATUSES.includes(item.status);
      return shouldInclude;
    });

    return filtered;
  }, [kitchenItems]);

  // Récupérer les commandes qui ont des items en cuisine
  const kitchenOrders = useMemo(() => {
    const orderIds = [...new Set(filteredKitchenItems.map(item => item.orderId))];
    const filteredOrders = orders.filter(order => orderIds.includes(order.id));

    return filteredOrders;
  }, [orders, filteredKitchenItems]);

  const groupedOrders = useOrderGrouping(kitchenOrders, filteredKitchenItems, overdueOrderIds, overdueOrderItemIds);

  const handleStatusChange = async (order: Order, newStatus: Status) => {
    try {
      // Récupérer les items spécifiques de cette commande avec ce statut à mettre à jour
      const itemsToUpdate = (order as any).kitchenItems || [];

      // Séparer OrderLines (articles individuels) et OrderLineItems (items de menu)
      const orderLineIds: string[] = [];
      const orderLineItemIds: string[] = [];

      itemsToUpdate.forEach((item: any) => {
        if (item.type === 'ITEM') {
          orderLineIds.push(item.id);
        } else if (item.type === 'MENU_ITEM') {
          orderLineItemIds.push(item.id);
        }
      });

      // Mettre à jour les OrderLines (articles individuels)
      if (orderLineIds.length > 0) {
        await updateOrderItemStatus(orderLineIds, newStatus);
      }

      // Mettre à jour les OrderLineItems (items de menu)
      if (orderLineItemIds.length > 0) {
        for (const itemId of orderLineItemIds) {
          await updateOrderLineItemStatus(itemId, newStatus);
        }
      }

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

  if (loading || error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          {loading ? 'Chargement...' : error || 'Erreur lors du chargement'}
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
            overdueOrderItemIds={overdueOrderItemIds}
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