import { StyleSheet, View } from "react-native";

interface GridLinesInterface {
  width: number;
  height: number;
  GRID_ROWS: number;
  GRID_COLS: number;
  CELL_SIZE: number;
}

export const RoomGrid: React.FC<GridLinesInterface> = ({ width, height, GRID_COLS, GRID_ROWS, CELL_SIZE }) => {
  // Nombre de lignes supplémentaires de chaque côté
  const EXTRA_LINES = 10;
  
  // Grille de base
  const verticalLines = Array.from({ length: GRID_COLS + 1 }, (_, i) => (
    <View
      key={`v-${i}`}
      style={[
        styles.gridLine,
        {
          left: i * CELL_SIZE,
          height: height + (EXTRA_LINES * 2 * CELL_SIZE),
          top: -EXTRA_LINES * CELL_SIZE,
        }
      ]}
    />
  ));

  const horizontalLines = Array.from({ length: GRID_ROWS - 1 }, (_, i) => (
    <View
      key={`h-${i}`}
      style={[
        styles.gridLine,
        {
          top: (i + 1) * CELL_SIZE,
          width: width + (EXTRA_LINES * 2 * CELL_SIZE),
          left: -EXTRA_LINES * CELL_SIZE,
        }
      ]}
    />
  ));

  // Grille étendue à gauche
  const leftVerticalLines = Array.from({ length: EXTRA_LINES }, (_, i) => (
    <View
      key={`lv-${i}`}
      style={[
        styles.extendedGridLine,
        {
          left: -(i + 1) * CELL_SIZE,
          height: height + (EXTRA_LINES * 2 * CELL_SIZE),
          top: -EXTRA_LINES * CELL_SIZE,
        }
      ]}
    />
  ));

  // Grille étendue à droite
  const rightVerticalLines = Array.from({ length: EXTRA_LINES }, (_, i) => (
    <View
      key={`rv-${i}`}
      style={[
        styles.extendedGridLine,
        {
          left: (GRID_COLS + i + 1) * CELL_SIZE,
          height: height + (EXTRA_LINES * 2 * CELL_SIZE),
          top: -EXTRA_LINES * CELL_SIZE,
        }
      ]}
    />
  ));

  // Grille étendue en haut
  const topHorizontalLines = Array.from({ length: EXTRA_LINES }, (_, i) => (
    <View
      key={`th-${i}`}
      style={[
        styles.extendedGridLine,
        {
          top: -(i) * CELL_SIZE,
          width: width + (EXTRA_LINES * 2 * CELL_SIZE),
          left: -EXTRA_LINES * CELL_SIZE,
        }
      ]}
    />
  ));

  // Grille étendue en bas
  const bottomHorizontalLines = Array.from({ length: EXTRA_LINES }, (_, i) => (
    <View
      key={`bh-${i}`}
      style={[
        styles.extendedGridLine,
        {
          top: (GRID_ROWS + i) * CELL_SIZE,
          width: width + (EXTRA_LINES * 2 * CELL_SIZE),
          left: -EXTRA_LINES * CELL_SIZE,
        }
      ]}
    />
  ));

  // Bordure de la salle
  const roomBorder = (
    <View
      style={[
        styles.roomBorder,
        {
          width: width,
          height: height,
          left: 0,
          top: 0,
        }
      ]}
    />
  );

  return (
    <>
      {verticalLines}
      {horizontalLines}
      {leftVerticalLines}
      {rightVerticalLines}
      {topHorizontalLines}
      {bottomHorizontalLines}
      {roomBorder}
    </>
  );
};

const styles = StyleSheet.create({
  gridLine: {
    position: 'absolute',
    width: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#F1F1F1',
  },
  extendedGridLine: {
    position: 'absolute',
    width: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#F1F1F1',
    opacity: 0.5,
  },
  roomBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#2A2E33',
    borderRadius: 4,
    backgroundColor: 'transparent',
  }
});