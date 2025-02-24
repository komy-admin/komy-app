import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import { Table } from '~/types/table.types';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { RoomGrid } from '~/components/Room/RoomGrid';
import { RoomTable } from '~/components/Room/RoomTable';
import { Order } from '~/types/order.types';

const CELL_SIZE = 50;

interface RoomProps {
  tables: Table[]; 
  orders?: Order[];
  editingTableId?: string;
  editionMode?: boolean;
  width?: number;
  height?: number;
  isLoading?: boolean;
  onTableUpdate: (id: string, updates: Partial<Table>) => void;
  onTableLongPress: (table: Table | null) => void;
  onTablePress: (table: Table | null) => void;
}

const Room: React.FC<RoomProps> = ({ 
  tables, 
  orders, 
  editingTableId, 
  editionMode = false, 
  width = 15,
  height = 15,
  isLoading = false,
  onTableUpdate, 
  onTableLongPress, 
  onTablePress 
}) => {
  const [dimensions, setDimensions] = useState<{
    gridWidth: number;
    gridHeight: number;
    initialZoom: number;
  } | null>(null);
  const [isGridReady, setIsGridReady] = useState(false);
  const [visibleTables, setVisibleTables] = useState<Table[]>([]);

  function isTableWithinRoom(table: Table): boolean {
    return (
      table.xStart >= 0 &&
      table.yStart >= 0 &&
      table.xStart + table.width <= width &&
      table.yStart + table.height <= height
    );
  }

  function hasTableCollision(table: Table, otherTables: Table[]): boolean {
    return otherTables.some(otherTable => {
      if (otherTable.id === table.id) return false;

      const hasHorizontalOverlap = (
        table.xStart < otherTable.xStart + otherTable.width &&
        table.xStart + table.width > otherTable.xStart
      );

      const hasVerticalOverlap = (
        table.yStart < otherTable.yStart + otherTable.height &&
        table.yStart + table.height > otherTable.yStart
      );

      return hasHorizontalOverlap && hasVerticalOverlap;
    });
  }

  function isPositionValid(table: Table): boolean {
    if (table.id !== editingTableId) return true;

    // Vérification des limites de la salle
    if (!isTableWithinRoom(table)) {
      return false;
    }

    // Vérification des collisions avec d'autres tables
    if (hasTableCollision(table, tables)) {
      return false;
    }

    return true;
  }

  function calculateOptimalZoom(screenWidth: number, gridWidth: number, gridHeight: number, roomWidth: number, roomHeight: number) {
    const SIDE_PANEL_WIDTH = screenWidth / 4;
    const availableWidth = screenWidth - SIDE_PANEL_WIDTH;
    
    const horizontalZoom = (availableWidth * 0.95) / gridWidth;
    const verticalZoom = (Dimensions.get('window').height * 0.9) / gridHeight;
    
    let optimalZoom = Math.min(horizontalZoom, verticalZoom);
    
    if (roomWidth > 1 || roomHeight > 1) {
      optimalZoom *= 0.9;
    }
    
    return Math.min(Math.max(optimalZoom, 0.2), 1.5);
  }

  const [zoomKey, setZoomKey] = useState(0);

  useEffect(() => {
    setIsGridReady(false);
    setVisibleTables([]);
    
    if (!isLoading) {
      const screenWidth = Dimensions.get('window').width;
      const gridWidth = width * CELL_SIZE;
      const gridHeight = height * CELL_SIZE;
      
      setDimensions({
        gridWidth,
        gridHeight,
        initialZoom: calculateOptimalZoom(screenWidth, gridWidth, gridHeight, width, height)
      });
      
      setZoomKey(prev => prev + 1);

      const timer = setTimeout(() => {
        setIsGridReady(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [width, height, isLoading]);

  useEffect(() => {
    if (isGridReady && tables.length > 0) {
      setVisibleTables(tables);
    }
  }, [isGridReady, tables]);

  const handleBackgroundPress = () => {
    onTablePress(null);
  };

  if (isLoading || !dimensions) {
    return (
      <View style={[styles.container, styles.loading]}>
        <View style={styles.loadingGrid} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ReactNativeZoomableView
        key={zoomKey}
        maxZoom={1.5}
        minZoom={0.2}
        zoomStep={0.5}
        initialZoom={dimensions.initialZoom}
        bindToBorders={true}
        contentWidth={dimensions.gridWidth}
        contentHeight={dimensions.gridHeight}
      >
        <Pressable onPress={handleBackgroundPress}>
          <View style={[styles.grid, { width: dimensions.gridWidth, height: dimensions.gridHeight }]}>
            <RoomGrid 
              width={dimensions.gridWidth} 
              height={dimensions.gridHeight} 
              GRID_COLS={width} 
              GRID_ROWS={height} 
              CELL_SIZE={CELL_SIZE}
            />
            {visibleTables.map(table => (
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
        </Pressable>
      </ReactNativeZoomableView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  grid: {
    backgroundColor: '#FFFFFF',
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGrid: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
  }
});

export default Room;