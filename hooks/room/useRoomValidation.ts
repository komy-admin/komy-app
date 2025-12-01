/**
 * useRoomValidation - Hook personnalisé pour la validation des positions de tables
 *
 * Optimise la validation en memoïzant les résultats et en évitant les calculs redondants.
 * Utilise un Map pour des lookups O(1) au lieu de O(n).
 */

import { useMemo } from 'react';
import { Table } from '~/types/table.types';

interface UseRoomValidationProps {
  tables: Table[];
  editingTableId?: string;
  roomWidth: number;
  roomHeight: number;
}

interface ValidationResult {
  isValid: boolean;
  isWithinBounds: boolean;
  hasCollision: boolean;
}

export const useRoomValidation = ({
  tables,
  editingTableId,
  roomWidth,
  roomHeight
}: UseRoomValidationProps) => {

  /**
   * Vérifie si une table est dans les limites de la room
   */
  const isTableWithinRoom = useMemo(() => {
    return (table: Table): boolean => {
      return (
        table.xStart >= 0 &&
        table.yStart >= 0 &&
        table.xStart + table.width <= roomWidth &&
        table.yStart + table.height <= roomHeight
      );
    };
  }, [roomWidth, roomHeight]);

  /**
   * Vérifie la collision AABB entre deux tables
   */
  const hasTableCollision = useMemo(() => {
    return (table: Table, otherTables: Table[]): boolean => {
      return otherTables.some(otherTable => {
        if (otherTable.id === table.id) return false;

        const hasHorizontalOverlap = (
          table.xStart < otherTable.xStart + otherTable.width &&
          table.xStart + table.width > otherTable.xStart
        );

        const hasVerticalOverlap = (
          table.yStart < otherTable.yStart + otherTable.height &&
          table.yStart + table.height > otherTable.yStart
        );

        return hasHorizontalOverlap && hasVerticalOverlap;
      });
    };
  }, []);

  /**
   * Map de validité memoïzée - O(1) lookup au lieu de O(n)
   * Recalculée seulement quand tables, editingTableId, roomWidth ou roomHeight changent
   */
  const validityMap = useMemo(() => {
    const map = new Map<string, ValidationResult>();

    tables.forEach(table => {
      // Seule la table en édition peut être invalide
      if (table.id !== editingTableId) {
        map.set(table.id, {
          isValid: true,
          isWithinBounds: true,
          hasCollision: false
        });
        return;
      }

      const withinBounds = isTableWithinRoom(table);
      const collision = hasTableCollision(table, tables);

      map.set(table.id, {
        isValid: withinBounds && !collision,
        isWithinBounds: withinBounds,
        hasCollision: collision
      });
    });

    return map;
  }, [tables, editingTableId, roomWidth, roomHeight, isTableWithinRoom, hasTableCollision]);

  /**
   * Fonction rapide pour vérifier si une table est valide
   * Utilise le Map pour lookup O(1)
   */
  const isPositionValid = (table: Table): boolean => {
    const result = validityMap.get(table.id);
    return result?.isValid ?? true;
  };

  /**
   * Obtenir les détails de validation pour une table
   */
  const getValidationDetails = (tableId: string): ValidationResult => {
    return validityMap.get(tableId) ?? {
      isValid: true,
      isWithinBounds: true,
      hasCollision: false
    };
  };

  /**
   * Vérifier si une position hypothétique serait valide
   * Utile pour le drag & drop preview
   */
  const wouldPositionBeValid = (
    tableId: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): ValidationResult => {
    // Vérifier les limites
    const withinBounds = (
      x >= 0 &&
      y >= 0 &&
      x + width <= roomWidth &&
      y + height <= roomHeight
    );

    // Vérifier les collisions
    const collision = tables.some(otherTable => {
      if (otherTable.id === tableId) return false;

      return (
        x < otherTable.xStart + otherTable.width &&
        x + width > otherTable.xStart &&
        y < otherTable.yStart + otherTable.height &&
        y + height > otherTable.yStart
      );
    });

    return {
      isValid: withinBounds && !collision,
      isWithinBounds: withinBounds,
      hasCollision: collision
    };
  };

  return {
    // Fonctions
    isPositionValid,
    getValidationDetails,
    wouldPositionBeValid,
    isTableWithinRoom,
    hasTableCollision,

    // Map pour accès direct
    validityMap
  };
};
