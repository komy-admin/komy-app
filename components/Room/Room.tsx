import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Table } from '~/types/table.types';
import { ReactNativeZoomableView, } from '@openspacelabs/react-native-zoomable-view';
import { RoomGrid } from './RoomGrid';
import { RoomTable } from './RoomTable';

const CELL_SIZE = 50;
const GRID_ROWS = 20;
const GRID_COLS = 15;

interface RoomProps { 
  tables: Table[]; 
  zoom?: number;
  editionMode?: boolean
  onTableUpdate: (id: string, updates: Partial<Table>) => void;
  onTablePress: (id: string) => void;
}

const Room: React.FC<RoomProps> = ({ tables, zoom, editionMode = false, onTableUpdate, onTablePress }) => {
  const screenWidth = Dimensions.get('window').width;
  const gridWidth = GRID_COLS * CELL_SIZE;
  const gridHeight = GRID_ROWS * CELL_SIZE;
  const initialZoom = zoom || screenWidth / gridWidth;

  const [isEditingTableId, setIsEditingTableId] = useState<string | null>(null);

  function onTableLongPress(id: string) {
    if (!editionMode) return
    if (isEditingTableId === id) {
      setIsEditingTableId(null);
    } else {
      setIsEditingTableId(id);
    }
  }

  function getPositionValidity(table: Table) {
    if (table.id !== isEditingTableId) return true
   
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
          <RoomGrid width={gridWidth} height={gridHeight} GRID_COLS={GRID_COLS} GRID_ROWS={GRID_ROWS} CELL_SIZE={CELL_SIZE} />
          {tables.map(table => (
            <RoomTable
              key={table.id}
              table={table}
              isEditing={isEditingTableId === table.id}
              editionMode={editionMode}
              positionValid={getPositionValidity(table)}
              CELL_SIZE={CELL_SIZE}
              onPress={onTablePress}
              onLongPress={onTableLongPress}
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
});

export default Room;