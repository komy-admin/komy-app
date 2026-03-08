/**
 * useRoomDimensions - Calculs de dimensions de la Room.
 *
 * Calcul synchrone via useMemo (pas d'effet async, pas de flash de rendu).
 * Retourne les dimensions de grille et le zoom optimal.
 * Les constantes CELL_SIZE / EXTRA_LINES sont dans constants.ts.
 */

import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { CELL_SIZE, EXTRA_LINES, MIN_SCALE, MAX_SCALE } from '~/hooks/room/constants';

interface UseRoomDimensionsProps {
  roomWidth: number;
  roomHeight: number;
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
  // Réactif aux changements de taille fenêtre (rotation iPad, split view)
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const dimensions = useMemo((): RoomDimensions | null => {
    if (isLoading) return null;
    if (fillContainer && !containerDimensions) return null;

    const roomWidthPx = roomWidth * CELL_SIZE;
    const roomHeightPx = roomHeight * CELL_SIZE;

    const extendedWidth = roomWidthPx + (EXTRA_LINES * 2 * CELL_SIZE);
    const extendedHeight = roomHeightPx + (EXTRA_LINES * 2 * CELL_SIZE);

    let optimalZoom: number;

    if (fillContainer && containerDimensions) {
      const horizontalZoom = containerDimensions.width / roomWidthPx;
      const verticalZoom = containerDimensions.height / roomHeightPx;
      optimalZoom = Math.min(horizontalZoom, verticalZoom) * 0.92;
    } else if (containerDimensions) {
      const availableWidth = containerDimensions.width - 40;
      const availableHeight = containerDimensions.height - 40;
      const horizontalZoom = (availableWidth * 0.95) / roomWidthPx;
      const verticalZoom = (availableHeight * 0.9) / roomHeightPx;
      optimalZoom = Math.min(horizontalZoom, verticalZoom) * 0.9;
    } else {
      const SIDE_PANEL_WIDTH = screenWidth / 4;
      const availableWidth = screenWidth - SIDE_PANEL_WIDTH;
      const availableHeight = screenHeight * 0.9;
      const horizontalZoom = (availableWidth * 0.95) / roomWidthPx;
      const verticalZoom = (availableHeight * 0.9) / roomHeightPx;
      optimalZoom = Math.min(horizontalZoom, verticalZoom);
      if (roomWidth > 1 || roomHeight > 1) {
        optimalZoom *= 0.7;
      }
    }

    // Pour les très grandes rooms, permettre un zoom plus petit que MIN_SCALE
    // afin que la room tienne dans le container
    const effectiveMinScale = Math.min(MIN_SCALE, optimalZoom);
    const initialZoom = Math.min(Math.max(optimalZoom, effectiveMinScale), MAX_SCALE);

    return { gridWidth: extendedWidth, gridHeight: extendedHeight, initialZoom };
  }, [roomWidth, roomHeight, isLoading, containerDimensions, fillContainer, screenWidth, screenHeight]);

  return {
    dimensions,
    isGridReady: dimensions !== null,
  };
};
