import { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Status } from '~/types/status.enum';
import { ItemGroup } from '~/types/kitchen.types';
import { TicketView } from '~/components/Ticket/TicketView';
import { useOrders } from '~/hooks/useRestaurant';
import { useSelector } from 'react-redux';
import { selectAllKitchenItems } from '~/store/slices/entities.slice';
import { useToast } from '~/components/ToastProvider';
import { RootState } from '~/store';
import { showApiError } from '~/lib/apiErrorHandler';
import { useItemGrouping } from '~/hooks/useItemGrouping';
import { filterItemsByArea } from '~/lib/itemFilters';

interface TicketPageProps {
  area: 'kitchen' | 'bar';
}

const AREA_LABELS: Record<string, string> = {
  kitchen: 'Cuisine',
  bar: 'Bar',
};

/** Statuts visibles dans la vue cuisine/bar */
const VISIBLE_STATUSES = [Status.DRAFT, Status.PENDING, Status.READY];

export default function TicketPage({ area }: TicketPageProps) {
  const { orders, updateOrderStatus } = useOrders();
  const kitchenItems = useSelector(selectAllKitchenItems);
  const overdueOrderItemIds = useSelector((state: RootState) => state.session.overdueOrderItemIds);
  const { showToast } = useToast();

  const filteredItems = useMemo(() => {
    return filterItemsByArea(kitchenItems, area, VISIBLE_STATUSES);
  }, [kitchenItems, area]);

  const areaOrders = useMemo(() => {
    const orderIds = [...new Set(filteredItems.map(item => item.orderId))];
    return orders.filter(order => orderIds.includes(order.id));
  }, [orders, filteredItems]);

  const groupedItems = useItemGrouping(areaOrders, filteredItems, overdueOrderItemIds);

  const handleStatusChange = async (itemGroup: ItemGroup, newStatus: Status) => {
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
    } catch (error) {
      showApiError(error, showToast, 'Impossible de mettre à jour le statut');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          <Text style={styles.bannerBold}>{AREA_LABELS[area]}</Text>
          {' : Suivi des commandes en temps réel'}
        </Text>
      </View>

      <TicketView
        itemGroups={groupedItems}
        onStatusChange={handleStatusChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFBFB',
  },
  banner: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.10)',
      } as any,
    }),
  },
  bannerText: {
    color: '#2A2E33',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  bannerBold: {
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
