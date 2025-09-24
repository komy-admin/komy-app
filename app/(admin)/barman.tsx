import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Order } from "~/types/order.types";
import { Status } from "~/types/status.enum";
import OrderColumn from '~/components/Kitchen/OrderColumn';
import { useOrders, useRestaurant } from '~/hooks/useRestaurant';
import { useSelector } from 'react-redux';
import { selectAllKitchenItems } from '~/store/slices/entities.slice';
import { useToast } from '~/components/ToastProvider';
import { RootState } from '~/store';

const AVAILABLE_STATUSES = [
  Status.PENDING,
  Status.INPROGRESS,
  Status.READY,
];

interface BarItemGroup {
  id: string;
  orderId: string;
  orderNumber: string;
  tableName: string;
  status: Status;
  items: Array<{
    id: string;
    type: 'ITEM' | 'MENU_ITEM';
    itemName: string;
    itemType?: string;
    menuName?: string;
    menuId?: string;
    orderLineId?: string;
    isOverdue: boolean;
  }>;
  isOverdue: boolean;
  createdAt: string;
}

function useBarItemGrouping(orders: Order[], kitchenItems: any[], overdueOrderItemIds: string[]) {
  const groupedItems = useMemo(() => {
    const groupMap = new Map<string, BarItemGroup>();

    const barItems = kitchenItems.filter(item =>
      item.itemType === 'Boissons' || item.itemType === 'Bar'
    );

    barItems.forEach(item => {
      const order = orders.find(o => o.id === item.orderId);
      if (!order) return;

      const groupKey = `${order.id}-${item.status}`;

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          id: groupKey,
          orderId: order.id,
          orderNumber: `#${order.id.slice(-4)}`,
          tableName: order.table?.name || 'Table inconnue',
          status: item.status,
          items: [],
          isOverdue: false,
          createdAt: order.createdAt
        });
      }

      const group = groupMap.get(groupKey)!;
      const isItemOverdue = overdueOrderItemIds.includes(item.id);

      group.items.push({
        id: item.id,
        type: item.type,
        itemName: item.itemName,
        itemType: item.itemType,
        menuName: item.menuName,
        menuId: item.menuId,
        orderLineId: item.orderLineId,
        isOverdue: isItemOverdue
      });

      // Marquer le groupe comme en retard si au moins un item l'est
      if (isItemOverdue) {
        group.isOverdue = true;
      }
    });

    // Convertir en array et trier (en retard en premier, puis par date)
    const sortedGroups = Array.from(groupMap.values()).sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return sortedGroups;
  }, [orders, kitchenItems, overdueOrderItemIds]);

  return groupedItems;
}

export default function BarmanPage() {
  const { orders, loading, error, updateOrderStatus } = useOrders();

  const kitchenItems = useSelector(selectAllKitchenItems);
  // Récupérer les commandes en retard depuis le store
  const overdueOrderIds = useSelector((state: RootState) => state.session.overdueOrderIds);
  const overdueOrderItemIds = useSelector((state: RootState) => state.session.overdueOrderItemIds);
  const { showToast } = useToast();

  // Filtrer les items selon les statuts disponibles au bar
  const filteredBarItems = useMemo(() => {
    const filtered = kitchenItems.filter(item => {
      const shouldInclude = AVAILABLE_STATUSES.includes(item.status) &&
        (item.itemType === 'Boissons' || item.itemType === 'Bar');
      return shouldInclude;
    });

    return filtered;
  }, [kitchenItems]);

  // Récupérer les commandes qui ont des items au bar
  const barOrders = useMemo(() => {
    const orderIds = [...new Set(filteredBarItems.map(item => item.orderId))];
    const filteredOrders = orders.filter(order => orderIds.includes(order.id));

    return filteredOrders;
  }, [orders, filteredBarItems]);

  const groupedItems = useBarItemGrouping(barOrders, filteredBarItems, overdueOrderItemIds);

  const handleStatusChange = async (itemGroup: BarItemGroup, newStatus: Status) => {
    try {
      const orderLineIds: string[] = [];
      const orderLineItemIds: string[] = [];

      itemGroup.items.forEach(item => {
        if (item.type === 'ITEM') {
          orderLineIds.push(item.id);
        } else if (item.type === 'MENU_ITEM') {
          orderLineItemIds.push(item.id);
        }
      });

      if (orderLineIds.length > 0 || orderLineItemIds.length > 0) {
        await updateOrderStatus(itemGroup.orderId, {
          status: newStatus,
          orderLineIds: orderLineIds.length > 0 ? orderLineIds : undefined,
          orderLineItemIds: orderLineItemIds.length > 0 ? orderLineItemIds : undefined,
        });
      }

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

  // Fonction pour mettre à jour un item individuel
  const handleIndividualItemStatusChange = async (item: any, newStatus: Status) => {
    try {
      console.log('🔄 [DEBUG] Bar handleIndividualItemStatusChange:', {
        itemId: item.id,
        itemType: item.type,
        itemName: item.itemName,
        newStatus
      });

      // Déterminer le bon array selon le type d'item
      let orderLineIds: string[] = [];
      let orderLineItemIds: string[] = [];

      if (item.type === 'ITEM') {
        orderLineIds.push(item.id);
      } else if (item.type === 'MENU_ITEM') {
        orderLineItemIds.push(item.id);
      }

      // Trouver l'orderId de cet item
      const parentGroup = groupedItems.find(group =>
        group.items.some(groupItem => groupItem.id === item.id)
      );

      if (!parentGroup) {
        console.error('Groupe parent non trouvé pour l\'item:', item.id);
        return;
      }

      await updateOrderStatus(parentGroup.orderId, {
        status: newStatus,
        orderLineIds: orderLineIds.length > 0 ? orderLineIds : undefined,
        orderLineItemIds: orderLineItemIds.length > 0 ? orderLineItemIds : undefined,
      });

    } catch (error: any) {
      console.error('Error updating individual item status:', error);

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
        <Text style={styles.headerTitle}>Bar</Text>
        <Text style={styles.headerSubtitle}>Gestion des boissons en temps réel</Text>
      </View>

      <View style={styles.columnsContainer}>
        {AVAILABLE_STATUSES.map((status) => (
          <OrderColumn
            key={status}
            itemGroups={groupedItems.filter(group => group.status === status)}
            status={status}
            onStatusChange={handleStatusChange}
            onIndividualItemStatusChange={handleIndividualItemStatusChange}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2E33',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '400',
    marginTop: 2,
    opacity: 0.8,
  },
  columnsContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
});