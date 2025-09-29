// app/(server)/service.tsx - Page de détail et gestion de commande
import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, Button } from '~/components/ui';
import { ConfirmationModal } from '~/components/ui/ConfirmationModal';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';
import MobileOrderDetailView from '~/components/Service/MobileOrderDetailView';
import { Status } from '~/types/status.enum';
import { OrderLineType } from '~/types/order-line.types';
import { ArrowLeft, Trash2, CheckCircle, Plus } from 'lucide-react-native';
import { useToast } from '~/components/ToastProvider';
import { useOrders, useMenu, useOrderLines } from '~/hooks/useRestaurant';
import * as Haptics from 'expo-haptics';

export default function ServiceDetailPage() {
  const { orderId, tableId } = useLocalSearchParams();
  const { showToast } = useToast();

  // Hooks pour les données
  const { getOrderById, deleteOrder, updateOrderStatus } = useOrders();
  const { itemTypes } = useMenu();
  const { deleteOrderLine, deleteOrderLines } = useOrderLines();

  // Récupération de la commande
  const order = getOrderById(orderId as string);

  // États locaux pour les modales
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);

  // Vérifier si la commande est terminée
  const isOrderTerminated = React.useMemo(() => {
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

  // Gestion de la suppression de commande
  const handleDeleteOrder = useCallback(async () => {
    if (!order) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await deleteOrder(order.id);
      showToast('Commande supprimée avec succès', 'success');
      router.back();
    } catch (error) {
      console.error('Erreur suppression:', error);
      showToast('Erreur lors de la suppression', 'error');
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
      router.back();
    } catch (error) {
      console.error('Erreur terminaison:', error);
      showToast('Erreur lors de la terminaison', 'error');
    }
  }, [order, updateOrderStatus, showToast]);

  // Gestion de la suppression de lignes
  const handleDeleteOrderLines = useCallback(async (lineIds: string[]) => {
    try {
      if (lineIds.length === 1) {
        await deleteOrderLine(lineIds[0]);
        showToast('Article supprimé avec succès', 'success');
      } else {
        await deleteOrderLines(lineIds);
        showToast(`${lineIds.length} articles supprimés`, 'success');
      }
    } catch (error) {
      console.error('Erreur suppression lignes:', error);
      showToast('Erreur lors de la suppression', 'error');
    }
  }, [deleteOrderLine, deleteOrderLines, showToast]);

  // Gestion de la mise à jour de statut
  const handleStatusUpdate = useCallback(async (lines: any[], status: Status) => {
    if (!order) return;

    try {
      const orderLineIds = lines.map(line => line.id);

      await updateOrderStatus(order.id, {
        status,
        orderLineIds,
      });

      showToast('Statut mis à jour avec succès', 'success');
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      showToast('Erreur lors de la mise à jour du statut', 'error');
    }
  }, [order, updateOrderStatus, showToast]);


  // Navigation vers l'ajout d'articles
  const handleAddItems = useCallback(() => {
    if (!order) return;

    router.push({
      pathname: '/(server)/order-form',
      params: {
        orderId: order.id,
        tableId: order.tableId,
        addMode: 'true'
      }
    });
  }, [order]);

  // Retour automatique si commande terminée
  useEffect(() => {
    if (isOrderTerminated) {
      showToast('Cette commande est terminée', 'info');
      router.back();
    }
  }, [isOrderTerminated]);

  if (!order) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-4">
        <Text className="text-gray-600 text-center mb-4">Commande introuvable</Text>
        <Button onPress={() => router.back()}>
          <Text className="text-white">Retour</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-white border-b border-gray-200">
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <ArrowLeft size={20} color="#374151" />
            <Text className="ml-2 text-gray-700">Retour</Text>
          </Pressable>

          <Text className="font-bold text-gray-900 text-lg">
            Table {order.table?.name}
          </Text>

          <View style={{ width: 60 }} />
        </View>

        {/* Info bar */}
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
              <CheckCircle size={18} color="#374151" />
              <Text className="text-gray-900 font-medium ml-1">Terminer</Text>
            </View>
          </Button>

          <Pressable
            onPress={() => setShowDeleteModal(true)}
            className="px-4 items-center justify-center"
          >
            <Trash2 size={20} color="#EF4444" />
          </Pressable>
        </View>
      </View>

      {/* Modal de confirmation de suppression */}
      <DeleteConfirmationModal
        isVisible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          setShowDeleteModal(false);
          handleDeleteOrder();
        }}
        entityName={`de la table ${order.table?.name || 'N/A'}`}
        entityType="la commande"
      />

      {/* Modal de confirmation de terminaison */}
      <ConfirmationModal
        isVisible={showTerminateModal}
        onClose={() => setShowTerminateModal(false)}
        onConfirm={handleTerminateOrder}
        title="Terminer la commande"
        message={`Voulez-vous vraiment terminer la commande de la table ${order.table?.name || 'N/A'} ?`}
        description="Cette action marquera tous les articles comme terminés."
        confirmText="Terminer"
        confirmVariant="default"
      />
    </View>
  );
}