import { ScrollView, View, useWindowDimensions, StyleSheet } from "react-native";
import { Text } from "~/components/ui";
import RoomComponent from '~/components/Room/Room';
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { Table } from "~/types/table.types";
import { router } from 'expo-router';
import { useToast } from '~/components/ToastProvider';
import { RoomTabsHeader } from '~/components/Service/RoomTabsHeader';
import { EmptyRoomsState } from '~/components/Service/EmptyRoomsState';
import { ActionConfirmModal } from '~/components/Service/ActionConfirmModal';
import { RoomBadgeItem } from '~/components/Service/RoomBadgeItem';
import {
  useRestaurant,
  useMenu,
  useTables,
  useOrders
} from '~/hooks/useRestaurant';
import { useAppSelector } from '~/store/hooks';
import { selectAppInitialized, selectIsAppInitializing } from '~/store/slices/session.slice';
import { OrderLinesForm } from '~/components/order/OrderLinesForm';
import { useOrderLinesManager } from '~/hooks/order/useOrderLinesManager';
import { useOrderStatusActions } from '~/hooks/order/useOrderStatusActions';
import { useContainerLayout } from '~/hooks/room/useContainerLayout';
import { useOrderLines } from '~/hooks/useOrderLines';
import { OrderDetailView, OrderDetailHeader } from '~/components/OrderDetail';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';
import { ConfirmationModal } from '~/components/ui/ConfirmationModal';
import { CustomModal } from '@/components/CustomModal';
import PaymentView from '~/components/Service/PaymentView';

const NOOP = () => {};

