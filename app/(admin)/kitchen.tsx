import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Order } from "~/types/order.types";
import { orderApiService } from "~/api/order.api";
import { getMostImportantStatus } from '~/lib/utils';
import { useSocket } from '~/hooks/useSocket';
import { Status } from "~/types/status.enum";
import { EventType } from '~/hooks/useSocket/types';
import { orderItemApiService } from '~/api/order-item.api';
import OrderColumn from '~/components/Kitchen/OrderColumn';
import { OrderItem } from '~/types/order-item.types';

const AVAILABLE_STATUSES = [
  Status.PENDING,
  Status.INPROGRESS,
  Status.READY,
];

function useOrderGrouping(fetchedOrders: Order[], fetchedOrderItems: OrderItem[]) {
  const groupedOrders = useMemo(() => {
    const orderMap = new Map();
    
    fetchedOrderItems.forEach(item => {
      const order = fetchedOrders.find(o => o.id === item.orderId);
      if (!order) return;
      
      const key = `${order.id}-${item.status}`;
      if (!orderMap.has(key)) {
        orderMap.set(key, { ...order, status: item.status, orderItems: [item] });
      } else {
        orderMap.get(key).orderItems.push(item);
      }
    });

    return orderMap;
  }, [fetchedOrders, fetchedOrderItems]);

  return groupedOrders;
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const groupedOrders = useOrderGrouping(orders, orderItems);

  const loadAllData = useCallback(async () => {
    const [ordersData, orderItemsData] = await Promise.all([
      orderApiService.getAll(`status[operator]=in&${AVAILABLE_STATUSES.map((s) => `status[values]=${s}`).join('&')}&perPage=100`),
      orderItemApiService.getAll(`status[operator]=in&${AVAILABLE_STATUSES.map((s) => `status[values]=${s}`).join('&')}&perPage=100`)
    ]);
    
    setOrders(ordersData.data);
    setOrderItems(orderItemsData.data);
  }, []);

  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected || !socket) return;
    socket.on(EventType.ORDER_ITEMS_PENDING, async ({ orderItems }: { orderItems: OrderItem[] }) => {
      console.log('Received ORDER_ITEMS_PENDING event:', orderItems);
      setOrderItems(prevItems => [...prevItems.filter(i => !orderItems.map(x => x.id).includes(i.id)), ...orderItems]);
      for (const orderItem of orderItems) {
        const order = orders.find(o => o.id === orderItem.orderId);
        if (!order) {
          const newOrder = await orderApiService.get(orderItem.orderId);
          setOrders(prevOrders => [...prevOrders, newOrder]);
        }
      }
    });

    return () => {
      socket.off(EventType.ORDER_ITEMS_PENDING);
    }
   }, [isConnected, socket]);

  useEffect(() => {
    loadAllData().then(() => setIsLoading(false));
  }, []);

  const handleStatusChange = async (order: Order, newStatus: Status) => {
    try {
      await orderItemApiService.updateManyStatus(order.orderItems.map(oi => oi.id), newStatus)
   
      const updatedItems = orderItems.map(item => 
        order.orderItems.some(orderItem => orderItem.id === item.id)
          ? { ...item, status: newStatus }
          : item
      );
      
      const allOrderItems = updatedItems.filter(item => item.orderId === order.id);
      const calculatedNewOrderStatus = getMostImportantStatus(allOrderItems.map(item => item.status));
      
      setOrderItems(updatedItems);
      
      if (order.status !== calculatedNewOrderStatus) {
        await orderApiService.update(order.id, { status: calculatedNewOrderStatus });
        setOrders(prevOrders => prevOrders.map(o => 
          o.id === order.id ? { ...o, status: calculatedNewOrderStatus } : o
        ));
      }
   
      // await emit(EventType.UPDATE_ORDER_STATUS, {
      //   orderId: order.id,
      //   orderStatus: calculatedNewOrderStatus,
      //   orderItemIds: order.orderItems.map(item => item.id),
      //   orderItemStatus: newStatus,
      // });
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cuisine</Text>
        <Text style={styles.headerSubtitle}>Gestion des commandes en temps réel</Text>
      </View>
      
      <View style={styles.columnsContainer}>
        {AVAILABLE_STATUSES.map((status, index) => (
          <OrderColumn
            key={status}
            orders={Array.from(groupedOrders.values())
              .filter(order => order.status === status)} 
            status={status}
            onStatusChange={handleStatusChange}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFBFB',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBFBFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#2A2E33',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A2E33',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  columnsContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
});