import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Order } from "~/types/order.types";
import { OrderLine, OrderLineType } from "~/types/order-line.types";
import { Status } from "~/types/status.enum";
import OrderColumn from '~/components/Kitchen/OrderColumn';
import { useOrderLines, useRestaurant } from '~/hooks/useRestaurant';
import { useSelector } from 'react-redux';
import { useToast } from '~/components/ToastProvider';
import { RootState } from '~/store';
import { getMostImportantStatus } from '~/lib/utils';

const AVAILABLE_STATUSES = [
  Status.PENDING,
  Status.INPROGRESS,
  Status.READY,
];

function useOrderGrouping(orders: Order[], overdueOrderIds: string[], overdueOrderItemIds: string[]) {
  const groupedOrders = useMemo(() => {
    const orderMap = new Map();

    orders.forEach(order => {
      if (!order.lines || order.lines.length === 0) return;

      // Collecter tous les statuts des OrderLines
      const allStatuses: Status[] = [];
      order.lines.forEach(line => {
        if (line.type === OrderLineType.ITEM && line.status) {
          allStatuses.push(line.status);
        } else if (line.type === OrderLineType.MENU && line.items) {
          line.items.forEach(item => allStatuses.push(item.status));
        }
      });

      // Grouper par statut principal
      const statusGroups = new Map<Status, OrderLine[]>();
      order.lines.forEach(line => {
        let lineStatus: Status | null = null;
        if (line.type === OrderLineType.ITEM && line.status) {
          lineStatus = line.status;
        } else if (line.type === OrderLineType.MENU && line.items) {
          lineStatus = getMostImportantStatus(line.items.map(item => item.status));
        }
        
        if (lineStatus && AVAILABLE_STATUSES.includes(lineStatus)) {
          if (!statusGroups.has(lineStatus)) {
            statusGroups.set(lineStatus, []);
          }
          statusGroups.get(lineStatus)!.push(line);
        }
      });

      // Créer des commandes groupées par statut
      statusGroups.forEach((lines, status) => {
        const key = `${order.id}-${status}`;
        
        // Vérifier si des lignes sont en retard
        const hasOverdueItems = lines.some(line => {
          if (line.type === OrderLineType.ITEM) {
            return overdueOrderItemIds.includes(line.id);
          } else if (line.type === OrderLineType.MENU && line.items) {
            return line.items.some(item => overdueOrderItemIds.includes(item.id));
          }
          return false;
        });

        orderMap.set(key, {
          ...order,
          status,
          lines,
          isOverdue: hasOverdueItems
        });
      });
    });

    // Trier pour mettre les commandes en retard en premier
    const sortedEntries = Array.from(orderMap.entries()).sort(([, a], [, b]) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return 0;
    });

    return new Map(sortedEntries);
  }, [orders, overdueOrderIds, overdueOrderItemIds]);

  return groupedOrders;
}

export default function CookKitchenPage() {
  // Utilisation des hooks Redux uniquement
  const { orders, loading, error, updateOrderItemStatus } = useOrders();
  const orderItems = useSelector((state: any) => selectAllOrderItems({ orders: state.restaurant.orders }));
  const { overdueOrderIds, overdueOrderItemIds } = useSelector((state: RootState) => state.accountConfig);
  const { showToast } = useToast();

  // Initialiser la connexion WebSocket via useRestaurant
  const { isLoading: globalLoading } = useRestaurant();

  // Filtrer les commandes et items selon les statuts disponibles en cuisine
  const kitchenOrders = useMemo(() => {
    return orders.filter(order =>
      order.orderItems.some(item => AVAILABLE_STATUSES.includes(item.status))
    );
  }, [orders]);

  const kitchenOrderItems = useMemo(() => {
    return orderItems.filter(item => AVAILABLE_STATUSES.includes(item.status));
  }, [orderItems]);

  const groupedOrders = useOrderGrouping(kitchenOrders, kitchenOrderItems, overdueOrderIds || [], overdueOrderItemIds || []);

  const handleStatusChange = async (order: Order, newStatus: Status) => {
    try {
      await updateOrderItemStatus(order.orderItems.map(oi => oi.id), newStatus);
      // Ne pas afficher le toast de succès ici - le WebSocket confirmera la mise à jour
    } catch (error: any) {
      console.error('Error updating status:', error);

      // Gestion d'erreur spécifique pour le 500
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

  if (loading || error || globalLoading) {
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
  columnsContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
});