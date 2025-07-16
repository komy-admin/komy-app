import React, { useState, useEffect, useCallback } from 'react';
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
  containerDimensions?: { width: number; height: number }; // Pour les modales
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
  onCheckAvailableSpace,
  containerDimensions
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
  
  // Synchroniser selectedTable avec editingTableId
  useEffect(() => {
    if (editingTableId) {
      const table = tables.find(t => t.id === editingTableId);
      setSelectedTable(table || null);
    } else {
      setSelectedTable(null);
    }
  }, [editingTableId, tables]);
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [lastValidPositions, setLastValidPositions] = useState<Map<string, {x: number, y: number}>>(new Map());

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
    return isTableWithinRoom(table) && !hasTableCollision(table, tables);
  }

  // Enregistrer la dernière position valide lors de la sélection
  const saveLastValidPosition = useCallback((table: Table) => {
    if (isPositionValid(table)) {
      setLastValidPositions(prev => new Map(prev.set(table.id!, { x: table.xStart, y: table.yStart })));
    }
  }, []);

  // Simple validation sans repositionnement automatique - laissé à RoomTable
  const checkTableValidity = useCallback((table: Table) => {
    if (table.id !== editingTableId) return;

    const isValid = isPositionValid(table);
    if (!isValid) {
      // Juste afficher le toast, le repositionnement est géré par RoomTable
      const lastValid = lastValidPositions.get(table.id!);
      if (lastValid) {
        showToastMessage("Table repositionnée à sa dernière position valide");
      } else {
        showToastMessage("Table repositionnée automatiquement");
      }
    }
  }, [editingTableId, lastValidPositions]);

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

  // Expose la fonction via les props - Version corrigée
  useEffect(() => {
    if (onCheckAvailableSpace) {
      onCheckAvailableSpace = (width: number, height: number) => canAddNewTable(width, height);
    }
  }, [onCheckAvailableSpace]);

  function calculateOptimalZoom(screenWidth: number, gridWidth: number, gridHeight: number, roomWidth: number, roomHeight: number) {
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
  }, [width, height, isLoading, containerDimensions]);

  useEffect(() => {
    if (isGridReady && tables.length > 0) {
      setVisibleTables(tables);
    }
  }, [isGridReady, tables]);

  const handleBackgroundPress = () => {
    onTablePress(null);
  };

  const handleTableSelect = useCallback((table: Table) => {
    if (editingTableId === table.id) return;
    
    // Sauvegarder la position valide lors de la sélection
    saveLastValidPosition(table);
    
    setSelectedTable(table);
    onTablePress(table);
  }, [editingTableId, onTablePress, saveLastValidPosition]);

  // Valider les tables en mode édition (sans repositionnement)
  useEffect(() => {
    if (editionMode && editingTableId) {
      const editingTable = tables.find(t => t.id === editingTableId);
      if (editingTable) {
        checkTableValidity(editingTable);
      }
    }
  }, [tables, editingTableId, editionMode, checkTableValidity]);

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
              key={table.id}
              table={table}
              status={getTableStatus(table)}
              isEditing={editingTableId === table.id}
              editionMode={editionMode}
              positionValid={isPositionValid(table)}
              CELL_SIZE={CELL_SIZE}
              currentZoom={currentZoom}
              isSelected={editingTableId === table.id}
              onPress={() => handleTableSelect(table)}
              onLongPress={onTableLongPress}
              onUpdate={onTableUpdate}
            />
          ))}
        </View>
      </ReactNativeZoomableView>
      {editionMode && editingTableId && tables.find(table => table.id === editingTableId) && (
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