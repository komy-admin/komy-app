import { View, ScrollView } from 'react-native';
import { useState, useCallback, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { OrderLine, OrderLineType } from '~/types/order-line.types';
import { Status } from '~/types/status.enum';
import { Order } from '~/types/order.types';
import { Text } from '~/components/ui';
import { useToast } from '~/components/ToastProvider';
import { showApiError } from '~/lib/apiErrorHandler';
import { ItemType } from '~/types/item-type.types';

// Import direct des composants Admin
import AdminOrderDetailView from './AdminOrderDetailView';

interface MobileOrderDetailViewProps {
  order: Order;
  itemTypes: ItemType[];
  onStatusUpdate?: (orderLines: OrderLine[], status: Status) => Promise<void>;
  onDeleteOrderLines?: (orderLineIds: string[]) => Promise<void>;
}

// Wrapper mobile qui utilise directement AdminOrderDetailView
export default function MobileOrderDetailView({
  order,
  itemTypes,
  onStatusUpdate,
  onDeleteOrderLines,
}: MobileOrderDetailViewProps) {
  const { showToast } = useToast();

  // Adapter les fonctions pour le format attendu par AdminOrderDetailView
  const handleDeleteOrderLines = useCallback(async (orderLineIds: string[]) => {
    try {
      if (onDeleteOrderLines) {
        await onDeleteOrderLines(orderLineIds);
        showToast('Articles supprimés', 'success');
      }
    } catch (error) {
      showApiError(error, showToast, 'Erreur lors de la suppression');
    }
  }, [onDeleteOrderLines, showToast]);

  const handleStatusUpdate = useCallback(async (orderLines: OrderLine[], status: Status) => {
    try {
      if (onStatusUpdate) {
        await onStatusUpdate(orderLines, status);
        showToast('Statut mis à jour', 'success');
      }
    } catch (error) {
      showApiError(error, showToast, 'Erreur lors de la mise à jour');
    }
  }, [onStatusUpdate, showToast]);

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={true}
    >
      {/* Utilisation directe du composant Admin */}
      <AdminOrderDetailView
        order={order}
        itemTypes={itemTypes}
        onDeleteOrderLines={handleDeleteOrderLines}
        onUpdateOrderLinesStatus={handleStatusUpdate}
      />
    </ScrollView>
  );
}