import React from 'react';
import { Pressable, ScrollView, View, useWindowDimensions, StyleSheet } from "react-native";
import { SidePanel } from "~/components/SidePanel";
import { Badge, Text, Button } from "~/components/ui";
import RoomComponent from '~/components/Room/Room';
import { useState, useCallback, useMemo, useRef } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { Table } from "~/types/table.types";
import OrderList from "~/components/Service/OrderList";
import { SearchBar } from "~/components/Service/SearchBar";
import { useOrderFilters } from "~/hooks/useOrderFilters";
import { router } from 'expo-router';
import { useToast } from '~/components/ToastProvider';
import { RoomTabsHeader } from '~/components/Service/RoomTabsHeader';
import { EmptyRoomsState } from '~/components/Service/EmptyRoomsState';
import { ClaimConfirmModal } from '~/components/Service/ClaimConfirmModal';
import { ServeConfirmModal } from '~/components/Service/ServeConfirmModal';
import { RoomBadgeItem } from '~/components/Service/RoomBadgeItem';
import {
  useRestaurant,
  useMenu,
  useTables,
  useOrders
} from '~/hooks/useRestaurant';
import { useSelector } from 'react-redux';
import { selectAppInitialized, selectIsAppInitializing } from '~/store/slices/session.slice';
import { OrderLinesForm, OrderLinesButton } from '~/components/order/OrderLinesForm';
import { Play } from 'lucide-react-native';
import { useOrderLinesManager } from '~/hooks/order/useOrderLinesManager';
import { useContainerLayout } from '~/hooks/room/useContainerLayout';
import { useOrderLines } from '~/hooks/useOrderLines';
import { OrderDetailView, OrderDetailHeader } from '~/components/OrderDetail';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';
import { ConfirmationModal } from '~/components/ui/ConfirmationModal';
import { CustomModal } from '@/components/CustomModal';
import { OrderLineType } from '~/types/order-line.types';
import PaymentView from '~/components/Service/PaymentView';
import { ForkModal } from '~/components/ui';
import { Status } from '~/types/status.enum';

