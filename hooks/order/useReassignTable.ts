import { useState, useMemo, useCallback } from 'react';
import { Order } from '~/types/order.types';
import { Room } from '~/types/room.types';
import { Table } from '~/types/table.types';
import { ToastType } from '~/components/ui/toast';
import { showApiError } from '~/lib/apiErrorHandler';

interface UseReassignTableProps {
  currentRoom: Room | null;
  rooms: Room[];
  enrichedTables: Table[];
  selectedTableOrder: Order | null;
  updateOrder: (id: string, data: Partial<Order>) => Promise<any>;
  setSelectedTable: (id: string | null) => void;
  setCurrentRoom: (id: string) => void;
  showToast: (msg: string, type?: ToastType) => void;
}

export function useReassignTable({
  currentRoom,
  rooms,
  enrichedTables,
  selectedTableOrder,
  updateOrder,
  setSelectedTable,
  setCurrentRoom,
  showToast,
}: UseReassignTableProps) {
  const [showReassignInline, setShowReassignInline] = useState(false);
  const [reassignRoomId, setReassignRoomId] = useState<string | null>(null);
  const [isReassigning, setIsReassigning] = useState(false);

  const handleReassignTable = useCallback(() => {
    setReassignRoomId(currentRoom?.id || null);
    setShowReassignInline(true);
  }, [currentRoom]);

  const reassignRoom = useMemo(() => {
    if (!reassignRoomId) return null;
    return rooms.find(room => room.id === reassignRoomId) || null;
  }, [reassignRoomId, rooms]);

  const reassignRoomTables = useMemo(() => {
    if (!reassignRoomId) return [];
    return enrichedTables.filter(table => table.roomId === reassignRoomId);
  }, [reassignRoomId, enrichedTables]);

  const handleReassignRoomChange = useCallback((room: any) => {
    setReassignRoomId(room.id);
  }, []);

  const handleTableReassign = useCallback(async (table: Table | null) => {
    if (!table || !selectedTableOrder || isReassigning) return;

    setIsReassigning(true);
    try {
      await updateOrder(selectedTableOrder.id, { tableId: table.id });
      // Changer de room si la table cible est dans une autre room
      if (table.roomId && table.roomId !== currentRoom?.id) {
        setCurrentRoom(table.roomId);
      }
      setSelectedTable(table.id);
      setShowReassignInline(false);
      showToast('Table réassignée avec succès', 'success');
    } catch (error) {
      showApiError(error, showToast, 'Erreur lors de la réassignation');
    } finally {
      // Délai pour laisser le WebSocket mettre à jour le store
      setTimeout(() => {
        setIsReassigning(false);
      }, 500);
    }
  }, [selectedTableOrder, updateOrder, setSelectedTable, setCurrentRoom, currentRoom, showToast, isReassigning]);

  return {
    showReassignInline,
    setShowReassignInline,
    reassignRoomId,
    reassignRoom,
    reassignRoomTables,
    isReassigning,
    handleReassignTable,
    handleReassignRoomChange,
    handleTableReassign,
  };
}