export default function ServicePage() {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderCreatedFromStart, setOrderCreatedFromStart] = useState(false);
  const [orderModalTitle, setOrderModalTitle] = useState('');
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignRoomId, setReassignRoomId] = useState<string | null>(null);
  const [isReassigning, setIsReassigning] = useState(false);
  const [showPaymentView, setShowPaymentView] = useState(false);

  const { rooms, currentRoom, setCurrentRoom } = useRestaurant();
  const appInitialized = useAppSelector(selectAppInitialized);
  const appLoading = useAppSelector(selectIsAppInitializing);
  const { enrichedTables, currentRoomTables, selectedTableId, selectedTable, setSelectedTable } = useTables();
  const {
    currentRoomOrders,
    selectedTableOrder,
    deleteOrder,
    updateOrder,
    updateOrderStatus
  } = useOrders();
  const { items: allItems, itemTypes: allItemTypes } = useMenu();
  const { deleteOrderLine } = useOrderLines();
  const { showToast } = useToast();

  const handleOrderCleanup = useCallback(() => {
    setSelectedTable(null);
    setShowOrderDetail(false);
  }, [setSelectedTable]);

  const {
    hasDraftItems,
    hasReadyItems,
    handleUpdateItemStatus,
    handleUpdateMenuItemStatus,
    handleBulkUpdateStatus,
    handleClaim,
    confirmClaim,
    showClaimConfirmModal,
    setShowClaimConfirmModal,
    itemsToClaimData,
    setItemsToClaimData,
    handleServe,
    confirmServe,
    showServeConfirmModal,
    setShowServeConfirmModal,
    itemsToServeData,
    setItemsToServeData,
    handleDeleteLine,
    handleDelete,
    handleConfirmDelete,
    showDeleteDialog,
    setShowDeleteDialog,
    handleTerminate,
    handleConfirmTerminate,
    showTerminateDialog,
    setShowTerminateDialog,
  } = useOrderStatusActions({
    selectedTableOrder,
    allItemTypes,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    deleteOrderLine,
    showToast,
    onCleanup: handleOrderCleanup,
  });

  // Stabiliser la référence des initialLines pour éviter les re-renders inutiles
  const initialLines = useMemo(() => selectedTableOrder?.lines || [], [selectedTableOrder?.id, selectedTableOrder?.lines]);

  const isSavingOrderRef = useRef<boolean | { savedOrder: any }>(false);
  const cameFromDetailViewRef = useRef<boolean>(false);

  // Hook pour gérer les OrderLines (remplace toute la logique manuelle)
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
      cameFromDetailViewRef.current = false;

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

  useFocusEffect(
    useCallback(() => {
      return () => {
        setSelectedTable(null);
      };
    }, [setSelectedTable])
  );

  const handleChangeRoom = useCallback((room: any) => {
    setSelectedTable(null);
    setCurrentRoom(room.id);
  }, [setSelectedTable, setCurrentRoom]);

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

    cameFromDetailViewRef.current = false;
    setOrderCreatedFromStart(true);
    setOrderModalTitle(`${currentRoom?.name || 'Salle'} - ${selectedTable?.name || 'Table'}`);
    setShowOrderModal(true);
  }, [selectedTableId, currentRoomOrders, selectedTable, currentRoom, showToast]);

  const handleTablePress = useCallback((table: Table | null) => {
    if (!table) return;

    const tableOrder = currentRoomOrders.find(order => order.tableId === table.id);

    if (tableOrder) {
      setSelectedTable(table.id);
      setShowOrderDetail(true);
    } else if (selectedTableId === table.id) {
      // 2e tap sur table vide déjà sélectionnée → démarrer commande
      handleCreateOrder();
    } else {
      // 1er tap → sélectionner
      setSelectedTable(table.id);
    }
  }, [currentRoomOrders, setSelectedTable, selectedTableId, handleCreateOrder]);

  // Reset quand l'ordre disparaît (ex: backend supprime l'ordre vide après suppression du dernier article)
  useEffect(() => {
    if (showOrderDetail && !selectedTableOrder && !isSavingOrderRef.current) {
      setShowOrderDetail(false);
      setSelectedTable(null);
    }
  }, [showOrderDetail, selectedTableOrder, setSelectedTable]);

  const handleSmartCloseOrderModal = useCallback(() => {
    orderLinesManager.reset();
    const cameFromDetail = cameFromDetailViewRef.current;

    setShowOrderModal(false);
    setOrderCreatedFromStart(false);

    if (cameFromDetail) {
      setShowOrderDetail(true);
      cameFromDetailViewRef.current = false;
    }

    setTimeout(() => {
      isSavingOrderRef.current = false;
    }, 300);
  }, [orderLinesManager]);

  const handleEditOrder = useCallback(() => {
    cameFromDetailViewRef.current = true;
    setShowOrderDetail(false);
    setOrderCreatedFromStart(false);
    setOrderModalTitle(`${currentRoom?.name || 'Salle'} - ${selectedTableOrder?.table?.name || selectedTable?.name || 'Table'}`);
    setShowOrderModal(true);
  }, [selectedTableOrder, selectedTable, currentRoom]);

  const handleReassignTable = useCallback(() => {
    setReassignRoomId(currentRoom?.id || null);
    setShowReassignModal(true);
  }, [currentRoom]);

  const reassignRoom = useMemo(() => {
    if (!reassignRoomId) return null;
    return rooms.find(room => room.id === reassignRoomId) || null;
  }, [reassignRoomId, rooms]);

  const reassignRoomTables = useMemo(() => {
    if (!reassignRoomId) return [];
    return enrichedTables.filter(table => {
      if (table.roomId !== reassignRoomId) return false;
      const hasOrder = table.orders && table.orders.length > 0;
      return !hasOrder;
    });
  }, [reassignRoomId, enrichedTables]);

  const handleReassignRoomChange = useCallback((room: any) => {
    setReassignRoomId(room.id);
  }, []);

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
    setShowPaymentView(true);
  }, []);

  const handlePaymentComplete = useCallback(async () => {
    try {
      showToast('Paiement traité avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors du traitement du paiement', 'error');
    }
  }, [showToast]);

  const handleBackFromPayment = useCallback(() => {
    setShowPaymentView(false);
  }, []);

  const handleCloseOrderDetail = useCallback(() => {
    setShowOrderDetail(false);
    setSelectedTable(null);
  }, [setSelectedTable]);

  const navigateToRoomEdit = useCallback(() => {
    if (!currentRoom) return;
    router.push('/(admin)/room/edition-mode');
  }, [currentRoom]);

  // Callbacks stabilisés pour les modals
  const handleCloseReassignModal = useCallback(() => setShowReassignModal(false), []);
  const handleCloseDeleteDialog = useCallback(() => setShowDeleteDialog(false), [setShowDeleteDialog]);
  const handleCloseTerminateDialog = useCallback(() => setShowTerminateDialog(false), [setShowTerminateDialog]);
  const handleCloseClaimModal = useCallback(() => {
    setShowClaimConfirmModal(false);
    setItemsToClaimData(null);
  }, [setShowClaimConfirmModal, setItemsToClaimData]);
  const handleCloseServeModal = useCallback(() => {
    setShowServeConfirmModal(false);
    setItemsToServeData(null);
  }, [setShowServeConfirmModal, setItemsToServeData]);

  const windowDimensions = useWindowDimensions();

  // Mesure du conteneur de la room pour le zoom auto-fill
  const { dimensions: roomContainerDimensions, onLayout: handleRoomContainerLayout } = useContainerLayout();

  const reassignModalDimensions = useMemo(() => ({
    width: Math.min(windowDimensions.width * 0.55, 600),
    height: Math.min(windowDimensions.height * 0.7, 600),
  }), [windowDimensions.width, windowDimensions.height]);

  const reassignRoomContainerDimensions = useMemo(() => ({
    width: Math.min(windowDimensions.width * 0.65, 660),
    height: Math.min(windowDimensions.height * 0.55, 500),
  }), [windowDimensions.width, windowDimensions.height]);

  const handleCreateFirstRoom = useCallback(() => {
    router.push('/(admin)/room');
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* PaymentView en pleine page */}
      {showPaymentView && selectedTableOrder ? (
        <PaymentView
          order={selectedTableOrder}
          tableName={selectedTable?.name || 'Table'}
          onBack={handleBackFromPayment}
          onPaymentComplete={handlePaymentComplete}
        />
      ) : /* OrderLinesForm en pleine page - remplace tout le layout */
      showOrderModal && (selectedTableOrder || orderCreatedFromStart) ? (
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
            />
          </View>

        </View>
      ) : (
        // Layout normal service — Room plein écran
        <View style={styles.flex1}>
          <View style={styles.mainContentContainer}>
            {/* Header avec tabs des rooms */}
            {rooms.length > 0 && !showOrderDetail && !showOrderModal && (
              <RoomTabsHeader
                rooms={rooms}
                currentRoomId={currentRoom?.id}
                enrichedTables={enrichedTables}
                onRoomChange={handleChangeRoom}
                onEditModePress={navigateToRoomEdit}
              />
            )}

            {appInitialized && !appLoading && rooms.length === 0 ? (
              <EmptyRoomsState onCreateFirstRoom={handleCreateFirstRoom} />
            ) : appLoading || !appInitialized ? (
              <View style={styles.loadingContainer}>
                <Text>Chargement des salles...</Text>
              </View>
            ) : (
              <View style={styles.normalLayoutContainer}>
                {showOrderDetail && selectedTableOrder ? (
                  <View style={styles.columnLayout}>
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

                    <OrderDetailView
                      order={selectedTableOrder}
                      itemTypes={allItemTypes}
                      onUpdateItemStatus={handleUpdateItemStatus}
                      onUpdateMenuItemStatus={handleUpdateMenuItemStatus}
                      onBulkUpdateStatus={handleBulkUpdateStatus}
                      onDeleteOrderLine={handleDeleteLine}
                      onDeleteMenuLine={handleDeleteLine}
                    />
                  </View>
                ) : (
                  <View style={styles.flex1} onLayout={handleRoomContainerLayout}>
                    <RoomComponent
                      key={currentRoom?.id || 'no-room'}
                      tables={currentRoomTables}
                      editingTableId={selectedTableId ?? undefined}
                      editionMode={false}
                      isLoading={false}
                      width={currentRoom?.width}
                      height={currentRoom?.height}
                      roomColor={currentRoom?.color}
                      containerDimensions={roomContainerDimensions}
                      fillContainer
                      onTablePress={handleTablePress}
                      onTableLongPress={handleTablePress}
                      onTableUpdate={NOOP}
                    />
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Modals */}
      <CustomModal
        isVisible={showReassignModal}
        onClose={handleCloseReassignModal}
        width={reassignModalDimensions.width}
        height={reassignModalDimensions.height}
        title={isReassigning ? 'Assignation en cours...' : 'Sélectionner une table'}
      >
        <View style={styles.reassignModalContainer}>
          <View style={styles.reassignTabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.reassignScrollContent}
              nestedScrollEnabled={true}
            >
              {rooms.length === 0 ? (
                <Text style={styles.emptyText}>Aucune room disponible</Text>
              ) : (
                rooms.map((room) => (
                  <RoomBadgeItem
                    key={room.id}
                    room={room}
                    isActive={room.id === reassignRoomId}
                    enrichedTables={enrichedTables}
                    onPress={handleReassignRoomChange}
                  />
                ))
              )}
            </ScrollView>
          </View>

          <View style={styles.reassignRoomContainer}>
            <RoomComponent
              tables={reassignRoomTables}
              editionMode={false}
              isLoading={isReassigning}
              width={reassignRoom?.width}
              height={reassignRoom?.height}
              roomColor={reassignRoom?.color}
              containerDimensions={reassignRoomContainerDimensions}
              onTablePress={handleTableReassign}
              onTableLongPress={handleTableReassign}
              onTableUpdate={NOOP}
            />
          </View>
        </View>
      </CustomModal>

      {selectedTableOrder && showDeleteDialog && (
        <DeleteConfirmationModal
          isVisible={showDeleteDialog}
          onClose={handleCloseDeleteDialog}
          onConfirm={handleConfirmDelete}
          entityName={`de la table ${selectedTableOrder.table?.name || selectedTableOrder.table?.id || 'N/A'}`}
          entityType="la commande"
        />
      )}

      {selectedTableOrder && showTerminateDialog && (
        <ConfirmationModal
          isVisible={showTerminateDialog}
          onClose={handleCloseTerminateDialog}
          onConfirm={handleConfirmTerminate}
          title="Terminer la commande"
          message={`Voulez-vous vraiment terminer la commande de la table ${selectedTableOrder.table?.name || 'N/A'} ?`}
          description="Cette action marquera tous les articles de la commande comme terminés. La commande disparaîtra de la vue service."
          confirmText="Confirmer"
          confirmVariant="default"
        />
      )}

      {/* Modal de confirmation pour Réclamer */}
      <ActionConfirmModal
        isVisible={showClaimConfirmModal}
        itemsData={itemsToClaimData}
        onClose={handleCloseClaimModal}
        onConfirm={confirmClaim}
        variant="claim"
      />

      {/* Modal de confirmation pour Servir */}
      <ActionConfirmModal
        isVisible={showServeConfirmModal}
        itemsData={itemsToServeData}
        onClose={handleCloseServeModal}
        onConfirm={confirmServe}
        variant="serve"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  columnLayout: {
    flex: 1,
    flexDirection: 'column',
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
  emptyText: {
    color: '#999',
  },
});
