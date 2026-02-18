import { ScrollView, View, useWindowDimensions, StyleSheet } from "react-native";
import { SidePanel } from "~/components/SidePanel";
import { Text } from "~/components/ui";
import RoomComponent from '~/components/Room/Room';
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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
import { ForkModal } from '~/components/ui';
import { Status } from '~/types/status.enum';

export default function ServicePage() {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderCreatedFromStart, setOrderCreatedFromStart] = useState<boolean>(false);
  const [orderModalTitle, setOrderModalTitle] = useState<string>('');
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignRoomId, setReassignRoomId] = useState<string | null>(null);
  const [isReassigning, setIsReassigning] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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
    deleteCurrentOrder,
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
    updateOrderStatus,
    deleteOrder,
    deleteOrderLine,
    showToast,
    onCleanup: handleOrderCleanup,
  });

  // Stabiliser la référence des initialLines pour éviter les re-renders inutiles
  const initialLines = useMemo(() => selectedTableOrder?.lines || [], [selectedTableOrder?.id, selectedTableOrder?.lines]);

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
        setSelectedTable(null);
      };
    }, [setSelectedTable])
  );

  const handleChangeRoom = useCallback((room: any) => {
    setSelectedTable(null);
    setCurrentRoom(room.id);
  }, [setSelectedTable, setCurrentRoom]);

  const isSavingOrderRef = useRef<boolean | { savedOrder: any }>(false);
  const cameFromDetailViewRef = useRef<boolean>(false);

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
  // useEffect requis car setSelectedTable dispatche vers Redux (state externe, pas local)
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

  // Handlers pour OrderDetailView
  const handleEditOrder = useCallback(() => {
    cameFromDetailViewRef.current = true; // Marquer qu'on vient de la detail view
    setShowOrderDetail(false);
    setOrderCreatedFromStart(false);
    setOrderModalTitle(`${currentRoom?.name || 'Salle'} - ${selectedTableOrder?.table?.name || selectedTable?.name || 'Table'}`);
    setShowOrderModal(true);
  }, [selectedTableOrder, selectedTable, currentRoom]);

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
            />
          </View>

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
                    onOrderDelete={deleteCurrentOrder}
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
                      onDeleteOrderLine={handleDeleteLine}
                      onDeleteMenuLine={handleDeleteLine}
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
                    onPress={(room) => setReassignRoomId(room.id)}
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
});