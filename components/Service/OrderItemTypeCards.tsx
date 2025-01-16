import { View, Text, Pressable, ScrollView } from 'react-native';
import { ChevronDown, ChevronUp, Wine, UtensilsCrossed, Soup, Dessert } from 'lucide-react-native';
import { useState } from 'react';
import { ItemType } from '~/types/item-type.types';
import { OrderItem } from '~/types/order-item.types';
import { Status } from '~/types/status.enum';
import { DateFormat, formatDate, getMostImportantStatus, getStatusColor, getStatusText } from '~/lib/utils';
import { Button } from '../ui';
import StatusSelector from './StatusSelector';
import { orderItemApiService } from '~/api/order-item.api';
import { Order } from '~/types/order.types';
import { orderApiService } from '~/api/order.api';

interface OrderItemsGroupProps {
  itemType: ItemType;
  orderItems: OrderItem[];
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateStatus: (newStatus: Status) => void;
}

const getItemTypeIcon = (itemTypeName: string) => {
  switch(itemTypeName) {
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

const OrderItemsGroup = ({ itemType, orderItems, isExpanded, onToggle, onUpdateStatus }: OrderItemsGroupProps) => {
  const [showStatusSelector, setShowStatusSelector] = useState(false);

  const itemStatus = getMostImportantStatus(orderItems.map(orderItem => orderItem.status));

  return (
    <View style={{ marginBottom: 8 }}>
      <View
        style={[{
          backgroundColor: getStatusColor(itemStatus),
          borderRadius: 12,
          overflow: 'hidden',
        }]}
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
            {isExpanded ? (
              <ChevronUp size={24} color="#1A1A1A" />
            ) : (
              <ChevronDown size={24} color="#1A1A1A" />
            )}
          </View>
        </Pressable>
        
        {isExpanded && (
          <View>
            {orderItems.map((orderItem, index) => (
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
      </View>
    </View>
  );
};

interface OrderViewProps {
  order: Order;
  itemTypes: ItemType[];
  onStatusUpdate: (order: Order) => void;
}

export default function OrderView({ order, itemTypes, onStatusUpdate }: OrderViewProps) {
  const [expandedTypes, setExpandedTypes] = useState<string[]>([]);

  const toggleExpanded = (typeId: string) => {
    setExpandedTypes(prev => 
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  // Grouper les orderItems par itemType
  const groupedItems = itemTypes.reduce((acc, itemType) => {
    const items = order.orderItems.filter(
      orderItem => orderItem.item.itemType.id === itemType.id
    );
    if (items.length > 0) {
      acc[itemType.id] = {
        itemType,
        items
      };
    }
    return acc;
  }, {} as Record<string, { itemType: ItemType; items: OrderItem[] }>);

  const handleUpdateStatus = async (items: OrderItem[], newStatus: Status) => {
    await Promise.all(
      items.map(async orderItem => {
        await orderItemApiService.update(orderItem.id, { status: newStatus });
      })
    )
    const updatedItems = order.orderItems.map(orderItem => {
      if (items.includes(orderItem)) {
        return { ...orderItem, status: newStatus };
      }
      return orderItem;
    });
    const mostImportantStatus = getMostImportantStatus(updatedItems.map(orderItem => orderItem.status));
    const updatedOrder = await orderApiService.update(order.id, { status: mostImportantStatus });
    onStatusUpdate(updatedOrder);
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      {Object.values(groupedItems).map(({ itemType, items }) => (
        <OrderItemsGroup
          key={itemType.id}
          itemType={itemType}
          orderItems={items}
          isExpanded={expandedTypes.includes(itemType.id)}
          onToggle={() => toggleExpanded(itemType.id)}
          onUpdateStatus={(newStatus) => {handleUpdateStatus(items, newStatus )}}
        />
      ))}
    </ScrollView>
  );
}