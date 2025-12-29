import { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Status } from "~/types/status.enum";
import { ItemGroup } from "~/types/kitchen.types";
import OrderColumn from '~/components/Kitchen/OrderColumn';
import { useOrders } from '~/hooks/useRestaurant';
import { useSelector } from 'react-redux';
import { selectAllKitchenItems } from '~/store/slices/entities.slice';
import { useToast } from '~/components/ToastProvider';
import { RootState } from '~/store';
import { useRouter } from 'expo-router';
import { handleOrderStatusError } from '~/lib/errorHandlers';
import { useItemGrouping } from '~/hooks/useItemGrouping';
import { filterItemsByArea } from '~/lib/itemFilters';

const AVAILABLE_STATUSES = [
  Status.PENDING,
  Status.INPROGRESS,
  Status.READY,
];

export default function KitchenPage() {
  const router = useRouter();
  const accountConfig = useSelector((state: RootState) => state.session.accountConfig);

  // Rediriger si la vue est désactivée
  useEffect(() => {
    if (accountConfig && accountConfig.kitchenEnabled === false) {
      router.replace('/(admin)/service');
    }
  }, [accountConfig, router]);

  // Utilisation des hooks Redux
  const { orders, loading, error, updateOrderStatus } = useOrders();
  const kitchenItems = useSelector(selectAllKitchenItems);
  // Récupérer les commandes en retard depuis le store
  const overdueOrderItemIds = useSelector((state: RootState) => state.session.overdueOrderItemIds);
  const { showToast } = useToast();

  // Filtrer les items selon les statuts disponibles en cuisine
  const filteredKitchenItems = useMemo(() => {
    return filterItemsByArea(kitchenItems, 'kitchen', AVAILABLE_STATUSES);
  }, [kitchenItems]);

  // Récupérer les commandes qui ont des items en cuisine
  const kitchenOrders = useMemo(() => {
    const orderIds = [...new Set(filteredKitchenItems.map(item => item.orderId))];
    const filteredOrders = orders.filter(order => orderIds.includes(order.id));

    return filteredOrders;
  }, [orders, filteredKitchenItems]);

  const groupedItems = useItemGrouping(kitchenOrders, filteredKitchenItems, overdueOrderItemIds);

  const handleStatusChange = async (itemGroup: ItemGroup, newStatus: Status) => {
    try {
      // Séparer OrderLines (articles individuels) et OrderLineItems (items de menu)
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

      // Ne pas afficher le toast de succès ici - le WebSocket confirmera la mise à jour
    } catch (error: any) {
      handleOrderStatusError(error, showToast);
    }
  };

  // 🆕 Fonction pour mettre à jour un item individuel
  const handleIndividualItemStatusChange = async (item: any, newStatus: Status) => {
    try {
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

      // Utiliser la nouvelle API PATCH pour un seul item
      await updateOrderStatus(parentGroup.orderId, {
        status: newStatus,
        orderLineIds: orderLineIds.length > 0 ? orderLineIds : undefined,
        orderLineItemIds: orderLineItemIds.length > 0 ? orderLineItemIds : undefined,
      });

      // Ne pas afficher le toast de succès ici - le WebSocket confirmera la mise à jour
    } catch (error: any) {
      handleOrderStatusError(error, showToast);
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