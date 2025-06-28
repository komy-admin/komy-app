import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, Button, Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui';
import { Order } from '~/types/order.types';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { Status } from '~/types/status.enum';
import { orderApiService } from '~/api/order.api';
import { itemApiService } from '~/api/item.api';
import { itemTypeApiService } from '~/api/item-type.api';
import { orderItemApiService } from '~/api/order-item.api';
import { useFilter } from '~/hooks/useFilter';
import { FilterConfig } from '~/hooks/useFilter/types';
import { useToast } from '~/components/ToastProvider';
import { ArrowLeft, Plus, Minus } from 'lucide-react-native';

export default function OrderMenuPage() {
  const { orderId } = useLocalSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [menuTabsValue, setMenuTabsValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, [orderId]);

  const filterItemConfig: FilterConfig<Item>[] = [
    {
      field: 'itemTypeId',
      type: 'text',
      label: 'ItemType',
      operator: '=',
      show: false
    },
  ];

  const { updateFilter: updateItemFilter } = useFilter<Item>({
    config: filterItemConfig,
    service: itemApiService,
    defaultParams: { page: 1, perPage: 100 },
    onDataChange: (response) => setItems(response.data)
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      if (!orderId || typeof orderId !== 'string') {
        throw new Error('ID de commande invalide');
      }

      const [orderResponse, itemTypesResponse] = await Promise.all([
        orderApiService.get(orderId),
        itemTypeApiService.getAll()
      ]);

      setOrder(orderResponse);
      setItemTypes(itemTypesResponse.data);
      setMenuTabsValue(itemTypesResponse.data[0]?.id);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
      showToast('Erreur lors du chargement des données.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getItemQuantity = (itemId: string) => {
    if (!order) return 0;
    return order.orderItems.filter(orderItem => orderItem.item.id === itemId).length;
  };

  const onUpdateQuantity = async (itemId: string, action: 'remove' | 'add') => {
    if (!order) {
      showToast('Aucune commande trouvée.', 'warning');
      return;
    }

    const item = items.find(item => item.id === itemId);
    if (!item) {
      showToast('L\'article sélectionné n\'existe pas.', 'error');
      return;
    }

    try {
      if (action === 'add') {
        const orderItem = await orderItemApiService.create({
          orderId: order.id,
          itemId: item.id,
          status: Status.DRAFT
        });
        const updatedOrder = { ...order, orderItems: [...order.orderItems, orderItem] };
        setOrder(updatedOrder);
      } else if (action === 'remove') {
        const orderItem = order.orderItems.find(orderItem => orderItem.item.id === itemId);
        if (!orderItem) return;

        await orderItemApiService.delete(orderItem.id);
        const updatedOrder = {
          ...order,
          orderItems: order.orderItems.filter(oi => oi.id !== orderItem.id)
        };
        setOrder(updatedOrder);
      }

      showToast(`Quantité ${action === 'add' ? 'ajoutée' : 'retirée'} avec succès.`, 'success');
    } catch (error) {
      console.error(error);
      showToast('Erreur lors de la mise à jour.', 'error');
    }
  };

  const navigateToOrderDetail = () => {
    if (!order) return;
    router.replace({
      pathname: '/(server)/order/[id]',
      params: { id: order.id }
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-gray-900">Chargement...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-4">
        <Text className="text-destructive text-center mb-4">{error || 'Commande introuvable'}</Text>
        <Button onPress={() => router.back()}>
          <Text className="text-primary-foreground">Retour</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-background border-b border-border">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center"
        >
          <ArrowLeft size={24} color="#374151" />
          <Text className="ml-2 text-lg font-medium text-gray-900">Retour</Text>
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Menu - Table {order.table.name}</Text>
        <Text className="text-sm text-muted-foreground">
          {order.orderItems.length} article{order.orderItems.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Menu Content */}
      <ScrollView className="flex-1">
        <View className="p-4">
          <Tabs
            value={menuTabsValue}
            onValueChange={(newValue: string) => setMenuTabsValue(newValue)}
            className="flex-1 w-full"
          >
            <TabsList className="flex-row w-full mb-4">
              {itemTypes.map((itemType) => (
                <TabsTrigger key={itemType.id} value={itemType.id} className="flex-1 py-3">
                  <Text className="text-sm text-gray-900">{itemType.name}</Text>
                </TabsTrigger>
              ))}
            </TabsList>

            {items
              .filter(item => item.itemType.id === menuTabsValue)
              .map((item) => {
                const quantity = getItemQuantity(item.id);
                return (
                  <TabsContent value={item.itemType.id} key={item.id}>
                    <View className="flex-row items-center justify-between py-4 border-b border-gray-100">
                      <View className="flex-1 pr-4">
                        <Text numberOfLines={1} className="font-medium text-base text-gray-900" ellipsizeMode="tail">
                          {item.name}
                        </Text>
                        <Text className="text-sm text-muted-foreground mt-1">{item.price}€</Text>
                        {item.description && (
                          <Text className="text-xs text-muted-foreground mt-1" numberOfLines={2}>
                            {item.description}
                          </Text>
                        )}
                      </View>
                      <View className="flex-row items-center bg-gray-100 rounded-full">
                        {quantity > 0 && (
                          <Pressable
                            onPress={() => onUpdateQuantity(item.id, 'remove')}
                            className="p-3"
                          >
                            <Minus size={20} color="#666666" />
                          </Pressable>
                        )}
                        <Text className="text-base min-w-[40px] text-center px-2 font-medium text-gray-900">
                          {quantity}
                        </Text>
                        <Pressable
                          onPress={() => onUpdateQuantity(item.id, 'add')}
                          className="p-3"
                        >
                          <Plus size={20} color="#666666" />
                        </Pressable>
                      </View>
                    </View>
                  </TabsContent>
                );
              })}
          </Tabs>
        </View>
      </ScrollView>

      {/* Actions */}
      <View className="px-4 py-3 bg-background border-t border-border">
        <Button
          onPress={navigateToOrderDetail}
          className="w-full"
          className="bg-primary"
        >
          <Text className="text-primary-foreground font-medium">
            Valider la commande ({order.orderItems.length} article{order.orderItems.length > 1 ? 's' : ''})
          </Text>
        </Button>
      </View>
    </View>
  );
}