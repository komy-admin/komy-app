import { View, Text, Pressable, ScrollView } from 'react-native';
import { ChevronDown, ChevronUp, Wine, UtensilsCrossed, Soup, Dessert, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ItemType } from '~/types/item-type.types';
import { OrderItem } from '~/types/order-item.types';
import { Status } from '~/types/status.enum';
import { DateFormat, formatDate, getMostImportantStatus, getStatusColor, getStatusText, getNextStatus, getPreviousStatus } from '~/lib/utils';
import { Button } from '../ui';
import StatusSelector from './StatusSelector';
import { Order } from '~/types/order.types';

interface OrderItemsGroupProps {
  itemType: ItemType;
  status: Status;
  orderItems: OrderItem[];
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateStatus: (newStatus: Status) => void;
}

const getItemTypeIcon = (itemTypeName: string) => {
  switch (itemTypeName) {
    case 'Boissons':
      return <Wine size={24} color="#1A1A1A" strokeWidth={1.5} />;
    case 'Entrées':
      return <UtensilsCrossed size={24} color="#1A1A1A" strokeWidth={1.5} />;
    case 'Plats':
      return <Soup size={24} color="#1A1A1A" strokeWidth={1.5} />;
    case 'Desserts':
      return <Dessert size={24} color="#1A1A1A" strokeWidth={1.5} />;
    default:
      return <UtensilsCrossed size={24} color="#1A1A1A" strokeWidth={1.5} />;
  }
};

