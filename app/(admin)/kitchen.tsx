import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Order } from "~/types/order.types";
import { orderApiService } from "~/api/order.api";
import { DateFormat, formatDate } from '~/lib/utils';
import { MoveRight, MoveLeft, CircleAlert, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Button } from "~/components/ui";
import { io } from 'socket.io-client';
import { storageService } from '~/lib/storageService';

// Constantes déplacées en dehors du composant
const ORDER_STATUS = [
  { name: 'En attente', id: 'r44s5mffjyt715fiopwgvpo3', status: 'waiting', color: 'bg-gray-200' },
  { name: 'En cours', id: 'l03dgl3k9eqlfklpdk1mkd0u', status: 'inProgress', color: 'bg-yellow-300' },
  { name: 'Prêt à servir', id: 'vkguwx74i3hdcb25n7xzqrh6', status: 'ready', color: 'bg-blue-100' },
];

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
    <View className={`shadow px-2 py-1 ${statusStyles[status] || statusStyles.waiting}`}>
      <Text className="text-xs font-medium">{statusTexts[status] || ''}</Text>
    </View>
  );
});

const OrderCard = React.memo(({ order, status, onStatusChange }: { 
    order: Order;
    status: keyof typeof statusStyles;
    onStatusChange: (order: Order, newStatus: 'waiting' | 'inProgress' | 'ready') => void; 
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const toggleExpanded = useCallback(() => setIsExpanded(prev => !prev), []);

    return (
      <View className="bg-white shadow mb-3">
        <View className="p-3">
          <View className="flex-row justify-between items-start mb-2.5 pb-2.5 border-b border-gray-100">
            <Text className="text-gray-900 text-sm font-medium">{order.id}</Text>
            <Text className="text-gray-600 text-sm">{order?.orderItems?.length || 0} ARTICLE{order?.orderItems?.length  > 1 ? 'S' : ''}</Text>
          </View>
          
          <View className="w-full flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-gray-900 font-bold mb-1">
                Table {order?.table?.name}
              </Text>
              <Text className="text-gray-500 text-xs flex-wrap">
                Commande lancé à {formatDate(order.createdAt, DateFormat.TIME)}
              </Text>
            </View>
            <View className="flex-row items-center ml-2">
              <StatusBadge status={status}/>
              <TouchableOpacity 
                onPress={toggleExpanded}
                className="ml-2"
              >
                <View>
                  {isExpanded ? (
                    <ChevronUp size={24} color="#2A2E33" />
                  ) : (
                    <ChevronDown size={24} color="#2A2E33" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
          {isExpanded && (
            <>
              <View className="p-4">
                {order?.orderItems?.length ? order.orderItems.map((orderItem, index) => (
                  <View key={index} className="flex-row items-center mb-2">
                    {/* <View className={`w-5 h-5 border mr-3 items-center justify-center`}>
                    </View> */}
                    <Text className="text-sm mr-3">-</Text>
                    <View>
                      <Text className="text-gray-800 text-sm">{orderItem.item.name}</Text>
                      <Text className="text-gray-500 text-xs">{orderItem.note}</Text>
                    </View>
                  </View>
                )) :
                  <Text className="text-gray-500 text-sm">Aucun article</Text>
                }
              </View>
            </>
          )}
          <View
            className="flex flex-row justify-between gap-3"
            style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center'}}
          >
            {(status === 'ready' || status === 'inProgress') ? (
              <View className="w-1/3">
                <Button
                  onPress={() =>
                    status === 'ready'
                      ? onStatusChange(order, 'inProgress')
                      : onStatusChange(order, 'waiting')
                  }
                  className="mt-2 flex items-center justify-center"
                  style={{ borderWidth: 1, borderColor: '#D7D7D7', backgroundColor: 'white' }}
                >
                  <MoveLeft size={24} color="black" />
                </Button>
              </View>
            ) : (
              <View className="w-1/3" />
            )}
            {(status === 'waiting' || status === 'inProgress') && (
              <View className="w-1/3">
                <Button
                  onPress={() => status === 'waiting' ? onStatusChange(order, 'inProgress') : onStatusChange(order, 'ready')}
                  className="mt-2 flex items-center justify-center"
                  style={{ borderWidth: 1, borderColor: '#D7D7D7', backgroundColor: 'white' }}>
                  <MoveRight
                    size={24} 
                    color={'black'}
                  />
                </Button>
              </View>
            )}
          </View>
        </View>
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
  <View className="flex-1 bg-gray-100 shadow">
    <View className={` ${headerColor} flex flex-row justify-center py-3`}>
      <Text className="font-bold text-sm">{title} : {orders?.length || 0} </Text>
    </View>
    <ScrollView className="flex-1 flex-column p-3">
      {orders && orders.length > 0 ? (
        orders.map((order) => (
          <OrderCard key={order.id} order={order} status={status} onStatusChange={onStatusChange}/>
        ))
      ) : (
        <View className="flex-1 flex items-center">
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

  const handleStatusChange = useCallback(
    async (order: Order, newStatus: 'waiting' | 'inProgress' | 'ready') => {
      try {
        const statusValue = statusId[newStatus];
        await orderApiService.update(order.id, { statusId: statusValue })
        const response = await orderApiService.update(order.id, { statusId: statusValue });
        const updatedOrder: Order = response;
        setMenuItems((prevItems) => {
          const oldStatusId = order.statusId;
          const updatedOldList = (prevItems[oldStatusId] || []).filter((o) => o.id !== order.id);
          const updatedNewList = [ ...(prevItems[statusValue] || []), updatedOrder ];
          return {
            ...prevItems,
            [oldStatusId]: updatedOldList,
            [statusValue]: updatedNewList,
          };1
        });
      } catch (err) {
        console.error('Failed to update order status', err);
      }
    },
    []
  );

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    const initializeSocket = async () => {
      // const BASE_URL = 'http://192.168.1.136:3333' // flo
      const BASE_URL = 'http://192.168.1.67:3333';
      const socket = io(BASE_URL, { autoConnect: false })
      const token = await storageService.getItem('token');
      socket.auth = { token: token };
      socket.connect()
      socket.on('newOrder', (data: Order) => {
        setMenuItems(prevItems => ({
          ...prevItems,
          [data.statusId]: [...(prevItems[data.statusId] || []), data]
        }));
      });
      socket.on('disconnect', () => { console.log('Disconnected from socket server') });
      socket.on('error', (error) => { console.error('Socket error:', error) });
      return () => {
        socket.disconnect();
      };
    }
    initializeSocket();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 flex-row gap-7 p-7 h-full">
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
  );
}