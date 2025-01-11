import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Order } from "~/types/order.types";
import { orderApiService } from "~/api/order.api";
import { DateFormat, formatDate } from '~/lib/utils';
import { Transmit } from '@adonisjs/transmit-client'

// Constantes déplacées en dehors du composant
const ORDER_STATUS = [
  { name: 'En attente', id: 'r44s5mffjyt715fiopwgvpo3', status: 'waiting', color: 'bg-gray-200' },
  { name: 'En cours', id: 'l03dgl3k9eqlfklpdk1mkd0u', status: 'inProgress', color: 'bg-yellow-300' },
  { name: 'Prêt à servir', id: 'vkguwx74i3hdcb25n7xzqrh6', status: 'ready', color: 'bg-blue-100' },
];

const BASE_URL = 'http://localhost:3333';

const statusId = {
  waiting: 'r44s5mffjyt715fiopwgvpo3',
  inProgress: 'l03dgl3k9eqlfklpdk1mkd0u',
  ready: 'vkguwx74i3hdcb25n7xzqrh6',
};

const statusStyles = {
  waiting: 'bg-gray-200 text-gray-700',
  inProgress: 'bg-yellow-200 text-yellow-800',
  ready: 'bg-blue-100 text-blue-800',
};

const statusTexts = {
  waiting: 'En attente',
  inProgress: 'En cours',
  ready: 'Prêt',
};

const StatusBadge = React.memo(({ status }: { status: keyof typeof statusStyles }) => {

  return (
    <View className={`shadow rounded-md px-2 py-1 ${statusStyles[status] || statusStyles.waiting}`}>
      <Text className="text-xs font-medium">{statusTexts[status] || ''}</Text>
    </View>
  );
});

