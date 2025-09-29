// app/(server)/index.tsx - Page principale avec plan de salle et liste des commandes
import React, { useMemo, useCallback, useState, useRef } from 'react';
import { View, ScrollView, Pressable, Dimensions } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Card, CardContent, Text, Badge, Button } from '~/components/ui';
import RoomComponent from '~/components/Room/Room';
import { Status } from '~/types/status.enum';
import { Table } from '~/types/table.types';
import { Room } from '~/types/room.types';
import { Clock, CheckCircle2, AlertCircle, Package, RefreshCw, Plus } from 'lucide-react-native';
import { useToast } from '~/components/ToastProvider';
import { useRooms, useMenu, useTables, useOrders } from '~/hooks/useRestaurant';
import { getStatusColor, getStatusText, getMostImportantStatus } from '~/lib/utils';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function ServerHomePage() {
  const snapPoints = useMemo(() => ['15%', '35%', '60%'], []);
  const screenHeight = Dimensions.get('window').height;
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { showToast } = useToast();

  // Hooks pour les données
  const { rooms, currentRoom, setCurrentRoom } = useRooms();
  const { currentRoomTables, selectedTableId, setSelectedTable } = useTables();
  const { currentRoomOrders } = useOrders();

  // État local
  const [bottomSheetIndex, setBottomSheetIndex] = useState(0);

  // Gestion du changement de salle
  const handleChangeRoom = useCallback((room: Room) => {
    setCurrentRoom(room.id);
    setSelectedTable(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [setCurrentRoom, setSelectedTable]);

  // Gestion du clic sur une table
  const handleTablePress = useCallback((table: Table | null) => {
    if (!table) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTable(table.id);

    // Chercher si une commande existe pour cette table
    const existingOrder = currentRoomOrders.find(order => order.tableId === table.id);

    if (existingOrder) {
      // Navigation vers la page de détail de la commande
      router.push({
        pathname: '/(server)/service',
        params: { orderId: existingOrder.id, tableId: table.id }
      });
    } else {
      // Navigation vers la page de prise de commande
      router.push({
        pathname: '/(server)/order-form',
        params: { tableId: table.id }
      });
    }
  }, [currentRoomOrders, setSelectedTable]);

  // Navigation vers une commande existante
  const handleOrderPress = useCallback((orderId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(server)/service',
      params: { orderId }
    });
  }, []);

  // Fonction pour obtenir l'icône de statut
  const getStatusIcon = useCallback((status: Status) => {
    const iconProps = { size: 14, strokeWidth: 2 };
    switch (status) {
      case Status.PENDING:
        return <Clock {...iconProps} color={getStatusColor(status)} />;
      case Status.INPROGRESS:
        return <RefreshCw {...iconProps} color={getStatusColor(status)} />;
      case Status.READY:
        return <Package {...iconProps} color={getStatusColor(status)} />;
      case Status.SERVED:
        return <CheckCircle2 {...iconProps} color={getStatusColor(status)} />;
      case Status.ERROR:
        return <AlertCircle {...iconProps} color="#EF4444" />;
      default:
        return <Clock {...iconProps} color={getStatusColor(status)} />;
    }
  }, []);

  // Rendu du contenu du BottomSheet - Liste simple des commandes
  const renderBottomSheetContent = useCallback(() => {
    const ordersWithTables = currentRoomOrders
      .filter(order => order.lines && order.lines.length > 0)
      .sort((a, b) => {
        // Trier par statut prioritaire puis par date
        const statusA = getMostImportantStatus(a.lines?.map(l => l.status || Status.PENDING) || []);
        const statusB = getMostImportantStatus(b.lines?.map(l => l.status || Status.PENDING) || []);

        const priorityOrder = [Status.READY, Status.INPROGRESS, Status.PENDING, Status.SERVED, Status.TERMINATED];
        const priorityA = priorityOrder.indexOf(statusA);
        const priorityB = priorityOrder.indexOf(statusB);

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    return (
      <BottomSheetScrollView
        className="px-4"
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <View className="py-3">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-bold text-gray-900">
              Commandes en cours ({ordersWithTables.length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-1 ml-3"
              contentContainerStyle={{ alignItems: 'center' }}
            >
              <View className="flex-row gap-2">
                {rooms.map((room) => (
                  <Pressable
                    key={room.id}
                    onPress={() => handleChangeRoom(room)}
                  >
                    <Badge
                      variant="outline"
                      active={room.id === currentRoom?.id}
                      size="sm"
                    >
                      <Text className="text-xs">{room.name}</Text>
                    </Badge>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Liste des commandes */}
          {ordersWithTables.length === 0 ? (
            <View className="py-8 items-center">
              <Text className="text-gray-500 text-sm">
                Aucune commande en cours
              </Text>
            </View>
          ) : (
            ordersWithTables.map((order) => {
              const orderStatus = getMostImportantStatus(
                (order.lines || []).map(line => line.status || Status.PENDING)
              );
              const table = currentRoomTables.find(t => t.id === order.tableId);

              return (
                <Pressable
                  key={order.id}
                  onPress={() => handleOrderPress(order.id)}
                >
                  <Card
                    className="mb-2 border border-gray-200"
                    style={{ backgroundColor: `${getStatusColor(orderStatus)}15` }}
                  >
                    <CardContent className="py-3 px-4">
                      <View className="flex-row justify-between items-center">
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2">
                            <Text className="font-semibold text-gray-900">
                              Table {table?.name || order.tableId}
                            </Text>
                            <Text className="text-xs text-gray-500">
                              • {order.lines?.length || 0} articles
                            </Text>
                          </View>
                          <Text className="text-xs text-gray-600 mt-1">
                            {new Date(order.createdAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </View>

                        <View className="flex-row items-center gap-2">
                          {getStatusIcon(orderStatus)}
                          <Badge
                            variant="outline"
                            size="sm"
                            style={{ backgroundColor: `${getStatusColor(orderStatus)}20` }}
                          >
                            <Text className="text-xs font-medium">
                              {getStatusText(orderStatus)}
                            </Text>
                          </Badge>
                        </View>
                      </View>
                    </CardContent>
                  </Card>
                </Pressable>
              );
            })
          )}
        </View>
      </BottomSheetScrollView>
    );
  }, [currentRoomOrders, currentRoomTables, rooms, currentRoom, handleChangeRoom, handleOrderPress, getStatusIcon]);

  return (
    <View className="flex-1 bg-background">
      {/* Plan de salle en plein écran */}
      <View style={{ height: screenHeight * 0.85 - 44 }}>
        <RoomComponent
          tables={currentRoomTables}
          orders={currentRoomOrders}
          editingTableId={selectedTableId}
          editionMode={false}
          isLoading={false}
          width={currentRoom?.width}
          height={currentRoom?.height}
          onTablePress={handleTablePress}
          onTableLongPress={handleTablePress}
          onTableUpdate={() => {}}
        />

        {/* Bouton flottant pour créer une commande rapide */}
        <Pressable
          onPress={() => {
            if (!selectedTableId) {
              showToast('Sélectionnez une table d\'abord', 'warning');
              return;
            }
            router.push({
              pathname: '/(server)/order-form',
              params: { tableId: selectedTableId }
            });
          }}
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            backgroundColor: '#2A2E33',
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 8,
          }}
        >
          <Plus size={24} color="white" strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* BottomSheet simple pour la liste des commandes */}
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        index={bottomSheetIndex}
        onChange={(index) => setBottomSheetIndex(index)}
        handleIndicatorStyle={{
          backgroundColor: '#94A3B8',
          width: 40,
          height: 4,
        }}
        handleStyle={{
          backgroundColor: '#ffffff',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingVertical: 8,
        }}
        backgroundStyle={{
          backgroundColor: '#ffffff',
        }}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 8,
        }}
      >
        {renderBottomSheetContent()}
      </BottomSheet>
    </View>
  );
}