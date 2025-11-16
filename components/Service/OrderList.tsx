import { Platform, Pressable, ScrollView, View } from "react-native";
import { Order } from "~/types/order.types";
import OrderCard from "~/components/Service/OrderCard";

interface OrderListProps {
  orders: Order[];
  onOrderPress: (order: Order) => void;
  onOrderDelete?: (order: Order) => void;
  selectedOrderId?: string;
}

export default function OrderList({ orders, onOrderPress, onOrderDelete, selectedOrderId }: OrderListProps) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 6 }}
      // Optimisations critiques pour tablettes
      showsVerticalScrollIndicator={true}
      bounces={true}
      scrollEventThrottle={16}
      // Gestion des conflits avec les gestes de swipe
      keyboardShouldPersistTaps="handled"
      // Permettre le scroll même avec des gestes imbriqués
      nestedScrollEnabled={true}
      scrollEnabled={true}
      // Éviter les conflits avec les animations des cartes
      removeClippedSubviews={false}
      // Améliorer la détection des gestes sur tablette
      directionalLockEnabled={true}
      // Optimiser pour les interactions tactiles
      alwaysBounceVertical={true}
    >
      {orders.map(order => (
        <Pressable
          key={order.id}
          onPress={() => onOrderPress(order)}
        >
          <OrderCard
            order={order}
            onDelete={onOrderDelete}
            isSelected={order.id === selectedOrderId}
          />
        </Pressable>
      ))}
      {/* Espace en bas pour éviter que le dernier élément soit coupé */}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}