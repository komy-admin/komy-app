/**
 * useRoomDimensions - Hook personnalisé pour les calculs de dimensions de la Room
 *
 * 🚀 OPTIMISATION v2.1:
 * - Calcul synchrone des dimensions initiales (pas d'effet async)
 * - Plus de flash de rendu (isGridReady=false→true)
 * - useMemo pour calculs instantanés au mount
 */

import { useMemo } from 'react';
import { Dimensions } from 'react-native';

const CELL_SIZE = 50;
const EXTRA_LINES = 10; // Extension de la grille pour capturer les gestes partout

interface UseRoomDimensionsProps {
  roomWidth: number; // Largeur en cellules
  roomHeight: number; // Hauteur en cellules
  isLoading: boolean;
  containerDimensions?: { width: number; height: number };
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
  containerDimensions
}: UseRoomDimensionsProps) => {

  // 🚀 Calcul synchrone des dimensions - plus besoin d'effet
  const dimensions = useMemo((): RoomDimensions | null => {
    if (isLoading) return null;

    const screenWidth = Dimensions.get('window').width;
    const roomWidthPx = roomWidth * CELL_SIZE;
    const roomHeightPx = roomHeight * CELL_SIZE;

    // Extension de la zone de capture des gestes au-delà de la room
    const extendedWidth = roomWidthPx + (EXTRA_LINES * 2 * CELL_SIZE);
    const extendedHeight = roomHeightPx + (EXTRA_LINES * 2 * CELL_SIZE);

    // Calcul du zoom optimal
    let availableWidth: number;
    let availableHeight: number;

    if (containerDimensions) {
      // Pour les modales : utiliser les dimensions du conteneur avec padding
      availableWidth = containerDimensions.width - 40;
      availableHeight = containerDimensions.height - 40;
    } else {
      // Comportement normal pour la vue service
      const SIDE_PANEL_WIDTH = screenWidth / 4;
      availableWidth = screenWidth - SIDE_PANEL_WIDTH;
      availableHeight = Dimensions.get('window').height * 0.9;
    }

    const horizontalZoom = (availableWidth * 0.95) / roomWidthPx;
    const verticalZoom = (availableHeight * 0.9) / roomHeightPx;

    let optimalZoom = Math.min(horizontalZoom, verticalZoom);

    if (containerDimensions) {
      optimalZoom *= 0.9;
    } else if (roomWidth > 1 || roomHeight > 1) {
      optimalZoom *= 0.7;
    }

    // Contraindre entre 0.2 et 1.5
    const initialZoom = Math.min(Math.max(optimalZoom, 0.2), 1.5);

    return {
      gridWidth: extendedWidth,
      gridHeight: extendedHeight,
      initialZoom
    };
  }, [roomWidth, roomHeight, isLoading, containerDimensions]);

  // 🚀 isGridReady est maintenant dérivé directement de dimensions
  // Plus de double rendu avec setState(false) puis setState(true)
  const isGridReady = dimensions !== null;

  return {
    dimensions,
    isGridReady,
    CELL_SIZE,
    EXTRA_LINES
  };
};
