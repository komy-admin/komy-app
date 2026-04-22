import { View, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import { Text } from "~/components/ui";
import RoomComponent from '~/components/Room/Room';
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { navigationEvents } from '~/lib/navigation-events';
import { Table } from "~/types/table.types";
import { router } from 'expo-router';
import { useToast } from '~/components/ToastProvider';
import { showApiError } from '~/lib/apiErrorHandler';
import { LayoutDashboard, LayoutGrid } from 'lucide-react-native';
import { AppHeader } from '~/components/ui/AppHeader';
import { TabBadgeItem } from '~/components/ui/TabBadgeItem';
import { HeaderActionButton } from '~/components/ui/HeaderActionButton';
import { ViewModeToggle } from '~/components/ui/ViewModeToggle';
import { colors } from '~/theme';
import { EmptyRoomsState } from '~/components/Service/EmptyRoomsState';
import {
  useRestaurant,
  useMenu,
  useTables,
  useOrders
} from '~/hooks/useRestaurant';
import { useAppSelector } from '~/store/hooks';
import { selectAppInitialized, selectIsAppInitializing } from '~/store/slices/session.slice';
import { selectOrders } from '~/store/selectors';
import OrdersBoard from '~/components/Service/OrdersBoard';
import { OrderLinesForm } from '~/components/order/OrderLinesForm';
import { useOrderLinesManager } from '~/hooks/order/useOrderLinesManager';
import { useOrderStatusActions } from '~/hooks/order/useOrderStatusActions';
import { useOrderDetailLineActions } from '~/hooks/order/useOrderDetailLineActions';
import { useReassignTable } from '~/hooks/order/useReassignTable';
import { useContainerLayout } from '~/hooks/room/useContainerLayout';
import { useOrderLines } from '~/hooks/useOrderLines';
import { OrderDetail } from '~/components/OrderDetail';
import PaymentView from '~/components/Service/PaymentView';

const NOOP = () => {};

export default function ServicePage() {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderCreatedFromStart, setOrderCreatedFromStart] = useState(false);
  const [orderModalTitle, setOrderModalTitle] = useState('');
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showPaymentView, setShowPaymentView] = useState(false);
  const [serviceViewMode, setServiceViewMode] = useState<'rooms' | 'orders'>('rooms');
  const [selectedCardOrderId, setSelectedCardOrderId] = useState<string | null>(null);

  const { width } = useWindowDimensions();
  const { rooms, currentRoom, setCurrentRoom } = useRestaurant();
  const activeRooms = useMemo(() => rooms.filter(room => room.isActive), [rooms]);
  const appInitialized = useAppSelector(selectAppInitialized);
  const appLoading = useAppSelector(selectIsAppInitializing);
  const roomEnabled = useAppSelector(state => state.session.accountConfig?.roomEnabled ?? true);
  const { enrichedTables, currentRoomTables, selectedTableId, selectedTable, setSelectedTable } = useTables();
  const {
    currentRoomOrders,
    selectedTableOrder,
    deleteOrder,
    updateOrder,
    updateOrderStatus
  } = useOrders();
  const allStoreOrders = useAppSelector(selectOrders);
  const { items: allItems, itemTypes: allItemTypes } = useMenu();
  const activeItems = useMemo(() => allItems.filter(item => item.isActive), [allItems]);
  const { deleteOrderLine, deleteOrderLines } = useOrderLines();
  const { showToast } = useToast();

  const isCardsMode = !roomEnabled || serviceViewMode === 'orders';

  // Ordre actuellement affiché : table sélectionnée (mode rooms) OU carte cliquée (mode cards)
  const selectedOrder = useMemo(() => {
    if (selectedTableOrder) return selectedTableOrder;
    if (selectedCardOrderId) return allStoreOrders.find(o => o.id === selectedCardOrderId) ?? null;
    return null;
  }, [selectedTableOrder, selectedCardOrderId, allStoreOrders]);

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
    setSelectedCardOrderId(null);
    setShowOrderDetail(false);
  }, [setSelectedTable]);

  const orderActions = useOrderStatusActions({
    selectedTableOrder: selectedOrder,
    allItemTypes,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    deleteOrderLine,
    showToast,
    onCleanup: handleOrderCleanup,
  });
  const {
    handleBulkUpdateStatus,
    handleDeleteLine,
    handleTerminate,
    showDeleteDialog,
    setShowDeleteDialog,
    showTerminateDialog,
    setShowTerminateDialog,
  } = orderActions;

  // Reset les dialogs Terminer/Supprimer quand on quitte le détail de commande
  useEffect(() => {
    if (!showOrderDetail) {
      if (showTerminateDialog) setShowTerminateDialog(false);
      if (showDeleteDialog) setShowDeleteDialog(false);
    }
  }, [showOrderDetail, showTerminateDialog, setShowTerminateDialog, showDeleteDialog, setShowDeleteDialog]);

  const lineActions = useOrderDetailLineActions({
    selectedTableOrder: selectedOrder,
    handleBulkUpdateStatus,
    handleDeleteLine,
    deleteOrderLines,
  });

  const reassignApi = useReassignTable({
    currentRoom,
    rooms,
    enrichedTables,
    selectedTableOrder: selectedOrder,
    updateOrder,
    setSelectedTable,
    setCurrentRoom,
    showToast,
  });
  const { isReassigning } = reassignApi;

  // Stabiliser la référence des initialLines pour éviter les re-renders inutiles
  const initialLines = useMemo(() => selectedOrder?.lines || [], [selectedOrder?.id, selectedOrder?.lines]);

  const isSavingOrderRef = useRef<boolean | { savedOrder: any }>(false);
  const cameFromDetailViewRef = useRef<boolean>(false);

  // Hook pour gérer les OrderLines (remplace toute la logique manuelle)
  const orderLinesManager = useOrderLinesManager({
    initialLines,
    mode: orderCreatedFromStart ? 'create' : 'edit',
    orderId: selectedOrder?.id,
    tableId: selectedTableId ?? undefined,
    onSuccess: (updatedOrder) => {
      isSavingOrderRef.current = { savedOrder: updatedOrder };
      showToast('Commande mise à jour avec succès', 'success');
      setShowOrderForm(false);

      // En mode cards, associer l'order nouvellement créé au state
      if (isCardsMode && updatedOrder?.id) {
        setSelectedCardOrderId(updatedOrder.id);
      }

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
      setSelectedCardOrderId(null);
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

  const handleCreateOrderCards = useCallback(() => {
    cameFromDetailViewRef.current = false;
    setOrderCreatedFromStart(true);
    setOrderModalTitle('Nouvelle commande');
    setShowOrderForm(true);
  }, []);

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

  const handleCardPress = useCallback((order: any) => {
    setSelectedCardOrderId(order.id);
    setShowOrderDetail(true);
  }, []);

  // Reset quand l'ordre disparaît (ex: backend supprime l'ordre vide après suppression du dernier article)
  useEffect(() => {
    if (showOrderDetail && !selectedOrder && !isSavingOrderRef.current && !isReassigning) {
      setShowOrderDetail(false);
      setSelectedTable(null);
      setSelectedCardOrderId(null);
    }
  }, [showOrderDetail, selectedOrder, setSelectedTable, isReassigning]);

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
    if (isCardsMode) {
      setOrderModalTitle('Commande');
    } else {
      setOrderModalTitle(`${currentRoom?.name || 'Salle'} - ${selectedOrder?.table?.name || selectedTable?.name || 'Table'}`);
    }
    setShowOrderForm(true);
  }, [selectedOrder, selectedTable, currentRoom, isCardsMode]);

  const selectedOrderDetailId = selectedOrder?.id;
  const handleNoteChange = useCallback(async (note: string) => {
    if (!selectedOrderDetailId) return;
    try {
      await updateOrder(selectedOrderDetailId, { note });
    } catch (error) {
      showApiError(error, showToast, 'Erreur lors de la sauvegarde de la note');
    }
  }, [selectedOrderDetailId, updateOrder, showToast]);

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
    setSelectedCardOrderId(null);
    setShowTerminateDialog(false);
  }, [setSelectedTable, setShowTerminateDialog]);

  const navigateToRoomEdit = useCallback(() => {
    if (!currentRoom) return;
    router.push('/(admin)/room/edition-mode');
  }, [currentRoom]);

  // Mesure du conteneur de la room pour le zoom auto-fill
  const { dimensions: roomContainerDimensions, onLayout: handleRoomContainerLayout } = useContainerLayout();

  const handleCreateFirstRoom = useCallback(() => {
    router.push('/(admin)/room/edition-mode?openCreate=1');
  }, []);

  // PaymentView en pleine page
  if (showPaymentView && selectedOrder) {
    return (
      <PaymentView
        order={selectedOrder}
        tableName={selectedOrder.table?.name || selectedTable?.name || 'Commande'}
        onBack={handleBackFromPayment}
        onPaymentComplete={handlePaymentComplete}
        onTerminate={handleTerminateFromPayment}
      />
    );
  }

  // OrderLinesForm en pleine page
  if (showOrderForm && (selectedOrder || orderCreatedFromStart)) {
    return (
      <View style={styles.columnLayout}>
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
    );
  }

  // OrderDetail en pleine page (rooms ou cards)
  if (showOrderDetail && selectedOrder) {
    const detailTitle = selectedOrder.table?.name
      ? `Commande - ${selectedOrder.table.name}`
      : 'Commande';
    return (
      <OrderDetail
        order={selectedOrder}
        itemTypes={allItemTypes}
        sidePanelWidth={width / 3}
        title={detailTitle}
        onEdit={handleEditOrder}
        onPayment={handlePayment}
        onClose={handleCloseOrderDetail}
        onNoteChange={handleNoteChange}
        orderActions={orderActions}
        lineActions={lineActions}
        reassignApi={!isCardsMode ? { ...reassignApi, rooms: activeRooms, enrichedTables } : undefined}
      />
    );
  }

  // Layout principal — AppHeader unifié + vue rooms ou cards
  const showRoomTabs = roomEnabled && activeRooms.length > 0 && !isCardsMode;

  return (
    <View style={styles.flex1}>
      <View style={styles.mainContentContainer}>
        <AppHeader
          tabs={showRoomTabs ? activeRooms.map((room) => {
            const count = orderCountByRoom[room.id] || 0;
            return (
              <Pressable key={room.id} onPress={() => handleChangeRoom(room)}>
                {({ pressed }) => (
                  <View style={pressed ? styles.roomTabPressed : undefined}>
                    <TabBadgeItem
                      name={room.name}
                      stats={`${count} commande${count !== 1 ? 's' : ''}`}
                      isActive={room.id === currentRoom?.id}
                      activeColor={room.color || colors.brand.accent}
                    />
                  </View>
                )}
              </Pressable>
            );
          }) : undefined}
          rightSlot={
            <>
              {roomEnabled && (
                <ViewModeToggle
                  options={[
                    { value: 'rooms', icon: LayoutDashboard },
                    { value: 'orders', icon: LayoutGrid },
                  ]}
                  value={serviceViewMode}
                  onChange={setServiceViewMode}
                  showSeparator
                  bordered
                />
              )}
              {roomEnabled ? (
                <HeaderActionButton label="MODE ÉDITION" onPress={navigateToRoomEdit} />
              ) : (
                <HeaderActionButton label="NOUVELLE COMMANDE" onPress={handleCreateOrderCards} />
              )}
            </>
          }
        />

        {appLoading || !appInitialized ? (
          <View style={styles.loadingContainer}>
            <Text>Chargement des salles...</Text>
          </View>
        ) : isCardsMode ? (
          <OrdersBoard
            allOrders={allStoreOrders}
            onOrderPress={handleCardPress}
            onCreateOrder={!roomEnabled ? handleCreateOrderCards : undefined}
          />
        ) : activeRooms.length === 0 ? (
          <EmptyRoomsState onCreateFirstRoom={handleCreateFirstRoom} />
        ) : (
          <View style={styles.normalLayoutContainer}>
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
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  roomTabPressed: {
    opacity: 0.6,
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
  roomDisabledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  roomDisabledTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[500],
    marginTop: 8,
  } as any,
  roomDisabledSubtitle: {
    fontSize: 14,
    color: colors.neutral[400],
    textAlign: 'center',
  } as any,
  normalLayoutContainer: {
    flex: 1,
    zIndex: 1,
  },
});
