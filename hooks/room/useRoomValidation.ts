/**
 * useRoomValidation - Hook pour la validation des positions de tables
 *
 * Memoïse les résultats dans des Maps pour des lookups O(1).
 * - boundsMap : vérifie si chaque table est dans les limites de la room
 * - validityMap : vérifie bounds + collisions pour la table en édition
 */

import { useMemo, useCallback } from 'react';
import { Table } from '~/types/table.types';

/** Vérifie si une table est entièrement dans les limites de la room */
export const isTableInBounds = (
  table: Pick<Table, 'xStart' | 'yStart' | 'width' | 'height'>,
  roomWidth: number,
  roomHeight: number
): boolean => (
  table.xStart >= 0 &&
  table.yStart >= 0 &&
  table.xStart + table.width <= roomWidth &&
  table.yStart + table.height <= roomHeight
);

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

  // Map des tables dans/hors limites (toutes les tables)
  const boundsMap = useMemo(() => {
    const map = new Map<string, boolean>();
    tables.forEach(table => {
      map.set(table.id, isTableInBounds(table, roomWidth, roomHeight));
    });
    return map;
  }, [tables, roomWidth, roomHeight]);

  // Map de validité complète (bounds + collisions) pour la table en édition
  const validityMap = useMemo(() => {
    const map = new Map<string, boolean>();

    tables.forEach(table => {
      const inBounds = boundsMap.get(table.id) ?? true;

      // Pour la table en édition : vérifier bounds + collisions
      if (table.id === editingTableId) {
        const hasCollision = tables.some(other => {
          if (other.id === table.id) return false;
          return (
            table.xStart < other.xStart + other.width &&
            table.xStart + table.width > other.xStart &&
            table.yStart < other.yStart + other.height &&
            table.yStart + table.height > other.yStart
          );
        });
        map.set(table.id, inBounds && !hasCollision);
      } else {
        map.set(table.id, inBounds);
      }
    });

    return map;
  }, [tables, editingTableId, boundsMap]);

  const isPositionValid = useCallback((table: Table): boolean => {
    return validityMap.get(table.id) ?? true;
  }, [validityMap]);

  const isInBounds = useCallback((table: Table): boolean => {
    return boundsMap.get(table.id) ?? true;
  }, [boundsMap]);

  return { isPositionValid, isInBounds };
};
