import React from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { SidePanel } from "~/components/SidePanel";
import { Badge, Button, ConfirmDialog, ForkModal, PopoverButton, Tabs, TabsContent, TabsList, TabsTrigger, Text, TextInput } from "~/components/ui";
import RoomComponent from '~/components/Room/Room';
import { useEffect, useState } from "react";
import { Table } from "~/types/table.types";
import { Grid3X3Icon, ListFilter, Minus, Plus } from "lucide-react-native";
import OrderList from "~/components/Service/OrderList";
import StartOrderCard from "~/components/Service/StartOrderCard";
import { Status } from "~/types/status.enum";
import OrderDetailView from "~/components/Service/OrderDetailView";
import { OrderItem } from '~/types/order-item.types';
import { router } from 'expo-router';
import { useToast } from '~/components/ToastProvider';
import {
  useRestaurant,
  useRestaurantInit,
  useRooms,
  useMenu,
  useTables,
  useOrders
} from '~/hooks/useRestaurant';
import { CustomModal } from '@/components/CustomModal';
import OrderItemsForm from '@/components/form/OrderItemsForm';
import { Order } from '@/types/order.types';

export default function ServicePage() {
  const [isOrderModalVisible, setIsOrderModalVisible] = useState<boolean>(false);
  const [orderCreatedFromStart, setOrderCreatedFromStart] = useState<boolean>(false);
  // Hooks spécialisés pour chaque domaine
  const { rooms, currentRoom, setCurrentRoom } = useRooms();
  console.log('Rooms:', rooms);
  const { currentRoomTables, selectedTableId, selectedTable, setSelectedTable } = useTables();
  const {
    currentRoomOrders,
    selectedTableOrder,
    createOrder,
    updateOrder,
    deleteOrder,
    createOrderItem,
    deleteOrderItem,
    updateOrderItemStatus
  } = useOrders();
  const { items: allItems, itemTypes: allItemTypes } = useMenu();

  console.log('Selected table:', selectedTable)

  // État global
  const { isLoading } = useRestaurant();

  // État local de l'interface seulement
  const [menuTabsValue, setMenuTabsValue] = useState<string>('');
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showReassignModal, setShowReassignModal] = useState<boolean>(false);
  const [showDeleteOrderDialog, setShowDeleteOrderDialog] = useState<boolean>(false);

  const { showToast } = useToast();

  // Initialiser le premier type d'article comme onglet par défaut
  useEffect(() => {
    if (allItemTypes.length > 0 && !menuTabsValue) {
      setMenuTabsValue(allItemTypes[0].id);
    }
  }, [allItemTypes, menuTabsValue]);

  const handleChangeRoom = (room: any) => {
    setSelectedTable(null);
    setCurrentRoom(room.id);
  };

  const handleTablePress = (table: Table | null) => {
    if (!table) return;

    // Supprimer les commandes vides si on change de table
    if (selectedTableId && selectedTableOrder && (!selectedTableOrder.orderItems || selectedTableOrder.orderItems.length === 0)) {
      try {
        deleteOrder(selectedTableOrder.id);
      } catch (error) {
        console.error('Failed to delete empty order:', error);
      }
    }

    setSelectedTable(table.id);
  };

  const handleCreateOrder = async () => {
    try {
      if (!selectedTableId) {
        showToast('Veuillez sélectionner une table avant de créer une commande.', 'warning');
        return;
      }
      const existingOrder = currentRoomOrders.find(order => order.tableId === selectedTableId);
      if (existingOrder) {
        showToast('Une commande existe déjà pour cette table.', 'warning');
        return;
      }

      await createOrder(selectedTableId);
      setShowMenu(true);
      showToast('Commande créée avec succès.', 'success');
    } catch (error) {
      showToast('Erreur lors de la création de la commande. Veuillez réessayer.', 'error');
      console.error(error);
    }
  };

  const handleContinueOrder = (order: Order) => {
    setSelectedTable(order.tableId);
    setOrderCreatedFromStart(false); // Cette commande existait déjà
    setIsOrderModalVisible(true);
  };

  const handleOpenOrderModal = () => {
    setOrderCreatedFromStart(false); // Modal ouverte depuis le bouton "Modifier"
    setIsOrderModalVisible(true);
  };

  const handleCloseOrderModal = async () => {
    // Cette fonction est appelée SEULEMENT quand l'utilisateur ferme manuellement la modal
    // ou appuie sur "Annuler"
    if (selectedTableOrder && orderCreatedFromStart && selectedTableOrder.orderItems.length === 0) {
      try {
        await deleteOrder(selectedTableOrder.id);
        showToast('Commande annulée car aucun article n\'a été ajouté.', 'info');
      } catch (error) {
        console.error('Erreur lors de la suppression de la commande vide:', error);
      }
    }

    setIsOrderModalVisible(false);
    setOrderCreatedFromStart(false);
  };

  const handleSaveOrder = async (updatedOrder: Order) => {
    try {
      updateOrder(updatedOrder);

      // Fermer la modal directement sans passer par handleCloseOrderModal
      // pour éviter la logique de suppression
      setIsOrderModalVisible(false);
      setOrderCreatedFromStart(false);

      showToast('Commande mise à jour avec succès.', 'success');
    } catch (error) {
      showToast('Erreur lors de la mise à jour de la commande.', 'error');
      console.error(error);
    }
  };
  const getItemQuantity = (itemId: string) => {
    if (!selectedTableOrder) return 0;
    return selectedTableOrder.orderItems.filter(orderItem => orderItem.item.id === itemId).length;
  };

  const onUpdateQuantity = async (itemId: string, action: 'remove' | 'add') => {
    if (!selectedTableOrder) {
      showToast('Veuillez d\'abord créer une commande.', 'warning');
      return;
    }

    const item = allItems.find(item => item.id === itemId);
    if (!item) {
      showToast('L\'article sélectionné n\'existe pas.', 'error');
      return;
    }

    try {
      if (action === 'add') {
        // Utiliser l'action Redux au lieu de l'appel API direct
        await createOrderItem(selectedTableOrder.id, item.id, Status.DRAFT);
      } else if (action === 'remove') {
        const orderItem = selectedTableOrder.orderItems.find(orderItem => orderItem.item.id === itemId);
        if (!orderItem) return;
        // Utiliser l'action Redux au lieu de l'appel API direct
        await deleteOrderItem(orderItem.id);
      }
      showToast(`Quantité ${action === 'add' ? 'ajoutée' : 'retirée'} avec succès.`, 'success');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la quantité:', error);
      showToast('Erreur lors de la mise à jour de la quantité.', 'error');
    }
  };

  const handleStatusUpdate = async (orderItems: OrderItem[], status: Status) => {
    if (!selectedTableOrder) {
      showToast('Aucune commande sélectionnée.', 'warning');
      return;
    }

    try {
      const orderItemsIds = orderItems.map(orderItem => orderItem.id);
      // Utiliser l'action Redux au lieu de l'appel API direct
      await updateOrderItemStatus(orderItemsIds, status);
      showToast('Statut mis à jour avec succès.', 'success');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      showToast('Erreur lors de la mise à jour du statut.', 'error');
    }
  };

  const handleDeleteOrder = async () => {
    if (!selectedTableOrder) return;

    try {
      await deleteOrder(selectedTableOrder.id);
      setSelectedTable(null);
      showToast('Commande supprimée avec succès.', 'success');
    } catch (error) {
      console.error('Erreur lors de la suppression de la commande:', error);
      showToast('Erreur lors de la suppression de la commande.', 'error');
    }
  };

  const navigateToRoomEdit = () => {
    if (!currentRoom) return;
    router.push({
      pathname: "/(admin)/room_edition",
      params: { roomId: currentRoom.id }
    });
  };

  // Fonction pour déterminer si une table avec commande est sélectionnée
  const isTableWithOrderSelected = () => {
    return selectedTable && selectedTableOrder && selectedTableOrder.orderItems && selectedTableOrder.orderItems.length > 0;
  };

  // Fonction pour gérer la déselection de table
  const handleDeselectTable = () => {
    setSelectedTable(null);
  };

  const { width, height } = useWindowDimensions();

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <SidePanel
        style={{ flex: 1 }}
        hideCloseButton={true}
        width={width / 4}
        showCloseButtonWhenTableSelected={!!isTableWithOrderSelected()}
        title={selectedTableOrder ? `Commande ${selectedTableOrder.table.name}` : 'Service'}
        onBack={handleDeselectTable}
      >
        {selectedTableOrder ? (
          <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between' }}>
            <OrderDetailView order={selectedTableOrder} itemTypes={allItemTypes} onStatusUpdate={handleStatusUpdate} />
            <View style={{ padding: 16 }}>
              <PopoverButton
                style={{ backgroundColor: '#2A2E33' }}
                className='w-full h-[50px]'
                variant="default"
                side="top"
                triggerContent={<Text>PLUS D'ACTION</Text>}
                popoverContent={
                  <View className="gap-4">
                    <View className="gap-2">
                      <Button variant="outline" onPress={() => setShowReassignModal(true)}>
                        <Text>Assigner une autre table</Text>
                      </Button>
                      <Button variant="outline" onPress={() => console.log('Régler la note')}>
                        <Text>Régler la note</Text>
                      </Button>
                      <Button variant="destructive" onPress={() => setShowDeleteOrderDialog(true)}>
                        <Text>Supprimer la commande</Text>
                      </Button>
                    </View>
                  </View>
                }
              />
              <Button
                onPress={handleOpenOrderModal}
                className="w-full h-[50px] flex items-center justify-center mt-2"
                style={{ backgroundColor: '#2A2E33' }}
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
                  Modifier la commande
                </Text>
              </Button>
            </View>
          </View>
        ) : (
          <View style={{ padding: 16, flex: 1 }}>
            {isLoading ? (
              <Text>Chargement...</Text>
            ) : (
              <>
                <View className='flex-row justify-between items-center'>
                  <Button className="rounded-full p-2" variant='outline'>
                    <Grid3X3Icon color='black' />
                  </Button>
                  <TextInput className="mx-2 rounded-full" style={{ flex: 1, height: 40 }} placeholder="Rechercher..." />
                  <Button className="rounded-full p-2" variant='outline'>
                    <ListFilter color='black' />
                  </Button>
                </View>
                <OrderList
                  orders={currentRoomOrders}
                  onOrderPress={(order) => {
                    if (order.tableId) {
                      setSelectedTable(order.tableId);
                    }
                  }}
                  onOrderDelete={handleDeleteOrder}
                />
              </>
            )}
          </View>
        )}
      </SidePanel>

      <View style={{ flex: 1, height: '100%', position: 'relative' }}>
        <View className='flex-row w-full justify-between' style={{ backgroundColor: '#FBFBFB', height: 50 }}>
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
                  active={room.name === currentRoom?.name}
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

        {selectedTable && (
          <StartOrderCard
            table={selectedTable}
            order={selectedTableOrder ?? undefined}
            onStartPress={handleCreateOrder}
            onContinuePress={handleContinueOrder}
          />
        )}

        <RoomComponent
          tables={currentRoomTables.map(t => ({
            ...t,
            orders: t.currentOrder ? [t.currentOrder] : []
          }))}
          orders={currentRoomOrders}
          editingTableId={selectedTableId ?? undefined}
          editionMode={false}
          isLoading={isLoading}
          width={currentRoom?.width}
          height={currentRoom?.height}
          onTablePress={handleTablePress}
          onTableLongPress={handleTablePress}
          onTableUpdate={() => { }}
        />
      </View>

      {/* Modal pour l'ajout/modification de commande */}
      <CustomModal
        isVisible={isOrderModalVisible}
        onClose={handleCloseOrderModal}
        width={700}
        height={650}
        title={selectedTableOrder ? `Modifier la commande - ${selectedTableOrder.table.name}` : "Créer une commande"}
      >
        {selectedTableOrder && (
          <OrderItemsForm
            order={selectedTableOrder}
            items={allItems}
            itemTypes={allItemTypes}
            onSave={handleSaveOrder}
            onCancel={handleCloseOrderModal}
          />
        )}
      </CustomModal>

      {selectedTableOrder && showDeleteOrderDialog && (
        <ConfirmDialog
          open={showDeleteOrderDialog}
          onOpenChange={(value) => {
            setShowDeleteOrderDialog(value)
          }}
          title="Supprimer la commande"
          content="Êtes-vous sûr de vouloir supprimer cette commande ?"
          onCancel={() => setShowDeleteOrderDialog(false)}
          onConfirm={() => {
            setShowDeleteOrderDialog(false)
            deleteOrder(selectedTableOrder.id)
            setSelectedTable(null)
          }}
          confirmText="Supprimer"
          variant="destructive"
        />
      )}
      <ForkModal
        visible={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        maxWidth={800}
        title="Sélectionner une table"
      >
        <RoomComponent
          tables={currentRoomTables.filter(table => !table.currentOrder)}
          width={currentRoom?.width}
          height={currentRoom?.height}
          editionMode={false}
          isLoading={isLoading}
          onTablePress={async (pressedTable: Table | null) => {
            if (pressedTable && selectedTableOrder) {
              try {
                // TODO: Implémenter la réassignation de table
                setSelectedTable(pressedTable.id);
                setShowReassignModal(false);
                showToast('Table réassignée avec succès.', 'success');
              } catch (error) {
                console.error('Erreur lors de la réassignation:', error);
                showToast('Erreur lors de la réassignation.', 'error');
              }
            }
          }}
          onTableLongPress={async (pressedTable: Table | null) => {
            if (pressedTable && selectedTableOrder) {
              try {
                // TODO: Implémenter la réassignation de table
                setSelectedTable(pressedTable.id);
                setShowReassignModal(false);
                showToast('Table réassignée avec succès.', 'success');
              } catch (error) {
                console.error('Erreur lors de la réassignation:', error);
                showToast('Erreur lors de la réassignation.', 'error');
              }
            }
          }}
          onTableUpdate={() => { }}
        />
      </ForkModal>
    </View>
  );
}