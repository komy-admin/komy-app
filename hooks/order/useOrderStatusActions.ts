import { useState, useMemo, useCallback } from 'react';
import { Status } from '~/types/status.enum';
import { OrderLineType } from '~/types/order-line.types';

export interface GroupedItem {
  name: string;
  quantity: number;
}

export interface GroupedSection {
  itemTypeName: string;
  items: GroupedItem[];
  totalCount: number;
}

export interface ClaimData {
  orderLineIds: string[];
  orderLineItemIds: string[];
  itemTypeNames: string[];
  count: number;
  itemNames: string[];
  sections: GroupedSection[];
}

export interface ServeData {
  orderLineIds: string[];
  orderLineItemIds: string[];
  count: number;
  itemNames: string[];
  sections: GroupedSection[];
}

interface UseOrderStatusActionsProps {
  selectedTableOrder: any;
  allItemTypes: { id: string; name: string; priorityOrder: number }[];
  updateOrder: (orderId: string, data: any) => Promise<any>;
  updateOrderStatus: (orderId: string, data: {
    status: Status;
    orderLineIds?: string[];
    orderLineItemIds?: string[];
  }) => Promise<any>;
  deleteOrder: (orderId: string) => Promise<any>;
  deleteOrderLine: (orderLineId: string) => Promise<any>;
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
  onCleanup: () => void;
}

