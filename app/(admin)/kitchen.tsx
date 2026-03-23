import { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Status } from "~/types/status.enum";
import { ItemGroup } from "~/types/kitchen.types";
import KitchenColumnView from '~/components/Kitchen/KitchenColumnView';
import { KitchenTicketView } from '~/components/Kitchen/KitchenTicketView';
import { useOrders } from '~/hooks/useRestaurant';
import { useSelector } from 'react-redux';
import { selectAllKitchenItems } from '~/store/slices/entities.slice';
import { useToast } from '~/components/ToastProvider';
import { RootState } from '~/store';
import { useRouter } from 'expo-router';
import { showApiError } from '~/lib/apiErrorHandler';
import { useItemGrouping } from '~/hooks/useItemGrouping';
import { filterItemsByArea } from '~/lib/itemFilters';
import { CARD_VARIANTS } from '~/components/Kitchen/cards/config/card-variants.config';
import { useAccountConfig } from '~/hooks/useAccountConfig';

export default function KitchenPage() {
  const router = useRouter();
  const { kitchenViewMode, kitchenEnabled } = useAccountConfig();

  // Rediriger si la vue est désactivée
  useEffect(() => {
    if (!kitchenEnabled) {
      router.replace('/(admin)/service');
    }
  }, [kitchenEnabled, router]);

  // Utilisation des hooks Redux
  const { orders, updateOrderStatus } = useOrders();
  const kitchenItems = useSelector(selectAllKitchenItems);
  // Récupérer les commandes en retard depuis le store
  const overdueOrderItemIds = useSelector((state: RootState) => state.session.overdueOrderItemIds);
  const { showToast } = useToast();

  // Déterminer le variant actif selon le mode de vue (config account)
  const currentVariant = kitchenViewMode === 'tickets' ? CARD_VARIANTS.ticket : CARD_VARIANTS.column;

  // Filtrer les items selon les statuts du variant actif
  const filteredKitchenItems = useMemo(() => {
    return filterItemsByArea(kitchenItems, 'kitchen', currentVariant.availableStatuses);
  }, [kitchenItems, currentVariant.availableStatuses]);

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
    } catch (error) {
      showApiError(error, showToast, 'Impossible de mettre à jour le statut');
    }
  };




  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cuisine</Text>
        <Text style={styles.headerSubtitle}>Gestion des commandes en temps réel</Text>
      </View>

      {kitchenViewMode === 'tickets' ? (
        <KitchenTicketView
          itemGroups={groupedItems}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <View style={styles.columnsContainer}>
          {currentVariant.availableStatuses.map((status) => (
            <KitchenColumnView
              key={status}
              itemGroups={groupedItems.filter(group => group.status === status)}
              status={status}
              onStatusChange={handleStatusChange}
            />
          ))}
        </View>
      )}
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