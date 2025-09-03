import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, Button, Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui';
import { orderItemApiService } from '~/api/order-item.api';
import { useToast } from '~/components/ToastProvider';
import { ArrowLeft, Plus, Minus, UtensilsCrossed } from 'lucide-react-native';
import { useOrders, useMenu, useRestaurant } from '~/hooks/useRestaurant';
import { useOrderLines } from '~/hooks/useOrderLines';
import { useMenus } from '~/hooks/useMenus';
import MenuSelector from '~/components/Service/MenuSelector';
import { Menu } from '~/types/menu.types';
import { OrderLineType } from '~/types/order-line.types';

export default function OrderMenuPage() {
  const { orderId } = useLocalSearchParams();
  const [menuTabsValue, setMenuTabsValue] = useState<string>('');
  const [isMenuSelectorVisible, setIsMenuSelectorVisible] = useState(false);
  const { showToast } = useToast();

  // Initialiser la connexion WebSocket via useRestaurant
  const { isLoading: globalLoading } = useRestaurant();

  // Utilisation des hooks Redux
  const { getOrderById, loading, error } = useOrders();
  const { createOrderLines } = useOrderLines();
  const { items, itemTypes } = useMenu();
  const { activeMenus } = useMenus();

  // Récupération de la commande depuis le store
  const order = getOrderById(orderId as string);

  // Initialiser l'onglet par défaut quand les itemTypes sont chargés
  useEffect(() => {
    if (itemTypes.length > 0 && !menuTabsValue) {
      setMenuTabsValue(itemTypes[0].id);
    }
  }, [itemTypes, menuTabsValue]);

  // Plus besoin de loadData, useFilter ou d'appels API - tout est géré par Redux

  const getItemQuantity = (itemId: string) => {
    if (!order || !order.lines) return 0;
    return order.lines.filter(line => 
      line.type === OrderLineType.ITEM && line.item?.id === itemId
    ).reduce((sum, line) => sum + line.quantity, 0);
  };

  const handleMenuSelect = async (
    menu: Menu,
    selectedItems: Array<{ itemId: string; menuCategoryItemId: string }>
  ) => {
    if (!order) {
      showToast('Aucune commande trouvée.', 'warning');
      return;
    }

    try {
      // Convertir selectedItems vers le format attendu par createOrderLines
      const selectedItemsRecord: Record<string, string> = {};
      selectedItems.forEach(item => {
        // Trouver la catégorie correspondante pour cet item
        const category = menu.categories.find(cat => 
          cat.items?.some(catItem => catItem.itemId === item.itemId)
        );
        if (category) {
          selectedItemsRecord[category.id] = item.itemId;
        }
      });

      const orderLineData = {
        type: OrderLineType.MENU as const,
        quantity: 1,
        menuId: menu.id,
        selectedItems: selectedItemsRecord
      };

      await createOrderLines(order.id, [orderLineData]);
      showToast('Menu ajouté à la commande avec succès.', 'success');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du menu:', error);
      showToast('Erreur lors de l\'ajout du menu.', 'error');
    }
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
        const orderLineData = {
          type: OrderLineType.ITEM as const,
          quantity: 1,
          itemId: item.id
        };
        await createOrderLines(order.id, [orderLineData]);
      } else if (action === 'remove') {
        // Pour le remove, on devra utiliser deleteOrderLine
        // TODO: Implémenter la suppression d'une OrderLine spécifique
        showToast('Fonctionnalité de suppression à implémenter', 'warning');
        return;
      }
      showToast(`Quantité ${action === 'add' ? 'ajoutée' : 'retirée'} avec succès.`, 'success');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la quantité:', error);
      showToast('Erreur lors de la mise à jour de la quantité.', 'error');
    }
  };

  const navigateToOrderDetail = () => {
    if (!order) return;
    router.replace({
      pathname: '/(server)/order/[id]',
      params: { id: order.id }
    });
  };

  if (loading) {
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
      <View className="px-4 py-3 bg-background border-b border-border">
        <View className="flex-row items-center justify-between mb-3">
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <ArrowLeft size={24} color="#374151" />
            <Text className="ml-2 text-lg font-medium text-gray-900">Retour</Text>
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">Menu - Table {order?.table.name}</Text>
          <Text className="text-sm text-muted-foreground">
            {order?.lines?.length || 0} article{(order?.lines?.length || 0) > 1 ? 's' : ''}
          </Text>
        </View>

        {/* Menu selection button */}
        {activeMenus.length > 0 && (
          <Pressable
            onPress={() => setIsMenuSelectorVisible(true)}
            className="flex-row items-center justify-center bg-primary rounded-lg py-3 px-4"
          >
            <UtensilsCrossed size={20} color="white" />
            <Text className="ml-2 text-primary-foreground font-medium">
              Choisir un menu ({activeMenus.length} disponible{activeMenus.length > 1 ? 's' : ''})
            </Text>
          </Pressable>
        )}
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
          className="w-full bg-primary"
        >
          <Text className="text-primary-foreground font-medium">
            Valider la commande ({order?.lines?.length || 0} article{(order?.lines?.length || 0) > 1 ? 's' : ''})
          </Text>
        </Button>
      </View>

      {/* Menu Selector Modal */}
      <MenuSelector
        visible={isMenuSelectorVisible}
        onClose={() => setIsMenuSelectorVisible(false)}
        onMenuSelect={handleMenuSelect}
      />
    </View>
  );
}