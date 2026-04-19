import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, Button } from '~/components/ui';
import { ConfirmationModal } from '~/components/ui/ConfirmationModal';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';
import MobileOrderDetailView from '~/components/Service/MobileOrderDetailView';
import { Status } from '~/types/status.enum';
import { OrderLineType, OrderLine } from '~/types/order-line.types';
import { ArrowLeft, Trash2, CheckCircle, Plus } from 'lucide-react-native';
import { useToast } from '~/components/ToastProvider';
import { showApiError } from '~/lib/apiErrorHandler';
import { useOrders, useMenu, useOrderLines } from '~/hooks/useRestaurant';
import * as Haptics from 'expo-haptics';
import { colors } from '~/theme';

export default function OrderDetailPage() {
  const { id } = useLocalSearchParams();
  const orderId = id as string;
  const { showToast } = useToast();

  // Hooks pour les données
  const { getOrderById, deleteOrder, updateOrderStatus } = useOrders();
  const { itemTypes } = useMenu();
  const { deleteOrderLine, deleteOrderLines } = useOrderLines();

  // Récupération de la commande
  const order = getOrderById(orderId);

  // États locaux pour les modales
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);

  // Redirection automatique si la commande n'existe plus
  useEffect(() => {
    if (orderId && !order) {
      React.startTransition(() => {
        router.replace('/(server)');
      });
    }
  }, [orderId, order]);

  // Vérifier si la commande est terminée
  const isOrderTerminated = useMemo(() => {
    if (!order?.lines || order.lines.length === 0) return false;

    return order.lines.every(line => {
      if (line.type === OrderLineType.ITEM) {
        return line.status === Status.TERMINATED;
      } else if (line.type === OrderLineType.MENU && line.items) {
        return line.items.every(item => item.status === Status.TERMINATED);
      }
      return false;
    });
  }, [order]);

  // Retour automatique si commande terminée
  useEffect(() => {
    if (isOrderTerminated) {
      React.startTransition(() => {
        showToast('Cette commande est terminée', 'info');
        router.replace('/(server)');
      });
    }
  }, [isOrderTerminated, showToast]);

  // Gestion de la suppression de commande
  const handleDeleteOrder = useCallback(async () => {
    if (!order) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await deleteOrder(order.id);
      showToast('Commande supprimée avec succès', 'success');
      router.replace('/(server)');
    } catch (error) {
      showApiError(error, showToast, 'Erreur lors de la suppression');
    }
  }, [order, deleteOrder, showToast]);

  // Gestion de la terminaison de commande
  const handleTerminateOrder = useCallback(async () => {
    if (!order) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Collecter tous les IDs des OrderLines et OrderLineItems
      const orderLineIds: string[] = [];
      const orderLineItemIds: string[] = [];

      order.lines?.forEach(line => {
        if (line.type === OrderLineType.ITEM) {
          orderLineIds.push(line.id);
        } else if (line.type === OrderLineType.MENU && line.items) {
          line.items.forEach(item => {
            orderLineItemIds.push(item.id);
          });
        }
      });

      // Mettre à jour toutes les lignes en TERMINATED
      await updateOrderStatus(order.id, {
        status: Status.TERMINATED,
        orderLineIds: orderLineIds.length > 0 ? orderLineIds : undefined,
        orderLineItemIds: orderLineItemIds.length > 0 ? orderLineItemIds : undefined,
      });

      showToast('Commande terminée avec succès', 'success');
      setShowTerminateModal(false);
      router.replace('/(server)');
    } catch (error) {
      showApiError(error, showToast, 'Erreur lors de la terminaison');
    }
  }, [order, updateOrderStatus, showToast]);

  // Gestion de la suppression de lignes
  const handleDeleteOrderLines = useCallback(async (lineIds: string[], reason?: string, notes?: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (lineIds.length === 1) {
        await deleteOrderLine(lineIds[0], reason, notes);
        showToast('Article supprimé avec succès', 'success');
      } else {
        await deleteOrderLines(lineIds, reason, notes);
        showToast(`${lineIds.length} articles supprimés`, 'success');
      }

      // Si toutes les lignes sont supprimées, la commande sera supprimée automatiquement
      // et la redirection se fera via le useEffect
    } catch (error) {
      showApiError(error, showToast, 'Erreur lors de la suppression');
    }
  }, [deleteOrderLine, deleteOrderLines, showToast]);

  // Gestion de la mise à jour de statut
  const handleStatusUpdate = useCallback(async (orderLines: OrderLine[], status: Status) => {
    if (!order) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Extraire les IDs des lignes
      const lineIds = orderLines.map(line => line.id);

      // Séparer les IDs selon le type
      const orderLineIds: string[] = [];
      const orderLineItemIds: string[] = [];

      lineIds.forEach(lineId => {
        // Trouver si c'est une OrderLine ou un OrderLineItem
        const isOrderLine = order.lines?.some(line => line.id === lineId);
        if (isOrderLine) {
          orderLineIds.push(lineId);
        } else {
          orderLineItemIds.push(lineId);
        }
      });

      await updateOrderStatus(order.id, {
        status,
        orderLineIds: orderLineIds.length > 0 ? orderLineIds : undefined,
        orderLineItemIds: orderLineItemIds.length > 0 ? orderLineItemIds : undefined,
      });

      showToast('Statut mis à jour avec succès', 'success');
    } catch (error) {
      showApiError(error, showToast, 'Erreur lors de la mise à jour');
    }
  }, [order, updateOrderStatus, showToast]);

  // Navigation vers l'ajout d'articles
  const handleAddItems = useCallback(() => {
    if (!order) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(server)/order/form',
      params: {
        orderId: order.id,
        ...(order.tableId ? { tableId: order.tableId } : {}),
        mode: 'add'
      }
    });
  }, [order]);

  // Si la commande n'existe pas, afficher un message de chargement
  if (!order) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-4">
        <Text className="text-gray-600 text-center">Redirection en cours...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-white border-b border-gray-200">
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable
            onPress={() => router.replace('/(server)')}
            className="flex-row items-center"
          >
            <ArrowLeft size={20} color={colors.gray[700]} />
            <Text className="ml-2 text-gray-700">Retour</Text>
          </Pressable>

          <Text className="font-bold text-gray-900 text-lg">
            Table {order.table?.name}
          </Text>

          <Pressable
            onPress={() => setShowDeleteModal(true)}
            className="p-2"
          >
            <Trash2 size={20} color={colors.error.base} />
          </Pressable>
        </View>

        {/* Infos de la commande */}
        <View className="px-4 pb-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-600">
              {order.lines?.length || 0} article{(order.lines?.length || 0) > 1 ? 's' : ''}
            </Text>
            <Text className="text-sm text-gray-600">
              Créée à {new Date(order.createdAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>
      </View>

      {/* Contenu scrollable */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={true}>
        <MobileOrderDetailView
          order={order}
          itemTypes={itemTypes}
          onStatusUpdate={handleStatusUpdate}
          onDeleteOrderLines={handleDeleteOrderLines}
        />
      </ScrollView>

      {/* Actions en bas */}
      <View className="px-4 py-3 bg-white border-t border-gray-200">
        <View className="flex-row gap-3">
          <Button
            className="flex-1"
            onPress={handleAddItems}
          >
            <View className="flex-row items-center justify-center">
              <Plus size={18} color="white" />
              <Text className="text-white font-medium ml-1">Ajouter</Text>
            </View>
          </Button>

          <Button
            variant="outline"
            className="flex-1"
            onPress={() => setShowTerminateModal(true)}
          >
            <View className="flex-row items-center justify-center">
              <CheckCircle size={18} color={colors.gray[700]} />
              <Text className="text-gray-900 font-medium ml-1">Terminer</Text>
            </View>
          </Button>
        </View>
      </View>

      {/* Modale de confirmation de suppression */}
      <DeleteConfirmationModal
        isVisible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          setShowDeleteModal(false);
          handleDeleteOrder();
        }}
        entityName={`de la table ${order.table?.name || order.table?.id || 'N/A'}`}
        entityType="la commande"
      />

      {/* Modale de confirmation de terminaison */}
      <ConfirmationModal
        isVisible={showTerminateModal}
        onClose={() => setShowTerminateModal(false)}
        onConfirm={handleTerminateOrder}
        title="Terminer la commande"
        message={`Voulez-vous vraiment terminer la commande de la table ${order.table?.name || 'N/A'} ?`}
        description="Cette action marquera tous les articles de la commande comme terminés. La commande disparaîtra de la vue service."
        confirmText="Confirmer"
        confirmVariant="default"
      />
    </View>
  );
}