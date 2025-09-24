// app/(server)/index.tsx
import { View, ScrollView, Pressable, Dimensions } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useMemo, useRef, useCallback, useState, useEffect, JSX } from 'react';
import { Table } from '~/types/table.types';
import { Room } from '~/types/room.types';
import { Order } from '~/types/order.types';
import { OrderLineType } from '~/types/order-line.types';
import { Card, CardContent, Text, Badge, Button } from '~/components/ui';
import { StatusPill } from '~/components/ui/StatusPill';
import { ConfirmationModal } from '~/components/ui/ConfirmationModal';
import { getStatusColor, getStatusText, getMostImportantStatus, getNextStatus } from '~/lib/utils';
import { router } from 'expo-router';
import RoomComponent from '~/components/Room/Room';
import { Status } from '~/types/status.enum';
import { useToast } from '~/components/ToastProvider';
import { AlertCircle, SquareArrowRight } from 'lucide-react-native';
import { ActionMenu, ActionItem } from '~/components/ActionMenu';
import { OrderItem } from '~/types/order-line.types';
import * as Haptics from 'expo-haptics';
import { useMenu, useOrders, useRestaurant, useRooms, useTables } from '~/hooks/useRestaurant';

type BottomSheetMode = 'tables' | 'orders' | 'menu';

