import React from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { SidePanel } from "~/components/SidePanel";
import { Badge, Button, ConfirmDialog, ForkModal, PopoverButton, Tabs, TabsContent, TabsList, TabsTrigger, Text, TextInput } from "~/components/ui";
import RoomComponent from '~/components/Room/Room';
import { useEffect, useState } from "react";
import { Room } from "~/types/room.types";
import { Table } from "~/types/table.types";
import { roomApiService } from "~/api/room.api";
import { useFilter } from "~/hooks/useFilter";
import { orderApiService } from "~/api/order.api";
import { Order } from "~/types/order.types";
import { FilterConfig } from "~/hooks/useFilter/types";
import { itemApiService } from "~/api/item.api";
import { Item } from "~/types/item.types";
import { Grid3x3 as Grid3X3Icon, ListFilter } from "lucide-react-native";
import OrderList from "~/components/Service/OrderList";
import StartOrderCard from "~/components/Service/StartOrderCard";
import { Status } from "~/types/status.enum";
import { ItemType } from "~/types/item-type.types";
import { itemTypeApiService } from "~/api/item-type.api";
import { orderItemApiService } from "~/api/order-item.api";
import OrderDetailView from "~/components/Service/OrderDetailView";
import { OrderItem } from '~/types/order-item.types';
import { getMostImportantStatus } from '~/lib/utils';
import { useSocket } from '~/hooks/useSocket';
import { EventType } from '~/hooks/useSocket/types';
import { router } from 'expo-router';
import { useToast } from '~/components/ToastProvider';
import { CustomModal } from "~/components/CustomModal";
import OrderItemsForm from "~/components/form/OrderItemsForm";

