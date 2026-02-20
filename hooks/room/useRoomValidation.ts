/**
 * useRoomValidation - Hook pour la validation des positions de tables
 *
 * Memoïse les résultats dans un Map pour des lookups O(1).
 * Seule la table en édition est réellement validée (les autres sont toujours valides).
 */

import { useMemo } from 'react';
import { Table } from '~/types/table.types';

interface UseRoomValidationProps {
  tables: Table[];
  editingTableId?: string;
  roomWidth: number;
  roomHeight: number;
}

export const useRoomValidation = ({
  tables,
  editingTableId,
  roomWidth,
  roomHeight
}: UseRoomValidationProps) => {

  const validityMap = useMemo(() => {
    const map = new Map<string, boolean>();

    tables.forEach(table => {
      // Seule la table en édition peut être invalide
      if (table.id !== editingTableId) {
        map.set(table.id, true);
        return;
      }

      // Vérifier les limites de la room
      const withinBounds = (
        table.xStart >= 0 &&
        table.yStart >= 0 &&
        table.xStart + table.width <= roomWidth &&
        table.yStart + table.height <= roomHeight
      );

      // Vérifier les collisions AABB avec les autres tables
      const hasCollision = tables.some(other => {
        if (other.id === table.id) return false;
        return (
          table.xStart < other.xStart + other.width &&
          table.xStart + table.width > other.xStart &&
          table.yStart < other.yStart + other.height &&
          table.yStart + table.height > other.yStart
        );
      });

      map.set(table.id, withinBounds && !hasCollision);
    });

    return map;
  }, [tables, editingTableId, roomWidth, roomHeight]);

  const isPositionValid = (table: Table): boolean => {
    return validityMap.get(table.id) ?? true;
  };

  return { isPositionValid };
};
