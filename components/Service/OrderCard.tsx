import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { DateFormat, formatDate, getOrderGlobalStatus, getStatusColor, getStatusText } from "~/lib/utils";
import { Order } from "~/types/order.types";
import { OrderLine, OrderLineType } from "~/types/order-line.types";
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import React, { useCallback, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react-native';
import { ConfirmDialog } from '~/components/ui';

interface OrderCardProps {
  order: Order;
  onDelete?: (order: Order) => void;
}

const SWIPE_THRESHOLD = -80;
const ACTIVATION_DISTANCE = 15;

const getOrderType = (order: Order): string => {
  if (!order.lines || order.lines.length === 0) return '';

  let itemTypeName = '';

  for (const line of order.lines) {
    if (line.type === OrderLineType.ITEM) {
      // Prendre le nom du premier item type trouvé
      if (!itemTypeName && line.item) {
        itemTypeName = (line.item as any).itemType?.name || 'Article';
      }
    } else if (line.type === OrderLineType.MENU && line.items) {
      line.items.forEach(menuItem => {
        // Prendre le nom du premier item type trouvé
        if (!itemTypeName && menuItem.item) {
          itemTypeName = (menuItem.item as any).itemType?.name || 'Article';
        }
      });
    }
    
    if (itemTypeName) break; // Arrêter dès qu'on a trouvé un type
  }

  return itemTypeName;
};

export default function OrderCard({ order, onDelete }: OrderCardProps) {
  const mostImportantStatus = getOrderGlobalStatus(order);
  const statusColor = getStatusColor(mostImportantStatus);
  const statusText = getStatusText(mostImportantStatus);
  const orderType = getOrderType(order);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const translateX = useRef(new Animated.Value(0)).current;
  const swipeRef = useRef(0);
  const isSwipeActive = useRef(false);

  const resetPosition = useCallback(() => {
    isSwipeActive.current = false;
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }, [translateX]);

  const onGestureEvent = useCallback(
    (event: PanGestureHandlerGestureEvent) => {
      const { translationX, velocityX } = event.nativeEvent;
      swipeRef.current = translationX;

      // Activer le swipe seulement si le mouvement est principalement horizontal
      // et dépasse la distance d'activation
      if (Math.abs(translationX) > ACTIVATION_DISTANCE && Math.abs(velocityX) > Math.abs(event.nativeEvent.velocityY)) {
        isSwipeActive.current = true;
      }

      // Appliquer la transformation seulement si le swipe est actif
      if (isSwipeActive.current && translationX <= 0 && translationX >= (SWIPE_THRESHOLD - 10)) {
        translateX.setValue(translationX);
      }
    },
    [translateX]
  );

  const onHandlerStateChange = useCallback((event: any) => {
    if (event.nativeEvent.state === State.END) {
      if (isSwipeActive.current && swipeRef.current <= SWIPE_THRESHOLD) {
        setShowDeleteDialog(true);
      } else {
        resetPosition();
      }
    } else if (event.nativeEvent.state === State.FAILED || event.nativeEvent.state === State.CANCELLED) {
      resetPosition();
    }
  }, [resetPosition]);

  const deleteIconOpacity = translateX.interpolate({
    inputRange: [SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
  });

  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrapper}>
        <View
          style={[
            styles.container,
            { backgroundColor: `${statusColor}80` },
          ]}
        >
          <View style={[styles.tableCode, { backgroundColor: statusColor }]}>
            <Text style={styles.tableCodeText}>
              {order.table.name}
            </Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{orderType}</Text>
            <Text style={styles.status} numberOfLines={1} ellipsizeMode="tail">
              {statusText}
            </Text>
          </View>

          <View style={styles.rightContent}>
            <Text style={styles.time}>{formatDate(order.updatedAt, DateFormat.TIME)}</Text>
            <Text style={styles.arrow}>›</Text>
          </View>
        </View>

        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Supprimer la commande"
          content="Êtes-vous sûr de vouloir supprimer cette commande ?"
          onCancel={() => setShowDeleteDialog(false)}
          onConfirm={() => onDelete?.(order)}
          confirmText="Supprimer"
          variant="destructive"
        />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.wrapper}>
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
      {/* Les conditions sont importante => scroll vertical sur le parent */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        // CRITIQUE: Configurations pour réduire la priorité du PanGestureHandler
        activeOffsetX={[-ACTIVATION_DISTANCE, ACTIVATION_DISTANCE]} // Seuil d'activation horizontal
        failOffsetY={[-20, 20]} // Échouer si mouvement vertical trop important
        shouldCancelWhenOutside={true} // Annuler si on sort de la zone
        // Réduire la priorité par rapport au scroll parent
        simultaneousHandlers={undefined}
        waitFor={undefined}
        // Améliorer la détection des gestes intentionnels
        minPointers={1}
        maxPointers={1}
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
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{orderType}</Text>
            <Text style={styles.status} numberOfLines={1} ellipsizeMode="tail">
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
          if (!value) resetPosition();
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
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginVertical: 8
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.08)',
      },
    }),
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
    minWidth: 0,
    overflow: 'hidden',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    numberOfLines: 1,
    ...Platform.select({
      web: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
      default: {
        numberOfLines: 1,
      }
    })
  },
  status: {
    fontSize: 14,
    marginTop: 4,
    numberOfLines: 1,
    ...Platform.select({
      web: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
      default: {
        numberOfLines: 1,
      }
    })
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