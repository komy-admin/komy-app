import React from 'react';
import { View, Animated, StyleSheet, Pressable, Dimensions } from 'react-native';
import { getStatusColor } from '~/lib/utils';
import { Table } from '~/types/table.types';
import { Text } from './ui';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';

const CELL_SIZE = 50;
const GRID_ROWS = 20;
const GRID_COLS = 15;

const GridLines: React.FC<{ width: number; height: number }> = ({ width, height }) => {
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

interface TableViewProps {
  table: Table;
  onPress: (id: string) => void;
}

const TableView: React.FC<TableViewProps> = ({ table, onPress }) => {
  const width = (table.width) * CELL_SIZE;
  const height = (table.height) * CELL_SIZE;
  
  return (
    <Pressable
      onPress={() => onPress(table.id)}
      style={[
        styles.table,
        {
          width,
          height,
          left: (table.xStart || 0) * CELL_SIZE,
          top: (table.yStart || 0) * CELL_SIZE,
          backgroundColor: getStatusColor(table.status),
        }
      ]}
    >
      <Text style={styles.tableText}>{table.name}</Text>
    </Pressable>
  );
};

const SeatingPlan: React.FC<{ 
  tables: Table[]; 
  onTablePress: (id: string) => void;
}> = ({ tables, onTablePress }) => {

  const screenWidth = Dimensions.get('window').width;
  const gridWidth = GRID_COLS * CELL_SIZE;
  const gridHeight = GRID_ROWS * CELL_SIZE;
  const initialZoom = screenWidth / gridWidth;

  return (
    <View style={styles.container}>
      <ReactNativeZoomableView
        maxZoom={1.5}
        minZoom={initialZoom}
        zoomStep={0.5}
        initialZoom={initialZoom}
        bindToBorders={true}
        contentWidth={gridWidth}
        contentHeight={gridHeight}
      >
        <View style={[styles.grid, { width: gridWidth, height: gridHeight }]}>
          <GridLines width={gridWidth} height={gridHeight} />
          {tables.map(table => (
            <TableView
              key={table.id}
              table={table}
              onPress={onTablePress}
            />
          ))}
        </View>
      </ReactNativeZoomableView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  seatingPlan: {
    flex: 1,
  },
  grid: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  table: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  tableText: {
    color: 'white',
    fontWeight: 'bold',
  },
  gridLine: {
    position: 'absolute',
    width: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#ddd',
  },
});

export default SeatingPlan;