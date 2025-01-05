// app/(server)/tables/[id]/index.tsx
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Table } from '~/types/table.types';
import { tablesApi } from '~/api/tables.api';
import { Button, Card, CardContent, CardHeader, CardTitle, Text } from '~/components/ui';
import { ItemTypes } from '~/types/item-type.enum';
import { TableItemsBox } from '~/components/TableItemsBox';

export default function TableDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [table, setTable] = useState<Table | null>(null);
  const [drinks, setDrinks] = useState<any[]>([]);
  const [starters, setStarters] = useState<any[]>([]);
  const [mains, setMains] = useState<any[]>([]);
  const [desserts, setDesserts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadTable();
  }, [id]);

  const loadTable = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching table with ID:', id);
      const data = await tablesApi.getById(id as string);
      setTable(data);
      data?.orders?.forEach((order) => {
        order.orderItems?.forEach((item) => {
          switch (item.itemType) {
            case ItemTypes.DRINK:
              setDrinks((prev) => [...prev, item]);
              break;
            case ItemTypes.STARTER:
              setStarters((prev) => [...prev, item]);
              break;
            case ItemTypes.MAIN:
              setMains((prev) => [...prev, item]);
              break;
            case ItemTypes.DESSERT:
              setDesserts((prev) => [...prev, item]);
              break;
            default:
              break;
          }
        });
      })
      console.log({
        drinks,
        starters,
        mains,
        desserts
      })
    } catch (err) {
      console.error('Error in loadTable:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-red-500 mb-2">Une erreur est survenue:</Text>
        <Text>{error.message}</Text>
        <Button 
          variant="outline" 
          className="mt-4"
          onPress={() => loadTable()}
        >
          <Text>Réessayer</Text>
        </Button>
      </View>
    );
  }

  if (!table) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Table non trouvée</Text>
        <Button 
          variant="outline" 
          className="mt-4"
          onPress={() => router.back()}
        >
          <Text>Retour</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className='flex-column justify-between h-full'>
      <ScrollView className="p-3">
        {Object.values(ItemTypes).map((type) => {
          const items = (() => {
            switch (type) {
              case ItemTypes.DRINK: return drinks;
              case ItemTypes.STARTER: return starters;
              case ItemTypes.MAIN: return mains;
              case ItemTypes.DESSERT: return desserts;
              default: return [];
            }
          })();

          return items.length > 0 ? (
            <TableItemsBox 
              key={type}
              items={items}
              itemType={type}
            />
          ) : null;
        })}
      </ScrollView>
      <View className='p-4'>
        <View className='py-1'>
          <Button onPress={() => router.push({
            pathname: '/table/menu',
            params: { title: 'Commande ' + table.name }
          })}>
            <Text className='font-bold'>Modifier la commande</Text>
          </Button>
        </View>
        <View className='py-1'>
          <Button variant='outline'>
            <Text className='font-bold'>Régler la note</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}