import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { Table } from '~/types/table.types';
import { ReactNativeZoomableView, } from '@openspacelabs/react-native-zoomable-view';
import { RoomGrid } from '~/components/Room/RoomGrid';
import { RoomTable } from '~/components/Room/RoomTable';
import { Order } from '~/types/order.types';

const CELL_SIZE = 50;
const GRID_ROWS = 15;
const GRID_COLS = 15;

interface RoomProps {
  tables: Table[]; 
  orders?: Order[];
  zoom?: number;
  editingTableId?: string
  editionMode?: boolean
  onTableUpdate: (id: string, updates: Partial<Table>) => void;
  onTableLongPress: (table: Table | null) => void
  onTablePress: (table: Table | null) => void;
}

const Room: React.FC<RoomProps> = ({ tables, orders, zoom, editingTableId, editionMode = false, onTableUpdate, onTableLongPress, onTablePress }) => {
  const screenWidth = Dimensions.get('window').width;
  const gridWidth = GRID_COLS * CELL_SIZE;
  const gridHeight = GRID_ROWS * CELL_SIZE;
  const initialZoom = zoom || screenWidth / gridWidth;

  function isPositionValid(table: Table) {
    if (table.id !== editingTableId) return true
   
    // Vérifie si la table en cours d'édition est en collision avec d'autres tables
    return !tables.some(otherTable => {
      if (otherTable.id === table.id) return false;

      const currentTable = {
          xStart: table.xStart,
          yStart: table.yStart,
          xEnd: table.xStart + table.width,
          yEnd: table.yStart + table.height
      };

      const comparedTable = {
          xStart: otherTable.xStart,
          yStart: otherTable.yStart,
          xEnd: otherTable.xStart + otherTable.width,
          yEnd: otherTable.yStart + otherTable.height
      };

      const horizontalOverlap = currentTable.xEnd > comparedTable.xStart && currentTable.xStart < comparedTable.xEnd;
      const verticalOverlap = currentTable.yEnd > comparedTable.yStart && currentTable.yStart < comparedTable.yEnd;

      return horizontalOverlap && verticalOverlap;
    });
  }

  const handleBackgroundPress = () => {
    onTablePress(null);
  };

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
        <TouchableWithoutFeedback onPress={handleBackgroundPress}>
          <View style={[styles.grid, { width: gridWidth, height: gridHeight }]}>
            <RoomGrid width={gridWidth} height={gridHeight} GRID_COLS={GRID_COLS} GRID_ROWS={GRID_ROWS} CELL_SIZE={CELL_SIZE} />
            {tables.map(table => (
              <RoomTable
                key={table.id}
                table={table}
                status={orders?.find(order => order.tableId === table.id)?.status}
                isEditing={editingTableId === table.id}
                editionMode={editionMode}
                positionValid={isPositionValid(table)}
                CELL_SIZE={CELL_SIZE}
                onPress={onTablePress}
                onLongPress={onTableLongPress}
                onUpdate={onTableUpdate}
              />
            ))}
          </View>
        </TouchableWithoutFeedback>
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
    backgroundColor: '#FFFFFF',

  },
});

export default Room;