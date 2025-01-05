import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { DateFormat, formatDate, getItemTypeText, getStatusColor, getStatusText } from '~/lib/utils';
import { ItemTypes } from '~/types/item-type.enum';
import { OrderItem } from '~/types/order-item.types';
import { Status } from '~/types/status.enum';
import { Button, Separator } from './ui';

interface TableItemsBoxProps {
  items: OrderItem[];
  itemType: ItemTypes;
  style?: object;
}

export const TableItemsBox: React.FC<TableItemsBoxProps> = ({ items, itemType, style }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  console.log('TableItemsBox:', items);

  const calculateGlobalStatus = (items: OrderItem[]): Status => {
    if (items.length === 0) return Status.FREE;
    if (items.some(item => item.status === Status.ERROR)) return Status.ERROR;
    if (items.some(item => item.status === Status.READY)) return Status.READY;
    if (items.some(item => item.status === Status.PREPARING)) return Status.PREPARING;
    if (items.some(item => item.status === Status.SERVED)) return Status.SERVED;
    return Status.FREE;
  };

  const globalStatus = calculateGlobalStatus(items);

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
          {items.map((item) => (
            <View className='flex-1 justify-center items-center px-7'>
              <View key={item.id} className="flex-row items-center justify-between py-2">
                <View className="flex-1">
                  <Text className="font-medium">{item.name}</Text>
                </View>
                <View className="flex-column items-center space-x-3">
                  <Text className="text-sm">
                    {formatDate(item.createdAt, DateFormat.TIME)}
                  </Text>
                  <Text className="text-sm">
                    {getStatusText(item.status)}
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