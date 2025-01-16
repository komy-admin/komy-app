import { Pressable } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Order } from "~/types/order.types";
import OrderCard from "./OrderCard";

interface OrderListProps {
  orders: Order[];
  onOrderPress: (order: Order) => void;
}

export default function OrderList({orders, onOrderPress}: OrderListProps) {
  return (
    <ScrollView>
      {orders.map(order => (
        <Pressable key={order.id} onPress={() => onOrderPress(order)}>
          <OrderCard order={order} />
        </Pressable>
      ))}
    </ScrollView>
  );
}
