import { StyleSheet, View } from "react-native";

interface GridLinesInterface {
  width: number;
  height: number;
  GRID_ROWS: number;
  GRID_COLS: number;
  CELL_SIZE: number;
}

export const RoomGrid: React.FC<GridLinesInterface> = ({ width, height, GRID_COLS, GRID_ROWS, CELL_SIZE }) => {
  const verticalLines = Array.from({ length: GRID_COLS - 1 }, (_, i) => (
    <View
      key={`v-${i}`}
      style={[
        styles.gridLine,
        {
          left: (i + 1) * CELL_SIZE,
          height: height,
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
          width: width,
        }
      ]}
    />
  ));

  return (
    <>
      {verticalLines}
      {horizontalLines}
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
    borderColor: '#ddd',
  },
})