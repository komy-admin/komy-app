// app/(server)/index.tsx
import { View, ScrollView, Pressable, Dimensions } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useMemo, useRef, useCallback, useState, useEffect, JSX } from 'react';
import { Table } from '~/types/table.types';
import { Room } from '~/types/room.types';
import { Order } from '~/types/order.types';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { Card, CardContent, CardHeader, CardTitle, Text, Badge, Button, Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui';
import { tableApiService } from '~/api/table.api';
import { roomApiService } from '~/api/room.api';
import { orderApiService } from '~/api/order.api';
import { itemApiService } from '~/api/item.api';
import { itemTypeApiService } from '~/api/item-type.api';
import { orderItemApiService } from '~/api/order-item.api';
import { getStatusColor, getStatusText, getMostImportantStatus } from '~/lib/utils';
import { router } from 'expo-router';
import RoomComponent from '~/components/Room/Room';
import { Status } from '~/types/status.enum';
import { useFilter } from '~/hooks/useFilter';
import { FilterConfig } from '~/hooks/useFilter/types';
import { useSocket } from '~/hooks/useSocket';
import { EventType } from '~/hooks/useSocket/types';
import { useToast } from '~/components/ToastProvider';
import { Plus, Minus, CheckCircle, Clock, AlertCircle, Truck } from 'lucide-react-native';
import { ActionMenu, ActionItem } from '~/components/ActionMenu';
import { OrderItem } from '@/types/order-item.types';

type BottomSheetMode = 'tables' | 'orders' | 'menu';

export default function ServerHome() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['15%', '50%', '90%'], []);
  const screenHeight = Dimensions.get('window').height;

  // État principal
  const [tables, setTables] = useState<Table[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // État de l'interface
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [bottomSheetMode, setBottomSheetMode] = useState<BottomSheetMode>('tables');
  const [menuTabsValue, setMenuTabsValue] = useState<string>('');

  const { showToast } = useToast();

  useEffect(() => {
    initData();
  }, []);

  // Configuration des filtres
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

  const { updateFilter: updateOrderFilter } = useFilter<Order>({
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

  const { updateFilter: updateItemFilter } = useFilter<Item>({
    config: filterItemConfig,
    service: itemApiService,
    defaultParams: { page: 1, perPage: 100 },
    onDataChange: (response) => setItems(response.data)
  });

  // Socket pour temps réel
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
      setIsLoading(true);
      const { data: rooms } = await roomApiService.getAll();
      const { data: itemTypes } = await itemTypeApiService.getAll();
      setRooms(rooms);
      setItemTypes(itemTypes);
      setMenuTabsValue(itemTypes[0]?.id);
      if (!rooms.length) return;
      setCurrentRoom(rooms[0]);
      updateOrderFilter('table.roomId', rooms[0].id, '=');
      setTables(rooms[0]?.tables || []);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
      showToast('Erreur lors du chargement des données. Veuillez réessayer plus tard.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeRoom = (room: Room) => {
    setCurrentOrder(null);
    setSelectedTable(null);
    setCurrentRoom(room);
    setTables(room.tables);
    updateOrderFilter('table.roomId', room.id, '=');
    setBottomSheetMode('tables');
  };

  const handleTablePress = (table: Table | null) => {
    console.log('Table pressed in ServerHome', table?.name);
    if (!table) return;

    // Nettoyer la commande vide précédente si elle existe
    if (selectedTable && currentOrder && currentOrder.orderItems.length === 0) {
      try {
        deleteOrder(currentOrder);
      } catch (error) {
        console.error('Failed to delete empty order:', error);
      }
    }

    setSelectedTable(table);
    const existingOrder = orders.find(order => order.tableId === table.id);
    setCurrentOrder(existingOrder || null);

    if (existingOrder) {
      // Naviguer vers la page de détail
      router.push({
        pathname: '/(server)/order/[id]',
        params: { id: existingOrder.id }
      });
    } else {
      setBottomSheetMode('orders');
      bottomSheetRef.current?.snapToIndex(1);
    }
  };

  const createOrder = async () => {
    try {
      if (!selectedTable) {
        showToast('Veuillez sélectionner une table avant de créer une commande.', 'warning');
        return;
      }
      const existingOrder = orders.find(order => order.tableId === selectedTable.id);
      if (existingOrder) {
        showToast('Une commande existe déjà pour cette table.', 'warning');
        return;
      }

      const order = await orderApiService.create({
        tableId: selectedTable.id,
        table: selectedTable,
        orderItems: [],
        status: Status.DRAFT
      });
      setCurrentOrder(order);
      setOrders([...orders, order]);
      // Naviguer vers la page menu
      router.push({
        pathname: '/(server)/order/menu',
        params: { orderId: order.id }
      });
      showToast('Commande créée avec succès.', 'success');
    } catch (error) {
      showToast('Erreur lors de la création de la commande. Veuillez réessayer.', 'error');
      console.error(error);
    }
  };

  const deleteOrder = async (order: Order) => {
    try {
      await orderApiService.delete(order.id);
      setOrders(orders.filter(o => o.id !== order.id));
      if (currentOrder?.id === order.id) {
        setCurrentOrder(null);
        setSelectedTable(null);
        setBottomSheetMode('tables');
        bottomSheetRef.current?.snapToIndex(0);
      }
      showToast('Commande supprimée avec succès.', 'success');
    } catch (error) {
      console.error(error);
      showToast('Erreur lors de la suppression.', 'error');
    }
  };

  const getItemQuantity = (itemId: string) => {
    if (!currentOrder) return 0;
    return currentOrder.orderItems.filter(orderItem => orderItem.item.id === itemId).length;
  };

  const onUpdateQuantity = async (itemId: string, action: 'remove' | 'add') => {
    if (!currentOrder) {
      showToast('Veuillez d\'abord créer une commande.', 'warning');
      return;
    }
    const item = items.find(item => item.id === itemId);
    if (!item) {
      showToast('L\'article sélectionné n\'existe pas.', 'error');
      return;
    }
    if (action === 'add') {
      const orderItem = await orderItemApiService.create({
        orderId: currentOrder.id,
        itemId: item.id,
        status: Status.DRAFT
      });
      const updatedOrder = { ...currentOrder, orderItems: [...currentOrder.orderItems, orderItem] };
      setCurrentOrder(updatedOrder);
      setOrders(orders.map(o => o.id === currentOrder.id ? updatedOrder : o));
    } else if (action === 'remove') {
      const orderItem = currentOrder.orderItems.find(orderItem => orderItem.item.id === itemId);
      if (!orderItem) return;
      await orderItemApiService.delete(orderItem.id);
      const updatedOrder = { ...currentOrder, orderItems: currentOrder.orderItems.filter(oi => oi.id !== orderItem.id) };
      setCurrentOrder(updatedOrder);
      setOrders(orders.map(o => o.id === currentOrder.id ? updatedOrder : o));
    }
    showToast(`Quantité ${action === 'add' ? 'ajoutée' : 'retirée'} avec succès.`, 'success');
  };

  const handleQuickStatusUpdate = async (order: Order, newStatus: Status, itemTypeId?: string) => {
    try {
      let orderItemsToUpdate;

      if (itemTypeId) {
        // Mettre à jour seulement les orderItems du type spécifié
        orderItemsToUpdate = order.orderItems.filter(orderItem =>
          orderItem.item.itemType.id === itemTypeId
        );
      } else {
        // Mettre à jour tous les orderItems de la commande
        orderItemsToUpdate = order.orderItems;
      }

      const orderItemsIds = orderItemsToUpdate.map(orderItem => orderItem.id);
      await orderItemApiService.updateManyStatus(orderItemsIds, newStatus);

      // Mettre à jour le statut de la commande selon le statut le plus important
      const updatedOrderItems = order.orderItems.map(orderItem => {
        if (orderItemsIds.includes(orderItem.id)) {
          return { ...orderItem, status: newStatus };
        }
        return orderItem;
      });

      const mostImportantStatus = getMostImportantStatus(updatedOrderItems.map(oi => oi.status));
      const updatedOrder = await orderApiService.update(order.id, {
        status: mostImportantStatus
      });

      // Mettre à jour l'état local avec les nouveaux orderItems
      const finalOrder = { ...updatedOrder, orderItems: updatedOrderItems };
      setOrders(orders.map(o => o.id === order.id ? finalOrder : o));

      const itemTypeName = itemTypeId ?
        orderItemsToUpdate[0]?.item.itemType.name || 'articles' :
        'commande';

      const statusMessages: Record<Status, string> = {
        [Status.DRAFT]: `${itemTypeName} en brouillon`,
        [Status.PENDING]: `${itemTypeName} remis en attente`,
        [Status.INPROGRESS]: `${itemTypeName} en cours de préparation`,
        [Status.READY]: `${itemTypeName} marqué(s) comme prêt(s)`,
        [Status.SERVED]: `${itemTypeName} marqué(s) comme servi(s)`,
        [Status.TERMINATED]: `${itemTypeName} terminé(s)`,
        [Status.ERROR]: `Problème signalé sur ${itemTypeName}`,
      };

      showToast(statusMessages[newStatus] || 'Statut mis à jour', 'success');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      showToast('Erreur lors de la mise à jour du statut', 'error');
    }
  };

  const getNextStatus = (currentStatus: Status): Status | null => {
    const statusProgression: Partial<Record<Status, Status>> = {
      [Status.DRAFT]: Status.PENDING,
      [Status.PENDING]: Status.INPROGRESS,
      [Status.INPROGRESS]: Status.READY,
      [Status.READY]: Status.SERVED,
    };
    return statusProgression[currentStatus] || null;
  };

  const getNextStatusLabel = (currentStatus: Status): string => {
    const labels: Partial<Record<Status, string>> = {
      [Status.DRAFT]: 'En attente',
      [Status.PENDING]: 'En cours',
      [Status.INPROGRESS]: 'Prêt',
      [Status.READY]: 'Servi',
    };
    return labels[currentStatus] || '';
  };

  const getStatusIcon = (status: Status) => {
    const icons: Record<Status, JSX.Element> = {
      [Status.DRAFT]: <Clock size={14} color="#9CA3AF" />,
      [Status.PENDING]: <Clock size={14} color="#F59E0B" />,
      [Status.INPROGRESS]: <Clock size={14} color="#EF4444" />,
      [Status.READY]: <Truck size={14} color="#10B981" />,
      [Status.SERVED]: <CheckCircle size={14} color="#6B7280" />,
      [Status.TERMINATED]: <CheckCircle size={14} color="#6B7280" />,
      [Status.ERROR]: <AlertCircle size={14} color="#EF4444" />,
    };
    return icons[status] || icons[Status.DRAFT];
  };

  const handleStatusUpdate = async (orderItems: OrderItem[], status: Status) => {
    if (!currentOrder) {
      showToast('Aucune commande sélectionnée.', 'warning');
      return;
    }
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
    setCurrentOrder(updatedOrder);
    setOrders(orders.map(o => o.id === currentOrder.id ? updatedOrder : o));
  };

  const renderBottomSheetContent = useCallback(() => {
    switch (bottomSheetMode) {
      case 'tables':
        return (
          <BottomSheetScrollView className="px-4">
            <View className="py-2">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-gray-900">Tables - {currentRoom?.name}</Text>
                <View className="flex-row gap-2">
                  {rooms.map((room, index) => (
                    <Pressable key={index} onPress={() => handleChangeRoom(room)}>
                      <Badge
                        variant="outline"
                        active={room.id === currentRoom?.id}
                        size="sm"
                      >
                        <Text className="text-xs text-gray-900">{room.name}</Text>
                      </Badge>
                    </Pressable>
                  ))}
                </View>
              </View>
              {tables.map((table) => {
                const tableOrder = orders.find(order => order.tableId === table.id);
                const status = tableOrder?.status || Status.DRAFT;

                const getStatusActions = (order: Order | undefined): ActionItem[] => {
                  if (!order) return [];

                  const actions: ActionItem[] = [];

                  // Grouper les orderItems par type
                  const itemsByType = order.orderItems.reduce((acc, orderItem) => {
                    const typeId = orderItem.item.itemType.id;
                    const typeName = orderItem.item.itemType.name;

                    if (!acc[typeId]) {
                      acc[typeId] = {
                        typeName,
                        items: [],
                        typeId
                      };
                    }
                    acc[typeId].items.push(orderItem);
                    return acc;
                  }, {} as Record<string, { typeName: string; items: any[]; typeId: string }>);

                  // Créer des actions pour chaque type
                  Object.values(itemsByType).forEach(({ typeName, items, typeId }) => {
                    // Calculer le statut dominant du groupe
                    const statuses = items.map(item => item.status);
                    const dominantStatus = getMostImportantStatus(statuses);
                    const nextStatus = getNextStatus(dominantStatus);

                    if (nextStatus && dominantStatus !== Status.SERVED) {
                      const nextLabel = getNextStatusLabel(dominantStatus);
                      const count = items.length;

                      actions.push({
                        label: `${typeName} (${count}) ${getStatusText(dominantStatus)} → ${nextLabel}`,
                        icon: getStatusIcon(nextStatus),
                        onPress: () => handleQuickStatusUpdate(order, nextStatus, typeId)
                      });
                    }
                  });

                  // Action pour voir les détails complets
                  actions.push({
                    label: 'Voir détails complets',
                    icon: <Clock size={16} color="#6B7280" />,
                    onPress: () => router.push({
                      pathname: '/(server)/order/[id]',
                      params: { id: order.id }
                    })
                  });

                  return actions;
                };

                return (
                  <Card
                    key={table.id}
                    className="mb-3 border border-gray-200"
                    style={{ backgroundColor: getStatusColor(status) }}
                  >
                    <CardContent className="flex-row justify-between items-center py-3">
                      <Pressable
                        className="flex-1 flex-row items-center"
                        onPress={() => handleTablePress(table)}
                      >
                        <View className="flex-1">
                          <Text className="font-medium text-gray-900">Table {table.name}</Text>
                          <Text className="text-sm text-muted-foreground">{table.seats} places</Text>
                          {tableOrder && (
                            <Text className="text-xs text-muted-foreground mt-1">
                              {tableOrder.orderItems.length} article{tableOrder.orderItems.length > 1 ? 's' : ''}
                            </Text>
                          )}
                        </View>
                        <View
                          className="px-3 py-1 rounded-full mr-2"
                          style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
                        >
                          <Text className="text-sm text-gray-900">
                            {getStatusText(status)}
                          </Text>
                        </View>
                      </Pressable>
                      {tableOrder && (
                        <ActionMenu actions={getStatusActions(tableOrder)} width={350} />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </View>
          </BottomSheetScrollView>
        );

      case 'orders':
        return (
          <BottomSheetScrollView className="px-4">
            <View className="py-4">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-gray-900">Table {selectedTable?.name}</Text>
                <Pressable onPress={() => {
                  setBottomSheetMode('tables');
                  bottomSheetRef.current?.snapToIndex(0);
                }}>
                  <Text className="text-primary">Retour</Text>
                </Pressable>
              </View>
              <View className="items-center py-8">
                <Text className="text-muted-foreground mb-2 text-center">Table {selectedTable?.name}</Text>
                <Text className="text-muted-foreground mb-6 text-center">{selectedTable?.seats} places disponibles</Text>
                <Button
                  onPress={createOrder}
                  className="w-full bg-primary"
                >
                  <Text className="text-primary-foreground font-medium">Créer une commande</Text>
                </Button>
              </View>
            </View>
          </BottomSheetScrollView>
        );

      case 'menu':
        // Ce mode n'est plus utilisé car déplacé vers une page dédiée
        return (
          <BottomSheetScrollView className="px-4">
            <View className="py-4 items-center">
              <Text className="text-muted-foreground">Menu déplacé vers une page dédiée</Text>
            </View>
          </BottomSheetScrollView>
        );

      // Le mode 'detail' a été supprimé car déplacé vers une page dédiée

      default:
        return null;
    }
  }, [bottomSheetMode, tables, currentRoom, rooms, selectedTable, orders, router]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-gray-900">Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-4">
        <Text className="text-destructive text-center mb-4">{error}</Text>
        <Button onPress={initData}>
          <Text className="text-primary-foreground">Réessayer</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View style={{
        height: screenHeight * 0.85 - 88,
      }}>
        <RoomComponent
          tables={tables}
          orders={orders}
          editingTableId={selectedTable?.id}
          editionMode={false}
          isLoading={false}
          width={currentRoom?.width}
          height={currentRoom?.height}
          onTablePress={handleTablePress}
          onTableLongPress={handleTablePress}
          onTableUpdate={() => { }}
        />
      </View>

      {/* Bottom Sheet avec modes multiples */}
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        index={0}
        handleIndicatorStyle={{
          backgroundColor: '#94A3B8',
          width: 40,
          height: 4,
        }}
        handleStyle={{
          backgroundColor: '#ffffff',
          borderTopLeftRadius: 15,
          borderTopRightRadius: 15,
          paddingVertical: 12,
        }}
        backgroundStyle={{
          backgroundColor: '#ffffff',
        }}
        style={{
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.30,
          shadowRadius: 4.65,
          elevation: 8,
        }}
      >
        {renderBottomSheetContent()}
      </BottomSheet>
    </View>
  );
}