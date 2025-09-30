import React, { useState, useCallback } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '~/components/ui';
import { OrderLinesForm, OrderLinesHeader, OrderLinesButton } from '~/components/order/OrderLinesForm';
import { OrderLine, OrderLineType, CreateOrderLineRequest } from '~/types/order-line.types';
import { useToast } from '~/components/ToastProvider';
import { useOrders, useMenu, useOrderLines, useTables, useMenus } from '~/hooks/useRestaurant';
import * as Haptics from 'expo-haptics';

export default function OrderFormPage() {
  const { orderId, tableId, mode } = useLocalSearchParams();
  const { showToast } = useToast();

  // Hooks pour les données
  const { getOrderById } = useOrders();
  const { getTableById } = useTables();
  const { items, itemTypes } = useMenu();
  const { allMenus } = useMenus();
  const { createOrderWithLines, createOrderLines } = useOrderLines();

  // Récupération de la commande existante si modification
  const existingOrder = orderId ? getOrderById(orderId as string) : null;
  const table = getTableById(tableId as string);

  // États pour le formulaire (comme dans admin)
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]); // Lignes draft uniquement
  const [isConfiguringMenu, setIsConfiguringMenu] = useState(false);
  const [menuConfigActions, setMenuConfigActions] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mode création ou ajout
  const isCreatingNew = mode === 'create' && !existingOrder;

  // Récupération des lignes actuelles
  const getCurrentLines = useCallback((): OrderLine[] => {
    if (isCreatingNew) {
      return orderLines; // Mode création : utiliser les lignes draft
    } else if (existingOrder) {
      return existingOrder.lines || []; // Mode modification : utiliser les lignes existantes
    }
    return [];
  }, [isCreatingNew, orderLines, existingOrder]);

  // Gestion du changement de lignes avec filtrage
  const handleLinesChange = useCallback((newLines: OrderLine[]) => {
    let linesToSave = newLines;

    if (existingOrder && !isCreatingNew) {
      // En mode modification, filtrer les lignes existantes
      const existingLineIds = new Set(existingOrder.lines.map(l => l.id));
      // Ne garder que les lignes qui n'ont pas d'ID ou dont l'ID commence par "draft-"
      linesToSave = newLines.filter(line =>
        !line.id ||
        line.id.startsWith('draft-') ||
        !existingLineIds.has(line.id)
      );
    }

    setOrderLines(linesToSave);
  }, [existingOrder, isCreatingNew]);

  // Conversion des lignes pour l'API
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
        // Si selectedItems est déjà stocké dans la ligne, l'utiliser directement
        let selectedItems: Record<string, string> = {};

        if (line.selectedItems) {
          selectedItems = line.selectedItems;
        } else {
          // Fallback : reconstruire selectedItems à partir des orderLine.items
          if (!allMenus || allMenus.length === 0) {
            throw new Error('Cannot send menu order: menu data not loaded');
          }

          line.items?.forEach(orderLineItem => {
            // Trouver la catégorie correspondante dans le menu original
            const menu = allMenus.find((m: any) => m.id === line.menu?.id);
            if (menu?.categories) {
              const category = menu.categories.find((cat: any) => {
                const categoryName = itemTypes?.find(type => type.id === cat.itemTypeId)?.name;
                return categoryName === orderLineItem.categoryName;
              });

              if (category) {
                selectedItems[category.id] = orderLineItem.item.id;
              }
            }
          });
        }

        return {
          type: line.type,
          quantity: line.quantity,
          menuId: line.menu!.id,
          selectedItems,
          note: line.note || ''
        };
      }

      // Fallback - ne devrait pas arriver
      throw new Error(`Type de ligne non supporté: ${line.type}`);
    });
  }, [allMenus, itemTypes]);

  // Sauvegarde de la commande
  const handleSaveOrder = useCallback(async () => {
    if (!orderLines || orderLines.length === 0) {
      showToast('Ajoutez au moins un article', 'warning');
      return;
    }

    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
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
          pathname: '/(server)/order/[id]',
          params: { id: result.id || existingOrder?.id || '' }
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

    if (existingOrder) {
      // Si on était en train d'ajouter à une commande, retourner au détail
      router.replace({
        pathname: '/(server)/order/[id]',
        params: { id: existingOrder.id }
      });
    } else {
      // Sinon retourner à l'accueil
      router.replace('/(server)');
    }
  }, [existingOrder]);

  // Titre de la page
  const getPageTitle = useCallback(() => {
    if (isCreatingNew) {
      return `Nouvelle commande - Table ${table?.name || tableId}`;
    }
    return existingOrder
      ? `Ajouter des articles - Table ${existingOrder?.table?.name}`
      : 'Nouvelle commande';
  }, [isCreatingNew, table, tableId, existingOrder]);

  // Configuration des actions de menu
  const handleConfigurationModeChange = useCallback((configuring: boolean) => {
    React.startTransition(() => {
      setIsConfiguringMenu(configuring);
      if (!configuring) {
        setMenuConfigActions(null);
      }
    });
  }, []);

  const handleConfigurationActionsChange = useCallback((actions: any) => {
    React.startTransition(() => {
      setMenuConfigActions(actions);
    });
  }, []);

  return (
    <View className="flex-1 bg-background">
      {/* OrderLinesForm en pleine page comme dans admin */}
      <View className="flex-1">
        {/* Header avec titre et bouton retour - masqué pendant la configuration de menu */}
        <OrderLinesHeader
          title={getPageTitle()}
          onClose={handleCancel}
          isVisible={!isConfiguringMenu}
        />

        {/* OrderLinesForm */}
        <View className="flex-1">
          <OrderLinesForm
            lines={getCurrentLines()}
            items={items.filter(item => item.isActive)}
            itemTypes={itemTypes}
            onLinesChange={handleLinesChange}
            onConfigurationModeChange={handleConfigurationModeChange}
            onConfigurationActionsChange={handleConfigurationActionsChange}
          />
        </View>

        {/* Boutons d'action */}
        {!isConfiguringMenu && (
          <View style={{
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            padding: 16,
          }}>
            {/* Indicateur du nombre d'articles */}
            {orderLines.length > 0 && (
              <Text className="text-sm text-gray-600 mb-3">
                {orderLines.length} article{orderLines.length > 1 ? 's' : ''} à {isCreatingNew ? 'commander' : 'ajouter'}
              </Text>
            )}

            <View style={{
              flexDirection: 'row',
              gap: 12
            }}>
              <OrderLinesButton
                variant="secondary"
                onPress={handleCancel}
              >
                Annuler
              </OrderLinesButton>
              <OrderLinesButton
                variant="primary"
                onPress={handleSaveOrder}
                disabled={!orderLines || orderLines.length === 0 || isProcessing}
                flex={2}
              >
                {isProcessing ? 'Envoi...' : 'Sauvegarder'}
              </OrderLinesButton>
            </View>
          </View>
        )}

        {/* Boutons de configuration de menu */}
        {isConfiguringMenu && menuConfigActions && (
          <View style={{
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            padding: 16,
            gap: 12
          }}>
            <OrderLinesButton
              variant="configCancel"
              onPress={menuConfigActions.onCancel}
            >
              Annuler
            </OrderLinesButton>
            <OrderLinesButton
              variant="config"
              onPress={menuConfigActions.onConfirm}
              disabled={!menuConfigActions.isValid}
              flex={2}
            >
              Confirmer la sélection
            </OrderLinesButton>
          </View>
        )}
      </View>
    </View>
  );
}