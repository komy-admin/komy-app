import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Table } from '~/types/table.types';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { RoomGrid } from '~/components/Room/RoomGrid';
import { RoomTable } from '~/components/Room/RoomTable';
import { Order } from '~/types/order.types';
import TableActionPanel from '~/components/Room/TableActionPanel';
import { getMostImportantStatus, getTableStatus } from '@/lib/utils';
import { Toast } from '~/components/ui/toast';

const CELL_SIZE = 50;
const PANEL_POSITION_KEY = 'actionPanelPosition';

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
  onEditTable?: () => void;
  onDeleteTable?: () => void;
  onCheckAvailableSpace?: (width: number, height: number) => boolean;
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
  onTablePress,
  onEditTable,
  onDeleteTable,
  onCheckAvailableSpace
}) => {
  const [dimensions, setDimensions] = useState<{
    gridWidth: number;
    gridHeight: number;
    initialZoom: number;
  } | null>(null);
  const [isGridReady, setIsGridReady] = useState(false);
  const [visibleTables, setVisibleTables] = useState<Table[]>([]);
  const [currentZoom, setCurrentZoom] = useState(dimensions?.initialZoom || 1);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const getInitialPanelPosition = () => {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const gridWidth = width * CELL_SIZE;

    return {
      x: Platform.OS === 'web' ?
        gridWidth + ((screenWidth - gridWidth) / 2) - 75 :
        screenWidth / 2 - 75,
      y: screenHeight / 3
    };
  };

  const [panelPosition, setPanelPosition] = useState(getInitialPanelPosition());

  useEffect(() => {
    const loadPanelPosition = async () => {
      try {
        const savedPosition = await AsyncStorage.getItem(PANEL_POSITION_KEY);
        if (savedPosition) {
          setPanelPosition(JSON.parse(savedPosition));
        }
      } catch (error) {
        console.error('Error loading panel position:', error);
      }
    };

    loadPanelPosition();
  }, []);

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

    if (!isTableWithinRoom(table)) {
      showToastMessage("Table hors limites - repositionnement automatique");
      return false;
    }

    if (hasTableCollision(table, tables)) {
      showToastMessage("Collision détectée - repositionnement automatique");
      return false;
    }

    return true;
  }

  function showToastMessage(message: string) {
    setToastMessage(message);
    setShowToast(true);
  }

  function findAvailableSpaceForNewTable(tableWidth: number = 2, tableHeight: number = 2): { x: number; y: number } | null {
    // Parcourt la grille pour trouver un espace libre
    for (let y = 0; y <= height - tableHeight; y++) {
      for (let x = 0; x <= width - tableWidth; x++) {
        const testTable: Table = {
          id: 'temp',
          name: 'test',
          xStart: x,
          yStart: y,
          width: tableWidth,
          height: tableHeight,
          roomId: '',
          orders: [],
          seats: 4,
          account: '',
          createdAt: '',
          updatedAt: ''
        };
        
        if (isTableWithinRoom(testTable) && !hasTableCollision(testTable, tables)) {
          return { x, y };
        }
      }
    }
    return null;
  }

  function canAddNewTable(tableWidth: number = 2, tableHeight: number = 2): boolean {
    const availableSpace = findAvailableSpaceForNewTable(tableWidth, tableHeight);
    if (!availableSpace) {
      showToastMessage("Aucun espace disponible pour une nouvelle table");
      return false;
    }
    return true;
  }

  // Expose la fonction via les props
  useEffect(() => {
    if (onCheckAvailableSpace) {
      onCheckAvailableSpace = canAddNewTable;
    }
  }, [onCheckAvailableSpace]);

  function calculateOptimalZoom(screenWidth: number, gridWidth: number, gridHeight: number, roomWidth: number, roomHeight: number) {
    const SIDE_PANEL_WIDTH = screenWidth / 4;
    const availableWidth = screenWidth - SIDE_PANEL_WIDTH;

    const horizontalZoom = (availableWidth * 0.95) / gridWidth;
    const verticalZoom = (Dimensions.get('window').height * 0.9) / gridHeight;

    let optimalZoom = Math.min(horizontalZoom, verticalZoom);

    if (roomWidth > 1 || roomHeight > 1) {
      optimalZoom *= 0.7;
    }

    const zoom = Math.min(Math.max(optimalZoom, 0.2), 1.5);
    setCurrentZoom(zoom);
    return zoom;
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

  const handleTableSelect = (table: Table) => {
    console.log('Table selected in Room', table?.name);
    if (selectedTable?.id === table.id) return;
    setSelectedTable(table);
    onTablePress(table);
  };

  const handlePanelMove = async (newPosition: { x: number; y: number }) => {
    setPanelPosition(newPosition);
    try {
      await AsyncStorage.setItem(PANEL_POSITION_KEY, JSON.stringify(newPosition));
    } catch (error) {
      console.error('Error saving panel position:', error);
    }
  };

  const handleEditClick = () => {
    if (onEditTable) {
      onEditTable();
    }
  };

  const handleDeleteClick = () => {
    if (onDeleteTable) {
      onDeleteTable();
    }
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
        onSingleTap={handleBackgroundPress}
        onZoomEnd={(_, __, { zoomLevel }) => {
          setCurrentZoom(zoomLevel);
        }}
      >
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
              key={`${table.id}_${currentZoom}`}
              table={table}
              status={getTableStatus(table)}
              isEditing={editingTableId === table.id}
              editionMode={editionMode}
              positionValid={isPositionValid(table)}
              CELL_SIZE={CELL_SIZE}
              currentZoom={currentZoom}
              onPress={() => handleTableSelect(table)}
              onLongPress={onTableLongPress}
              onUpdate={onTableUpdate}
            />
          ))}
        </View>
      </ReactNativeZoomableView>
      {editionMode && selectedTable && tables.find(table => table.id === selectedTable.id) && (
        <TableActionPanel
          position={panelPosition}
          onPositionChange={handlePanelMove}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      )}
      <Toast
        visible={showToast}
        message={toastMessage}
        type="warning"
        duration={2000}
        onHide={() => setShowToast(false)}
      />
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