const OrderCard = React.memo(({ order, status, onStatusChange }: { 
    order: Order;
    status: keyof typeof statusStyles;
    onStatusChange: (order: Order, newStatus: 'waiting' | 'inProgress' | 'ready') => void; 
  }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const toggleExpanded = useCallback(() => setIsExpanded(prev => !prev), []);

    return (
      <View className="bg-white rounded-lg shadow mb-3">
        <View className="px-4 pt-3 pb-2">
          <View className="flex-row justify-between items-start mb-1 border-b border-gray-100">
            <Text className="text-gray-900 text-sm font-medium">{order.id}</Text>
            <Text className="text-gray-600 text-sm">{order.orderItems.length} ARTICLES</Text>
          </View>
          
          <View className="w-full flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-gray-900 font-bold mb-1">
                Table {order?.table?.name}
              </Text>
              <Text className="text-gray-500 text-xs flex-wrap">
                Commande lancé {formatDate(order.createdAt, DateFormat.DATE_TIME)}
              </Text>
            </View>
            <View className="flex-row items-center ml-2">
              <StatusBadge status={status}/>
              <TouchableOpacity 
                onPress={toggleExpanded}
                className="ml-2"
              >
                <MaterialIcons 
                  name={isExpanded ? "expand-less" : "expand-more"} 
                  size={24} 
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {isExpanded && (
          <>
            <View className="px-4 py-2">
              {order.orderItems.map((orderItem, index) => (
                <View key={index} className="flex-row items-center mb-2">
                  <View className={`w-5 h-5 rounded-full border ${
                    status === 'ready' ? 'border-green-500 bg-green-500' : 
                    'border-gray-300'
                  } mr-3 items-center justify-center`}>
                    {status === 'ready' && (
                      <MaterialIcons name="check" size={14} color="white" />
                    )}
                  </View>
                  <View>
                    <Text className="text-gray-800 text-sm">{orderItem.item.name}</Text>
                    <Text className="text-gray-500 text-xs">{orderItem.note}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* --- Boutons de changement de statut --- */}
            <View className="px-4 py-2 flex-row gap-2">
              {status === 'waiting' && (
                <TouchableOpacity
                  onPress={() => onStatusChange(order, 'inProgress')}
                  style={{ backgroundColor: '#FCD34D', padding: 8, borderRadius: 6 }}
                >
                  <Text style={{ fontWeight: 'bold', color: '#fff' }}>
                    Passer en cours
                  </Text>
                </TouchableOpacity>
              )}
              
              {status === 'inProgress' && (
                <TouchableOpacity
                  onPress={() => onStatusChange(order, 'ready')}
                  style={{ backgroundColor: '#60A5FA', padding: 8, borderRadius: 6 }}
                >
                  <Text style={{ fontWeight: 'bold', color: '#fff' }}>
                    Marquer prêt
                  </Text>
                </TouchableOpacity>
              )}

              {/* Exemple si vous voulez un bouton en plus sur le statut 'ready' 
                (ex: "Commande servie" ou "Terminé") */}
              {status === 'ready' && (
                <TouchableOpacity
                  onPress={() => {/* handle if needed, ou rien si c'est la fin de la chaîne */}}
                  style={{ backgroundColor: '#10B981', padding: 8, borderRadius: 6 }}
                >
                  <Text style={{ fontWeight: 'bold', color: '#fff' }}>
                    Terminer
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>
    );
});

const OrderColumn = React.memo(({ title, orders = [], status, headerColor, onStatusChange }: { 
  title: string; 
  orders: Order[]; 
  status: 'waiting' | 'inProgress' | 'ready';
  headerColor: string;
  onStatusChange: (order: Order, newStatus: 'waiting' | 'inProgress' | 'ready') => void;
}) => (
  <View className="flex-1 bg-gray-100 rounded-lg shadow">
    <View className={`rounded-t-lg ${headerColor}`}>
      <Text className="font-bold text-center py-3 text-sm">{title}</Text>
    </View>
    <ScrollView className="flex-1 flex-column p-3">
      {orders.length > 0 ? (
        orders.map((order) => (
          <OrderCard key={order.id} order={order} status={status} onStatusChange={onStatusChange}/>
        ))
      ) : (
        <View className="flex-1 flex items-center justify-center">
          <Text>Aucune commande à afficher</Text>
        </View>
      )}
    </ScrollView>
  </View>
));

export default function KitchenPage() {
  const [menuItems, setMenuItems] = useState<{ [key: string]: Order[] }>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const newMenuItems = await Promise.all(
        ORDER_STATUS.map(async (type) => {
          try {
            const { data } = await orderApiService.getAll(`statusId=${type.id}`);
            return [type.id, data];
          } catch (err) {
            console.error(`Error loading ${type.name} items:`, err);
            return [type.id, []];
          }
        })
      );
      setMenuItems(Object.fromEntries(newMenuItems));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // const handleStatusChange = useCallback(
  //   async (order: Order, newStatus: 'waiting' | 'inProgress' | 'ready') => {
  //     try {
  //       const statusValue = statusId[newStatus];
  //       console.log('New status value:', statusValue);
  //       const response = await orderApiService.update(order.id, { statusId: statusValue });
  //       console.log('Order status updated:', response);
  //       const updatedOrder: Order = response;

  //       setMenuItems((prevItems) => {
  //         const oldStatusId = order.status;
  //         const updatedOldList = (prevItems[oldStatusId] || []).filter((o) => o.id !== order.id);
  //         const updatedNewList = [ ...(prevItems[statusValue] || []), updatedOrder ];
  //         return {
  //           ...prevItems,
  //           [oldStatusId]: updatedOldList,
  //           [statusValue]: updatedNewList,
  //         };
  //       });
  //     } catch (err) {
  //       console.error('Failed to update order status', err);
  //     }
  //   },
  //   []
  // );

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    const transmit = new Transmit({ baseUrl: BASE_URL });
    let subscription: any;

    const subscribe = async () => {
      subscription = transmit.subscription('global');
      await subscription.create();
      
      subscription.onMessage((data: any) => {
        console.log('New message:', data);
        if (typeof data === 'object' && data !== null && 'newOrder' in data) {
          const newOrder = data.newOrder;
          setMenuItems(prevItems => ({
            ...prevItems,
            [newOrder.statusId]: [...(prevItems[newOrder.statusId] || []), newOrder]
          }));
        }
      });
    };
    subscribe();
    return () => {
      subscription?.delete();
    };
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View className="flex-1 flex-row gap-7 p-7">
        {ORDER_STATUS.map((status) => (
          <OrderColumn 
            key={status.id}
            title={status.name.toUpperCase()} 
            orders={menuItems[status.id]} 
            status={status.status as 'waiting' | 'inProgress' | 'ready'}
            headerColor={status.color}
            onStatusChange={handleStatusChange}
          />
        ))}
      </View>
    </View>
  );
}