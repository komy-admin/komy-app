import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
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
import { Table } from '~/types/table.types';
import { RoomGrid } from '~/components/Room/RoomGrid';
import { RoomTableMobile } from '~/components/Room/RoomTableMobile';
import { Order } from '~/types/order.types';
import TableActionPanel from '~/components/Room/TableActionPanel';
import { getTableStatus } from '~/lib/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Toast } from '~/components/ui/toast';

const CELL_SIZE = 50;
const PANEL_POSITION_KEY = 'actionPanelPosition';

interface RoomMobileProps {
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
  dimensions: {
    gridWidth: number;
    gridHeight: number;
    initialZoom: number;
  };
}

const RoomMobile: React.FC<RoomMobileProps> = ({
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
  dimensions
}) => {
  // Initialize with safe default values
  const initialZoom = dimensions?.initialZoom || 1;
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(initialZoom);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const savedScale = useSharedValue(initialZoom);

  const [currentZoom, setCurrentZoom] = useState(initialZoom);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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

  const handleBackgroundPress = useCallback(() => {
    onTablePress(null);
  }, [onTablePress]);

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
      .enabled(!editionMode)
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
  [editionMode, updateZoom]);

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

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.animatedContainer, animatedStyle]}>
          <View style={[styles.grid, { width: dimensions.gridWidth, height: dimensions.gridHeight }]}>
            <RoomGrid
              width={dimensions.gridWidth}
              height={dimensions.gridHeight}
              GRID_COLS={width}
              GRID_ROWS={height}
              CELL_SIZE={CELL_SIZE}
            />
            {tables.map(table => {
              const isEditing = editingTableId === table.id;
              return (
                <RoomTableMobile
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
        </Animated.View>
      </GestureDetector>
      {editionMode && editingTableId && tables.find(table => table.id === editingTableId) && (
        <TableActionPanel
          position={panelPosition}
          onPositionChange={handlePanelMove}
          onEdit={onEditTable!}
          onDelete={onDeleteTable!}
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
  animatedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    backgroundColor: '#FFFFFF',
  },
});

export default RoomMobile;