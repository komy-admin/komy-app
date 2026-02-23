/**
 * useRoomDimensions - Calculs de dimensions de la Room.
 *
 * Calcul synchrone via useMemo (pas d'effet async, pas de flash de rendu).
 * Retourne CELL_SIZE, EXTRA_LINES, dimensions de grille et zoom optimal.
 */

import { useMemo } from 'react';
import { Dimensions } from 'react-native';

export const CELL_SIZE = 50;
export const EXTRA_LINES = 10; // Extension de la grille pour capturer les gestes partout

interface UseRoomDimensionsProps {
  roomWidth: number; // Largeur en cellules
  roomHeight: number; // Hauteur en cellules
  isLoading: boolean;
  containerDimensions?: { width: number; height: number };
  fillContainer?: boolean;
}

interface RoomDimensions {
  gridWidth: number;
  gridHeight: number;
  initialZoom: number;
}

export const useRoomDimensions = ({
  roomWidth,
  roomHeight,
  isLoading,
  containerDimensions,
  fillContainer
}: UseRoomDimensionsProps) => {

  // Calcul synchrone des dimensions
  const dimensions = useMemo((): RoomDimensions | null => {
    if (isLoading) return null;
    // Attendre la mesure réelle du conteneur avant de calculer le zoom
    if (fillContainer && !containerDimensions) return null;

    const screenWidth = Dimensions.get('window').width;
    const roomWidthPx = roomWidth * CELL_SIZE;
    const roomHeightPx = roomHeight * CELL_SIZE;

    // Extension de la zone de capture des gestes au-delà de la room
    const extendedWidth = roomWidthPx + (EXTRA_LINES * 2 * CELL_SIZE);
    const extendedHeight = roomHeightPx + (EXTRA_LINES * 2 * CELL_SIZE);

    // Calcul du zoom optimal
    let optimalZoom: number;

    if (fillContainer && containerDimensions) {
      // Mode fillContainer : remplir le conteneur mesuré avec ~8% de marge
      const horizontalZoom = containerDimensions.width / roomWidthPx;
      const verticalZoom = containerDimensions.height / roomHeightPx;
      optimalZoom = Math.min(horizontalZoom, verticalZoom) * 0.92;
    } else if (containerDimensions) {
      // Pour les modales : utiliser les dimensions du conteneur avec padding
      const availableWidth = containerDimensions.width - 40;
      const availableHeight = containerDimensions.height - 40;
      const horizontalZoom = (availableWidth * 0.95) / roomWidthPx;
      const verticalZoom = (availableHeight * 0.9) / roomHeightPx;
      optimalZoom = Math.min(horizontalZoom, verticalZoom) * 0.9;
    } else {
      // Fallback sans mesure conteneur : estimation statique via window
      const SIDE_PANEL_WIDTH = screenWidth / 4;
      const availableWidth = screenWidth - SIDE_PANEL_WIDTH;
      const availableHeight = Dimensions.get('window').height * 0.9;
      const horizontalZoom = (availableWidth * 0.95) / roomWidthPx;
      const verticalZoom = (availableHeight * 0.9) / roomHeightPx;
      optimalZoom = Math.min(horizontalZoom, verticalZoom);
      if (roomWidth > 1 || roomHeight > 1) {
        optimalZoom *= 0.7;
      }
    }

    // Contraindre entre 0.2 et 1.5
    const initialZoom = Math.min(Math.max(optimalZoom, 0.2), 1.5);

    return {
      gridWidth: extendedWidth,
      gridHeight: extendedHeight,
      initialZoom
    };
  }, [roomWidth, roomHeight, isLoading, containerDimensions, fillContainer]);

  // Dérivé de dimensions (pas de double rendu)
  const isGridReady = dimensions !== null;

  return {
    dimensions,
    isGridReady,
    CELL_SIZE,
    EXTRA_LINES
  };
};
