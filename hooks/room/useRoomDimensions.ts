/**
 * useRoomDimensions - Hook personnalisé pour les calculs de dimensions de la Room
 *
 * Gère le calcul du zoom optimal, des dimensions de la grille, et l'état de chargement
 */

import { useState, useEffect, useMemo } from 'react';
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
  const [dimensions, setDimensions] = useState<RoomDimensions | null>(null);
  const [isGridReady, setIsGridReady] = useState(false);

  /**
   * Calcule le zoom optimal pour que la room soit visible à l'écran
   */
  const calculateOptimalZoom = useMemo(() => {
    return (
      screenWidth: number,
      gridWidth: number,
      gridHeight: number,
      roomWidth: number,
      roomHeight: number
    ): number => {
      let availableWidth: number;
      let availableHeight: number;

      if (containerDimensions) {
        // Pour les modales : utiliser les dimensions du conteneur avec padding
        availableWidth = containerDimensions.width - 40; // 20px padding de chaque côté
        availableHeight = containerDimensions.height - 40;
      } else {
        // Comportement normal pour la vue service
        const SIDE_PANEL_WIDTH = screenWidth / 4;
        availableWidth = screenWidth - SIDE_PANEL_WIDTH;
        availableHeight = Dimensions.get('window').height * 0.9;
      }

      const horizontalZoom = (availableWidth * 0.95) / gridWidth;
      const verticalZoom = (availableHeight * 0.9) / gridHeight;

      let optimalZoom = Math.min(horizontalZoom, verticalZoom);

      if (containerDimensions) {
        // Pour les modales : zoom légèrement plus élevé
        optimalZoom *= 0.9;
      } else if (roomWidth > 1 || roomHeight > 1) {
        optimalZoom *= 0.7;
      }

      // Contraindre entre 0.2 et 1.5
      return Math.min(Math.max(optimalZoom, 0.2), 1.5);
    };
  }, [containerDimensions]);

  /**
   * Effet pour calculer les dimensions et le zoom quand la room change
   */
  useEffect(() => {
    setIsGridReady(false);

    if (!isLoading) {
      const screenWidth = Dimensions.get('window').width;
      const roomWidthPx = roomWidth * CELL_SIZE;
      const roomHeightPx = roomHeight * CELL_SIZE;

      // Extension de la zone de capture des gestes au-delà de la room
      const extendedWidth = roomWidthPx + (EXTRA_LINES * 2 * CELL_SIZE);
      const extendedHeight = roomHeightPx + (EXTRA_LINES * 2 * CELL_SIZE);

      const newZoom = calculateOptimalZoom(
        screenWidth,
        roomWidthPx,
        roomHeightPx,
        roomWidth,
        roomHeight
      );

      setDimensions({
        gridWidth: extendedWidth,
        gridHeight: extendedHeight,
        initialZoom: newZoom
      });

      // Petit délai pour éviter le flash de rendu
      const timer = setTimeout(() => {
        setIsGridReady(true);
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [roomWidth, roomHeight, isLoading, containerDimensions, calculateOptimalZoom]);

  return {
    dimensions,
    isGridReady,
    CELL_SIZE,
    EXTRA_LINES
  };
};
