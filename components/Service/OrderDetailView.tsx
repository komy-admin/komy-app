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
import { OrderLine, OrderLineType } from '~/types/order-line.types';
import { Status } from '~/types/status.enum';
import { getOrderLinesGlobalStatus, getStatusColor, getStatusText, getNextStatus, getPreviousStatus } from '~/lib/utils';
import { Button } from '../ui';
import StatusSelector from './StatusSelector';
import { Order } from '~/types/order.types';
import MenuGroupView from './MenuGroupView';

interface OrderItemsGroupProps {
  itemType: ItemType;
  status: Status;
  orderLines: OrderLine[];
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

const OrderItemsGroup = ({ itemType, status, orderLines, isExpanded, onToggle, onUpdateStatus }: OrderItemsGroupProps) => {
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const nextStatus = status ? getNextStatus(status) : null;
  const previousStatus = status ? getPreviousStatus(status) : null;

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
                backgroundColor: `${getStatusColor(status)}80`,
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
                    <Text style={{ fontSize: 14, color: '#666666' }}>{status ? getStatusText(status) : 'Aucun statut'}</Text>
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
                {orderLines.map((orderLine, index) => {
                  if (orderLine.type === OrderLineType.ITEM && orderLine.item) {
                    return (
                      <View
                        key={orderLine.id}
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
                          <Text style={{ fontSize: 16 }}>{orderLine.item.name} (x{orderLine.quantity})</Text>
                          {orderLine.note && (
                            <Text style={{ fontSize: 14, color: '#666666', fontStyle: 'italic' }}>
                              Commentaire : {orderLine.note}
                            </Text>
                          )}
                        </View>
                        <View>
                          <Text style={{
                            fontSize: 14,
                            color: '#666666',
                            textAlign: 'right'
                          }}>
                            {orderLine.status ? getStatusText(orderLine.status) : 'Aucun statut'}
                          </Text>
                        </View>
                      </View>
                    );
                  } else if (orderLine.type === OrderLineType.MENU && orderLine.items) {
                    return (
                      <View key={orderLine.id}>
                        <View
                          style={{
                            paddingVertical: 8,
                            paddingHorizontal: 16,
                            borderTopWidth: 1,
                            borderTopColor: '#E5E7EB',
                            backgroundColor: '#F8F9FA',
                          }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#666' }}>
                            Menu: {orderLine.menu?.name} (x{orderLine.quantity})
                          </Text>
                        </View>
                        {orderLine.items.map((menuItem) => (
                          <View
                            key={menuItem.id}
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              paddingVertical: 8,
                              paddingHorizontal: 32,
                              borderTopWidth: 1,
                              borderTopColor: '#F0F0F0',
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 15 }}>{menuItem.item.name}</Text>
                              <Text style={{ fontSize: 12, color: '#888' }}>Catégorie: {menuItem.categoryName}</Text>
                            </View>
                            <View>
                              <Text style={{
                                fontSize: 14,
                                color: '#666666',
                                textAlign: 'right'
                              }}>
                                {getStatusText(menuItem.status)}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    );
                  }
                  return null;
                })}
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
                {status && (
                  <StatusSelector
                    visible={showStatusSelector}
                    currentStatus={status}
                    onClose={() => setShowStatusSelector(false)}
                    onStatusSelect={onUpdateStatus}
                  />
                )}
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
  onStatusUpdate: (orderLines: OrderLine[], status: Status) => void;
}

export default function OrderDetailView({ order, itemTypes, onStatusUpdate }: OrderDetailViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleExpanded = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const toggleMenuExpanded = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  // Créer une structure de groupement par type d'item pour les OrderLines
  const createGroupedOrderLines = () => {
    const groups: Array<{
      id: string;
      itemType: ItemType;
      status: Status;
      orderLines: OrderLine[];
    }> = [];

    if (!order.lines || order.lines.length === 0) return [];

    // Pour chaque type d'item
    itemTypes.forEach(itemType => {
      // Filtrer les OrderLines qui correspondent à ce type d'item
      const linesOfType = order.lines.filter(line => {
        if (line.type === OrderLineType.ITEM && line.item) {
          return (line.item as any).itemTypeId === itemType.id;
        } else if (line.type === OrderLineType.MENU && line.items) {
          // Pour les menus, vérifier si des items du menu correspondent à ce type
          return line.items.some(menuItem =>
            (menuItem.item as any).itemTypeId === itemType.id
          );
        }
        return false;
      });

      if (linesOfType.length === 0) return;

      const globalStatus = getOrderLinesGlobalStatus(linesOfType);

      groups.push({
        id: `${itemType.id}-${globalStatus}`,
        itemType,
        status: globalStatus,
        orderLines: linesOfType
      });
    });

    // Trier les groupes par nom de type
    return groups.sort((a, b) => a.itemType.name.localeCompare(b.itemType.name));
  };

  const groupedOrderLines = createGroupedOrderLines();

  // Séparer les menus des autres items pour l'affichage
  const menuOrderLines = order.lines?.filter(line => line.type === OrderLineType.MENU) || [];

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
      {/* Section Menus */}
      {menuOrderLines.length > 0 && (
        <View>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#1A1A1A',
            marginBottom: 12,
          }}>
            🍽️ Menus
          </Text>
          {menuOrderLines.map((orderLine) => (
            <MenuGroupView
              key={orderLine.id}
              orderLine={orderLine}
              isExpanded={expandedMenus.includes(orderLine.id)}
              onToggle={() => toggleMenuExpanded(orderLine.id)}
              onStatusUpdate={(orderLineItems, status) => onStatusUpdate([orderLine], status)}
            />
          ))}
        </View>
      )}

      {/* Section Items par type */}
      {groupedOrderLines.length > 0 && (
        <View style={{ marginTop: menuOrderLines.length > 0 ? 24 : 0 }}>
          {menuOrderLines.length > 0 && (
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#1A1A1A',
              marginBottom: 12,
            }}>
              🍹 Items par catégorie
            </Text>
          )}
          {groupedOrderLines.map((group) => (
            <OrderItemsGroup
              key={group.id}
              itemType={group.itemType}
              status={group.status}
              orderLines={group.orderLines}
              isExpanded={expandedGroups.includes(group.id)}
              onToggle={() => toggleExpanded(group.id)}
              onUpdateStatus={(newStatus) => onStatusUpdate(group.orderLines, newStatus)}
            />
          ))}
        </View>
      )}

      {/* Message si aucun item */}
      {menuOrderLines.length === 0 && groupedOrderLines.length === 0 && (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 40,
        }}>
          <Text style={{
            fontSize: 16,
            color: '#666666',
            textAlign: 'center',
          }}>
            Aucun item dans cette commande
          </Text>
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}