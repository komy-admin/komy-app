import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, Button } from '~/components/ui';
import { Order } from '~/types/order.types';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { OrderItem } from '~/types/order-item.types';
import { Status } from '~/types/status.enum';
import { orderApiService } from '~/api/order.api';
import { itemApiService } from '~/api/item.api';
import { itemTypeApiService } from '~/api/item-type.api';
import { orderItemApiService } from '~/api/order-item.api';
import { useFilter } from '~/hooks/useFilter';
import { FilterConfig } from '~/hooks/useFilter/types';
import { useSocket } from '~/hooks/useSocket';
import { EventType } from '~/hooks/useSocket/types';
import { useToast } from '~/components/ToastProvider';
import { getMostImportantStatus } from '~/lib/utils';
import OrderDetailView from '~/components/Service/OrderDetailView';
import { ArrowLeft, Plus } from 'lucide-react-native';

export default function OrderDetailPage() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { showToast } = useToast();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    loadOrderData();
  }, [id]);

  // Socket pour temps réel
  useEffect(() => {
    if (!isConnected || !socket || !order) return;

    const handleUpdateOrdersStatus = (orderItemIds: string[], status: Status) => {
      setOrder(prevOrder => {
        if (!prevOrder) return null;

        const updatedOrderItems = prevOrder.orderItems.map(orderItem => {
          if (orderItemIds.includes(orderItem.id)) {
            return { ...orderItem, status: status };
          }
          return orderItem;
        });

        return {
          ...prevOrder,
          orderItems: updatedOrderItems,
          status: getMostImportantStatus(updatedOrderItems.map(orderItem => orderItem.status))
        };
      });
    };

    socket.on(EventType.ORDER_ITEMS_INPROGRESS, ({ orderItemIds }) =>
      handleUpdateOrdersStatus(orderItemIds, Status.INPROGRESS)
    );
    socket.on(EventType.ORDER_ITEMS_READY, ({ orderItemIds }) =>
      handleUpdateOrdersStatus(orderItemIds, Status.READY)
    );

    return () => {
      socket.off(EventType.ORDER_ITEMS_INPROGRESS);
      socket.off(EventType.ORDER_ITEMS_READY);
    };
  }, [isConnected, socket, order]);

  const loadOrderData = async () => {
    try {
      setIsLoading(true);
      if (!id || typeof id !== 'string') {
        throw new Error('ID de commande invalide');
      }

      const [orderResponse, itemTypesResponse] = await Promise.all([
        orderApiService.get(id),
        itemTypeApiService.getAll()
      ]);

      setOrder(orderResponse);
      setItemTypes(itemTypesResponse.data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement de la commande');
      console.error(err);
      showToast('Erreur lors du chargement de la commande.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderItems: OrderItem[], status: Status) => {
    if (!order) {
      showToast('Aucune commande sélectionnée.', 'warning');
      return;
    }

    try {
      const orderItemsIds = orderItems.map(orderItem => orderItem.id);
      await orderItemApiService.updateManyStatus(orderItemsIds, status);

      const updatedItems = order.orderItems.map(orderItem => {
        if (orderItems.includes(orderItem)) {
          return { ...orderItem, status };
        }
        return orderItem;
      });

      const mostImportantStatus = getMostImportantStatus(updatedItems.map(orderItem => orderItem.status));
      const updatedOrder = await orderApiService.update(order.id, {
        status: mostImportantStatus
      });

      setOrder(updatedOrder);
      showToast('Statut mis à jour avec succès.', 'success');
    } catch (error) {
      console.error(error);
      showToast('Erreur lors de la mise à jour du statut.', 'error');
    }
  };

  const deleteOrder = async () => {
    if (!order) return;

    try {
      await orderApiService.delete(order.id);
      showToast('Commande supprimée avec succès.', 'success');
      router.back();
    } catch (error) {
      console.error(error);
      showToast('Erreur lors de la suppression.', 'error');
    }
  };

  const navigateToMenu = () => {
    router.push({
      pathname: '/(server)/order/menu',
      params: { orderId: order?.id }
    });
  };

  const handleBackPress = () => {
    if (order?.orderItems.length === 0) {
      deleteOrder();
    }
    router.back();
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-gray-900">Chargement...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-4">
        <Text className="text-destructive text-center mb-4">{error || 'Commande introuvable'}</Text>
        <Button onPress={() => router.back()}>
          <Text className="text-primary-foreground">Retour</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-background border-b border-border">
        <Pressable
          onPress={handleBackPress}
          className="flex-row items-center"
        >
          <ArrowLeft size={24} color="#374151" />
          <Text className="ml-2 text-lg font-medium text-gray-900">Retour</Text>
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Table {order.table.name}</Text>
        <Pressable
          onPress={navigateToMenu}
          className="flex-row items-center"
        >
          <Plus size={24} color="#374151" />
          <Text className="ml-1 text-sm text-gray-900">Ajouter</Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <OrderDetailView
          order={order}
          itemTypes={itemTypes}
          onStatusUpdate={handleStatusUpdate}
        />
      </ScrollView>

      {/* Actions */}
      <View className="px-4 py-3 bg-white border-t border-gray-200">
        <View className="flex-row gap-3">
          <Button
            onPress={navigateToMenu}
            className="flex-1"
            style={{ backgroundColor: '#2A2E33' }}
          >
            <Text className="text-white font-medium">Modifier la commande</Text>
          </Button>
          <Button
            onPress={deleteOrder}
            className="flex-1"
            variant="destructive"
          >
            <Text className="text-white font-medium">Supprimer</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}