const OrderItemsGroup = ({ itemType, status, orderItems, isExpanded, onToggle, onUpdateStatus }: OrderItemsGroupProps) => {
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const itemStatus = getMostImportantStatus(orderItems.map(orderItem => orderItem.status));
  const nextStatus = getNextStatus(itemStatus);
  const previousStatus = getPreviousStatus(itemStatus);

  const handleSwipeComplete = (direction: 'next' | 'previous') => {
    if (direction === 'next' && nextStatus) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onUpdateStatus(nextStatus);
    } else if (direction === 'previous' && previousStatus) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onUpdateStatus(previousStatus);
    }
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Swipe vers la droite (statut suivant)
      if (event.translationX > 0 && nextStatus) {
        translateX.value = Math.min(event.translationX, 100);
        opacity.value = Math.max(1 - event.translationX / 200, 0.7);
      }
      // Swipe vers la gauche (statut précédent)
      else if (event.translationX < 0 && previousStatus) {
        translateX.value = Math.max(event.translationX, -100);
        opacity.value = Math.max(1 - Math.abs(event.translationX) / 200, 0.7);
      }
    })
    .onEnd((event) => {
      if (event.translationX > 80 && nextStatus) {
        // Swipe vers la droite complété, passer au statut suivant
        translateX.value = withSpring(0);
        opacity.value = withSpring(1);
        runOnJS(handleSwipeComplete)('next');
      } else if (event.translationX < -80 && previousStatus) {
        // Swipe vers la gauche complété, revenir au statut précédent
        translateX.value = withSpring(0);
        opacity.value = withSpring(1);
        runOnJS(handleSwipeComplete)('previous');
      } else {
        // Retourner à la position initiale - vibration légère pour indiquer l'échec
        if (Math.abs(event.translationX) > 20) {
          runOnJS(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light))();
        }
        translateX.value = withSpring(0);
        opacity.value = withSpring(1);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });

  const rightBackgroundAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: translateX.value > 0 ? translateX.value / 100 : 0,
    };
  });

  const leftBackgroundAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: translateX.value < 0 ? Math.abs(translateX.value) / 100 : 0,
    };
  });

  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ position: 'relative' }}>
        {/* Background indicator pour swipe vers la droite (statut suivant) */}
        {nextStatus && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: getStatusColor(nextStatus),
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingLeft: 20,
                zIndex: 0,
              },
              rightBackgroundAnimatedStyle,
            ]}
          >
            <ArrowRight size={24} color="#1A1A1A" strokeWidth={2} />
            <Text style={{
              marginLeft: 8,
              fontSize: 14,
              fontWeight: '600',
              color: '#1A1A1A'
            }}>
              {getStatusText(nextStatus)}
            </Text>
          </Animated.View>
        )}

        {/* Background indicator pour swipe vers la gauche (statut précédent) */}
        {previousStatus && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: getStatusColor(previousStatus),
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 20,
                zIndex: 0,
              },
              leftBackgroundAnimatedStyle,
            ]}
          >
            <Text style={{
              marginRight: 8,
              fontSize: 14,
              fontWeight: '600',
              color: '#1A1A1A'
            }}>
              {getStatusText(previousStatus)}
            </Text>
            <ArrowLeft size={24} color="#1A1A1A" strokeWidth={2} />
          </Animated.View>
        )}

        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              {
                backgroundColor: `${getStatusColor(itemStatus)}80`,
                borderRadius: 12,
                overflow: 'hidden',
                zIndex: 1,
              },
              animatedStyle,
            ]}
          >
            <Pressable
              onPress={onToggle}
              style={[{
                padding: 16,
              }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                  <View style={{
                    backgroundColor: 'white',
                    borderRadius: 20,
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {getItemTypeIcon(itemType.name)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600' }}>{itemType.name}</Text>
                    <Text style={{ fontSize: 14, color: '#666666' }}>{getStatusText(itemStatus)}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {(nextStatus || previousStatus) && (
                    <Text style={{ fontSize: 11, color: '#666666', textAlign: 'center' }}>
                      {previousStatus && nextStatus ? '← Swiper →' :
                        nextStatus ? 'Swiper →' :
                          '← Swiper'}
                    </Text>
                  )}
                  {isExpanded ? (
                    <ChevronUp size={24} color="#1A1A1A" />
                  ) : (
                    <ChevronDown size={24} color="#1A1A1A" />
                  )}
                </View>
              </View>
            </Pressable>

            {isExpanded && (
              <View>
                {orderItems.map((orderItem) => (
                  <View
                    key={orderItem.id}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderTopWidth: 1,
                      borderTopColor: '#E5E7EB',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16 }}>{orderItem.item.name}</Text>
                      {orderItem.note && (
                        <Text style={{ fontSize: 14, color: '#666666', fontStyle: 'italic' }}>
                          Commentaire : {orderItem.note}
                        </Text>
                      )}
                    </View>
                    <View>
                      <Text style={{ fontSize: 14, color: '#666666' }}>
                        {formatDate(orderItem.updatedAt, DateFormat.TIME)}
                      </Text>
                      <Text style={{
                        fontSize: 14,
                        color: '#666666',
                        textAlign: 'right'
                      }}>
                        {getStatusText(itemStatus)}
                      </Text>
                    </View>
                  </View>
                ))}
                <Button
                  onPress={() => setShowStatusSelector(true)}
                  style={{ backgroundColor: '#2A2E33', margin: 16, borderRadius: 8 }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: '#FBFBFB',
                      fontWeight: '500',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                    }}
                  >
                    Modifier statut
                  </Text>
                </Button>
                <StatusSelector
                  visible={showStatusSelector}
                  currentStatus={itemStatus}
                  onClose={() => setShowStatusSelector(false)}
                  onStatusSelect={onUpdateStatus}
                />
              </View>
            )}
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
};

interface OrderDetailViewProps {
  order: Order;
  itemTypes: ItemType[];
  onStatusUpdate: (orderItems: OrderItem[], status: Status) => void;
}

export default function OrderDetailView({ order, itemTypes, onStatusUpdate }: OrderDetailViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const toggleExpanded = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  // Créer une structure de groupement par type ET par statut
  const createGroupedItems = () => {
    const groups: Array<{
      id: string;
      itemType: ItemType;
      status: Status;
      orderItems: OrderItem[];
    }> = [];

    // Pour chaque type d'item
    itemTypes.forEach(itemType => {
      // Récupérer tous les orderItems de ce type
      const itemsOfType = order.orderItems.filter(
        orderItem => orderItem.item.itemType.id === itemType.id
      );

      if (itemsOfType.length === 0) return;

      // Grouper par statut au sein de ce type
      const statusGroups = itemsOfType.reduce((acc, orderItem) => {
        const status = orderItem.status;
        if (!acc[status]) {
          acc[status] = [];
        }
        acc[status].push(orderItem);
        return acc;
      }, {} as Record<Status, OrderItem[]>);

      // Créer un groupe pour chaque combinaison type + statut
      Object.entries(statusGroups).forEach(([status, orderItems]) => {
        groups.push({
          id: `${itemType.id}-${status}`,
          itemType,
          status: status as Status,
          orderItems
        });
      });
    });

    // Trier les groupes : d'abord par type, puis par priorité de statut
    const statusPriority: Record<Status, number> = {
      [Status.ERROR]: 1,
      [Status.DRAFT]: 2,
      [Status.PENDING]: 3,
      [Status.INPROGRESS]: 4,
      [Status.READY]: 5,
      [Status.SERVED]: 6,
      [Status.TERMINATED]: 7,
    };

    return groups.sort((a, b) => {
      // D'abord trier par nom de type
      const typeComparison = a.itemType.name.localeCompare(b.itemType.name);
      if (typeComparison !== 0) return typeComparison;

      // Puis par priorité de statut - avec fallback pour les statuts non définis
      const aPriority = statusPriority[a.status] ?? 999;
      const bPriority = statusPriority[b.status] ?? 999;
      return aPriority - bPriority;
    });
  };

  const groupedItems = createGroupedItems();

  return (
    <ScrollView
      style={{ flex: 1, padding: 16 }}
      showsVerticalScrollIndicator={true}
      bounces={true}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled"
      removeClippedSubviews={false}
      scrollEnabled={true}
      nestedScrollEnabled={true}
    >
      {groupedItems.map((group) => (
        <OrderItemsGroup
          key={group.id}
          itemType={group.itemType}
          status={group.status}
          orderItems={group.orderItems}
          isExpanded={expandedGroups.includes(group.id)}
          onToggle={() => toggleExpanded(group.id)}
          onUpdateStatus={(newStatus) => onStatusUpdate(group.orderItems, newStatus)}
        />
      ))}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}