import { useState, useCallback, useRef, useEffect } from 'react';
import { Table } from '~/types/table.types';
import { Order } from '~/types/order.types';
import { OrderLine, OrderLineType, CreateOrderLineRequest } from '~/types/order-line.types';
import { Status } from '~/types/status.enum';
import { useToast } from '~/components/ToastProvider';
import { useOrders, useTables, useOrderLines } from '~/hooks/useRestaurant';
import * as Haptics from 'expo-haptics';

export type ServiceMode = 'overview' | 'detail' | 'ordering';

interface MobileServiceState {
  mode: ServiceMode;
  selectedOrder: Order | null;
  selectedTable: Table | null;
  draftLines: OrderLine[];
  isCreatingNewOrder: boolean;
  bottomSheetIndex: number;
  isProcessing: boolean;
}

export const useMobileService = () => {
  const { showToast } = useToast();
  const { currentRoomOrders, createOrder, deleteOrder, updateOrderStatus } = useOrders();
  const { selectedTable, setSelectedTable, currentRoomTables } = useTables();
  const { createOrderWithLines, createOrderLines, deleteOrderLine, deleteOrderLines } = useOrderLines();

  // État unifié pour le service mobile
  const [state, setState] = useState<MobileServiceState>({
    mode: 'overview',
    selectedOrder: null,
    selectedTable: null,
    draftLines: [],
    isCreatingNewOrder: false,
    bottomSheetIndex: 0,
    isProcessing: false,
  });

  const bottomSheetRef = useRef<any>(null);
  const isSavingOrderRef = useRef<boolean>(false);

  // Fonction pour changer de mode avec animation fluide
  const setMode = useCallback((mode: ServiceMode, order?: Order, table?: Table) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setState(prev => ({
      ...prev,
      mode,
      selectedOrder: order || prev.selectedOrder,
      selectedTable: table || prev.selectedTable,
      isCreatingNewOrder: mode === 'ordering' && !order,
      draftLines: mode === 'ordering' ? [] : prev.draftLines,
    }));

    // Ajuster le BottomSheet selon le mode
    const indexMap: Record<ServiceMode, number> = {
      'overview': 0,  // 15%
      'detail': 1,    // 50%
      'ordering': 2,  // 90%
    };

    const targetIndex = indexMap[mode];
    bottomSheetRef.current?.snapToIndex(targetIndex);

    setState(prev => ({ ...prev, bottomSheetIndex: targetIndex }));
  }, []);

  // Gestion du clic sur une table
  const handleTablePress = useCallback((table: Table | null) => {
    if (!table) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTable(table.id);

    // Chercher si une commande existe pour cette table
    const existingOrder = currentRoomOrders.find(order => order.tableId === table.id);

    if (existingOrder) {
      // Table avec commande → mode détail
      setMode('detail', existingOrder, table);
    } else {
      // Table libre → préparer création de commande
      setState(prev => ({
        ...prev,
        selectedTable: table,
        selectedOrder: null,
        mode: 'overview',
        bottomSheetIndex: 1,
      }));
      bottomSheetRef.current?.snapToIndex(1);
    }
  }, [currentRoomOrders, setSelectedTable, setMode]);

  // Démarrer une nouvelle commande
  const startNewOrder = useCallback(() => {
    if (!state.selectedTable) {
      showToast('Veuillez sélectionner une table', 'warning');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMode('ordering', undefined, state.selectedTable);
  }, [state.selectedTable, showToast, setMode]);

  // Sauvegarder la commande (création ou modification)
  const saveOrder = useCallback(async (lines: OrderLine[]): Promise<boolean> => {
    if (!lines || lines.length === 0) {
      showToast('Aucun article à sauvegarder', 'info');
      return false;
    }

    setState(prev => ({ ...prev, isProcessing: true }));
    isSavingOrderRef.current = true;

    try {
      // Convertir les OrderLine vers le format API
      const apiData: CreateOrderLineRequest[] = lines.map(line => {
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

      let updatedOrder: Order | undefined;

      if (state.isCreatingNewOrder && state.selectedTable) {
        // Créer commande + lignes ensemble
        updatedOrder = await createOrderWithLines(state.selectedTable.id, apiData);
        showToast('Commande créée avec succès', 'success');
      } else if (state.selectedOrder) {
        // Ajouter lignes à commande existante
        updatedOrder = await createOrderLines(state.selectedOrder.id, apiData);
        showToast('Commande mise à jour avec succès', 'success');
      }

      if (updatedOrder) {
        // Passer en mode détail avec la commande mise à jour
        setMode('detail', updatedOrder, state.selectedTable || undefined);
        setState(prev => ({
          ...prev,
          draftLines: [],
          isCreatingNewOrder: false,
        }));
        return true;
      }

      return false;
    } catch (error) {
      showToast('Erreur lors de la sauvegarde', 'error');
      return false;
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
      isSavingOrderRef.current = false;
    }
  }, [state.isCreatingNewOrder, state.selectedOrder, state.selectedTable,
      createOrderWithLines, createOrderLines, showToast, setMode]);

  // Mettre à jour le statut d'une commande
  const updateStatus = useCallback(async (
    order: Order,
    newStatus: Status,
    itemTypeId?: string
  ) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Identifier les lignes à mettre à jour
      let orderLineIds: string[] = [];
      let orderLineItemIds: string[] = [];

      if (itemTypeId) {
        // Filtrer par type d'item spécifique
        const targetLines = (order.lines || []).filter(line =>
          line.type === OrderLineType.ITEM &&
          line.item?.itemType?.id === itemTypeId
        );
        orderLineIds = targetLines.map(line => line.id);
      } else {
        // Toutes les lignes
        (order.lines || []).forEach(line => {
          if (line.type === OrderLineType.ITEM) {
            orderLineIds.push(line.id);
          } else if (line.type === OrderLineType.MENU && line.items) {
            line.items.forEach(item => {
              orderLineItemIds.push(item.id);
            });
          }
        });
      }

      if (orderLineIds.length > 0 || orderLineItemIds.length > 0) {
        await updateOrderStatus(order.id, {
          status: newStatus,
          orderLineIds: orderLineIds.length > 0 ? orderLineIds : undefined,
          orderLineItemIds: orderLineItemIds.length > 0 ? orderLineItemIds : undefined,
        });

        showToast('Statut mis à jour avec succès', 'success');
        return true;
      }

      return false;
    } catch (error) {
      showToast('Erreur lors de la mise à jour du statut', 'error');
      return false;
    }
  }, [updateOrderStatus, showToast]);

  // Supprimer une commande
  const removeOrder = useCallback(async (orderId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await deleteOrder(orderId);
      showToast('Commande supprimée avec succès', 'success');

      // Retour à l'overview
      setMode('overview');
      setState(prev => ({
        ...prev,
        selectedOrder: null,
        selectedTable: null,
      }));

      return true;
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
      return false;
    }
  }, [deleteOrder, showToast, setMode]);

  // Supprimer des lignes de commande
  const removeOrderLines = useCallback(async (lineIds: string[]) => {
    try {
      if (lineIds.length === 1) {
        await deleteOrderLine(lineIds[0]);
        showToast('Article supprimé avec succès', 'success');
      } else {
        await deleteOrderLines(lineIds);
        showToast(`${lineIds.length} articles supprimés`, 'success');
      }
      return true;
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
      return false;
    }
  }, [deleteOrderLine, deleteOrderLines, showToast]);

  // Nettoyer l'état lors du démontage
  useEffect(() => {
    return () => {
      setState({
        mode: 'overview',
        selectedOrder: null,
        selectedTable: null,
        draftLines: [],
        isCreatingNewOrder: false,
        bottomSheetIndex: 0,
        isProcessing: false,
      });
    };
  }, []);

  return {
    // État
    ...state,

    // Données
    currentRoomOrders,
    currentRoomTables,

    // Actions
    setMode,
    handleTablePress,
    startNewOrder,
    saveOrder,
    updateStatus,
    removeOrder,
    removeOrderLines,

    // Refs
    bottomSheetRef,

    // Helpers
    getOrderForTable: (tableId: string) =>
      currentRoomOrders.find(order => order.tableId === tableId),
  };
};