import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Table } from '~/types/table.types';
import { Order } from '~/types/order.types';
import { Toast } from '~/components/ui/toast';
import { RoomGrid } from '~/components/Room/RoomGrid';
import { RoomTable } from '~/components/Room/RoomTable';
import TableActionPanel from '~/components/Room/TableActionPanel';
import { getTableStatus } from '~/lib/utils';

const CELL_SIZE = 50;
const EXTRA_LINES = 10; // Extension de la grille pour capturer les gestes partout
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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [lastValidPositions, setLastValidPositions] = useState<Map<string, { x: number, y: number }>>(new Map());

  // Gesture handler values
  const initialZoom = dimensions?.initialZoom || 1;
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(initialZoom);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const savedScale = useSharedValue(initialZoom);
  const [currentZoom, setCurrentZoom] = useState(initialZoom);

  // Update scale if dimensions change
  useEffect(() => {
    if (dimensions?.initialZoom && dimensions.initialZoom !== scale.value) {
      scale.value = dimensions.initialZoom;
      savedScale.value = dimensions.initialZoom;
      setCurrentZoom(dimensions.initialZoom);
    }
  }, [dimensions?.initialZoom]);

  const getInitialPanelPosition = () => {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    return {
      x: screenWidth / 2 - 75,
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

  const handlePanelMove = async (newPosition: { x: number; y: number }) => {
    setPanelPosition(newPosition);
    try {
      await AsyncStorage.setItem(PANEL_POSITION_KEY, JSON.stringify(newPosition));
    } catch (error) {
      console.error('Error saving panel position:', error);
    }
  };

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
    return (
      table.xStart >= 0 &&
      table.yStart >= 0 &&
      table.xStart + table.width <= width &&
      table.yStart + table.height <= height &&
      !tables.some(otherTable => {
        if (otherTable.id === table.id) return false;
        return (
          table.xStart < otherTable.xStart + otherTable.width &&
          table.xStart + table.width > otherTable.xStart &&
          table.yStart < otherTable.yStart + otherTable.height &&
          table.yStart + table.height > otherTable.yStart
        );
      })
    );
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

  useEffect(() => {
    setIsGridReady(false);
    setVisibleTables([]);

    // Réinitialiser les transformations pour éviter le flash
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;

    if (!isLoading) {
      const screenWidth = Dimensions.get('window').width;
      const roomWidth = width * CELL_SIZE;
      const roomHeight = height * CELL_SIZE;
      // Extension de la zone de capture des gestes au-delà de la room
      const extendedWidth = roomWidth + (EXTRA_LINES * 2 * CELL_SIZE);
      const extendedHeight = roomHeight + (EXTRA_LINES * 2 * CELL_SIZE);
      const newZoom = calculateOptimalZoom(screenWidth, roomWidth, roomHeight, width, height);

      setDimensions({
        gridWidth: extendedWidth,
        gridHeight: extendedHeight,
        initialZoom: newZoom
      });

      // Réinitialiser le zoom
      scale.value = newZoom;
      savedScale.value = newZoom;

      const timer = setTimeout(() => {
        setIsGridReady(true);
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [width, height, isLoading, containerDimensions]);

  useEffect(() => {
    if (isGridReady && tables.length > 0) {
      setVisibleTables(tables);
    }
  }, [isGridReady, tables]);

  const handleBackgroundPress = useCallback(() => {
    onTablePress(null);
  }, [onTablePress]);

  // Valider les tables en mode édition (sans repositionnement)
  useEffect(() => {
    if (editionMode && editingTableId) {
      const editingTable = tables.find(t => t.id === editingTableId);
      if (editingTable) {
        checkTableValidity(editingTable);
      }
    }
  }, [tables, editingTableId, editionMode, checkTableValidity]);

  // Support molette souris pour zoom sur Web
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      const zoomSensitivity = 0.001;
      const delta = -event.deltaY * zoomSensitivity;
      const newScale = Math.min(Math.max(scale.value + delta, 0.2), 1.5);

      scale.value = newScale;
      savedScale.value = newScale;
      setCurrentZoom(newScale);
    };

    const timer = setTimeout(() => {
      const element = document.getElementById('room-zoom-container');
      if (element) {
        element.addEventListener('wheel', handleWheel, { passive: false });
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      const element = document.getElementById('room-zoom-container');
      if (element) {
        element.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

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

  const updateZoom = useCallback((value: number) => {
    setCurrentZoom(value);
  }, []);

  const panGesture = useMemo(() =>
    Gesture.Pan()
      .enabled(!editionMode)
      .onStart(() => {
        'worklet';
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      })
      .onUpdate((event) => {
        'worklet';
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      })
      .runOnJS(false),
  [editionMode]);

  const pinchGesture = useMemo(() =>
    Gesture.Pinch()
      // Pinch activé en edition-mode (pas de conflit avec drag/resize des tables)
      .onStart(() => {
        'worklet';
        savedScale.value = scale.value;
      })
      .onUpdate((event) => {
        'worklet';
        const newScale = savedScale.value * event.scale;
        scale.value = Math.min(Math.max(newScale, 0.2), 1.5);
      })
      .onEnd(() => {
        'worklet';
        runOnJS(updateZoom)(scale.value);
      })
      .runOnJS(false),
  [updateZoom]);

  const tapGesture = useMemo(() =>
    Gesture.Tap()
      .onEnd(() => {
        'worklet';
        runOnJS(handleBackgroundPress)();
      })
      .runOnJS(false),
  [handleBackgroundPress]);

  const composedGesture = useMemo(() =>
    Gesture.Simultaneous(
      panGesture,
      pinchGesture,
      Gesture.Exclusive(tapGesture)
    ),
  [panGesture, pinchGesture, tapGesture]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  }, []);

  if (isLoading || !dimensions || !isGridReady) {
    return (
      <View style={[styles.container, styles.loading]}>
        <View style={styles.loadingGrid} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView
      nativeID="room-zoom-container"
      style={styles.container}
    >
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.animatedContainer, animatedStyle]}>
          <View style={[styles.grid, { width: dimensions.gridWidth, height: dimensions.gridHeight }]}>
            <View style={{
              position: 'absolute',
              left: EXTRA_LINES * CELL_SIZE,
              top: EXTRA_LINES * CELL_SIZE,
              width: width * CELL_SIZE,
              height: height * CELL_SIZE,
            }}>
              <RoomGrid
                width={width * CELL_SIZE}
                height={height * CELL_SIZE}
                GRID_COLS={width}
                GRID_ROWS={height}
                CELL_SIZE={CELL_SIZE}
              />
              {visibleTables.map(table => {
                const isEditing = editingTableId === table.id;
                return (
                  <RoomTable
                    key={table.id}
                    table={table}
                    tables={tables}
                    roomWidth={width}
                    roomHeight={height}
                    status={getTableStatus(table)}
                    isEditing={isEditing}
                    editionMode={editionMode}
                    positionValid={isPositionValid(table)}
                    CELL_SIZE={CELL_SIZE}
                    currentZoom={currentZoom}
                    isSelected={isEditing}
                    onPress={() => onTablePress(table)}
                    onLongPress={onTableLongPress}
                    onUpdate={onTableUpdate}
                  />
                );
              })}
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
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
    </GestureHandlerRootView>
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
  },
  animatedContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF', // Nécessaire pour capturer les gestes sur toute la surface
  }
});

export default Room;