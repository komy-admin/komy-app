import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Order } from "~/types/order.types";
import { OrderLine, OrderLineType } from "~/types/order-line.types";
import { Status } from "~/types/status.enum";
import KitchenColumnView from '~/components/Kitchen/KitchenColumnView';
import { KitchenTicketView } from '~/components/Kitchen/KitchenTicketView';
import { useRestaurant, useOrders } from '~/hooks/useRestaurant';
import { useOrderLines } from '~/hooks/useOrderLines';
import { useSelector } from 'react-redux';
import { useToast } from '~/components/ToastProvider';
import { RootState } from '~/store';
import { getMostImportantStatus } from '~/lib/utils';
import { selectAllKitchenItems } from '~/store/slices/entities.slice';
import { CARD_VARIANTS } from '~/components/Kitchen/cards/config/card-variants.config';
import { useAccountConfig } from '~/hooks/useAccountConfig';
import { filterItemsByArea } from '~/lib/itemFilters';
import { useItemGrouping } from '~/hooks/useItemGrouping';
import { ItemGroup } from '~/types/kitchen.types';

export default function CookKitchenPage() {
  const { kitchenViewMode } = useAccountConfig();
  const { orders, loading, error, updateOrderStatus } = useOrders();
  const { updateOrderLineItemStatus } = useOrderLines();
  const overdueOrderItemIds = useSelector((state: RootState) => state.session.overdueOrderItemIds);
  const { showToast } = useToast();

  // Déterminer le variant actif selon le mode de vue (config account)
  const currentVariant = kitchenViewMode === 'tickets' ? CARD_VARIANTS.ticket : CARD_VARIANTS.column;

  const kitchenItems = useSelector(selectAllKitchenItems);

  // Filtrer les items selon les statuts du variant actif
  const filteredKitchenItems = useMemo(() => {
    return filterItemsByArea(kitchenItems, 'kitchen', currentVariant.availableStatuses);
  }, [kitchenItems, currentVariant.availableStatuses]);

  // Récupérer les commandes qui ont des items en cuisine
  const kitchenOrders = useMemo(() => {
    const orderIds = [...new Set(filteredKitchenItems.map(item => item.orderId))];
    return orders.filter(order => orderIds.includes(order.id));
  }, [orders, filteredKitchenItems]);

  const groupedItems = useItemGrouping(kitchenOrders, filteredKitchenItems, overdueOrderItemIds || []);

  const handleStatusChange = async (itemGroup: ItemGroup, newStatus: Status) => {
    try {
      console.log('🔄 [DEBUG] Cook handleStatusChange (new):', {
        groupId: itemGroup.id,
        orderId: itemGroup.orderId,
        currentStatus: itemGroup.status,
        newStatus,
        itemsCount: itemGroup.items.length
      });

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

      console.log('🔄 [DEBUG] Items to update:', {
        orderLineIds: orderLineIds.length,
        orderLineItemIds: orderLineItemIds.length
      });

      // 🆕 Utiliser la nouvelle API PATCH qui gère tout en une seule requête
      if (orderLineIds.length > 0 || orderLineItemIds.length > 0) {
        await updateOrderStatus(itemGroup.orderId, {
          status: newStatus,
          orderLineIds: orderLineIds.length > 0 ? orderLineIds : undefined,
          orderLineItemIds: orderLineItemIds.length > 0 ? orderLineItemIds : undefined,
        });
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

  // 🆕 Fonction pour mettre à jour un item individuel
  const handleIndividualItemStatusChange = async (item: any, newStatus: Status) => {
    try {
      console.log('🔄 [DEBUG] Cook handleIndividualItemStatusChange:', {
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

      // Utiliser la nouvelle API PATCH pour un seul item
      await updateOrderStatus(parentGroup.orderId, {
        status: newStatus,
        orderLineIds: orderLineIds.length > 0 ? orderLineIds : undefined,
        orderLineItemIds: orderLineItemIds.length > 0 ? orderLineItemIds : undefined,
      });

      // Ne pas afficher le toast de succès ici - le WebSocket confirmera la mise à jour
    } catch (error: any) {
      console.error('Error updating individual item status:', error);

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