export const useOrderStatusActions = ({
  selectedTableOrder,
  allItemTypes,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  deleteOrderLine,
  showToast,
  onCleanup,
}: UseOrderStatusActionsProps) => {
  // Modal states
  const [showClaimConfirmModal, setShowClaimConfirmModal] = useState(false);
  const [showServeConfirmModal, setShowServeConfirmModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [itemsToClaimData, setItemsToClaimData] = useState<ClaimData | null>(null);
  const [itemsToServeData, setItemsToServeData] = useState<ServeData | null>(null);

  // Computed
  const hasDraftItems = useMemo(() => {
    if (!selectedTableOrder?.lines) return false;
    return selectedTableOrder.lines.some(
      (line: any) => line.type === OrderLineType.ITEM && line.status === Status.DRAFT
    ) || selectedTableOrder.lines.some(
      (line: any) => line.type === OrderLineType.MENU &&
        line.items?.some((menuItem: any) => menuItem.status === Status.DRAFT)
    );
  }, [selectedTableOrder?.lines]);

  const hasReadyItems = useMemo(() => {
    if (!selectedTableOrder?.lines) return false;
    return selectedTableOrder.lines.some(
      (line: any) => line.type === OrderLineType.ITEM && line.status === Status.READY
    ) || selectedTableOrder.lines.some(
      (line: any) => line.type === OrderLineType.MENU &&
        line.items?.some((menuItem: any) => menuItem.status === Status.READY)
    );
  }, [selectedTableOrder?.lines]);

  // --- Status update handlers ---

  const handleUpdateItemStatus = useCallback(async (orderLine: any, newStatus: Status) => {
    if (!selectedTableOrder) return;
    try {
      await updateOrderStatus(selectedTableOrder.id, {
        status: newStatus,
        orderLineIds: [orderLine.id],
      });
      showToast('Statut mis à jour avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de la mise à jour du statut', 'error');
      console.error('Erreur updateItemStatus:', error);
    }
  }, [selectedTableOrder, updateOrderStatus, showToast]);

  const handleUpdateMenuItemStatus = useCallback(async (orderLineItem: any, newStatus: Status) => {
    if (!selectedTableOrder) return;
    try {
      await updateOrderStatus(selectedTableOrder.id, {
        status: newStatus,
        orderLineItemIds: [orderLineItem.id],
      });
      showToast('Statut mis à jour avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de la mise à jour du statut', 'error');
      console.error('Erreur updateMenuItemStatus:', error);
    }
  }, [selectedTableOrder, updateOrderStatus, showToast]);

  const handleBulkUpdateStatus = useCallback(async (
    orderLineIds: string[],
    orderLineItemIds: string[],
    newStatus: Status
  ) => {
    if (!selectedTableOrder) return;
    try {
      await updateOrderStatus(selectedTableOrder.id, {
        status: newStatus,
        orderLineIds: orderLineIds.length > 0 ? orderLineIds : undefined,
        orderLineItemIds: orderLineItemIds.length > 0 ? orderLineItemIds : undefined,
      });
      showToast(`${orderLineIds.length + orderLineItemIds.length} article(s) mis à jour`, 'success');
    } catch (error) {
      showToast('Erreur lors de la mise à jour', 'error');
      console.error('Erreur bulk update:', error);
    }
  }, [selectedTableOrder, updateOrderStatus, showToast]);

  // --- Claim flow ---

  const handleClaim = useCallback(() => {
    if (!selectedTableOrder) return;

    const itemTypePriorityMap = new Map(
      allItemTypes.map(it => [it.id, it.priorityOrder])
    );

    const draftItems: { orderLineId?: string; orderLineItemId?: string; itemTypeId: string; priority: number; itemName: string }[] = [];

    selectedTableOrder.lines?.forEach((line: any) => {
      if (line.type === OrderLineType.ITEM && line.status === Status.DRAFT) {
        const itemTypeId = line.item?.itemType?.id || '';
        const priority = itemTypePriorityMap.get(itemTypeId) ?? Number.MAX_SAFE_INTEGER;
        draftItems.push({ orderLineId: line.id, itemTypeId, priority, itemName: line.item?.name || 'Article inconnu' });
      }
      if (line.type === OrderLineType.MENU && line.items) {
        line.items.forEach((menuItem: any) => {
          if (menuItem.status === Status.DRAFT) {
            const itemTypeId = menuItem.item?.itemType?.id || '';
            const priority = itemTypePriorityMap.get(itemTypeId) ?? Number.MAX_SAFE_INTEGER;
            draftItems.push({ orderLineItemId: menuItem.id, itemTypeId, priority, itemName: menuItem.item?.name || 'Article inconnu' });
          }
        });
      }
    });

    if (draftItems.length === 0) {
      showToast('Aucun article en brouillon', 'warning');
      return;
    }

    const minPriority = Math.min(...draftItems.map(item => item.priority));
    const itemsToClaim = draftItems.filter(item => item.priority === minPriority);

    // Grouper par itemType puis par nom d'item
    const sectionsMap = new Map<string, { itemTypeName: string; itemCounts: Map<string, number> }>();
    itemsToClaim.forEach(item => {
      const typeName = allItemTypes.find(it => it.id === item.itemTypeId)?.name || 'Autre';
      if (!sectionsMap.has(item.itemTypeId)) {
        sectionsMap.set(item.itemTypeId, { itemTypeName: typeName, itemCounts: new Map() });
      }
      const section = sectionsMap.get(item.itemTypeId)!;
      section.itemCounts.set(item.itemName, (section.itemCounts.get(item.itemName) || 0) + 1);
    });
    const sections: GroupedSection[] = Array.from(sectionsMap.values()).map(s => ({
      itemTypeName: s.itemTypeName,
      items: Array.from(s.itemCounts.entries()).map(([name, quantity]) => ({ name, quantity })),
      totalCount: Array.from(s.itemCounts.values()).reduce((sum, q) => sum + q, 0),
    }));

    setItemsToClaimData({
      orderLineIds: itemsToClaim.filter(item => item.orderLineId).map(item => item.orderLineId!),
      orderLineItemIds: itemsToClaim.filter(item => item.orderLineItemId).map(item => item.orderLineItemId!),
      itemTypeNames: allItemTypes.filter(it => it.priorityOrder === minPriority).map(it => it.name).sort(),
      count: itemsToClaim.length,
      itemNames: itemsToClaim.map(item => item.itemName),
      sections,
    });
    setShowClaimConfirmModal(true);
  }, [selectedTableOrder, allItemTypes, showToast]);

  const confirmClaim = useCallback(async () => {
    if (!itemsToClaimData) return;
    try {
      await handleBulkUpdateStatus(itemsToClaimData.orderLineIds, itemsToClaimData.orderLineItemIds, Status.PENDING);
      showToast(`${itemsToClaimData.itemTypeNames.join(' + ')} réclamé${itemsToClaimData.count > 1 ? 's' : ''} (${itemsToClaimData.count})`, 'success');
      setShowClaimConfirmModal(false);
      setItemsToClaimData(null);
    } catch (error) {
      showToast('Erreur lors de la réclamation', 'error');
      console.error('Erreur claim:', error);
    }
  }, [itemsToClaimData, handleBulkUpdateStatus, showToast]);

  // --- Serve flow ---

  const handleServe = useCallback(() => {
    if (!selectedTableOrder) return;

    const orderLineIds: string[] = [];
    const orderLineItemIds: string[] = [];
    const itemNames: string[] = [];
    const serveItems: { itemName: string; itemTypeId: string }[] = [];

    selectedTableOrder.lines?.forEach((line: any) => {
      if (line.type === OrderLineType.ITEM && line.status === Status.READY) {
        orderLineIds.push(line.id);
        const itemName = line.item?.name || 'Article inconnu';
        itemNames.push(itemName);
        serveItems.push({ itemName, itemTypeId: line.item?.itemType?.id || '' });
      }
      if (line.type === OrderLineType.MENU && line.items) {
        line.items.forEach((menuItem: any) => {
          if (menuItem.status === Status.READY) {
            orderLineItemIds.push(menuItem.id);
            const itemName = menuItem.item?.name || 'Article inconnu';
            itemNames.push(itemName);
            serveItems.push({ itemName, itemTypeId: menuItem.item?.itemType?.id || '' });
          }
        });
      }
    });

    const totalItems = orderLineIds.length + orderLineItemIds.length;
    if (totalItems === 0) {
      showToast('Aucun article prêt', 'warning');
      return;
    }

    // Grouper par itemType puis par nom d'item
    const sectionsMap = new Map<string, { itemTypeName: string; itemCounts: Map<string, number> }>();
    serveItems.forEach(item => {
      const typeName = allItemTypes.find(it => it.id === item.itemTypeId)?.name || 'Autre';
      if (!sectionsMap.has(item.itemTypeId)) {
        sectionsMap.set(item.itemTypeId, { itemTypeName: typeName, itemCounts: new Map() });
      }
      const section = sectionsMap.get(item.itemTypeId)!;
      section.itemCounts.set(item.itemName, (section.itemCounts.get(item.itemName) || 0) + 1);
    });
    const sections: GroupedSection[] = Array.from(sectionsMap.values()).map(s => ({
      itemTypeName: s.itemTypeName,
      items: Array.from(s.itemCounts.entries()).map(([name, quantity]) => ({ name, quantity })),
      totalCount: Array.from(s.itemCounts.values()).reduce((sum, q) => sum + q, 0),
    }));

    setItemsToServeData({ orderLineIds, orderLineItemIds, count: totalItems, itemNames, sections });
    setShowServeConfirmModal(true);
  }, [selectedTableOrder, allItemTypes, showToast]);

  const confirmServe = useCallback(async () => {
    if (!itemsToServeData) return;
    try {
      await handleBulkUpdateStatus(itemsToServeData.orderLineIds, itemsToServeData.orderLineItemIds, Status.SERVED);
      showToast(`Article${itemsToServeData.count > 1 ? 's' : ''} servi${itemsToServeData.count > 1 ? 's' : ''} (${itemsToServeData.count})`, 'success');
      setShowServeConfirmModal(false);
      setItemsToServeData(null);
    } catch (error) {
      showToast('Erreur lors du service', 'error');
      console.error('Erreur serve:', error);
    }
  }, [itemsToServeData, handleBulkUpdateStatus, showToast]);

  // --- Delete line ---

  const handleDeleteLine = useCallback(async (orderLineId: string) => {
    try {
      await deleteOrderLine(orderLineId);
      showToast('Ligne supprimée avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
    }
  }, [deleteOrderLine, showToast]);

  // --- Delete order flow ---

  const deleteCurrentOrder = useCallback(async () => {
    if (!selectedTableOrder) return;
    try {
      await deleteOrder(selectedTableOrder.id);
      showToast('Commande supprimée avec succès', 'success');
      onCleanup();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression de la commande';
      showToast(errorMessage, 'error');
    }
  }, [selectedTableOrder, deleteOrder, showToast, onCleanup]);

  const handleDelete = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    await deleteCurrentOrder();
    setShowDeleteDialog(false);
  }, [deleteCurrentOrder]);

  // --- Terminate flow ---

  const handleTerminate = useCallback(() => {
    setShowTerminateDialog(true);
  }, []);

  const handleConfirmTerminate = useCallback(async () => {
    if (!selectedTableOrder) return;
    try {
      await updateOrder(selectedTableOrder.id, {
        isClosed: true
      });

      showToast('Commande terminée avec succès', 'success');
      setShowTerminateDialog(false);
      onCleanup();
    } catch (error) {
      showToast('Erreur lors de la terminaison de la commande', 'error');
      console.error('Erreur terminate:', error);
    }
  }, [selectedTableOrder, updateOrder, showToast, onCleanup]);

  return {
    // Computed
    hasDraftItems,
    hasReadyItems,

    // Status updates
    handleUpdateItemStatus,
    handleUpdateMenuItemStatus,
    handleBulkUpdateStatus,

    // Claim
    handleClaim,
    confirmClaim,
    showClaimConfirmModal,
    setShowClaimConfirmModal,
    itemsToClaimData,
    setItemsToClaimData,

    // Serve
    handleServe,
    confirmServe,
    showServeConfirmModal,
    setShowServeConfirmModal,
    itemsToServeData,
    setItemsToServeData,

    // Delete
    handleDeleteLine,
    handleDelete,
    handleConfirmDelete,
    showDeleteDialog,
    setShowDeleteDialog,

    // Terminate
    handleTerminate,
    handleConfirmTerminate,
    showTerminateDialog,
    setShowTerminateDialog,
  };
};
