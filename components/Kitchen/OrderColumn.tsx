import { ScrollView, View } from "react-native";
import { getStatusColor, getStatusText } from "~/lib/utils";
import { Order } from "~/types/order.types";
import { Status } from "~/types/status.enum";
import { Text } from "../ui";
import OrderCard from "./OrderCard";

export default function OrderColumn({ orders = [], status, onStatusChange }: {
  orders: Order[]; 
  status: Status;
  onStatusChange: (order: Order, newStatus: Status) => void;
}) {

  return (
    <View className="flex-1 bg-gray-100 shadow">
      <View className='flex flex-row justify-center py-3' style={{ backgroundColor: getStatusColor(status) }}>
        <Text className="font-bold text-sm">{getStatusText(status)} : {orders?.length || 0} </Text>
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
  );
};