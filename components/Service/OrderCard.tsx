// import { View, Text, StyleSheet } from 'react-native';
// import { DateFormat, formatDate, getMostImportantStatus, getStatusColor, getStatusText } from "~/lib/utils";
// import { Order } from "~/types/order.types";
// import { Status } from "~/types/status.enum";

// interface OrderCardProps {
//   order: Order;
// }

// const getOrderType = (order: Order): string => {
//   console.log(order);
//   const statuses = order.orderItems.map(item => item.status);
//   const mostImportantStatus = getMostImportantStatus(statuses);
//   return order.orderItems.find(item => item.status === mostImportantStatus)?.item.itemType.name!;
// };

// export default function OrderCard({ order }: OrderCardProps) {
//   const statusColor = getStatusColor(order.status);
//   const statusText = getStatusText(order.status);
//   const orderType = getOrderType(order);

//   return (
//     <View style={[styles.container, { backgroundColor: `${statusColor}80` }]}>
//       <View style={[styles.tableCode, { backgroundColor: statusColor }]}>
//         <Text style={styles.tableCodeText}>
//           {order.table.name}
//         </Text>
//       </View>
      
//       <View style={styles.content}>
//         <Text style={styles.title}>{orderType}</Text>
//         <Text style={styles.status}>
//           {statusText}
//         </Text>
//       </View>

//       <View style={styles.rightContent}>
//         <Text style={styles.time}>{formatDate(order.updatedAt, DateFormat.TIME)}</Text>
//         <Text style={styles.arrow}>›</Text>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//     marginVertical: 8,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#E5E5E5',
//   },
//   tableCode: {
//     width: 44,
//     height: 44,
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   tableCodeText: {
//     color: 'grey',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   content: {
//     flex: 1,
//     marginLeft: 12,
//   },
//   title: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1A1A1A',
//   },
//   status: {
//     fontSize: 14,
//     marginTop: 4,
//   },
//   rightContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   time: {
//     fontSize: 14,
//     color: '#666666',
//     marginRight: 8,
//   },
//   arrow: {
//     fontSize: 20,
//     color: '#666666',
//   },
// });

import { Alert, Animated, StyleSheet, Text, View } from 'react-native';
import { DateFormat, formatDate, getMostImportantStatus, getStatusColor, getStatusText } from "~/lib/utils";
import { Order } from "~/types/order.types";
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { useCallback, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react-native';
import { ConfirmDialog } from '../ui/dialog';

interface OrderCardProps {
  order: Order;
  onDelete?: (order: Order) => void;
}

const SWIPE_THRESHOLD = -80;

const getOrderType = (order: Order): string => {
  const statuses = order.orderItems.map(item => item.status);
  const mostImportantStatus = getMostImportantStatus(statuses);
  return order.orderItems.find(item => item.status === mostImportantStatus)?.item.itemType.name || '';
};

export default function OrderCard({ order, onDelete }: OrderCardProps) {
  const statusColor = getStatusColor(order.status);
  const statusText = getStatusText(order.status);
  const orderType = getOrderType(order);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const showDeleteConfirmation = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const translateX = useRef(new Animated.Value(0)).current;
  const swipeRef = useRef(0);

  const resetPosition = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }, [translateX]);

  const onGestureEvent = useCallback(
    (event: PanGestureHandlerGestureEvent) => {
      const { translationX } = event.nativeEvent;
      swipeRef.current = translationX;
      console.log(translationX);
      
      if (translationX <= 0 && translationX >= (SWIPE_THRESHOLD - 10)) {
        translateX.setValue(translationX);
      }
    },
    [translateX]
  );

  const onGestureEnd = useCallback(() => {
    if (swipeRef.current <= SWIPE_THRESHOLD) {
      showDeleteConfirmation();
    } else {
      resetPosition();
    }
  }, [showDeleteConfirmation, resetPosition]);

  const deleteIconOpacity = translateX.interpolate({
    inputRange: [SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
  });

  return (
    <View style={styles.wrapper}>
      {/* Background delete view */}
      <Animated.View
        style={[
          styles.deleteBackground,
          {
            opacity: deleteIconOpacity,
          },
        ]}
      >
        <Trash2 color="white" size={24} />
      </Animated.View>

      {/* Card content */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onEnded={onGestureEnd}
      >
        <Animated.View
          style={[
            styles.container,
            { backgroundColor: `${statusColor}80` },
            { transform: [{ translateX }] },
          ]}
        >
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
        </Animated.View>
      </PanGestureHandler>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={(value) => {
          setShowDeleteDialog(value);
          resetPosition();
        }}
        title="Supprimer la commande"
        content="Êtes-vous sûr de vouloir supprimer cette commande ?"
        onCancel={resetPosition}
        onConfirm={() => {
          resetPosition();
          onDelete?.(order);
        }}
        confirmText="Supprimer"
        variant="destructive"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginVertical: 8,
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: 'white',
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