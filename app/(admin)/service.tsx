import React from 'react';
import { Pressable, ScrollView, View } from "react-native";
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
import { Grid3X3Icon, ListFilter, Minus, Plus } from "lucide-react-native";
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

export default function ServicePage () {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [menuTabsValue, setMenuTabsValue] = useState<string>('');
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showReassignModal, setShowReassignModal] = useState<boolean>(false);
  const [showDeleteOrderDialog, setShowDeleteOrderDialog] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Item[]>([]);

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
      setMenuTabsValue(itemTypes[0]?.id)
      if (!rooms.length) return
      setCurrentRoom(rooms[0])
      updateOrderFilter('table.roomId', rooms[0].id, '=')
      setTables(rooms[0]?.tables || [])
    } catch (err) {;
      console.error(err);
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
      if (!selectedTable) return;
      const existingOrder = orders.find(order => order.tableId === selectedTable.id);
      if (existingOrder) {
        throw new Error('An order already exists for this table.');
      }

      const order = await orderApiService.create({ tableId: selectedTable.id, table: selectedTable, orderItems: [], status: Status.DRAFT });
      setCurrentOrder(order)
      setShowMenu(true)
      setOrders([...orders, order])
    } catch (error) {
      console.error(error);
    }
  }

  const getItemQuantity = (itemId: string) => {
    if (!currentOrder) return 0;
    return currentOrder.orderItems.filter(orderItem => orderItem.item.id === itemId).length;
  };

  const onUpdateQuantity = async (itemId: string, action: 'remove' | 'add') => {
    if (!currentOrder) return;
    const item = items.find(item => item.id === itemId);
    if (!item) return;
    if (action === 'add') {
      const orderItem = await orderItemApiService.create({ orderId: currentOrder.id, itemId: item.id, status: Status.DRAFT });
      updateOrder({ ...currentOrder, orderItems: [...currentOrder.orderItems, orderItem] });
    } else if (action === 'remove') {
      const orderItem = currentOrder.orderItems.find(orderItem => orderItem.item.id === itemId);
      if (!orderItem) return;
      orderItemApiService.delete(orderItem.id);
      updateOrder({ ...currentOrder, orderItems: currentOrder.orderItems.filter(orderItem => orderItem.item.id !== itemId) });
    }
  }

  const updateOrder = (order: Order) => {
    setSelectedTable(order.table)
    setCurrentOrder(order)
    setOrders(orders.map(o => o.id === order.id ? order : o))
  }

  const deleteOrder = async (order: Order) => {
    try {
      await orderApiService.delete(order.id);
      updateOrderFilter('table.roomId', currentRoom?.id, '=')
    } catch (error) {
      console.error(error);
    }
  }

  const handleStatusUpdate = async (orderItems: OrderItem[], status: Status) => {
    if (!currentOrder) return;
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

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <SidePanel
        style={{ flex: 1}}
        title={currentOrder ? `Commande ${currentOrder.table.name}` : 'Service'}
        {...(currentOrder && { onBack: () => {
          if (showMenu) setShowMenu(false)
          else {
            if (currentOrder && (!currentOrder.orderItems || !currentOrder.orderItems.length)) {
              deleteOrder(currentOrder)
            }
            setCurrentOrder(null)
            setSelectedTable(null)
          }
        }})}
      >
      {currentOrder ? (
        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between'}}>
          {showMenu ? (
            <>
              <Tabs
                value={menuTabsValue}
                onValueChange={(newValue: string) => setMenuTabsValue(newValue)}
                className='flex-1 w-full max-w-[400px] mx-auto flex-col gap-1.5'
              >
                <TabsList className='flex-row w-full'>
                  {itemTypes.map((itemType) => (
                    <TabsTrigger key={itemType.id} value={itemType.id} className='flex-1 py-3'>
                      <Text>{itemType.name}</Text>
                    </TabsTrigger>
                  ))}
                </TabsList>
                <View style={{ flex: 1, paddingHorizontal: 16, marginTop: 8 }}>
                  {items
                    .filter(item => item.itemType.id === menuTabsValue)
                    .map((item) => {
                      const quantity = getItemQuantity(item.id);
                      
                      return (
                        <TabsContent value={item.itemType.id} key={item.id}>
                          <View className='flex-row items-center justify-between py-2'>
                            <View className='flex-1'>
                              <Text numberOfLines={1} className='font-medium' ellipsizeMode="tail">
                                {item.name}
                              </Text>
                            </View>
                            <View className='flex-row items-center gap-4'>
                              <View className='flex-row items-center bg-gray-100 rounded-full px-1'>
                                {quantity > 0 ? (
                                  <>
                                    <Pressable
                                      onPress={() => onUpdateQuantity(item.id, 'remove')}
                                      className='p-2'
                                    >
                                      <Minus size={20} color="#666666" />
                                    </Pressable>
                                    <Text className='text-base min-w-[24px] text-center'>
                                      {quantity}
                                    </Text>
                                  </>
                                ) : (
                                  <Text className='text-base min-w-[24px] text-center px-2'>0</Text>
                                )}
                                <Pressable
                                  onPress={() => onUpdateQuantity(item.id, 'add')}
                                  className='p-2'
                                >
                                  <Plus size={20} color="#666666" />
                                </Pressable>
                              </View>
                            </View>
                          </View>
                        </TabsContent>
                      );
                  })}
                </View>
              </Tabs>
              <View style={{ padding: 16 }}>
                <Button
                  onPress={() => setShowMenu(false)}
                  className="w-full h-[50px] flex items-center justify-center"
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
                    Valider la commande
                  </Text>
                </Button>
              </View>
            </>
          ) : (
            <>
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
                  onPress={() => setShowMenu(true)}
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
            </>
          )}
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
            onPress={() => {}}
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
            onStartPress={createOrder} />
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