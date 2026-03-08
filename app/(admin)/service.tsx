import { View, StyleSheet, Pressable, Platform, Text as RNText, useWindowDimensions } from "react-native";
import { Text } from "~/components/ui";
import RoomComponent from '~/components/Room/Room';
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { navigationEvents } from '~/lib/navigation-events';
import { Table } from "~/types/table.types";
import { router } from 'expo-router';
import { useToast } from '~/components/ToastProvider';
import { RoomTabsHeader } from '~/components/Service/RoomTabsHeader';
import { EmptyRoomsState } from '~/components/Service/EmptyRoomsState';
import { ActionConfirmModal } from '~/components/Service/ActionConfirmModal';
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
import { useOrderDetailLineActions } from '~/hooks/order/useOrderDetailLineActions';
import { useReassignTable } from '~/hooks/order/useReassignTable';
import { useContainerLayout } from '~/hooks/room/useContainerLayout';
import { useOrderLines } from '~/hooks/useOrderLines';
import { OrderDetailActions, ReassignTablePanel } from '~/components/OrderDetail';
import { SidePanel } from '~/components/SidePanel';
import { DraftReviewPanelContent } from '~/components/order/OrderLinesForm/DraftReviewPanelContent';
import { Status } from '~/types/status.enum';

import { GroupDeletePickerModal } from '~/components/ui/GroupDeletePickerModal';
import { GroupStatusPickerModal } from '~/components/ui/GroupStatusPickerModal';
import PaymentView from '~/components/Service/PaymentView';

const NOOP = () => {};

const ConfirmDeleteOverlay = ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) => {
  const [countdown, setCountdown] = useState(3);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <View style={styles.confirmOverlay}>
      <View style={styles.overlayMessage}>
        <RNText style={styles.overlayMessageText}>Supprimer cette commande ?</RNText>
      </View>
      <Pressable
        onPress={countdown === 0 ? onConfirm : undefined}
        disabled={countdown > 0}
        style={[styles.deleteConfirmBtn, countdown > 0 && styles.confirmBtnDisabled]}
      >
        <RNText style={styles.confirmBtnText}>
          {countdown > 0 ? `${countdown}` : 'SUPPRIMER'}
        </RNText>
      </Pressable>
      <Pressable onPress={onCancel} style={styles.cancelBtn}>
        <RNText style={styles.cancelBtnText}>ANNULER</RNText>
      </Pressable>
    </View>
  );
};

