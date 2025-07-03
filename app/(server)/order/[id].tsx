import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, Button } from '~/components/ui';
import { OrderItem } from '~/types/order-item.types';
import { Status } from '~/types/status.enum';
import { useToast } from '~/components/ToastProvider';
import OrderDetailView from '~/components/Service/OrderDetailView';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { useOrders, useMenu, useRestaurant } from '~/hooks/useRestaurant';
import { orderItemApiService } from '~/api/order-item.api';

export default function OrderDetailPage() {
  const { id } = useLocalSearchParams();
  const { showToast } = useToast();

  // Initialiser la connexion WebSocket via useRestaurant
  const { isLoading: globalLoading } = useRestaurant();

  // Utilisation des hooks Redux
  const { getOrderById, deleteOrder, updateOrderItemStatus, loading, error } = useOrders();
  const { itemTypes } = useMenu();

  // Récupération de la commande depuis le store
  const order = getOrderById(id as string);

  // Les données sont maintenant gérées par Redux via les hooks
  // La synchronisation temps réel est gérée par useRestaurantSocket automatiquement

  const handleStatusUpdate = async (orderItems: OrderItem[], status: Status) => {
    if (!order) {
      showToast('Aucune commande sélectionnée.', 'warning');
      return;
    }

    try {
      const orderItemsIds = orderItems.map(orderItem => orderItem.id);
      await updateOrderItemStatus(orderItemsIds, status);

      showToast('Statut mis à jour avec succès.', 'success');
    } catch (error) {
      console.error(error);
      showToast('Erreur lors de la mise à jour du statut.', 'error');
    }
  };

  const handleDeleteOrder = async () => {
    if (!order) return;

    try {
      await deleteOrder(order.id);
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
      handleDeleteOrder();
    }
    router.back();
  };

  if (loading) {
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
            onPress={handleDeleteOrder}
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