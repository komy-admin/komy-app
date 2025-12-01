/**
 * RoomContext - Context pour partager les valeurs stables de la Room
 *
 * Évite le prop drilling en passant les valeurs constantes via Context.
 * Réduit drastiquement les re-renders en évitant de passer ces props à chaque RoomTable.
 *
 * ⚡ v2.4: currentZoomScale est maintenant une SharedValue (pas number)
 * pour éviter les re-renders sur changement de zoom (100% UI thread)
 */

import React, { createContext, useContext, useMemo } from 'react';
import { SharedValue } from 'react-native-reanimated';
import { Table } from '~/types/table.types';

interface RoomContextValue {
  roomWidth: number;      // Largeur de la room en cellules
  roomHeight: number;     // Hauteur de la room en cellules
  CELL_SIZE: number;      // Taille d'une cellule en pixels
  editionMode: boolean;   // Mode édition actif ou non
  currentZoomScale: SharedValue<number>;  // ⚡ SharedValue (pas number)
  tables: Table[];        // Toutes les tables (pour collision detection)
}

const RoomContext = createContext<RoomContextValue | null>(null);

interface RoomProviderProps {
  children: React.ReactNode;
  value: RoomContextValue;
}

/**
 * Provider du RoomContext
 * À wrapper autour du contenu de la Room pour partager les valeurs
 */
export const RoomProvider: React.FC<RoomProviderProps> = ({ children, value }) => {
  // Memoïzer la valeur du context pour éviter les re-renders inutiles
  // ⚡ currentZoomScale est une SharedValue stable (même référence), pas besoin de la watch
  const memoizedValue = useMemo(() => value, [
    value.roomWidth,
    value.roomHeight,
    value.CELL_SIZE,
    value.editionMode,
    value.currentZoomScale,
    value.tables
  ]);

  return (
    <RoomContext.Provider value={memoizedValue}>
      {children}
    </RoomContext.Provider>
  );
};

/**
 * Hook pour accéder au RoomContext
 * Throw une erreur si utilisé en dehors du Provider
 */
export const useRoomContext = (): RoomContextValue => {
  const context = useContext(RoomContext);

  if (!context) {
    throw new Error('useRoomContext must be used within a RoomProvider');
  }

  return context;
};

/**
 * Hook pour accéder seulement aux tables proches (optimisation)
 * Réduit les re-renders en filtrant les tables non pertinentes
 */
export const useNearbyTables = (
  tableId: string,
  x: number,
  y: number,
  radius: number = 5
): Table[] => {
  const { tables } = useRoomContext();

  return useMemo(() => {
    return tables.filter(table => {
      if (table.id === tableId) return false;

      // Vérifier si la table est dans le rayon
      const distance = Math.sqrt(
        Math.pow(table.xStart - x, 2) +
        Math.pow(table.yStart - y, 2)
      );

      return distance <= radius;
    });
  }, [tables, tableId, x, y, radius]);
};