export default function ServicePage() {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderCreatedFromStart, setOrderCreatedFromStart] = useState<boolean>(false);
  const [isConfiguringMenu, setIsConfiguringMenu] = useState<boolean>(false);
  const [orderModalTitle, setOrderModalTitle] = useState<string>('');
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignRoomId, setReassignRoomId] = useState<string | null>(null);
  const [isReassigning, setIsReassigning] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showClaimConfirmModal, setShowClaimConfirmModal] = useState(false);
  const [showServeConfirmModal, setShowServeConfirmModal] = useState(false);
  const [itemsToClaimData, setItemsToClaimData] = useState<{ orderLineIds: string[]; orderLineItemIds: string[]; itemTypeName: string; count: number; itemNames: string[] } | null>(null);
  const [itemsToServeData, setItemsToServeData] = useState<{ orderLineIds: string[]; orderLineItemIds: string[]; count: number; itemNames: string[] } | null>(null);
  const [menuConfigActions, setMenuConfigActions] = useState<{
    onCancel: () => void;
    onConfirm: () => void;
    isValid?: boolean;
  } | null>(null);

  const { rooms, currentRoom, setCurrentRoom } = useRestaurant();
  const appInitialized = useSelector(selectAppInitialized);
  const appLoading = useSelector(selectIsAppInitializing);
  const { enrichedTables, currentRoomTables, selectedTableId, selectedTable, setSelectedTable } = useTables();
  const {
    currentRoomOrders,
    selectedTableOrder,
    loading,
    deleteOrder,
    updateOrder,
    updateOrderStatus
  } = useOrders();
  const { items: allItems, itemTypes: allItemTypes } = useMenu();
  const { deleteOrderLine } = useOrderLines();

  // Stabiliser la référence des initialLines pour éviter les re-renders inutiles
  const initialLines = useMemo(() => selectedTableOrder?.lines || [], [selectedTableOrder?.id, selectedTableOrder?.lines]);

  // Calculer si il y a des items en DRAFT
  const hasDraftItems = useMemo(() => {
    if (!selectedTableOrder?.lines) return false;

    // Vérifier items individuels
    const hasDraftIndividualItems = selectedTableOrder.lines.some(
      (line) => line.type === OrderLineType.ITEM && line.status === Status.DRAFT
    );
    if (hasDraftIndividualItems) return true;

    // Vérifier items dans les menus
    return selectedTableOrder.lines.some(
      (line) => line.type === OrderLineType.MENU &&
        line.items?.some((menuItem) => menuItem.status === Status.DRAFT)
    );
  }, [selectedTableOrder?.lines]);

  // Calculer si il y a des items en READY
  const hasReadyItems = useMemo(() => {
    if (!selectedTableOrder?.lines) return false;

    // Vérifier items individuels
    const hasReadyIndividualItems = selectedTableOrder.lines.some(
      (line) => line.type === OrderLineType.ITEM && line.status === Status.READY
    );
    if (hasReadyIndividualItems) return true;

    // Vérifier items dans les menus
    return selectedTableOrder.lines.some(
      (line) => line.type === OrderLineType.MENU &&
        line.items?.some((menuItem) => menuItem.status === Status.READY)
    );
  }, [selectedTableOrder?.lines]);

  // ✅ Hook pour gérer les OrderLines (remplace toute la logique manuelle)
  const orderLinesManager = useOrderLinesManager({
    initialLines,
    mode: orderCreatedFromStart ? 'create' : 'edit',
    orderId: selectedTableOrder?.id,
    tableId: selectedTableId!,
    onSuccess: (updatedOrder) => {
      isSavingOrderRef.current = { savedOrder: updatedOrder };
      showToast('Commande mise à jour avec succès', 'success');
      setShowOrderModal(false);

      // Toujours afficher les détails après sauvegarde
      setShowOrderDetail(true);
      cameFromDetailViewRef.current = false; // Réinitialiser car on ouvre déjà la detail view

      setTimeout(() => {
        isSavingOrderRef.current = false;
      }, 500);
      setOrderCreatedFromStart(false);
    },
    onError: () => {
      showToast('Erreur lors de la mise à jour de la commande', 'error');
      isSavingOrderRef.current = false;
    },
  });





  const { showToast } = useToast();

  const {
    searchQuery,
    filters,
    filteredOrders,
    handleSearchChange,
    handleFiltersChange,
    handleClearFilters,
    isLoaded: filtersLoaded,
  } = useOrderFilters(currentRoomOrders.filter(order => order.lines && order.lines.length > 0));


  useFocusEffect(
    useCallback(() => {
      return () => {
        // Cleanup : désélectionner lors du blur (navigation sortante)
        setSelectedTable(null);
      };
    }, [setSelectedTable])
  );



  const handleChangeRoom = useCallback((room: any) => {
    setSelectedTable(null);
    setCurrentRoom(room.id);
  }, [setSelectedTable, setCurrentRoom]);

  const handleTablePress = useCallback((table: Table | null) => {
    if (!table) return;

    // 🔧 CORRECTION: Trouver la commande AVANT de changer la table sélectionnée
    const tableOrder = currentRoomOrders.find(order => order.tableId === table.id);

    // Sélectionner la table
    setSelectedTable(table.id);

    // Si la table a une commande, afficher les détails
    if (tableOrder) {
      setShowOrderDetail(true);
    } else {
    }
  }, [currentRoomOrders, setSelectedTable]);

  const handleCreateOrder = useCallback(() => {
    if (!selectedTableId) {
      showToast('Veuillez sélectionner une table avant de créer une commande.', 'warning');
      return;
    }
    const existingOrder = currentRoomOrders.find(order => order.tableId === selectedTableId);
    if (existingOrder) {
      showToast('Une commande existe déjà pour cette table.', 'warning');
      return;
    }

    // NOUVEAU FLUX : Ouvrir directement le formulaire SANS créer de commande
    // La commande sera créée à la fin quand le serveur validera avec les OrderLines
    cameFromDetailViewRef.current = false; // On ne vient pas de la detail view
    setOrderCreatedFromStart(true); // Marquer qu'on vient du bouton "Start"
    setOrderModalTitle(`${currentRoom?.name || 'Salle'} - ${selectedTable?.name || 'Table'}`);
    setShowOrderModal(true); // Ouvrir la modal
  }, [selectedTableId, currentRoomOrders, selectedTable, currentRoom, showToast]);




  const isSavingOrderRef = useRef<boolean | { savedOrder: any }>(false);
  const cameFromDetailViewRef = useRef<boolean>(false);

  // ✅ Hook personnalisé pour la logique de fermeture intelligente
  const useSmartOrderClose = () => {
    return useCallback(() => {
      // Réinitialiser les lignes avant de fermer
      orderLinesManager.reset();

      // Vérifier si on vient de la detail view
      const cameFromDetail = cameFromDetailViewRef.current;

      // Fermer le formulaire
      setShowOrderModal(false);
      setOrderCreatedFromStart(false);

      // Rouvrir la detail view si on vient de là
      if (cameFromDetail) {
        setShowOrderDetail(true);
        cameFromDetailViewRef.current = false; // Réinitialiser
      }

      // Réinitialiser le ref
      setTimeout(() => {
        isSavingOrderRef.current = false;
      }, 300);
    }, [
      orderLinesManager
    ]);
  };

  const handleSmartCloseOrderModal = useSmartOrderClose();

  const handleConfigurationModeChange = useCallback((configuring: boolean) => {
    setIsConfiguringMenu(configuring);
    if (!configuring) {
      setMenuConfigActions(null);
    }
  }, []);

  const handleConfigurationActionsChange = useCallback((actions: { onCancel: () => void; onConfirm: () => void; isValid?: boolean } | null) => {
    setMenuConfigActions(actions);
  }, []);

  const handleDeleteOrder = useCallback(async () => {
    if (!selectedTableOrder) return;

    try {
      await deleteOrder(selectedTableOrder.id);
      setSelectedTable(null);
      setShowOrderDetail(false);
      showToast('Commande supprimée avec succès.', 'success');
    } catch (error) {
      showToast('Erreur lors de la suppression de la commande.', 'error');
    }
  }, [selectedTableOrder, deleteOrder, setSelectedTable, showToast]);

  // Handlers pour OrderDetailView
  const handleEditOrder = useCallback(() => {
    cameFromDetailViewRef.current = true; // Marquer qu'on vient de la detail view
    setShowOrderDetail(false);
    setOrderCreatedFromStart(false);
    setOrderModalTitle(`${currentRoom?.name || 'Salle'} - ${selectedTableOrder?.table?.name || selectedTable?.name || 'Table'}`);
    setShowOrderModal(true);
  }, [selectedTableOrder, selectedTable, currentRoom]);

  const handleUpdateItemStatus = useCallback(async (orderLine: any, newStatus: Status) => {
    if (!selectedTableOrder) return;

    try {
      await updateOrderStatus(selectedTableOrder.id, {
        status: newStatus,
        orderLineIds: [orderLine.id],
      });
      showToast('Statut mis à jour avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de la mise à jour du statut', 'error');
      console.error('Erreur updateItemStatus:', error);
    }
  }, [selectedTableOrder, updateOrderStatus, showToast]);

  const handleUpdateMenuItemStatus = useCallback(async (orderLineItem: any, newStatus: Status) => {
    if (!selectedTableOrder) return;

    try {
      await updateOrderStatus(selectedTableOrder.id, {
        status: newStatus,
        orderLineItemIds: [orderLineItem.id],
      });
      showToast('Statut mis à jour avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de la mise à jour du statut', 'error');
      console.error('Erreur updateMenuItemStatus:', error);
    }
  }, [selectedTableOrder, updateOrderStatus, showToast]);

  const handleBulkUpdateStatus = useCallback(async (orderLineIds: string[], orderLineItemIds: string[], newStatus: Status) => {
    if (!selectedTableOrder) return;

    try {
      await updateOrderStatus(selectedTableOrder.id, {
        status: newStatus,
        orderLineIds: orderLineIds.length > 0 ? orderLineIds : undefined,
        orderLineItemIds: orderLineItemIds.length > 0 ? orderLineItemIds : undefined,
      });
      showToast(`${orderLineIds.length + orderLineItemIds.length} article(s) mis à jour`, 'success');
    } catch (error) {
      showToast('Erreur lors de la mise à jour', 'error');
      console.error('Erreur bulk update:', error);
    }
  }, [selectedTableOrder, updateOrderStatus, showToast]);

  const handleClaim = useCallback(() => {
    if (!selectedTableOrder) return;

    // Créer un Map pour accès rapide au priorityOrder
    const itemTypePriorityMap = new Map(
      allItemTypes.map(it => [it.id, it.priorityOrder])
    );

    // Trouver tous les items en DRAFT (items individuels + items dans les menus)
    const draftItems: { orderLineId?: string; orderLineItemId?: string; itemTypeId: string; priority: number; itemName: string }[] = [];

    // Items individuels
    selectedTableOrder.lines?.forEach((line) => {
      if (line.type === OrderLineType.ITEM && line.status === Status.DRAFT) {
        const itemTypeId = line.item?.itemType?.id || '';
        const priority = itemTypePriorityMap.get(itemTypeId) ?? Number.MAX_SAFE_INTEGER;
        draftItems.push({
          orderLineId: line.id,
          itemTypeId,
          priority,
          itemName: line.item?.name || 'Article inconnu'
        });
      }
    });

    // Items dans les menus
    selectedTableOrder.lines?.forEach((line) => {
      if (line.type === OrderLineType.MENU && line.items) {
        line.items.forEach((menuItem) => {
          if (menuItem.status === Status.DRAFT) {
            const itemTypeId = menuItem.item?.itemType?.id || '';
            const priority = itemTypePriorityMap.get(itemTypeId) ?? Number.MAX_SAFE_INTEGER;
            draftItems.push({
              orderLineItemId: menuItem.id,
              itemTypeId,
              priority,
              itemName: menuItem.item?.name || 'Article inconnu'
            });
          }
        });
      }
    });

    if (draftItems.length === 0) {
      showToast('Aucun article en brouillon', 'warning');
      return;
    }

    // Trouver la priorité minimale parmi les items en DRAFT
    const minPriority = Math.min(...draftItems.map(item => item.priority));

    // Filtrer seulement les items avec cette priorité minimale
    const itemsToClaim = draftItems.filter(item => item.priority === minPriority);

    const orderLineIds = itemsToClaim.filter(item => item.orderLineId).map(item => item.orderLineId!);
    const orderLineItemIds = itemsToClaim.filter(item => item.orderLineItemId).map(item => item.orderLineItemId!);
    const itemTypeName = allItemTypes.find(it => it.priorityOrder === minPriority)?.name || 'Articles';
    const itemNames = itemsToClaim.map(item => item.itemName);

    // Stocker les données et afficher la modal de confirmation
    setItemsToClaimData({
      orderLineIds,
      orderLineItemIds,
      itemTypeName,
      count: itemsToClaim.length,
      itemNames
    });
    setShowClaimConfirmModal(true);
  }, [selectedTableOrder, allItemTypes, showToast]);

  const confirmClaim = useCallback(async () => {
    if (!itemsToClaimData) return;

    try {
      await handleBulkUpdateStatus(itemsToClaimData.orderLineIds, itemsToClaimData.orderLineItemIds, Status.PENDING);
      showToast(`${itemsToClaimData.itemTypeName} réclamé${itemsToClaimData.count > 1 ? 's' : ''} (${itemsToClaimData.count})`, 'success');
      setShowClaimConfirmModal(false);
      setItemsToClaimData(null);
    } catch (error) {
      showToast('Erreur lors de la réclamation', 'error');
      console.error('Erreur claim:', error);
    }
  }, [itemsToClaimData, handleBulkUpdateStatus, showToast]);

  const handleServe = useCallback(() => {
    if (!selectedTableOrder) return;

    // Trouver tous les items en READY (items individuels + items dans les menus)
    const orderLineIds: string[] = [];
    const orderLineItemIds: string[] = [];
    const itemNames: string[] = [];

    // Items individuels
    selectedTableOrder.lines?.forEach((line) => {
      if (line.type === OrderLineType.ITEM && line.status === Status.READY) {
        orderLineIds.push(line.id);
        itemNames.push(line.item?.name || 'Article inconnu');
      }
    });

    // Items dans les menus
    selectedTableOrder.lines?.forEach((line) => {
      if (line.type === OrderLineType.MENU && line.items) {
        line.items.forEach((menuItem) => {
          if (menuItem.status === Status.READY) {
            orderLineItemIds.push(menuItem.id);
            itemNames.push(menuItem.item?.name || 'Article inconnu');
          }
        });
      }
    });

    const totalItems = orderLineIds.length + orderLineItemIds.length;

    if (totalItems === 0) {
      showToast('Aucun article prêt', 'warning');
      return;
    }

    // Stocker les données et afficher la modal de confirmation
    setItemsToServeData({
      orderLineIds,
      orderLineItemIds,
      count: totalItems,
      itemNames
    });
    setShowServeConfirmModal(true);
  }, [selectedTableOrder, showToast]);

  const confirmServe = useCallback(async () => {
    if (!itemsToServeData) return;

    try {
      await handleBulkUpdateStatus(itemsToServeData.orderLineIds, itemsToServeData.orderLineItemIds, Status.SERVED);
      showToast(`Article${itemsToServeData.count > 1 ? 's' : ''} servi${itemsToServeData.count > 1 ? 's' : ''} (${itemsToServeData.count})`, 'success');
      setShowServeConfirmModal(false);
      setItemsToServeData(null);
    } catch (error) {
      showToast('Erreur lors du service', 'error');
      console.error('Erreur serve:', error);
    }
  }, [itemsToServeData, handleBulkUpdateStatus, showToast]);

  const handleDeleteOrderLine = useCallback(async (orderLineId: string) => {
    try {
      await deleteOrderLine(orderLineId);
      showToast('Article supprimé avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
      console.error('Erreur suppression:', error);
    }
  }, [deleteOrderLine, showToast]);

  const handleDeleteMenuLine = useCallback(async (orderLineId: string) => {
    try {
      await deleteOrderLine(orderLineId);
      showToast('Menu supprimé avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
      console.error('Erreur suppression:', error);
    }
  }, [deleteOrderLine, showToast]);

  const handleReassignTable = useCallback(() => {
    setReassignRoomId(currentRoom?.id || null);
    setShowReassignModal(true);
  }, [currentRoom]);

  // Tables et room pour la modal de réassignation
  const reassignRoom = useMemo(() => {
    if (!reassignRoomId) return null;
    return rooms.find(room => room.id === reassignRoomId) || null;
  }, [reassignRoomId, rooms]);

  const reassignRoomTables = useMemo(() => {
    if (!reassignRoomId) return [];
    return enrichedTables.filter(table => {
      // Filtrer seulement les tables de la room sélectionnée
      if (table.roomId !== reassignRoomId) return false;

      // Exclure TOUTES les tables qui ont déjà une commande (on ne peut pas assigner à une table occupée)
      const hasOrder = table.orders && table.orders.length > 0;
      return !hasOrder;
    });
  }, [reassignRoomId, enrichedTables]);

  const handleTableReassign = useCallback(async (table: Table | null) => {
    if (!table || !selectedTableOrder || isReassigning) return;

    setIsReassigning(true);
    try {
      await updateOrder(selectedTableOrder.id, { tableId: table.id });
      setSelectedTable(table.id);
      setShowReassignModal(false);
      showToast('Table réassignée avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de la réassignation', 'error');
    } finally {
      setIsReassigning(false);
    }
  }, [selectedTableOrder, updateOrder, setSelectedTable, showToast, isReassigning]);

  const handlePayment = useCallback(() => {
    setShowPaymentModal(true);
  }, []);

  const handlePaymentComplete = useCallback(async (_paymentData: any) => {
    try {
      setShowPaymentModal(false);
      showToast('Paiement traité avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors du traitement du paiement', 'error');
    }
  }, [showToast]);

  const handleTerminate = useCallback(() => {
    setShowTerminateDialog(true);
  }, []);

  const handleConfirmTerminate = useCallback(async () => {
    if (!selectedTableOrder) return;

    try {
      const orderLineIds: string[] = [];
      const orderLineItemIds: string[] = [];

      selectedTableOrder.lines?.forEach((line) => {
        if (line.type === OrderLineType.ITEM) {
          orderLineIds.push(line.id);
        } else if (line.type === OrderLineType.MENU && line.items) {
          line.items.forEach((item) => {
            orderLineItemIds.push(item.id);
          });
        }
      });

      await updateOrderStatus(selectedTableOrder.id, {
        status: Status.TERMINATED,
        orderLineIds: orderLineIds.length > 0 ? orderLineIds : undefined,
        orderLineItemIds: orderLineItemIds.length > 0 ? orderLineItemIds : undefined,
      });

      showToast('Commande terminée avec succès', 'success');
      setShowTerminateDialog(false);
      setShowOrderDetail(false);
      setSelectedTable(null);
    } catch (error) {
      showToast('Erreur lors de la terminaison de la commande', 'error');
      console.error('Erreur terminate:', error);
    }
  }, [selectedTableOrder, updateOrderStatus, showToast, setSelectedTable]);

  const handleDelete = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedTableOrder) return;

    try {
      await deleteOrder(selectedTableOrder.id);
      showToast('Commande supprimée avec succès', 'success');
      setShowDeleteDialog(false);
      setShowOrderDetail(false);
      setSelectedTable(null);
    } catch (error) {
      showToast('Erreur lors de la suppression de la commande', 'error');
    }
  }, [selectedTableOrder, deleteOrder, showToast, setSelectedTable]);

  const handleCloseOrderDetail = useCallback(() => {
    setShowOrderDetail(false);
    setSelectedTable(null);
  }, [setSelectedTable]);

  const navigateToRoomEdit = useCallback(() => {
    if (!currentRoom) return;
    router.push('/(admin)/room/edition-mode');
  }, [currentRoom]);

  const handleDeselectTable = useCallback(() => {
    setSelectedTable(null);
  }, [setSelectedTable]);

  const windowDimensions = useWindowDimensions();

  // Mesure du conteneur de la room pour le zoom auto-fill
  const { dimensions: roomContainerDimensions, onLayout: handleRoomContainerLayout } = useContainerLayout();

  // ✅ useMemo : Dimensions de la modal de réassignation
  const reassignModalDimensions = useMemo(() => ({
    width: Math.min(windowDimensions.width * 0.55, 600),
    height: Math.min(windowDimensions.height * 0.7, 600),
  }), [windowDimensions.width, windowDimensions.height]);

  // ✅ useMemo : Dimensions du container Room dans la modal de réassignation
  const reassignRoomContainerDimensions = useMemo(() => ({
    width: Math.min(windowDimensions.width * 0.65, 660),
    height: Math.min(windowDimensions.height * 0.55, 500),
  }), [windowDimensions.width, windowDimensions.height]);

  // Fonction pour rediriger vers room_list avec création automatique
  const handleCreateFirstRoom = useCallback(() => {
    router.push('/(admin)/room');
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* OrderLinesForm en pleine page - remplace tout le layout */}
      {showOrderModal && (selectedTableOrder || orderCreatedFromStart) ? (
        <View style={{ flex: 1, flexDirection: 'column' }}>
          {/* OrderLinesForm */}
          <View style={{ flex: 1 }}>
            <OrderLinesForm
              title={orderModalTitle}
              lines={orderLinesManager.orderLines}
              items={allItems.filter(item => item.isActive)}
              itemTypes={allItemTypes}
              onAddItem={orderLinesManager.addItem}
              onUpdateItem={orderLinesManager.updateItem}
              onAddMenu={orderLinesManager.addMenu}
              onUpdateMenu={orderLinesManager.updateMenu}
              onDeleteLine={orderLinesManager.deleteLine}
              onClearAll={orderLinesManager.clearAllLines}
              onSave={orderLinesManager.save}
              onCancel={handleSmartCloseOrderModal}
              hasChanges={orderLinesManager.hasChanges}
              isProcessing={orderLinesManager.isProcessing}
              onConfigurationModeChange={handleConfigurationModeChange}
              onConfigurationActionsChange={handleConfigurationActionsChange}
            />
          </View>

          {/* Boutons de configuration de menu */}
          {isConfiguringMenu && menuConfigActions && (
            <View style={styles.actionButtonsContainer}>
              <OrderLinesButton
                variant="configCancel"
                onPress={menuConfigActions.onCancel}
              >
                Annuler
              </OrderLinesButton>
              <OrderLinesButton
                variant="config"
                onPress={menuConfigActions.onConfirm}
                disabled={!menuConfigActions.isValid}
                flex={2}
              >
                Confirmer la sélection
              </OrderLinesButton>
            </View>
          )}
        </View>
      ) : (
        // Layout normal service avec SidePanel + Room
        <View style={{ flexDirection: 'row', flex: 1 }}>
          <SidePanel
            hideCloseButton={true}
            hideHeader={true}
            width={windowDimensions.width / 4}
            title="Service"
            onBack={handleDeselectTable}
          >
            <View style={{ padding: 16, flex: 1, backgroundColor: '#F9FAFB' }}>
              {loading || !filtersLoaded ? (
                <Text>Chargement...</Text>
              ) : (
                <>
                  <SearchBar
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onClearFilters={handleClearFilters}
                  />
                  <OrderList
                    orders={filteredOrders}
                    onOrderPress={(order) => {
                      setSelectedTable(order.tableId);
                      setShowOrderDetail(true);
                    }}
                    onOrderDelete={handleDeleteOrder}
                    selectedOrderId={selectedTableOrder?.id}
                  />
                </>
              )}
            </View>
          </SidePanel>

          <View style={styles.mainContentContainer}>
            {/* Header avec tabs des rooms - seulement si il y a des rooms et pas en mode detail/edit */}
            {rooms.length > 0 && !showOrderDetail && !showOrderModal && (
              <RoomTabsHeader
                rooms={rooms}
                currentRoomId={currentRoom?.id}
                onRoomChange={handleChangeRoom}
                onEditModePress={navigateToRoomEdit}
              />
            )}

            {appInitialized && !appLoading && rooms.length === 0 ? (
              <EmptyRoomsState onCreateFirstRoom={handleCreateFirstRoom} />
            ) : appLoading || !appInitialized ? (
              // État de chargement
              <View style={styles.loadingContainer}>
                <Text>Chargement des salles...</Text>
              </View>
            ) : (
              // Layout normal avec room existante
              <View style={styles.normalLayoutContainer}>
                {showOrderDetail && selectedTableOrder ? (
                  // Afficher les détails de la commande
                  <View style={{ flex: 1, flexDirection: 'column' }}>
                    {/* Header avec bouton retour, Réclamer et Actions */}
                    <OrderDetailHeader
                      title={`Commande - ${selectedTableOrder.table?.name || 'Table'}`}
                      onBack={handleCloseOrderDetail}
                      onAddItem={handleEditOrder}
                      onClaim={handleClaim}
                      onServe={handleServe}
                      hasDraftItems={hasDraftItems}
                      hasReadyItems={hasReadyItems}
                      onReassignTable={handleReassignTable}
                      onPayment={handlePayment}
                      onTerminate={handleTerminate}
                      onDelete={handleDelete}
                      orderStatus={selectedTableOrder.status}
                    />

                    {/* OrderDetailView */}
                    <OrderDetailView
                      order={selectedTableOrder}
                      itemTypes={allItemTypes}
                      onUpdateItemStatus={handleUpdateItemStatus}
                      onUpdateMenuItemStatus={handleUpdateMenuItemStatus}
                      onBulkUpdateStatus={handleBulkUpdateStatus}
                      onDeleteOrderLine={handleDeleteOrderLine}
                      onDeleteMenuLine={handleDeleteMenuLine}
                    />
                  </View>
                ) : (
                  // Afficher la room normalement
                  <>
                    <View style={{ flex: 1 }} onLayout={handleRoomContainerLayout}>
                      <RoomComponent
                        key={currentRoom?.id || 'no-room'}
                        tables={currentRoomTables}
                        editingTableId={selectedTableId ?? undefined}
                        editionMode={false}
                        isLoading={loading}
                        width={currentRoom?.width}
                        height={currentRoom?.height}
                        containerDimensions={roomContainerDimensions}
                        fillContainer
                        onTablePress={handleTablePress}
                        onTableLongPress={handleTablePress}
                        onTableUpdate={() => { }}
                      />
                    </View>

                    {/* Bouton Start flottant - visible quand une table vide est sélectionnée */}
                    {selectedTable && !selectedTableOrder && (
                      <Pressable
                        onPress={handleCreateOrder}
                        style={styles.startButton}
                      >
                        <Play size={28} color="white" fill="white" />
                      </Pressable>
                    )}
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Modals pour OrderDetailView */}
      <CustomModal
        isVisible={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        width={reassignModalDimensions.width}
        height={reassignModalDimensions.height}
        title={isReassigning ? 'Assignation en cours...' : 'Sélectionner une table'}
      >
        <View style={styles.reassignModalContainer}>
          {/* Tabs des rooms - hauteur fixe en haut avec zIndex élevé */}
          <View style={styles.reassignTabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.reassignScrollContent}
              nestedScrollEnabled={true}
            >
              {rooms.length === 0 ? (
                <Text style={{ color: '#999' }}>Aucune room disponible</Text>
              ) : (
                rooms.map((room, index) => (
                  <RoomBadgeItem
                    key={`${room.name}-reassign-${index}`}
                    room={room}
                    isActive={room.id === reassignRoomId}
                    onPress={(room) => {
                      console.log('👆 Room clicked:', room.name);
                      setReassignRoomId(room.id);
                    }}
                    keyPrefix="reassign"
                  />
                ))
              )}
            </ScrollView>
          </View>

          {/* Room - prend le reste de l'espace disponible */}
          <View style={styles.reassignRoomContainer}>
            <RoomComponent
              tables={reassignRoomTables}
              editionMode={false}
              isLoading={loading || isReassigning}
              width={reassignRoom?.width}
              height={reassignRoom?.height}
              containerDimensions={reassignRoomContainerDimensions}
              onTablePress={handleTableReassign}
              onTableLongPress={handleTableReassign}
              onTableUpdate={() => {}}
            />
          </View>
        </View>
      </CustomModal>

      <ForkModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        maxWidth={1200}
        title="Régler l'addition"
      >
        {selectedTableOrder && (
          <PaymentView
            order={selectedTableOrder}
            onClose={() => setShowPaymentModal(false)}
            onPaymentComplete={handlePaymentComplete}
          />
        )}
      </ForkModal>

      {selectedTableOrder && showDeleteDialog && (
        <DeleteConfirmationModal
          isVisible={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleConfirmDelete}
          entityName={`de la table ${selectedTableOrder.table?.name || selectedTableOrder.table?.id || 'N/A'}`}
          entityType="la commande"
        />
      )}

      {selectedTableOrder && showTerminateDialog && (
        <ConfirmationModal
          isVisible={showTerminateDialog}
          onClose={() => setShowTerminateDialog(false)}
          onConfirm={handleConfirmTerminate}
          title="Terminer la commande"
          message={`Voulez-vous vraiment terminer la commande de la table ${selectedTableOrder.table?.name || 'N/A'} ?`}
          description="Cette action marquera tous les articles de la commande comme terminés. La commande disparaîtra de la vue service."
          confirmText="Confirmer"
          confirmVariant="default"
        />
      )}

      {/* Modal de confirmation pour Réclamer */}
      <ClaimConfirmModal
        isVisible={showClaimConfirmModal}
        itemsData={itemsToClaimData}
        onClose={() => {
          setShowClaimConfirmModal(false);
          setItemsToClaimData(null);
        }}
        onConfirm={confirmClaim}
      />

      {/* Modal de confirmation pour Servir */}
      <ServeConfirmModal
        isVisible={showServeConfirmModal}
        itemsData={itemsToServeData}
        onClose={() => {
          setShowServeConfirmModal(false);
          setItemsToServeData(null);
        }}
        onConfirm={confirmServe}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actionButtonsContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    gap: 12,
  },
  mainContentContainer: {
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  normalLayoutContainer: {
    flex: 1,
    zIndex: 1,
    elevation: 0,
  },
  reassignModalContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
  },
  reassignTabsContainer: {
    height: 54,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 6,
    zIndex: 10,
    elevation: 2,
    shadowColor: 'transparent',
  },
  reassignScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  reassignRoomContainer: {
    flex: 1,
    zIndex: 1,
    backgroundColor: '#FFFFFF',
  },
  startButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#1A1A1A',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
});