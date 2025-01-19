import React from 'react';
import { Modal, Pressable, ScrollView, View } from "react-native";
import { SidePanel } from "~/components/SidePanel";
import { Badge, Button, ConfirmDialog, ForkModal, Input, PopoverButton, Tabs, TabsContent, TabsList, TabsTrigger, Text } from "~/components/ui";
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
import OrderView from "~/components/Service/OrderItemTypeCards";
import { set } from 'lodash';

export default function ServicePage () {
  const [currentRoom, setCurrentRoom] = useState<Room | null>();
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

  useEffect(() => {
    initData();
  }, []);


  const filterOrder: FilterConfig<Order>[] = [
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
  const {
    data: orders,
    loading: ordersLoading,
    error: ordersError,
    updateFilter: updateOrderFilter,
    clearFilters: clearOrderFilters,
    changePage: changeOrderPage,
    queryParams: orderQueryParams
  } = useFilter({ config: filterOrder, service: orderApiService, defaultParams: { sort: { field: 'updatedAt', direction: 'asc' } } });

  const filterItem: FilterConfig<Item>[] = [
    { 
      field: 'itemTypeId', 
      type: 'text',
      label: 'ItemType',
      operator: '=',
      show: false
    },
  ];
  const {
    data: items,
    loading: itemsLoading,
    error: itemsError,
    updateFilter: updateItemFilter,
    clearFilters: clearItemFilters,
    changePage: changeItemPage,
    queryParams: itemQueryParams
  } = useFilter({ config: filterItem, service: itemApiService, defaultParams: { page: 1, perPage: 100 } });

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
    setSelectedTable(table)
    setCurrentOrder(orders.data.find(order => order.tableId === table?.id) || null)
  }

  const createOrder = async () => {
    try {
      if (!selectedTable) return;
      const order = await orderApiService.create({ tableId: selectedTable.id, table: selectedTable, orderItems: [], status: Status.DRAFT });
      setCurrentOrder(order)
      setShowMenu(true)
      orders.data.push(order)
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
    const item = items.data.find(item => item.id === itemId);
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
    orders.data = orders.data.map(o => o.id === order.id ? order : o)
  }

  const deleteOrder = async (order: Order) => {
    try {
      await orderApiService.delete(order.id);
      updateOrderFilter('table.roomId', currentRoom?.id, '=')
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <SidePanel
        style={{ flex: 1}}
        title={currentOrder ? `Commande ${currentOrder.table.name}` : 'Service'}
        {...(currentOrder && { onBack: () => {
          if (showMenu) setShowMenu(false)
          else {
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
                  {items.data
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
              <OrderView order={currentOrder} itemTypes={itemTypes} onStatusUpdate={updateOrder} />
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
          <View className='flex-row justify-between items-center'>
            <Button className="rounded-full p-2" variant='outline'>
              <Grid3X3Icon color='black' />
            </Button>
            <Input className="mx-2 rounded-full" style={{ flex: 1, height: 40 }} placeholder="Rechercher..." />
            <Button className="rounded-full p-2" variant='outline'>
              <ListFilter color='black' />
            </Button>
          </View>
          <OrderList orders={orders.data} onOrderPress={updateOrder} onOrderDelete={deleteOrder} />
        </View>
      )}
      </SidePanel>
      <View style={{ flex: 1, height: '100%', position: 'relative' }}>
        <View className='flex-row w-full justify-between'>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
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
            style={{ backgroundColor: '#2A2E33', borderRadius: 0 }}
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
            order={orders.data.find(order => order.tableId === selectedTable.id)}
            onStartPress={createOrder} />
        )}
        <RoomComponent
          tables={tables}
          orders={orders.data}
          zoom={0.9}
          editingTableId={selectedTable?.id}
          editionMode={false}
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
            tables={tables.filter(table => !orders.data.find(order => order.tableId === table.id))}
            zoom={0.9}
            editionMode={false}
            onTablePress={handleTablePress}
            onTableLongPress={handleTablePress}
            onTableUpdate={() => {}}
          />
        </ForkModal>
    </View>
  );

}