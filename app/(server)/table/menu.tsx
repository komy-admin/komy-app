import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { itemsApi } from '~/api/items.api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui';
import { getItemTypeText } from '~/lib/utils';
import { ItemTypes } from '~/types/item-type.enum';
import { Item } from '~/types/item.types';

export default function TableMenu() {
  const [value, setValue] = useState(ItemTypes.DRINK);
  const [menuDrinks, setMenuDrinks] = useState<Item[]>([]);
  const [menuStarters, setMenuStarters] = useState<Item[]>([]);
  const [menuMains, setMenuMains] = useState<Item[]>([]);
  const [menuDesserts, setMenuDesserts] = useState<Item[]>([]);

  useEffect(() => {
    loadData(ItemTypes.DRINK);
    loadData(ItemTypes.STARTER);
    loadData(ItemTypes.MAIN);
    loadData(ItemTypes.DESSERT);
  }, []);

  const loadData = async (itemType: ItemTypes) => {
    try {
      const data = await itemsApi.getItems(itemType);
      console.log('Data:', data);
      switch (itemType) {
        case ItemTypes.DRINK:
          setMenuDrinks(data);
          break;
        case ItemTypes.STARTER:
          setMenuStarters(data);
          break;
        case ItemTypes.MAIN:
          setMenuMains(data);
          break;
        case ItemTypes.DESSERT:
          setMenuDesserts(data);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Error in loadData:', err);
    }
  }
  return (
    <View className='flex-1 p-3'>
      <Tabs
        value={value}
        onValueChange={(newValue: string) => setValue(newValue as ItemTypes)}
        className='w-full max-w-[400px] mx-auto flex-col gap-1.5'
      >
        <TabsList className='flex-row w-full'>
          <TabsTrigger value={ItemTypes.DRINK} className='flex-1'>
            <Text>{getItemTypeText(ItemTypes.DRINK)}</Text>
          </TabsTrigger>
          <TabsTrigger value={ItemTypes.STARTER} className='flex-1'>
            <Text>{getItemTypeText(ItemTypes.STARTER)}</Text>
          </TabsTrigger>
          <TabsTrigger value={ItemTypes.MAIN} className='flex-1'>
            <Text>{getItemTypeText(ItemTypes.MAIN)}</Text>
          </TabsTrigger>
          <TabsTrigger value={ItemTypes.DESSERT} className='flex-1'>
            <Text>{getItemTypeText(ItemTypes.DESSERT)}</Text>
          </TabsTrigger>
        </TabsList>
        <TabsContent value={ItemTypes.DRINK}>
          {menuDrinks.map((item) => (
            <View key={item.id} className='flex-row items-center justify-between py-2'>
              <View className='flex-1'>
                <Text className='font-medium'>{item.name}</Text>
              </View>
              <View className='flex-column items-center space-x-3'>
                <Text className='text-sm'>{item.price}€</Text>
              </View>
            </View>
          ))}
        </TabsContent>
        <TabsContent value={ItemTypes.STARTER}>
          {menuStarters.map((item) => (
            <View key={item.id} className='flex-row items-center justify-between py-2'>
              <View className='flex-1'>
                <Text className='font-medium'>{item.name}</Text>
              </View>
              <View className='flex-column items-center space-x-3'>
                <Text className='text-sm'>{item.price}€</Text>
              </View>
            </View>
          ))}
        </TabsContent>
        <TabsContent value={ItemTypes.MAIN}>
          {menuMains.map((item) => (
            <View key={item.id} className='flex-row items-center justify-between py-2'>
              <View className='flex-1'>
                <Text className='font-medium'>{item.name}</Text>
              </View>
              <View className='flex-column items-center space-x-3'>
                <Text className='text-sm'>{item.price}€</Text>
              </View>
            </View>
          ))}
        </TabsContent>
        <TabsContent value={ItemTypes.DESSERT}>
          {menuDesserts.map((item) => (
            <View key={item.id} className='flex-row items-center justify-between py-2'>
              <View className='flex-1'>
                <Text className='font-medium'>{item.name}</Text>
              </View>
              <View className='flex-column items-center space-x-3'>
                <Text className='text-sm'>{item.price}€</Text>
              </View>
            </View>
          ))}
        </TabsContent>
      </Tabs>
    </View>
  );
}