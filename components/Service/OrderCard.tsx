import { View, Text, StyleSheet } from 'react-native';
import { DateFormat, formatDate, getStatusColor, getStatusText } from "~/lib/utils";
import { Order } from "~/types/order.types";
import { Status } from "~/types/status.enum";

interface OrderCardProps {
  order: Order;
}

// const getStatusText = (status: Status): string => {
//   switch (status) {
//     case Status.READY:
//       return 'Prêt';
//     case Status.TERMINATED:
//       return 'Servi';
//     case Status.ERROR:
//       return 'Erreur';
//     case Status.PENDING:
//       return 'En attente';
//     case Status.INPROGRESS:
//       return 'En préparation';
//     default:
//       return 'Brouillon';
//   }
// };

const getOrderType = (order: Order): string => {
  // Cette logique devra être adaptée selon votre besoin spécifique
  // pour déterminer si c'est un dessert, une entrée, ou un plat
  // const firstItem = order.orderItems[0];
  // if (firstItem?.itemType.name === 'dessert') return 'Dessert';
  // if (firstItem?.itemType.name === 'starter') return 'Entrées';
  return 'Plats';
};

export default function OrderCard({ order }: OrderCardProps) {
  const statusColor = getStatusColor(order.status);
  const statusText = getStatusText(order.status);
  const orderType = getOrderType(order);

  return (
    <View style={[styles.container, { backgroundColor: `${statusColor}80` }]}>
      <View style={[styles.tableCode, { backgroundColor: statusColor }]}>
        <Text style={styles.tableCodeText}>
          {order.table.name}
        </Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{orderType}</Text>
        <Text style={styles.status}>
          {statusText}
        </Text>
      </View>

      <View style={styles.rightContent}>
        <Text style={styles.time}>{formatDate(order.updatedAt, DateFormat.TIME)}</Text>
        <Text style={styles.arrow}>›</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  tableCode: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableCodeText: {
    color: 'grey',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  status: {
    fontSize: 14,
    marginTop: 4,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  arrow: {
    fontSize: 20,
    color: '#666666',
  },
});