export default function ServicePage() {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderCreatedFromStart, setOrderCreatedFromStart] = useState(false);
  const [orderModalTitle, setOrderModalTitle] = useState('');
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showPaymentView, setShowPaymentView] = useState(false);

  const { width } = useWindowDimensions();
  const { rooms, currentRoom, setCurrentRoom } = useRestaurant();
  const activeRooms = useMemo(() => rooms.filter(room => room.isActive), [rooms]);
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
  const activeItems = useMemo(() => allItems.filter(item => item.isActive), [allItems]);
  const { deleteOrderLine, deleteOrderLines } = useOrderLines();
  const { showToast } = useToast();

  const orderCountByRoom = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of enrichedTables) {
      if (t.orders && t.orders.length > 0) {
        map[t.roomId] = (map[t.roomId] || 0) + 1;
      }
    }
    return map;
  }, [enrichedTables]);

  // S'assurer que la currentRoom est active, sinon basculer sur la première active
  useEffect(() => {
    if (activeRooms.length > 0 && (!currentRoom || !currentRoom.isActive)) {
      setCurrentRoom(activeRooms[0].id);
    }
  }, [activeRooms, currentRoom, setCurrentRoom]);

  const handleOrderCleanup = useCallback(() => {
    setSelectedTable(null);
    setShowOrderDetail(false);
  }, [setSelectedTable]);

  const {
    hasDraftItems,
    hasReadyItems,
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

  // Reset les dialogs Terminer/Supprimer quand on quitte le détail de commande
  useEffect(() => {
    if (!showOrderDetail) {
      if (showTerminateDialog) setShowTerminateDialog(false);
      if (showDeleteDialog) setShowDeleteDialog(false);
    }
  }, [showOrderDetail, showTerminateDialog, setShowTerminateDialog, showDeleteDialog, setShowDeleteDialog]);

  const {
    statusGroupData,
    handleOpenStatusSelector,
    handleOpenStatusSelectorGroup,
    handleConfirmGroupStatus,
    handleCloseStatusGroup,
    menuStatusData,
    handleOpenMenuStatusSelector,
    handleConfirmMenuStatus,
    handleCloseMenuStatus,
    deleteGroupData,
    handleDeleteLineByIndex,
    handleDeleteGroupByIndices,
    handleConfirmDeleteGroup,
    handleCloseDeleteGroup,
  } = useOrderDetailLineActions({
    selectedTableOrder,
    handleBulkUpdateStatus,
    handleDeleteLine,
    deleteOrderLines,
  });

  const {
    showReassignInline,
    setShowReassignInline,
    reassignRoomId,
    reassignRoom,
    reassignRoomTables,
    isReassigning,
    handleReassignTable,
    handleReassignRoomChange,
    handleTableReassign,
  } = useReassignTable({
    currentRoom,
    rooms,
    enrichedTables,
    selectedTableOrder,
    updateOrder,
    setSelectedTable,
    setCurrentRoom,
    showToast,
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
      setShowOrderForm(false);

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

  // Reset toute la vue quand on re-clique sur "Service" dans le menu latéral
  const resetOrderLines = orderLinesManager.reset;
  useEffect(() => {
    return navigationEvents.on('/service', () => {
      resetOrderLines();
      setShowOrderForm(false);
      setShowOrderDetail(false);
      setShowPaymentView(false);
      setOrderCreatedFromStart(false);
      setSelectedTable(null);
    });
  }, [resetOrderLines, setSelectedTable]);

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
    setShowOrderForm(true);
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
    if (showOrderDetail && !selectedTableOrder && !isSavingOrderRef.current && !isReassigning) {
      setShowOrderDetail(false);
      setSelectedTable(null);
    }
  }, [showOrderDetail, selectedTableOrder, setSelectedTable, isReassigning]);

  const handleSmartCloseOrderModal = useCallback(() => {
    orderLinesManager.reset();
    const cameFromDetail = cameFromDetailViewRef.current;

    setShowOrderForm(false);
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
    setShowOrderForm(true);
  }, [selectedTableOrder, selectedTable, currentRoom]);

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

  const handleTerminateFromPayment = useCallback(() => {
    setShowPaymentView(false);
    handleTerminate();
  }, [handleTerminate]);

  const handleCloseOrderDetail = useCallback(() => {
    setShowOrderDetail(false);
    setSelectedTable(null);
    setShowTerminateDialog(false);
  }, [setSelectedTable, setShowTerminateDialog]);

  const navigateToRoomEdit = useCallback(() => {
    if (!currentRoom) return;
    router.push('/(admin)/room/edition-mode');
  }, [currentRoom]);

  // Callbacks stabilisés pour les modals
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

  // Mesure du conteneur de la room pour le zoom auto-fill
  const { dimensions: roomContainerDimensions, onLayout: handleRoomContainerLayout } = useContainerLayout();

  const handleCreateFirstRoom = useCallback(() => {
    router.push('/(admin)/room/edition-mode?openCreate=1');
  }, []);

  return (
    <View style={styles.flex1}>
      {/* PaymentView en pleine page */}
      {showPaymentView && selectedTableOrder ? (
        <PaymentView
          order={selectedTableOrder}
          tableName={selectedTable?.name || 'Table'}
          onBack={handleBackFromPayment}
          onPaymentComplete={handlePaymentComplete}
          onTerminate={handleTerminateFromPayment}
        />
      ) : /* OrderLinesForm en pleine page - remplace tout le layout */
      showOrderForm && (selectedTableOrder || orderCreatedFromStart) ? (
        <View style={styles.columnLayout}>
          {/* OrderLinesForm */}
          <View style={styles.flex1}>
            <OrderLinesForm
              title={orderModalTitle}
              lines={orderLinesManager.orderLines}
              items={activeItems}
              itemTypes={allItemTypes}
              onAddItem={orderLinesManager.addItem}
              onUpdateItem={orderLinesManager.updateItem}
              onAddMenu={orderLinesManager.addMenu}
              onUpdateMenu={orderLinesManager.updateMenu}
              onDeleteLine={orderLinesManager.deleteLine}
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
            {activeRooms.length > 0 && !showOrderDetail && !showOrderForm && (
              <RoomTabsHeader
                rooms={activeRooms}
                currentRoomId={currentRoom?.id}
                orderCountByRoom={orderCountByRoom}
                onRoomChange={handleChangeRoom}
                onEditModePress={navigateToRoomEdit}
              />
            )}

            {appInitialized && !appLoading && activeRooms.length === 0 ? (
              <EmptyRoomsState onCreateFirstRoom={handleCreateFirstRoom} />
            ) : appLoading || !appInitialized ? (
              <View style={styles.loadingContainer}>
                <Text>Chargement des salles...</Text>
              </View>
            ) : (
              <View style={styles.normalLayoutContainer}>
                {showOrderDetail && selectedTableOrder ? (
                  <View style={styles.orderDetailLayout}>
                    <SidePanel
                      title=""
                      hideCloseButton={true}
                      hideHeader={true}
                      width={width / 3}
                    >
                      <DraftReviewPanelContent
                        title={`Commande - ${selectedTableOrder.table?.name || 'Table'}`}
                        draftLines={selectedTableOrder.lines}
                        itemTypes={allItemTypes}
                        hideFooter={true}
                        allowEditAll={true}
                        onEdit={handleOpenStatusSelector}
                        onEditGroup={handleOpenStatusSelectorGroup}
                        onEditMenu={handleOpenMenuStatusSelector}
                        onDelete={handleDeleteLineByIndex}
                        onDeleteGroup={handleDeleteGroupByIndices}
                        onCancel={showReassignInline ? () => setShowReassignInline(false) : handleCloseOrderDetail}
                      />
                    </SidePanel>
                    {showReassignInline ? (
                      <ReassignTablePanel
                        rooms={activeRooms}
                        reassignRoomId={reassignRoomId}
                        enrichedTables={enrichedTables}
                        reassignRoom={reassignRoom}
                        reassignRoomTables={reassignRoomTables}
                        currentTableId={selectedTableOrder?.tableId}
                        isReassigning={isReassigning}
                        onRoomChange={handleReassignRoomChange}
                        onConfirm={handleTableReassign}
                        onBack={() => setShowReassignInline(false)}
                      />
                    ) : (
                      <OrderDetailActions
                        onAddItem={handleEditOrder}
                        onClaim={handleClaim}
                        onServe={handleServe}
                        hasDraftItems={hasDraftItems}
                        hasReadyItems={hasReadyItems}
                        onReassignTable={handleReassignTable}
                        onPayment={handlePayment}
                        onTerminate={handleTerminate}
                        onDelete={handleDelete}
                        order={selectedTableOrder}
                      />
                    )}

                    {/* Overlay Terminer */}
                    {showTerminateDialog && (
                      <View style={styles.confirmOverlay}>
                        <View style={styles.overlayMessage}>
                          <RNText style={styles.overlayMessageText}>Terminer cette commande ?</RNText>
                        </View>
                        <Pressable onPress={handleConfirmTerminate} style={styles.terminateConfirmBtn}>
                          <RNText style={styles.confirmBtnText}>TERMINER</RNText>
                        </Pressable>
                        <Pressable onPress={handleCloseTerminateDialog} style={styles.cancelBtn}>
                          <RNText style={styles.cancelBtnText}>ANNULER</RNText>
                        </Pressable>
                      </View>
                    )}

                    {/* Overlay Supprimer */}
                    {showDeleteDialog && (
                      <ConfirmDeleteOverlay
                        onConfirm={handleConfirmDelete}
                        onCancel={handleCloseDeleteDialog}
                      />
                    )}

                    {/* Menu status modal */}
                    <GroupStatusPickerModal
                      isVisible={!!menuStatusData}
                      onClose={handleCloseMenuStatus}
                      onConfirm={handleConfirmMenuStatus}
                      itemName={menuStatusData?.itemName || ''}
                      max={menuStatusData?.orderLineItemIds.length || 1}
                      currentStatus={menuStatusData?.currentStatus || Status.DRAFT}
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

      {/* Modal de suppression groupée avec quantité */}
      {deleteGroupData && (
        <GroupDeletePickerModal
          isVisible={!!deleteGroupData}
          onClose={handleCloseDeleteGroup}
          onConfirm={handleConfirmDeleteGroup}
          itemName={deleteGroupData.itemName}
          max={deleteGroupData.indices.length}
          status={deleteGroupData.status}
        />
      )}

      {/* Modal de statut groupé : quantité + statut en une seule modale */}
      {statusGroupData && (
        <GroupStatusPickerModal
          isVisible={!!statusGroupData}
          onClose={handleCloseStatusGroup}
          onConfirm={handleConfirmGroupStatus}
          itemName={statusGroupData.itemName}
          max={statusGroupData.indices.length}
          currentStatus={statusGroupData.currentStatus}
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
  orderDetailLayout: {
    flex: 1,
    flexDirection: 'row',
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
  confirmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    zIndex: 50,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(1px)',
        WebkitBackdropFilter: 'blur(1px)',
      },
    }),
  } as any,
  overlayMessage: {
    marginBottom: 8,
  },
  overlayMessageText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2A2E33',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  } as any,
  terminateConfirmBtn: {
    minWidth: 200,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 12,
    backgroundColor: '#2A2E33',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.2)',
      },
      android: { elevation: 8 },
    }),
  } as any,
  deleteConfirmBtn: {
    minWidth: 200,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.2)',
      },
      android: { elevation: 8 },
    }),
  } as any,
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  cancelBtn: {
    minWidth: 200,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  } as any,
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as any,
});
