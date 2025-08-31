import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { DateFormat, formatDate, getItemTypeText, getStatusColor, getStatusText, getMostImportantStatus } from '~/lib/utils';
import { ItemTypes } from '~/types/item-type.enum';
import { OrderLine, OrderLineType } from '~/types/order-line.types';
import { Status } from '~/types/status.enum';
import { Button, Separator } from './ui';

interface TableItemsBoxProps {
  orderLines: OrderLine[];
  itemType: ItemTypes;
  style?: object;
}

export const TableItemsBox: React.FC<TableItemsBoxProps> = ({ orderLines, itemType, style }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filtrer les OrderLines pour ce type d'item spécifique
  const filteredOrderLines = orderLines.filter(line => {
    if (line.type === OrderLineType.ITEM && line.item) {
      // Pour les items individuels, vérifier le type d'item via itemTypeId
      return (line.item as any).itemTypeId === itemType;
    } else if (line.type === OrderLineType.MENU && line.items) {
      // Pour les menus, vérifier si des items du menu correspondent à ce type
      return line.items.some(menuItem => 
        (menuItem.item as any).itemTypeId === itemType
      );
    }
    return false;
  });

  const calculateGlobalStatus = (orderLines: OrderLine[]): Status => {
    if (orderLines.length === 0) return Status.DRAFT;
    
    const allStatuses: Status[] = [];
    orderLines.forEach(line => {
      if (line.type === OrderLineType.ITEM && line.status) {
        allStatuses.push(line.status);
      } else if (line.type === OrderLineType.MENU && line.items) {
        line.items.forEach(menuItem => allStatuses.push(menuItem.status));
      }
    });
    
    return getMostImportantStatus(allStatuses);
  };

  const globalStatus = calculateGlobalStatus(filteredOrderLines);

  style = {
    ...style,
    backgroundColor: getStatusColor(globalStatus),
  };

  return (
    <View style={style} className="rounded shadow m-2 relative">
      <Pressable
        className="p-4"
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View className="flex-column justify-between items-center">
          <Text className="text-lg font-semibold">{getItemTypeText(itemType)}</Text>
          <View className="flex-row items-center space-x-3">
            <Text className={`text-sm ${getStatusColor(globalStatus)}`}>
              {getStatusText(globalStatus)}
            </Text>
          </View>
        </View>
        {isExpanded
          ? <ChevronUp color="#000" className="w-6 h-6 absolute top-[25px] right-[15px]" />
          : <ChevronDown color="#000" className="w-6 h-6 absolute top-[25px] right-[15px]" />
        }

      </Pressable>

      {isExpanded && (
        <View>
          {filteredOrderLines.map((orderLine) => (
            <View key={orderLine.id} className='flex-1 justify-center items-center px-7'>
              <View className="flex-row items-center justify-between py-2">
                <View className="flex-1">
                  <Text className="font-medium">
                    {orderLine.type === OrderLineType.ITEM && orderLine.item 
                      ? `${orderLine.item.name} (x${orderLine.quantity})`
                      : orderLine.type === OrderLineType.MENU && orderLine.menu
                      ? `Menu: ${orderLine.menu.name} (x${orderLine.quantity})`
                      : 'Article inconnu'
                    }
                  </Text>
                  {orderLine.note && (
                    <Text className="text-sm text-gray-500 italic">Note: {orderLine.note}</Text>
                  )}
                </View>
                <View className="flex-column items-center space-x-3">
                  <Text className="text-sm">
                    {/* Utiliser la date de création de la commande car OrderLine n'a pas de createdAt */}
                    {formatDate(new Date().toISOString(), DateFormat.TIME)}
                  </Text>
                  <Text className="text-sm">
                    {orderLine.type === OrderLineType.ITEM && orderLine.status
                      ? getStatusText(orderLine.status)
                      : orderLine.type === OrderLineType.MENU && orderLine.items
                      ? `${orderLine.items.filter(item => item.status === Status.READY || item.status === Status.SERVED).length}/${orderLine.items.length}`
                      : 'N/A'
                    }
                  </Text>
                </View>
              </View>
              <Separator />
            </View>
          ))}
          <View className="flex-row justify-center p-4">
            <Button className='rounded w-full'>
              <Text className='text-white font-bold'>Modifier statuts</Text>
            </Button>
          </View>
        </View>
      )}
    </View>
  );
};