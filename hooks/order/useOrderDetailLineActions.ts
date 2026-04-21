import { useState, useCallback } from 'react';
import { Order } from '~/types/order.types';
import { OrderLine } from '~/types/order-line.types';
import { Status } from '~/types/status.enum';

interface UseGroupActionsProps {
  selectedTableOrder: Order | null;
  handleBulkUpdateStatus: (lineIds: string[], itemIds: string[], status: Status) => Promise<void>;
  handleDeleteLine: (id: string, reason?: string, notes?: string) => Promise<void>;
  deleteOrderLines: (ids: string[], reason?: string, notes?: string) => Promise<void>;
}

export function useOrderDetailLineActions({
  selectedTableOrder,
  handleBulkUpdateStatus,
  handleDeleteLine,
  deleteOrderLines,
}: UseGroupActionsProps) {
  // --- Changement de statut (unifié via GroupStatusPickerModal) ---
  const [statusGroupData, setStatusGroupData] = useState<{
    indices: number[];
    itemName: string;
    currentStatus: Status;
  } | null>(null);

  const handleOpenStatusSelector = useCallback((index: number) => {
    if (!selectedTableOrder) return;
    const line = selectedTableOrder.lines[index];
    if (!line) return;
    setStatusGroupData({
      indices: [index],
      itemName: line.item?.name || 'Article',
      currentStatus: line.status || Status.PENDING,
    });
  }, [selectedTableOrder]);

  const handleOpenStatusSelectorGroup = useCallback((indices: number[]) => {
    if (!selectedTableOrder || indices.length === 0) return;
    const firstLine = selectedTableOrder.lines[indices[0]];
    setStatusGroupData({
      indices,
      itemName: firstLine?.item?.name || 'Article',
      currentStatus: firstLine?.status || Status.PENDING,
    });
  }, [selectedTableOrder]);

  const handleConfirmGroupStatus = useCallback(async (quantity: number, newStatus: Status) => {
    if (!statusGroupData || !selectedTableOrder) return;
    const ids = statusGroupData.indices
      .slice(0, quantity)
      .map(idx => selectedTableOrder.lines[idx]?.id)
      .filter(Boolean) as string[];
    setStatusGroupData(null);
    if (ids.length === 0) return;
    await handleBulkUpdateStatus(ids, [], newStatus);
  }, [statusGroupData, selectedTableOrder, handleBulkUpdateStatus]);

  const handleCloseStatusGroup = useCallback(() => {
    setStatusGroupData(null);
  }, []);

  // --- Menu status: stocke les orderLineItemIds pour bulk update ---
  const [menuStatusData, setMenuStatusData] = useState<{
    orderLineItemIds: string[];
    itemName: string;
    currentStatus: Status;
  } | null>(null);

  const handleOpenMenuStatusSelector = useCallback((menuLine: OrderLine) => {
    if (!menuLine.items || menuLine.items.length === 0) return;
    const currentStatus = menuLine.items[0]?.status || Status.PENDING;
    setMenuStatusData({
      orderLineItemIds: menuLine.items.map(item => item.id),
      itemName: menuLine.menu?.name || 'Menu',
      currentStatus,
    });
  }, []);

  const handleConfirmMenuStatus = useCallback(async (quantity: number, newStatus: Status) => {
    if (!menuStatusData) return;
    const ids = menuStatusData.orderLineItemIds.slice(0, quantity);
    setMenuStatusData(null);
    if (ids.length === 0) return;
    await handleBulkUpdateStatus([], ids, newStatus);
  }, [menuStatusData, handleBulkUpdateStatus]);

  const handleCloseMenuStatus = useCallback(() => {
    setMenuStatusData(null);
  }, []);

  // --- Suppression groupée ---
  const [deleteGroupData, setDeleteGroupData] = useState<{
    indices: number[];
    itemName: string;
    status?: Status;
  } | null>(null);

  const handleDeleteLineByIndex = useCallback((index: number) => {
    if (!selectedTableOrder) return;
    const line = selectedTableOrder.lines[index];
    if (!line) return;
    setDeleteGroupData({
      indices: [index],
      itemName: line.item?.name || line.menu?.name || 'Article',
      status: line.status,
    });
  }, [selectedTableOrder]);

  const handleDeleteGroupByIndices = useCallback((indices: number[]) => {
    if (!selectedTableOrder || indices.length === 0) return;
    const firstLine = selectedTableOrder.lines[indices[0]];
    setDeleteGroupData({
      indices,
      itemName: firstLine?.item?.name || firstLine?.menu?.name || 'Article',
      status: firstLine?.status,
    });
  }, [selectedTableOrder]);

  const handleConfirmDeleteGroup = useCallback(async (quantity: number, reason?: string, notes?: string) => {
    if (!deleteGroupData || !selectedTableOrder) return;
    const ids = deleteGroupData.indices
      .slice(0, quantity)
      .map(idx => selectedTableOrder.lines[idx]?.id)
      .filter(Boolean) as string[];
    setDeleteGroupData(null);
    if (ids.length === 1) {
      await handleDeleteLine(ids[0], reason, notes);
    } else if (ids.length > 1) {
      await deleteOrderLines(ids, reason, notes);
    }
  }, [deleteGroupData, selectedTableOrder, handleDeleteLine, deleteOrderLines]);

  const handleCloseDeleteGroup = useCallback(() => {
    setDeleteGroupData(null);
  }, []);

  return {
    // Status group
    statusGroupData,
    handleOpenStatusSelector,
    handleOpenStatusSelectorGroup,
    handleConfirmGroupStatus,
    handleCloseStatusGroup,
    // Menu status
    menuStatusData,
    handleOpenMenuStatusSelector,
    handleConfirmMenuStatus,
    handleCloseMenuStatus,
    // Delete group
    deleteGroupData,
    handleDeleteLineByIndex,
    handleDeleteGroupByIndices,
    handleConfirmDeleteGroup,
    handleCloseDeleteGroup,
  };
}
