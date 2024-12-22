import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Pressable, PanResponder } from 'react-native';
import { getStatusColor } from '~/lib/utils';
import { Table } from '~/types/table.types';
import { Text } from './ui';
import { ReactNativeZoomableView, } from '@openspacelabs/react-native-zoomable-view';
import { Animated } from 'react-native';

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
  isEditing: boolean;
  onPress: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Table>) => void;
}

const TableView: React.FC<TableViewProps> = ({ table, isEditing, onPress, onUpdate }) => {

  const lastValidWidth = useRef(table.width);
  const lastValidHeight = useRef(table.height);
  // Valeurs animées pour la taille
  const width = useRef(new Animated.Value(table.width * CELL_SIZE)).current;
  const height = useRef(new Animated.Value(table.height * CELL_SIZE)).current;

  useEffect(() => {
    lastValidWidth.current = table.width;
    lastValidHeight.current = table.height;
    width.setValue(table.width * CELL_SIZE);
    height.setValue(table.height * CELL_SIZE);
  }, [table.width, table.height]);

  // PanResponder pour le redimensionnement droit
  const rightPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const newWidth = Math.max(
          CELL_SIZE,
          Math.round((lastValidWidth.current * CELL_SIZE + gesture.dx) / CELL_SIZE) * CELL_SIZE
        );
        width.setValue(newWidth);
      },
      onPanResponderRelease: (_, gesture) => {
        const newTableWidth = Math.round(width._value / CELL_SIZE);
        console.log('Before release table width', lastValidWidth.current);
        lastValidWidth.current = newTableWidth; // Mettre à jour la référence
        onUpdate(table.id, { width: newTableWidth });
      }
    })
  ).current;

  const bottomPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const newHeight = Math.max(
          CELL_SIZE,
          Math.round((lastValidHeight.current * CELL_SIZE + gesture.dy) / CELL_SIZE) * CELL_SIZE
        );
        height.setValue(newHeight);
      },
      onPanResponderRelease: (_, gesture) => {
        console.log('Before release table height', table.height);
        const newTableHeight = Math.round(height._value / CELL_SIZE);
        lastValidHeight.current = newTableHeight; 
        onUpdate(table.id, { height: newTableHeight });
      }
    })
  ).current;

  return (
    <Pressable
      onLongPress={() => onPress(table.id)}
      delayLongPress={500}
    >
      <Animated.View
        style={[
          styles.table,
          {
            width: width,
            height: height,
            left: (table.xStart || 0) * CELL_SIZE,
            top: (table.yStart || 0) * CELL_SIZE,
            backgroundColor: getStatusColor(table.status),
            borderWidth: isEditing ? 2 : 0,
            borderColor: '#007AFF',
          }
        ]}
      >
        <Text style={styles.tableText}>{table.name}</Text>
        
        {isEditing && (
          <>
            <Animated.View
              {...rightPanResponder.panHandlers}
              style={styles.rightHandleHitArea}
            >
              <View style={styles.handleDot} />
            </Animated.View>
            <Animated.View
              {...bottomPanResponder.panHandlers}
              style={styles.bottomHandleHitArea}
            >
              <View style={styles.handleDot} />
            </Animated.View>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
};

const SeatingPlan: React.FC<{ 
  tables: Table[]; 
  onTableUpdate: (id: string, updates: Partial<Table>) => void;
  zoom?: number;
}> = ({ tables, onTableUpdate, zoom }) => {
  const screenWidth = Dimensions.get('window').width;
  const gridWidth = GRID_COLS * CELL_SIZE;
  const gridHeight = GRID_ROWS * CELL_SIZE;
  const initialZoom = zoom || screenWidth / gridWidth;

  const [isEditingTableId, setIsEditingTableId] = useState<string | null>(null);

  function onTablePress(id: string) {
    if (isEditingTableId === id) {
      setIsEditingTableId(null);
    } else {
      setIsEditingTableId(id);
    }
  }

  return (
    <View style={styles.container}>
      <ReactNativeZoomableView
        maxZoom={1.5}
        minZoom={0.2}
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
              isEditing={isEditingTableId === table.id}
              onPress={onTablePress}
              onUpdate={onTableUpdate}
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
  rightHandleHitArea: {
    position: 'absolute',
    right: -25,
    top: '50%',
    width: 50,
    height: 50,
    transform: [{ translateY: -25 }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomHandleHitArea: {
    position: 'absolute',
    bottom: -25,
    left: '50%',
    width: 50,
    height: 50,
    transform: [{ translateX: -25 }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleDot: {
    width: 20,
    height: 20,
    backgroundColor: '#007AFF',
    borderRadius: 10,
  },
});

export default SeatingPlan;