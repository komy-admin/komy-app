/**
 * RoomGrid - Grille SVG pour le mode édition.
 *
 * Un seul composant SVG au lieu de 100+ View (gain 10x performance).
 * Lignes principales (room) + lignes extended (overflow avec opacity réduite) + bordure salle.
 * React.memo : ne re-render que si les dimensions changent.
 */

import React from "react";
import Svg, { Line, Rect, G } from 'react-native-svg';
import { EXTRA_LINES } from '~/hooks/room/constants';
import { colors } from '~/theme';

interface GridLinesInterface {
  width: number;
  height: number;
  GRID_ROWS: number;
  GRID_COLS: number;
  CELL_SIZE: number;
  borderColor?: string;
}

const RoomGridComponent: React.FC<GridLinesInterface> = ({ width, height, GRID_COLS, GRID_ROWS, CELL_SIZE, borderColor = colors.brand.dark }) => {
  const extendedHeight = height + (EXTRA_LINES * 2 * CELL_SIZE);
  const extendedWidth = width + (EXTRA_LINES * 2 * CELL_SIZE);

  return (
    <Svg
      width={extendedWidth}
      height={extendedHeight}
      style={{
        position: 'absolute',
        left: -EXTRA_LINES * CELL_SIZE,
        top: -EXTRA_LINES * CELL_SIZE,
      }}
    >
      <G>
        {/* Lignes verticales principales */}
        {Array.from({ length: GRID_COLS + 1 }, (_, i) => (
          <Line
            key={`v-${i}`}
            x1={(i + EXTRA_LINES) * CELL_SIZE}
            y1={0}
            x2={(i + EXTRA_LINES) * CELL_SIZE}
            y2={extendedHeight}
            stroke={colors.gray[300]}
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        ))}

        {/* Lignes horizontales principales */}
        {Array.from({ length: GRID_ROWS - 1 }, (_, i) => (
          <Line
            key={`h-${i}`}
            x1={0}
            y1={(i + 1 + EXTRA_LINES) * CELL_SIZE}
            x2={extendedWidth}
            y2={(i + 1 + EXTRA_LINES) * CELL_SIZE}
            stroke={colors.gray[300]}
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        ))}

        {/* Lignes verticales extended (gauche) */}
        {Array.from({ length: EXTRA_LINES }, (_, i) => (
          <Line
            key={`lv-${i}`}
            x1={i * CELL_SIZE}
            y1={0}
            x2={i * CELL_SIZE}
            y2={extendedHeight}
            stroke={colors.gray[300]}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.5}
          />
        ))}

        {/* Lignes verticales extended (droite) */}
        {Array.from({ length: EXTRA_LINES }, (_, i) => (
          <Line
            key={`rv-${i}`}
            x1={(GRID_COLS + EXTRA_LINES + i + 1) * CELL_SIZE}
            y1={0}
            x2={(GRID_COLS + EXTRA_LINES + i + 1) * CELL_SIZE}
            y2={extendedHeight}
            stroke={colors.gray[300]}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.5}
          />
        ))}

        {/* Lignes horizontales extended (haut) */}
        {Array.from({ length: EXTRA_LINES }, (_, i) => (
          <Line
            key={`th-${i}`}
            x1={0}
            y1={i * CELL_SIZE}
            x2={extendedWidth}
            y2={i * CELL_SIZE}
            stroke={colors.gray[300]}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.5}
          />
        ))}

        {/* Lignes horizontales extended (bas) */}
        {Array.from({ length: EXTRA_LINES }, (_, i) => (
          <Line
            key={`bh-${i}`}
            x1={0}
            y1={(GRID_ROWS + EXTRA_LINES + i) * CELL_SIZE}
            x2={extendedWidth}
            y2={(GRID_ROWS + EXTRA_LINES + i) * CELL_SIZE}
            stroke={colors.gray[300]}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.5}
          />
        ))}

        {/* Bordure de la salle - rendue en dernier pour couvrir les lignes */}
        <Rect
          x={EXTRA_LINES * CELL_SIZE}
          y={EXTRA_LINES * CELL_SIZE}
          width={width}
          height={height}
          fill="none"
          stroke={borderColor}
          strokeWidth={2}
        />
      </G>
    </Svg>
  );
};

// React.memo : la grille ne change que si les dimensions changent
export const RoomGrid = React.memo(RoomGridComponent, (prev, next) => {
  return (
    prev.width === next.width &&
    prev.height === next.height &&
    prev.GRID_COLS === next.GRID_COLS &&
    prev.GRID_ROWS === next.GRID_ROWS &&
    prev.CELL_SIZE === next.CELL_SIZE &&
    prev.borderColor === next.borderColor
  );
});