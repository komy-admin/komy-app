// app/(server)/order-form.tsx - Page de prise de commande
import React, { useState, useCallback, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, Button } from '~/components/ui';
import { OrderLinesForm } from '~/components/order/OrderLinesForm';
import { OrderLine, OrderLineType, CreateOrderLineRequest } from '~/types/order-line.types';
import { Status } from '~/types/status.enum';
import { ArrowLeft, Save, X } from 'lucide-react-native';
import { useToast } from '~/components/ToastProvider';
import { useOrders, useMenu, useOrderLines, useTables } from '~/hooks/useRestaurant';
import * as Haptics from 'expo-haptics';

export default function OrderFormPage() {
  const { orderId, tableId, addMode } = useLocalSearchParams();
  const { showToast } = useToast();

  // Hooks pour les données
  const { getOrderById } = useOrders();
  const { getTableById } = useTables();
  const { items, itemTypes } = useMenu();
  const { createOrderWithLines, createOrderLines } = useOrderLines();

  // Récupération de la commande existante si modification
  const existingOrder = orderId ? getOrderById(orderId as string) : null;
  const table = getTableById(tableId as string);

  // États pour le formulaire
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [isConfiguringMenu, setIsConfiguringMenu] = useState(false);
  const [menuConfigActions, setMenuConfigActions] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mode création ou modification
  const isCreatingNew = !existingOrder;
  const isAddingItems = addMode === 'true';

  // Titre de la page
  const getPageTitle = () => {
    if (isCreatingNew) {
      return `Nouvelle commande - Table ${table?.name || tableId}`;
    } else if (isAddingItems) {
      return `Ajouter des articles - Table ${existingOrder?.table?.name}`;
    } else {
      return `Modifier la commande - Table ${existingOrder?.table?.name}`;
    }
  };

  // Conversion des OrderLine vers le format API
  const convertOrderLinesToApiFormat = useCallback((lines: OrderLine[]): CreateOrderLineRequest[] => {
    return lines.map(line => {
      if (line.type === OrderLineType.ITEM) {
        return {
          type: line.type,
          quantity: line.quantity,
          itemId: line.item!.id,
          note: line.note || ''
        };
      } else if (line.type === OrderLineType.MENU) {
        // Pour les menus, reconstruire selectedItems
        const selectedItems: Record<string, string> = {};

        line.items?.forEach(item => {
          // Trouver la catégorie dans le menu original
          if (line.menu?.categories) {
            const category = line.menu.categories.find(cat =>
              cat.items?.some(catItem => catItem.item?.id === item.item.id)
            );
            if (category) {
              selectedItems[category.id] = item.item.id;
            }
          }
        });

        return {
          type: line.type,
          quantity: line.quantity,
          menuId: line.menu!.id,
          selectedItems,
          note: line.note || ''
        };
      }

      throw new Error(`Type de ligne non supporté: ${line.type}`);
    });
  }, []);

  // Sauvegarde de la commande
  const handleSaveOrder = useCallback(async () => {
    if (!orderLines || orderLines.length === 0) {
      showToast('Ajoutez au moins un article', 'warning');
      return;
    }

    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Convertir les OrderLine vers le format API
      const apiData = convertOrderLinesToApiFormat(orderLines);

      let result;
      if (isCreatingNew && tableId) {
        // Créer commande + lignes ensemble
        result = await createOrderWithLines(tableId as string, apiData);
        showToast('Commande créée avec succès', 'success');
      } else if (existingOrder) {
        // Ajouter lignes à commande existante
        result = await createOrderLines(existingOrder.id, apiData);
        showToast('Articles ajoutés avec succès', 'success');
      }

      if (result) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Navigation vers la page de détail
        router.replace({
          pathname: '/(server)/service',
          params: { orderId: result.id, tableId: result.tableId }
        });
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      showToast('Erreur lors de la sauvegarde', 'error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsProcessing(false);
    }
  }, [orderLines, isCreatingNew, tableId, existingOrder, createOrderWithLines, createOrderLines, convertOrderLinesToApiFormat, showToast]);

  // Annulation
  const handleCancel = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (orderLines.length > 0) {
      // Demander confirmation si des articles ont été ajoutés
      // Pour simplifier, on retourne directement pour l'instant
      router.back();
    } else {
      router.back();
    }
  }, [orderLines]);

  // Effet pour charger les lignes existantes si modification
  useEffect(() => {
    if (!isAddingItems && existingOrder?.lines) {
      // En mode modification, précharger les lignes existantes
      // Note: Pour l'instant on ne charge pas les lignes existantes
      // car OrderLinesForm les affiche déjà via le prop lines
    }
  }, [existingOrder, isAddingItems]);

  return (
    <View className="flex-1 bg-background">
      {/* Header avec titre et actions */}
      {!isConfiguringMenu && (
        <View className="bg-white border-b border-gray-200">
          <View className="flex-row items-center justify-between px-4 py-3">
            <Pressable
              onPress={handleCancel}
              className="flex-row items-center"
            >
              <ArrowLeft size={20} color="#374151" />
              <Text className="ml-2 text-gray-700">Annuler</Text>
            </Pressable>

            <Text className="font-bold text-gray-900 text-base flex-1 text-center mx-4" numberOfLines={1}>
              {getPageTitle()}
            </Text>

            <Pressable
              onPress={handleSaveOrder}
              disabled={!orderLines || orderLines.length === 0 || isProcessing}
              className={`px-3 py-1.5 rounded-full ${
                orderLines.length > 0 && !isProcessing
                  ? 'bg-green-600'
                  : 'bg-gray-300'
              }`}
            >
              <View className="flex-row items-center">
                <Save size={16} color="white" />
                <Text className={`text-sm font-medium ml-1 ${
                  orderLines.length > 0 && !isProcessing
                    ? 'text-white'
                    : 'text-gray-500'
                }`}>
                  {isProcessing ? 'Envoi...' : 'Valider'}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Indicateur du nombre d'articles */}
          {orderLines.length > 0 && (
            <View className="px-4 pb-2">
              <Text className="text-sm text-gray-600">
                {orderLines.length} article{orderLines.length > 1 ? 's' : ''} ajouté{orderLines.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Formulaire de commande */}
      <View className="flex-1">
        <OrderLinesForm
          lines={!isAddingItems ? (existingOrder?.lines || []) : []}
          items={items.filter(item => item.isActive)}
          itemTypes={itemTypes}
          onLinesChange={setOrderLines}
          onConfigurationModeChange={setIsConfiguringMenu}
          onConfigurationActionsChange={setMenuConfigActions}
        />
      </View>

      {/* Boutons de configuration de menu */}
      {isConfiguringMenu && menuConfigActions && (
        <View className="px-4 py-3 bg-white border-t border-gray-200">
          <View className="flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onPress={menuConfigActions.onCancel}
            >
              <View className="flex-row items-center justify-center">
                <X size={18} color="#374151" />
                <Text className="text-gray-900 ml-1">Annuler</Text>
              </View>
            </Button>
            <Button
              className="flex-1"
              disabled={!menuConfigActions.isValid}
              onPress={menuConfigActions.onConfirm}
            >
              <Text className="text-white">Confirmer le menu</Text>
            </Button>
          </View>
        </View>
      )}

      {/* Actions normales en bas */}
      {!isConfiguringMenu && orderLines.length > 0 && (
        <View className="px-4 py-3 bg-white border-t border-gray-200">
          <Button
            onPress={handleSaveOrder}
            disabled={isProcessing}
            className="w-full"
          >
            <View className="flex-row items-center justify-center">
              <Save size={18} color="white" />
              <Text className="text-white font-semibold ml-2">
                {isProcessing ? 'Envoi en cours...' : `Valider ${orderLines.length} article${orderLines.length > 1 ? 's' : ''}`}
              </Text>
            </View>
          </Button>
        </View>
      )}
    </View>
  );
}