export default function ServicePage () {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState<boolean>(true);
  const [showReassignModal, setShowReassignModal] = useState<boolean>(false);
  const [showDeleteOrderDialog, setShowDeleteOrderDialog] = useState<boolean>(false);
  const [isOrderModalVisible, setIsOrderModalVisible] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [orderCreatedFromStart, setOrderCreatedFromStart] = useState<boolean>(false);

  const { showToast } = useToast();

  useEffect(() => {
    initData();
  }, []);

  const filterOrderConfig: FilterConfig<Order>[] = [
    { 
      field: 'status', 
      type: 'text',
      label: 'Statut',
      operator: 'not in',
      show: false
    },
    { 
      field: 'table.roomId', 
      type: 'text',
      label: 'Table',
      operator: '=',
      show: false
    },
  ];

  const { updateFilter: updateOrderFilter, loading: ordersLoading } = useFilter<Order>({
    config: filterOrderConfig,
    service: orderApiService,
    defaultParams: { sort: { field: 'updatedAt', direction: 'asc' }, perPage: 100 },
    onDataChange: (response) => setOrders(response.data),
    loadOnMount: false
  });

  const filterItemConfig: FilterConfig<Item>[] = [
    { 
      field: 'itemTypeId', 
      type: 'text',
      label: 'ItemType',
      operator: '=',
      show: false
    },
  ];

  const { updateFilter: updateItemFilter, loading: itemsLoading } = useFilter<Item>({
    config: filterItemConfig,
    service: itemApiService,
    defaultParams: { page: 1, perPage: 100 },
    onDataChange: (response) => setItems(response.data)
  });

  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected || !socket) return;
    const handleUpdateOrdersStatus = (orderItemIds: string[], status: Status) => {
      setOrders(prevOrders => {
        const newOrders = prevOrders.map(order => {
          const updatedOrderItems = order.orderItems.map(orderItem => {
            if (orderItemIds.includes(orderItem.id)) {
              return { ...orderItem, status: status };
            }
            return orderItem;
          });
          return { ...order, orderItems: updatedOrderItems, status: getMostImportantStatus(updatedOrderItems.map(orderItem => orderItem.status)) };
        });
  
        setTables(prevTables => prevTables.map(table => {
          const order = newOrders.find(order => order.tableId === table.id);
          return order ? { ...table, orders: [order] } : table;
        }));
  
        return newOrders;
      });
    }
    socket.on(EventType.ORDER_ITEMS_INPROGRESS, ({ orderItemIds }) => handleUpdateOrdersStatus(orderItemIds, Status.INPROGRESS));
    socket.on(EventType.ORDER_ITEMS_READY, ({ orderItemIds }) => handleUpdateOrdersStatus(orderItemIds, Status.READY));
    return () => {
      socket.off(EventType.ORDER_ITEMS_INPROGRESS);
      socket.off(EventType.ORDER_ITEMS_READY);
  };
  }, [isConnected, socket]);

  const initData = async () => {
    try {
      setLoading(true);
      const { data: rooms } = await roomApiService.getAll();
      const { data: itemTypes } = await itemTypeApiService.getAll();
      setRooms(rooms)
      setItemTypes(itemTypes)
      if (!rooms.length) return
      setCurrentRoom(rooms[0])
      updateOrderFilter('table.roomId', rooms[0].id, '=')
      setTables(rooms[0]?.tables || [])
    } catch (err) {;
      console.error(err);
      showToast('Erreur lors du chargement des données. Veuillez réessayer plus tard.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRoom = (room: Room) => {
    setCurrentOrder(null)
    setCurrentRoom(room)
    setTables(room.tables)
    updateOrderFilter('table.roomId', room.id, '=')
  }

  const handleTablePress = (table: Table | null) => {
    if (selectedTable && currentOrder && currentOrder.orderItems.length === 0) {
      try {
        deleteOrder(currentOrder)
      } catch (error) {
          console.error('Failed to delete empty order:', error);
      }
    }
    setSelectedTable(table)
    setCurrentOrder(orders.find(order => order.tableId === table?.id) || null)
  }

  const createOrder = async () => {
    try {
      if (!selectedTable) {
        showToast('Veuillez sélectionner une table avant de créer une commande.', 'warning');
        return;
      };
      const existingOrder = orders.find(order => order.tableId === selectedTable.id);
      if (existingOrder) {
        showToast('Une commande existe déjà pour cette table.', 'warning');
        throw new Error('An order already exists for this table.');
      }

      const order = await orderApiService.create({ tableId: selectedTable.id, table: selectedTable, orderItems: [], status: Status.DRAFT });
      setCurrentOrder(order)
      setIsOrderModalVisible(true)
      setOrderCreatedFromStart(true) // Marquer que cette commande vient d'être créée
      setOrders([...orders, order])
      showToast('Commande créée avec succès.', 'success');
    } catch (error) {
      showToast('Erreur lors de la création de la commande. Veuillez réessayer.', 'error');
      console.error(error);
    }
  }

  const handleContinueOrder = (order: Order) => {
    setCurrentOrder(order);
    setSelectedTable(order.table);
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
    if (currentOrder && orderCreatedFromStart && currentOrder.orderItems.length === 0) {
      try {
        await deleteOrder(currentOrder);
        setCurrentOrder(null);
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
      setCurrentOrder(updatedOrder);
      setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      
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

  const updateOrder = (order: Order) => {
    setSelectedTable(order.table)
    setCurrentOrder(order)
    setOrders(orders.map(o => o.id === order.id ? order : o))
  }

  const deleteOrder = async (order: Order) => {
    try {
      await orderApiService.delete(order.id);
      // Mettre à jour la liste des commandes en supprimant celle qui vient d'être supprimée
      setOrders(prevOrders => prevOrders.filter(o => o.id !== order.id));
      updateOrderFilter('table.roomId', currentRoom?.id, '=')
      showToast('Commande supprimée avec succès.', 'success');
    } catch (error) {
      console.error(error);
    }
  }

  const handleStatusUpdate = async (orderItems: OrderItem[], status: Status) => {
    if (!currentOrder) {
      showToast('Aucune commande sélectionner.', 'warning');
      return;
    };
    const orderItemsIds = orderItems.map(orderItem => orderItem.id);
    await orderItemApiService.updateManyStatus(orderItemsIds, status);
    const updatedItems = currentOrder?.orderItems.map(orderItem => {
      if (orderItems.includes(orderItem)) {
        return { ...orderItem, status };
      }
      return orderItem;
    });
    const mostImportantStatus = getMostImportantStatus(updatedItems.map(orderItem => orderItem.status));
    const updatedOrder = await orderApiService.update(currentOrder.id, {
      status: mostImportantStatus
    });
    updateOrder(updatedOrder);
  }

  const navigateToRoomEdit = () => {
    if (!currentRoom) return;
    router.push({
      pathname: "/(admin)/room_edition",
      params: { roomId: currentRoom.id }
    });
  };

  // Fonction pour déterminer si une table avec commande est sélectionnée
  const isTableWithOrderSelected = () => {
    return selectedTable && currentOrder && currentOrder.orderItems && currentOrder.orderItems.length > 0;
  };

  // Fonction pour gérer la déselection de table
  const handleDeselectTable = () => {
    setSelectedTable(null);
    setCurrentOrder(null);
  };

  const { width, height } = useWindowDimensions();

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <SidePanel
        style={{ flex: 1}}
        hideCloseButton={true}
        width={width / 4}
        showCloseButtonWhenTableSelected={!!isTableWithOrderSelected()}
        title={currentOrder ? `Commande ${currentOrder.table.name}` : 'Service'}
        onBack={handleDeselectTable}
      >
      {currentOrder ? (
        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between'}}>
          <OrderDetailView order={currentOrder} itemTypes={itemTypes} onStatusUpdate={handleStatusUpdate} />
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
          {loading ? (
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
              <OrderList orders={orders} onOrderPress={updateOrder} onOrderDelete={deleteOrder} />
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
            onPress={() =>  navigateToRoomEdit()}
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
            order={orders.find(order => order.tableId === selectedTable.id)}
            onStartPress={createOrder}
            onContinuePress={handleContinueOrder}
          />
        )}
        <RoomComponent
          tables={tables}
          orders={orders}
          editingTableId={selectedTable?.id}
          editionMode={false}
          isLoading={loading}
          width={currentRoom?.width}
          height={currentRoom?.height}
          onTablePress={handleTablePress}
          onTableLongPress={handleTablePress}
          onTableUpdate={() => {}}
        />
      </View>

      {/* Modal pour l'ajout/modification de commande */}
      <CustomModal
        isVisible={isOrderModalVisible}
        onClose={handleCloseOrderModal}
        width={700}
        height={650}
        title={currentOrder ? `Modifier la commande - ${currentOrder.table.name}` : "Créer une commande"}
      >
        {currentOrder && (
          <OrderItemsForm
            order={currentOrder}
            items={items}
            itemTypes={itemTypes}
            onSave={handleSaveOrder}
            onCancel={handleCloseOrderModal}
          />
        )}
      </CustomModal>

      {currentOrder && showDeleteOrderDialog && (
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
            deleteOrder(currentOrder)
            setCurrentOrder(null)
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
          tables={tables.filter(table => !orders.find(order => order.tableId === table.id))}
          width={currentRoom?.width}
          height={currentRoom?.height}
          editionMode={false}
          isLoading={loading}
          onTablePress={async (pressedTable: Table | null) => {
            if (pressedTable) {
              let newCurrentOrder = orders.find(order => order.tableId === pressedTable.id)
              if (!newCurrentOrder && currentOrder) {
                newCurrentOrder = await orderApiService.update(currentOrder.id, { tableId: pressedTable.id, status: currentOrder.status })
                setCurrentOrder(newCurrentOrder)
                setOrders(orders.map(order => order.id === currentOrder.id ? newCurrentOrder! : order))
                setSelectedTable(pressedTable)
              }
              setShowReassignModal(false)
            }
          }}
          onTableLongPress={async (pressedTable: Table | null) => {
            if (pressedTable) {
              let newCurrentOrder = orders.find(order => order.tableId === pressedTable.id)
              if (!newCurrentOrder && currentOrder) {
                newCurrentOrder = await orderApiService.update(currentOrder.id, { tableId: pressedTable.id, status: currentOrder.status })
                setCurrentOrder(newCurrentOrder)
                setOrders(orders.map(order => order.id === currentOrder.id ? newCurrentOrder! : order))
                setSelectedTable(pressedTable)
              }
              setShowReassignModal(false)
            }
          }}
          onTableUpdate={() => {}}
        />
      </ForkModal>
    </View>
  );
}