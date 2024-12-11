import { Alert, DimensionValue, ScrollView, useWindowDimensions, View } from "react-native";
import { Input, Tabs, TabsContent, TabsList, TabsTrigger, Text, Badge, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Button } from "~/components/ui";
import { SidePanel } from "~/components/SidePanel";
import React, { useEffect, useState } from "react";
import { Item } from "~/types/item.types";
import { ItemTypes } from "~/types/item-types.enum";
import { itemsApi } from "~/api/items.api";
import { cn, getItemTypeText } from "~/lib/utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Trash2 } from "lucide-react-native";

export default function MenuPage() {
  const [value, setValue] = useState(ItemTypes.DRINK);
  const [menuDrinks, setMenuDrinks] = useState<Item[]>([]);
  const [menuStarters, setMenuStarters] = useState<Item[]>([]);
  const [menuMains, setMenuMains] = useState<Item[]>([]);
  const [menuDesserts, setMenuDesserts] = useState<Item[]>([]);

  const insets = useSafeAreaInsets();

  const columnWidths = ['65%', '15%', '15%', '5%'] as DimensionValue[];

  console.log('Column widths:', columnWidths);

  useEffect(() => {
    loadData(ItemTypes.DRINK);
    loadData(ItemTypes.STARTER);
    loadData(ItemTypes.MAIN);
    loadData(ItemTypes.DESSERT);
  }, []);

  const loadData = async (itemType: ItemTypes) => {
    try {
      const data = await itemsApi.getItems(itemType);
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
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <SidePanel title="Filtrage">
        <View style={{ padding: 16 }}>
          <Input placeholder="Rechercher..." />
        </View>
      </SidePanel>
      <View style={{ flex: 1 }}>
      <Tabs
        value={value}
        onValueChange={(newValue: string) => setValue(newValue as ItemTypes)}
        className='w-full mx-auto flex-col gap-1.5'
      >
        <View className="flex flex-row w-full">
          <TabsList className='flex-row w-[600px] h-full' style={{ backgroundColor: '#F1F1F1' }}>
            <TabsTrigger value={ItemTypes.DRINK} className='flex-1 flex-row h-full' style={{height: '100%'}}>
              <Text>{getItemTypeText(ItemTypes.DRINK)}</Text>
              <Badge className="ml-2">
                <Text>{menuDrinks.length}</Text>
              </Badge>
            </TabsTrigger>
            <TabsTrigger value={ItemTypes.STARTER} className='flex-1 flex-row h-full'>
              <Text>{getItemTypeText(ItemTypes.STARTER)}</Text>
              <Badge className="ml-2">
                <Text>{menuStarters.length}</Text>
              </Badge>
            </TabsTrigger>
            <TabsTrigger value={ItemTypes.MAIN} className='flex-1 flex-row h-full'>
              <Text>{getItemTypeText(ItemTypes.MAIN)}</Text>
              <Badge className="ml-2">
                <Text>{menuMains.length}</Text>
              </Badge>
            </TabsTrigger>
            <TabsTrigger value={ItemTypes.DESSERT} className='flex-1 flex-row h-full'>
              <Text>{getItemTypeText(ItemTypes.DESSERT)}</Text>
              <Badge className="ml-2">
                <Text>{menuDesserts.length}</Text>
              </Badge>
            </TabsTrigger>
          </TabsList>
          <View className='h-1 w-full h-[50px]' style={{backgroundColor: '#FF00FF'}}>
            <Text>
              COUCOU
            </Text>
          </View>
        </View>
        <View className='px-6'>
          <TabsContent value={ItemTypes.DRINK}>
            <Table aria-labelledby='invoice-table'>
              <TableHeader>
                <TableRow>
                  <TableHead className='px-0.5' style={{ width: columnWidths[0] }}>
                    <Text>Nom</Text>
                  </TableHead>
                  <TableHead style={{ width: columnWidths[1] }}>
                    <Text>Prix</Text>
                  </TableHead>
                  <TableHead style={{ width: columnWidths[2] }}>
                    <Text>Statut</Text>
                  </TableHead>
                  <TableHead style={{ width: columnWidths[3] }}>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menuStarters.map((item, index) => (
                    <TableRow
                      key={item.id}
                      className={cn('active:bg-secondary', index % 2 && 'bg-muted/40 ')}
                    >
                      <TableCell style={{ width: columnWidths[0] }}>
                        <Text>{item.name}</Text>
                      </TableCell>
                      <TableCell style={{ width: columnWidths[1] }}>
                        <Text>{item.price} €</Text>
                      </TableCell>
                      <TableCell style={{ width: columnWidths[2] }}>
                        {index === 2 ? (
                          <Badge variant='danger' style={{ width: '60px' as DimensionValue }}>
                            <Text>Inactif</Text>
                          </Badge>
                          ) : (
                          <Badge variant='success' style={{ width: '60px' as DimensionValue }}>
                            <Text>Actif</Text>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell style={{ width: columnWidths[3] }}>
                        <Trash2 size={22} color='red' />
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value={ItemTypes.STARTER}>
            <ScrollView>
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
            </ScrollView>
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
        </View>
      </Tabs>
      </View>
    </View>
  );
}