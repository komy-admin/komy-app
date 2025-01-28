import { Pressable, ScrollView } from "react-native";
import { Order } from "~/types/order.types";
import OrderCard from "./OrderCard";

interface OrderListProps {
  orders: Order[];
  onOrderPress: (order: Order) => void;
  onOrderDelete?: (order: Order) => void;
}

export default function OrderList({orders, onOrderPress, onOrderDelete}: OrderListProps) {
  return (
    <ScrollView>
      {orders.map(order => (
        <Pressable key={order.id} onPress={() => onOrderPress(order)}>
          <OrderCard order={order} onDelete={onOrderDelete} />
        </Pressable>
      ))}
    </ScrollView>
  );
}
