import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text } from 'react-native';
import { Order } from "~/types/order.types";
import { orderApiService } from "~/api/order.api";
import { getMostImportantStatus } from '~/lib/utils';
import { useSocket } from '~/hooks/useSocket/useSocket';
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

  const { on } = useSocket();

  useEffect(() => {
    on(EventType.ORDER_ITEMS_PENDING, async ({ orderItems }) => {
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
   }, []);

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
      <View className="flex-1 items-center justify-center">
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 flex-row gap-7 p-7 h-full">
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
  );
}