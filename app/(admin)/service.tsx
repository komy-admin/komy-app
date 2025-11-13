import React from 'react';
import { Pressable, ScrollView, View, useWindowDimensions, Platform } from "react-native";
import { SidePanel } from "~/components/SidePanel";
import { Badge, Text, Button } from "~/components/ui";
import RoomComponent from '~/components/Room/Room';
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { Table } from "~/types/table.types";
import OrderList from "~/components/Service/OrderList";
import { SearchBar } from "~/components/Service/SearchBar";
import { useOrderFilters } from "~/hooks/useOrderFilters";
import StartOrderCard from "~/components/Service/StartOrderCard";
import { router } from 'expo-router';
import { useToast } from '~/components/ToastProvider';
import {
  useRestaurant,
  useMenu,
  useTables,
  useOrders
} from '~/hooks/useRestaurant';
import { useSelector } from 'react-redux';
import { selectAppInitialized, selectIsAppInitializing } from '~/store/slices/session.slice';
import { OrderLinesForm, OrderLinesHeader, OrderLinesButton } from '~/components/order/OrderLinesForm';
import { Plus, LayoutDashboard } from 'lucide-react-native';
import { useOrderLinesManager } from '~/hooks/order/useOrderLinesManager';
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
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
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



  const handleChangeRoom = (room: any) => {
    setSelectedTable(null);
    setCurrentRoom(room.id);
  };

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

  const handleCreateOrder = () => {
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
    setOrderModalTitle(`Prendre la commande - ${selectedTable?.name}`);
    setShowOrderModal(true); // Ouvrir la modal
  };




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

  const handleDeleteOrder = async () => {
    if (!selectedTableOrder) return;

    try {
      await deleteOrder(selectedTableOrder.id);
      setSelectedTable(null);
      setShowOrderDetail(false);
      showToast('Commande supprimée avec succès.', 'success');
    } catch (error) {
      showToast('Erreur lors de la suppression de la commande.', 'error');
    }
  };

  // Handlers pour OrderDetailView
  const handleEditOrder = useCallback(() => {
    cameFromDetailViewRef.current = true; // Marquer qu'on vient de la detail view
    setShowOrderDetail(false);
    setOrderCreatedFromStart(false);
    setOrderModalTitle(selectedTableOrder ? `Modifier la commande - ${selectedTableOrder.table?.name || selectedTable?.name || 'Table'}` : "Modifier la commande");
    setShowOrderModal(true);
  }, [selectedTableOrder, selectedTable]);

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
      if (table.roomId !== reassignRoomId) return false;
      // Exclure la table qui a déjà la commande
      const tableOrder = table.orders?.[0];
      return tableOrder?.id !== selectedTableOrder?.id;
    });
  }, [reassignRoomId, enrichedTables, selectedTableOrder]);

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

  const navigateToRoomEdit = () => {
    if (!currentRoom) return;
    router.push('/(admin)/room/edition-mode');
  };

  const handleDeselectTable = () => {
    setSelectedTable(null);
  };

  const { width } = useWindowDimensions();
  // Fonction pour rediriger vers room_list avec création automatique
  const handleCreateFirstRoom = () => {
    router.push('/(admin)/room/create');
  };

  return (
    <View style={{ flex: 1 }}>
      {/* OrderLinesForm en pleine page - remplace tout le layout */}
      {showOrderModal && (selectedTableOrder || orderCreatedFromStart) ? (
        <View style={{ flex: 1, flexDirection: 'column' }}>
          {/* Header avec titre et bouton retour - masqué pendant la configuration de menu */}
          <OrderLinesHeader
            title={orderModalTitle}
            onClose={handleSmartCloseOrderModal}
            isVisible={!isConfiguringMenu}
          />

          {/* OrderLinesForm */}
          <View style={{ flex: 1 }}>
            <OrderLinesForm
              lines={orderLinesManager.orderLines}
              items={allItems.filter(item => item.isActive)}
              itemTypes={allItemTypes}
              onAddItem={orderLinesManager.addItem}
              onUpdateItem={orderLinesManager.updateItem}
              onAddMenu={orderLinesManager.addMenu}
              onUpdateMenu={orderLinesManager.updateMenu}
              onDeleteLine={orderLinesManager.deleteLine}
              onClearAll={orderLinesManager.clearAllLines}
              onConfigurationModeChange={handleConfigurationModeChange}
              onConfigurationActionsChange={handleConfigurationActionsChange}
            />
          </View>

          {/* Boutons d'action */}
          {!isConfiguringMenu && (
            <View style={{
              backgroundColor: '#ffffff',
              borderTopWidth: 1,
              borderTopColor: '#e5e7eb',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              padding: 16,
              gap: 12
            }}>
              <OrderLinesButton
                variant="secondary"
                onPress={handleSmartCloseOrderModal}
              >
                Annuler
              </OrderLinesButton>
              <OrderLinesButton
                variant="primary"
                onPress={orderLinesManager.save}
                disabled={!orderLinesManager.hasChanges || orderLinesManager.isProcessing}
                flex={2}
              >
                {orderLinesManager.isProcessing ? 'Sauvegarde...' : 'Sauvegarder'}
              </OrderLinesButton>
            </View>
          )}

          {/* Boutons de configuration de menu */}
          {isConfiguringMenu && menuConfigActions && (
            <View style={{
              backgroundColor: '#ffffff',
              borderTopWidth: 1,
              borderTopColor: '#e5e7eb',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              padding: 16,
              gap: 12
            }}>
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
            width={width / 4}
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

          <View style={{ flex: 1, height: '100%', position: 'relative' }}>
            {/* Header avec tabs des rooms - seulement si il y a des rooms et pas en mode detail/edit */}
            {rooms.length > 0 && !showOrderDetail && !showOrderModal && (
              <View className='flex-row w-full justify-between' style={{
                backgroundColor: '#FBFBFB',
                height: 50,
                zIndex: 10,
                elevation: 5,
                ...Platform.select({
                  android: {
                    shadowColor: 'transparent', // Pas d'ombre visible sur Android
                  },
                }),
              }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    alignItems: 'center',
                    height: '100%'
                  }}
                  className='flex-row p-2 flex-1'
                >
                  {rooms.map((room, index) => (
                    <Pressable
                      key={`${room.name}-badge-${index}`}
                      onPress={() => handleChangeRoom(room)}>
                      <Badge
                        variant="outline"
                        className='mx-1'
                        active={room.id === currentRoom?.id}
                        size='lg'
                      >
                        <Text>{room.name}</Text>
                      </Badge>
                    </Pressable>
                  ))}
                </ScrollView>
                <Button
                  onPress={() => navigateToRoomEdit()}
                  className="w-[200px] h-[50px] flex items-center justify-center"
                  style={{ backgroundColor: '#2A2E33', borderRadius: 0, height: 50 }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: '#FBFBFB',
                      fontWeight: '500',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                    }}
                  >
                    Mode édition
                  </Text>
                </Button>
              </View>
            )}

            {appInitialized && !appLoading && rooms.length === 0 ? (
              // État vide - Aucune room disponible (seulement quand l'initialisation est vraiment terminée)
              <View style={{
                backgroundColor: '#F4F5F7',
                padding: 48,
                alignItems: 'center',
                flex: 1,
                justifyContent: 'center',
              }}>
                <View style={{ marginBottom: 20 }}>
                  <LayoutDashboard size={48} color="#D1D5DB" />
                </View>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: '#2A2E33',
                  marginBottom: 12,
                  textAlign: 'center',
                  letterSpacing: 0.3,
                }}>
                  Aucune salle configurée
                </Text>
                <Text style={{
                  fontSize: 15,
                  color: '#6B7280',
                  textAlign: 'center',
                  lineHeight: 22,
                  marginBottom: 32,
                  maxWidth: 320,
                }}>
                  Pour commencer à utiliser le service, vous devez d'abord créer une salle avec des tables.
                </Text>
                <Pressable
                  onPress={handleCreateFirstRoom}
                  style={{
                    backgroundColor: '#2A2E33',
                    paddingHorizontal: 28,
                    paddingVertical: 14,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: '#2A2E33',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 6,
                    ...(Platform.OS === 'web' && {
                      cursor: 'pointer',
                    })
                  }}
                >
                  <Plus size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: '700',
                    letterSpacing: 0.4,
                  }}>
                    Créer ma première salle
                  </Text>
                </Pressable>
              </View>
            ) : appLoading || !appInitialized ? (
              // État de chargement
              <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text>Chargement des salles...</Text>
              </View>
            ) : (
              // Layout normal avec room existante
              <View style={{
                flex: 1,
                zIndex: 1,
                elevation: 0,
              }}>
                {showOrderDetail && selectedTableOrder ? (
                  // Afficher les détails de la commande
                  <View style={{ flex: 1, flexDirection: 'column' }}>
                    {/* Header avec bouton retour, sélection et modifier */}
                    <OrderDetailHeader
                      title={`Commande - ${selectedTableOrder.table?.name || 'Table'}`}
                      onBack={handleCloseOrderDetail}
                      onEdit={handleEditOrder}
                      isMultiSelectMode={isMultiSelectMode}
                      onToggleMultiSelectMode={() => setIsMultiSelectMode(!isMultiSelectMode)}
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
                      onReassignTable={handleReassignTable}
                      onPayment={handlePayment}
                      onTerminate={handleTerminate}
                      onDelete={handleDelete}
                      isMultiSelectMode={isMultiSelectMode}
                      onToggleMultiSelectMode={() => setIsMultiSelectMode(!isMultiSelectMode)}
                    />
                  </View>
                ) : (
                  // Afficher la room normalement
                  <>
                    {selectedTable && !selectedTableOrder && (
                      <StartOrderCard
                        table={selectedTable}
                        onStartPress={handleCreateOrder}
                      />
                    )}

                    <RoomComponent
                      tables={currentRoomTables}
                      orders={currentRoomOrders}
                      editingTableId={selectedTableId ?? undefined}
                      editionMode={false}
                      isLoading={loading}
                      width={currentRoom?.width}
                      height={currentRoom?.height}
                      onTablePress={handleTablePress}
                      onTableLongPress={handleTablePress}
                      onTableUpdate={() => { }}
                    />
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
        width={800}
        height={650}
        title={isReassigning ? 'Assignation en cours...' : 'Sélectionner une table'}
      >
        <View style={{ flex: 1, flexDirection: 'column' }}>
          {/* Tabs des rooms - hauteur fixe */}
          <View style={{
            height: 60,
            backgroundColor: '#F9FAFB',
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
          }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                alignItems: 'center',
                paddingHorizontal: 16,
                height: 60,
              }}
            >
              {rooms.map((room, index) => (
                <Pressable
                  key={`${room.name}-reassign-${index}`}
                  onPress={() => setReassignRoomId(room.id)}
                  style={{ marginHorizontal: 4 }}
                >
                  <Badge
                    variant="outline"
                    active={room.id === reassignRoomId}
                    size='lg'
                  >
                    <Text>{room.name}</Text>
                  </Badge>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Room - prend tout le reste */}
          <View style={{ flex: 1, padding: 20 }}>
            <RoomComponent
              tables={reassignRoomTables}
              editionMode={false}
              isLoading={loading || isReassigning}
              width={reassignRoom?.width}
              height={reassignRoom?.height}
              containerDimensions={{ width: 760, height: 540 }}
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
    </View>
  );
}