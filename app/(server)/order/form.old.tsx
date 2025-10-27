import { useState, useCallback, useMemo, useEffect } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '~/components/ui';
import { OrderLinesForm, OrderLinesHeader, OrderLinesButton } from '~/components/order/OrderLinesForm';
import { OrderLine, OrderLineType, CreateOrderLineRequest, OrderLineState } from '~/types/order-line.types';
import { useToast } from '~/components/ToastProvider';
import { useOrders, useMenu, useOrderLines, useTables, useMenus } from '~/hooks/useRestaurant';
import { orderApiService } from '~/api/order.api';
import {
  initializeLineStates,
  addNewLine,
  updateLine,
  deleteLine,
  hasUnsavedChanges,
  countChanges,
  generateBulkPayload
} from '~/utils/order-line-tracker';
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

  // États pour le formulaire
  const [currentLines, setCurrentLines] = useState<OrderLine[]>([]);
  const [initialLines, setInitialLines] = useState<OrderLine[]>([]);
  const [isConfiguringMenu, setIsConfiguringMenu] = useState(false);
  const [menuConfigActions, setMenuConfigActions] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mode création ou ajout
  const isCreatingNew = mode === 'create' && !existingOrder;

  // Initialiser avec les lignes existantes
  useEffect(() => {
    if (existingOrder && existingOrder.lines) {
      // En mode modification, initialiser avec les lignes existantes
      setCurrentLines(existingOrder.lines);
      setInitialLines(existingOrder.lines);
    }
  }, [existingOrder]);

  // Récupération des lignes actuelles pour l'affichage
  const getCurrentLines = useCallback((): OrderLine[] => {
    return currentLines;
  }, [currentLines]);

  // Gestion du changement de lignes - simple
  const handleLinesChange = useCallback((newLines: OrderLine[]) => {
    setCurrentLines(newLines);
  }, []);

  // Vérifier simplement s'il y a des changements
  const hasChanges = useCallback((): boolean => {
    if (isCreatingNew) {
      return currentLines.length > 0;
    }

    // Comparer avec l'état initial
    return JSON.stringify(currentLines) !== JSON.stringify(initialLines);
  }, [currentLines, initialLines, isCreatingNew]);

  // Analyser les changements par rapport à l'état original
  const analyzeChanges = useCallback((): OrderLineState[] => {
    const states: OrderLineState[] = [];
    const originalLines = initialLines;
    const currentLineIds = new Set(currentLines.map(l => l.id));
    const originalLineIds = new Set(originalLines.map(l => l.id));

    // Analyser chaque ligne actuelle
    for (const line of currentLines) {
      if (!line.id || line.id.startsWith('draft-')) {
        // Nouvelle ligne
        states.push({
          original: null,
          current: line,
          status: 'created',
          changes: undefined
        });
      } else if (originalLineIds.has(line.id)) {
        // Ligne existante - vérifier les modifications
        const originalLine = originalLines.find(ol => ol.id === line.id)!;
        const isModified = JSON.stringify(originalLine) !== JSON.stringify(line);
        states.push({
          original: originalLine,
          current: line,
          status: isModified ? 'modified' : 'unchanged',
          changes: isModified ? line : undefined
        });
      }
    }

    // Détecter les suppressions
    for (const originalLine of originalLines) {
      if (!currentLineIds.has(originalLine.id)) {
        // Ligne supprimée
        states.push({
          original: originalLine,
          current: originalLine,
          status: 'deleted',
          changes: undefined
        });
      }
    }

    return states;
  }, [currentLines, initialLines]);

  // Conversion des lignes pour l'API
  const convertOrderLinesToApiFormat = useCallback((lines: OrderLine[]): CreateOrderLineRequest[] => {
    return lines.map(line => {
      if (line.type === OrderLineType.ITEM) {
        // Convertir les tags du format frontend (SelectedTag[]) au format API (Record<tagId, value>)
        const tags: Record<string, any> = {};
        if (line.tags && line.tags.length > 0) {
          line.tags.forEach(tag => {
            tags[tag.tagId] = tag.value;
          });
        }

        return {
          type: line.type,
          quantity: line.quantity,
          itemId: line.item!.id,
          note: line.note || '',
          tags: Object.keys(tags).length > 0 ? tags : undefined
        };
      } else if (line.type === OrderLineType.MENU) {
        // Construire selectedItems avec itemId + tags pour chaque item du menu
        const selectedItems: Record<string, { itemId: string; tags?: Record<string, any> }> = {};

        if (!allMenus || allMenus.length === 0) {
          throw new Error('Cannot send menu order: menu data not loaded');
        }

        line.items?.forEach((orderLineItem: any) => {
          // Trouver la catégorie correspondante dans le menu original
          const menu = allMenus.find((m: any) => m.id === line.menu?.id);
          if (menu?.categories) {
            const category = menu.categories.find((cat: any) => {
              const categoryName = itemTypes?.find(type => type.id === cat.itemTypeId)?.name;
              return categoryName === orderLineItem.categoryName;
            });

            if (category) {
              // Convertir les tags du format frontend au format API
              const tags: Record<string, any> = {};
              if (orderLineItem.tags && orderLineItem.tags.length > 0) {
                orderLineItem.tags.forEach((tag: any) => {
                  tags[tag.tagId] = tag.value;
                });
              }

              selectedItems[category.id] = {
                itemId: orderLineItem.item.id,
                tags: Object.keys(tags).length > 0 ? tags : undefined
              };
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

      // Fallback - ne devrait pas arriver
      throw new Error(`Type de ligne non supporté: ${line.type}`);
    });
  }, [allMenus, itemTypes]);

  // Sauvegarde de la commande
  const handleSaveOrder = useCallback(async () => {
    // Vérifier s'il y a des changements
    if (!hasChanges()) {
      showToast('Aucune modification à sauvegarder', 'info');
      return;
    }

    // Pour une nouvelle commande, vérifier qu'il y a au moins un article
    if (isCreatingNew) {
      if (currentLines.length === 0) {
        showToast('Ajoutez au moins un article', 'warning');
        return;
      }
    }

    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      let result;

      if (isCreatingNew && tableId) {
        // Créer commande + lignes ensemble
        const apiData = convertOrderLinesToApiFormat(currentLines);
        result = await createOrderWithLines(tableId as string, apiData);
        showToast('Commande créée avec succès', 'success');
      } else if (existingOrder) {
        // Utiliser l'API bulk update pour gérer toutes les opérations
        const lineStates = analyzeChanges();
        const payload = generateBulkPayload(lineStates);
        result = await orderApiService.updateWithLines(existingOrder.id, payload);

        // Message personnalisé selon les changements
        const changes = countChanges(lineStates);
        let message = 'Commande mise à jour';
        if (changes.created > 0) message = `${changes.created} article(s) ajouté(s)`;
        if (changes.modified > 0) message = changes.created > 0
          ? `${message} et ${changes.modified} modifié(s)`
          : `${changes.modified} article(s) modifié(s)`;
        if (changes.deleted > 0) message = changes.total > changes.deleted
          ? `${message} et ${changes.deleted} supprimé(s)`
          : `${changes.deleted} article(s) supprimé(s)`;

        showToast(message, 'success');
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
  }, [currentLines, analyzeChanges, hasChanges, isCreatingNew, tableId, existingOrder, createOrderWithLines, convertOrderLinesToApiFormat, showToast]);

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
    setIsConfiguringMenu(configuring);
    if (!configuring) {
      setMenuConfigActions(null);
    }
  }, []);

  const handleConfigurationActionsChange = useCallback((actions: any) => {
    setMenuConfigActions(actions);
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
            {/* Indicateur des changements */}
            {(() => {
              const lineStates = analyzeChanges();
              const hasChanges = hasUnsavedChanges(lineStates);

              if (!hasChanges && !isCreatingNew) {
                return null;
              }

              const changes = countChanges(lineStates);
              const parts = [];
              if (isCreatingNew) {
                if (currentLines.length > 0) {
                  parts.push(`${currentLines.length} article${currentLines.length > 1 ? 's' : ''} à commander`);
                }
              } else {
                if (changes.created > 0) parts.push(`${changes.created} à ajouter`);
                if (changes.modified > 0) parts.push(`${changes.modified} à modifier`);
                if (changes.deleted > 0) parts.push(`${changes.deleted} à supprimer`);
              }

              if (parts.length > 0) {
                return (
                  <Text className="text-sm text-gray-600 mb-3">
                    {parts.join(', ')}
                  </Text>
                );
              }
              return null;
            })()}

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
                flex={2}
              >
                {isProcessing ? 'Envoi...' : 'Sauvegardervze'}
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