export default function ServerHome() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['15%', '50%', '90%'], []);
  const screenHeight = Dimensions.get('window').height;


  const { rooms, currentRoom, error: roomsError, setCurrentRoom } = useRooms();
  const { currentRoomTables, selectedTableId, selectedTable, setSelectedTable } = useTables();
  const { currentRoomOrders, selectedTableOrder, createOrder, deleteOrder, updateOrderStatus, error: ordersError } = useOrders();
  const { items, itemTypes } = useMenu();

  const [bottomSheetMode, setBottomSheetMode] = useState<BottomSheetMode>('tables');
  const [orderToTerminate, setOrderToTerminate] = useState<Order | null>(null);

  const { showToast } = useToast();

  const handleChangeRoom = (room: Room) => {
    setSelectedTable(null);
    setCurrentRoom(room.id);
    setBottomSheetMode('tables');
  };

  const handleTablePress = (table: Table | null) => {
    if (!table) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);


    setSelectedTable(table.id);
    const existingOrder = currentRoomOrders.find(order => order.tableId === table.id);

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

  const handleStartOrder = () => {
    if (!selectedTable) {
      showToast('Veuillez sélectionner une table avant de créer une commande.', 'warning');
      return;
    }
    const existingOrder = currentRoomOrders.find(order => order.tableId === selectedTable.id);
    if (existingOrder) {
      showToast('Une commande existe déjà pour cette table.', 'warning');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // NOUVEAU FLUX : Naviguer directement vers la sélection SANS créer de commande
    // La commande sera créée à la fin avec toutes les OrderLines sélectionnées
    router.push({
      pathname: '/(server)/order/menu',
      params: {
        tableId: selectedTable.id,  // Passer tableId au lieu d'orderId
        newOrder: 'true'            // Flag pour indiquer que c'est une nouvelle commande
      }
    });
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      await deleteOrder(orderId);
      if (selectedTableOrder?.id === orderId) {
        setSelectedTable(null);
        setBottomSheetMode('tables');
        bottomSheetRef.current?.snapToIndex(0);
      }
      showToast('Commande supprimée avec succès.', 'success');
    } catch (error) {
      // Retour haptique d'erreur
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error(error);
      showToast('Erreur lors de la suppression.', 'error');
    }
  };


  const handleQuickStatusUpdate = async (order: Order, newStatus: Status, itemTypeId?: string) => {
    try {
      if (newStatus === Status.READY) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (newStatus === Status.SERVED) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // 🔄 Adapter l'ancienne signature vers la nouvelle API PATCH
      console.log('🔄 [DEBUG] Server handleQuickStatusUpdate:', {
        orderId: order.id,
        newStatus,
        itemTypeId
      });

      // Identifier les OrderLines à mettre à jour selon itemTypeId
      let orderLineIds: string[] = [];
      let orderLineItemIds: string[] = [];

      if (itemTypeId) {
        // Filtrer par itemType spécifique (items individuels seulement)
        const targetLines = (order.lines || []).filter(line =>
          line.type === OrderLineType.ITEM &&
          (line.item as any)?.itemType?.id === itemTypeId
        );
        orderLineIds = targetLines.map(line => line.id);
      } else {
        // Toutes les lignes : items individuels + items de menu
        (order.lines || []).forEach(line => {
          if (line.type === OrderLineType.ITEM) {
            orderLineIds.push(line.id);
          } else if (line.type === OrderLineType.MENU && line.items) {
            line.items.forEach(item => {
              orderLineItemIds.push(item.id);
            });
          }
        });
      }

      // Utiliser la nouvelle API PATCH
      if (orderLineIds.length > 0 || orderLineItemIds.length > 0) {
        await updateOrderStatus(order.id, {
          status: newStatus,
          orderLineIds: orderLineIds.length > 0 ? orderLineIds : undefined,
          orderLineItemIds: orderLineItemIds.length > 0 ? orderLineItemIds : undefined,
        });
      }

      const itemTypeName = itemTypeId ?
        (order.lines || []).find(line => line.type === OrderLineType.ITEM && (line.item as any)?.itemType?.id === itemTypeId)?.item?.itemType?.name || 'articles' :
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

  const getStatusIcon = (status: Status) => {
    const icons: Record<Status, JSX.Element> = {
      [Status.DRAFT]: <SquareArrowRight size={14} color={getStatusColor(status)} />,
      [Status.PENDING]: <SquareArrowRight size={14} color={getStatusColor(status)} />,
      [Status.INPROGRESS]: <SquareArrowRight size={14} color={getStatusColor(status)} />,
      [Status.READY]: <SquareArrowRight size={14} color={getStatusColor(status)} />,
      [Status.SERVED]: <SquareArrowRight size={14} color={getStatusColor(status)} />,
      [Status.TERMINATED]: <SquareArrowRight size={14} color={getStatusColor(status)} />,
      [Status.ERROR]: <AlertCircle size={14} color="#EF4444" />,
    };
    return icons[status] || icons[Status.DRAFT];
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
              {currentRoomTables.map((table) => {
                if (!table.orders?.[0]) return null;
                const tableOrder = table.orders?.[0];
                const status = tableOrder.status;

                const getStatusActions = (order: Order | undefined): ActionItem[] => {
                  if (!order) return [];

                  const actions: ActionItem[] = [];

                  // Grouper les lines par type
                  const itemsByType = (order.lines || []).reduce((acc, line) => {
                    if (line.type !== OrderLineType.ITEM || !line.item) return acc;
                    const orderItem = { item: line.item, status: line.status }; // Adapter pour compatibilité

                    // Vérifier si itemType existe, sinon utiliser un fallback
                    const itemType = (orderItem.item as any)?.itemType;
                    if (!itemType) return acc; // Skip si pas d'itemType

                    const typeId = itemType.id;
                    const typeName = itemType.name;

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

                    if (nextStatus && dominantStatus !== Status.TERMINATED) {
                      const count = items.length;

                      actions.push({
                        content: (
                          <View className="flex-1">
                            <View className="flex-row items-center justify-between">
                              <View className="flex-row items-center">
                                <Text className="font-semibold text-gray-900 text-base mr-3">
                                  {typeName}
                                </Text>
                                <View className="bg-gray-100 px-2 py-1 rounded-full">
                                  <Text className="text-xs font-medium text-gray-700">
                                    {count}
                                  </Text>
                                </View>
                              </View>
                            </View>
                            <View className="flex-row items-center mt-2">
                              <StatusPill status={dominantStatus} size="md" />
                              <View className="mx-3 h-px bg-gray-300 flex-1" />
                              <StatusPill status={nextStatus} size="md" />
                            </View>
                          </View>
                        ),
                        icon: getStatusIcon(nextStatus),
                        onPress: () => handleQuickStatusUpdate(order, nextStatus, typeId)
                      });
                    }
                  });

                  // Ajouter une action globale pour terminer toute la commande si elle est servie
                  const orderStatus = order.status || getMostImportantStatus(
                    (order.lines || []).flatMap(line => {
                      if (line.type === OrderLineType.ITEM) {
                        return [line.status];
                      } else if (line.type === OrderLineType.MENU && line.items) {
                        return line.items.map(item => item.status);
                      }
                      return [];
                    }).filter(s => s !== undefined) as Status[]
                  );

                  if (orderStatus === Status.SERVED) {
                    actions.push({
                      content: (
                        <View className="flex-1">
                          <View className="flex-row items-center justify-between">
                            <Text className="font-semibold text-gray-900 text-base">
                              Terminer toute la commande
                            </Text>
                          </View>
                          <View className="flex-row items-center mt-2">
                            <StatusPill status={Status.SERVED} size="md" />
                            <View className="mx-3 h-px bg-gray-300 flex-1" />
                            <StatusPill status={Status.TERMINATED} size="md" />
                          </View>
                        </View>
                      ),
                      icon: getStatusIcon(Status.TERMINATED),
                      onPress: () => setOrderToTerminate(order) // Ouvrir la modal de confirmation
                    });
                  }

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
                              {(tableOrder.lines || []).length} article{(tableOrder.lines || []).length > 1 ? 's' : ''}
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
                        <ActionMenu actions={getStatusActions(tableOrder)} width={350} withSeparator fullWidth />
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
                  onPress={handleStartOrder}
                  className="w-full bg-primary"
                >
                  <Text className="text-primary-foreground font-medium">Prendre la commande</Text>
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
  }, [bottomSheetMode, currentRoomTables, currentRoom, rooms, selectedTable, currentRoomOrders, router]);


  if (roomsError || ordersError) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-4">
        <Text className="text-destructive text-center mb-4">
          {roomsError || ordersError || 'Erreur lors du chargement'}
        </Text>
        <Button onPress={() => { }}>
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
          tables={currentRoomTables.map(t => ({ ...t, orders: t.orders?.[0] ? [t.orders?.[0]] : [] }))}
          orders={currentRoomOrders}
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
          backgroundColor: '#f8f9fa',
          borderTopLeftRadius: 15,
          borderTopRightRadius: 15,
          paddingVertical: 12,
        }}
        backgroundStyle={{
          backgroundColor: '#f8f9fa',
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

      {/* Modal de confirmation pour terminer la commande */}
      {orderToTerminate && (
        <ConfirmationModal
          isVisible={!!orderToTerminate}
          onClose={() => setOrderToTerminate(null)}
          onConfirm={async () => {
            try {
              // Collecter tous les IDs des OrderLines et OrderLineItems
              const orderLineIds: string[] = [];
              const orderLineItemIds: string[] = [];

              orderToTerminate.lines?.forEach(line => {
                if (line.type === OrderLineType.ITEM) {
                  orderLineIds.push(line.id);
                } else if (line.type === OrderLineType.MENU && line.items) {
                  line.items.forEach(item => {
                    orderLineItemIds.push(item.id);
                  });
                }
              });

              // Mettre à jour toutes les lignes en TERMINATED
              await updateOrderStatus(orderToTerminate.id, {
                status: Status.TERMINATED,
                orderLineIds: orderLineIds.length > 0 ? orderLineIds : undefined,
                orderLineItemIds: orderLineItemIds.length > 0 ? orderLineItemIds : undefined,
              });

              showToast('Commande terminée avec succès', 'success');
              setOrderToTerminate(null);
            } catch (error) {
              showToast('Erreur lors de la terminaison de la commande', 'error');
              setOrderToTerminate(null);
            }
          }}
          title="Terminer la commande"
          message={`Voulez-vous vraiment terminer la commande de la table ${orderToTerminate.table?.name || 'N/A'} ?`}
          description="Cette action marquera tous les articles de la commande comme terminés. La commande disparaîtra de la vue service."
          confirmText="Confirmer"
          confirmVariant="default"
        />
      )}
    </View>
  );
}