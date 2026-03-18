import React, { useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { Table } from '~/types/table.types';
import { RoomGrid } from '~/components/Room/RoomGrid';
import { RoomTable } from '~/components/Room/RoomTable';
import { RoomTableService } from '~/components/Room/RoomTableService';
import { getTableStatus } from '~/lib/utils';
import { getRoomLightBackground } from '~/lib/room-utils';
import { CELL_SIZE, EXTRA_LINES } from '~/hooks/room/constants';
import { useRoomDimensions } from '~/hooks/room/useRoomDimensions';
import { useRoomZoom } from '~/hooks/room/useRoomZoom';
import { useRoomValidation } from '~/hooks/room/useRoomValidation';

interface RoomProps {
  tables: Table[];
  editingTableId?: string;
  editionMode?: boolean;
  width?: number;
  height?: number;
  isLoading?: boolean;
  onTableUpdate: (id: string, updates: Partial<Table>) => void;
  onTableLongPress: (table: Table | null) => void;
  onTablePress: (table: Table | null) => void;
  containerDimensions?: { width: number; height: number };
  fillContainer?: boolean;
  roomColor?: string | null;
  onTableEditTap?: (table: Table) => void;
  selectedIcon?: 'play' | 'move';
  disabledTableIds?: Set<string>;
}

const Room: React.FC<RoomProps> = ({
  tables,
  editingTableId,
  editionMode = false,
  width = 15,
  height = 15,
  isLoading = false,
  onTableUpdate,
  onTableLongPress,
  onTablePress,
  containerDimensions,
  fillContainer,
  roomColor,
  onTableEditTap,
  selectedIcon,
  disabledTableIds,
}) => {
  // Couleurs dérivées de la room (calculées une seule fois pour toutes les tables)
  const resolvedColor = roomColor || '#6366F1';
  const roomBg = useMemo(() => getRoomLightBackground(resolvedColor), [resolvedColor]);
  const tableBg = useMemo(() => getRoomLightBackground(resolvedColor, 0.04), [resolvedColor]);
  // Dimensions et zoom optimal
  const { dimensions, isGridReady } = useRoomDimensions({
    roomWidth: width,
    roomHeight: height,
    isLoading,
    containerDimensions,
    fillContainer
  });

  // SharedValues pour le clamping du pan (synchro via useEffect, pas dans le render)
  const roomPixelWidthSV = useSharedValue(width * CELL_SIZE);
  const roomPixelHeightSV = useSharedValue(height * CELL_SIZE);
  const containerWidthSV = useSharedValue(containerDimensions?.width || 0);
  const containerHeightSV = useSharedValue(containerDimensions?.height || 0);

  useEffect(() => {
    roomPixelWidthSV.value = width * CELL_SIZE;
    roomPixelHeightSV.value = height * CELL_SIZE;
  }, [width, height]);

  useEffect(() => {
    if (containerDimensions) {
      containerWidthSV.value = containerDimensions.width;
      containerHeightSV.value = containerDimensions.height;
    }
  }, [containerDimensions]);

  // Zoom interactif (pan, pinch, wheel) avec focal point zoom
  const {
    translateX,
    translateY,
    scale,
    panGesture,
    pinchGesture
  } = useRoomZoom({
    initialZoom: dimensions?.initialZoom || 1,
    editionMode,
    hasSelectedTable: !!editingTableId,
    roomPixelWidth: roomPixelWidthSV,
    roomPixelHeight: roomPixelHeightSV,
    containerWidth: containerWidthSV,
    containerHeight: containerHeightSV,
  });

  // Validation des positions (bounds + collisions)
  const { isPositionValid, isInBounds } = useRoomValidation({
    tables,
    editingTableId,
    roomWidth: width,
    roomHeight: height
  });

  // Statuts mémoïsés (évite de recalculer getTableStatus() pour chaque table à chaque render)
  const tableStatuses = useMemo(() => {
    return tables.reduce((acc, table) => {
      acc[table.id] = getTableStatus(table);
      return acc;
    }, {} as Record<string, ReturnType<typeof getTableStatus>>);
  }, [tables]);

  const handleBackgroundPress = useCallback(() => {
    // Mode service : toujours désélectionner au tap fond
    // Mode édition web : désélectionner pour libérer le pan
    // Mode édition native : pas de désélection (X button ou autre table)
    if (!editionMode || Platform.OS === 'web') {
      onTablePress(null);
    }
  }, [editionMode, onTablePress]);

  const tapGesture = useMemo(() =>
    Gesture.Tap()
      .runOnJS(true)
      .onEnd(handleBackgroundPress),
  [handleBackgroundPress]);

  const composedGesture = useMemo(() =>
    Gesture.Simultaneous(
      panGesture,
      pinchGesture,
      Gesture.Exclusive(tapGesture)
    ),
  [panGesture, pinchGesture, tapGesture]);

  // Séparation des transforms (fix détection gestures sur grandes grilles)
  // translate sur vue externe (zone gestures 100%), scale sur vue interne (visuel seulement)
  const translateStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  }, []);

  const scaleStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
      ],
    };
  }, []);

  const roomAreaStyle = useMemo(() => ({
    position: 'absolute' as const,
    left: EXTRA_LINES * CELL_SIZE,
    top: EXTRA_LINES * CELL_SIZE,
    width: width * CELL_SIZE,
    height: height * CELL_SIZE,
    backgroundColor: roomBg,
    ...(!editionMode && { borderWidth: 2, borderColor: resolvedColor }),
  }), [width, height, editionMode, resolvedColor, roomBg]);

  const gridStyle = useMemo(() => ({
    width: dimensions?.gridWidth ?? 0,
    height: dimensions?.gridHeight ?? 0,
  }), [dimensions?.gridWidth, dimensions?.gridHeight]);

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
      style={[styles.container, { backgroundColor: '#FFFFFF' }]}
    >
      <GestureDetector gesture={composedGesture}>
        {/* Zone de détection des gestures : fixe, plein conteneur, jamais transformée */}
        <Animated.View style={[styles.gestureArea, { backgroundColor: '#FFFFFF' }]}>
          {/* Translate (déplacement) */}
          <Animated.View style={[styles.transformLayer, translateStyle]}>
            {/* Scale (zoom visuel) */}
            <Animated.View style={scaleStyle}>
              <View style={gridStyle}>
                <View style={roomAreaStyle}>
                  {editionMode && (
                    <RoomGrid
                      width={width * CELL_SIZE}
                      height={height * CELL_SIZE}
                      GRID_COLS={width}
                      GRID_ROWS={height}
                      CELL_SIZE={CELL_SIZE}
                      borderColor={resolvedColor}
                    />
                  )}
                  {tables.map(table => {
                    const isEditing = editingTableId === table.id;
                    const tableInBounds = isInBounds(table);

                    if (!editionMode && !tableInBounds) return null;

                    if (editionMode && isEditing) {
                      return (
                        <RoomTable
                          key={table.id}
                          table={table}
                          tables={tables}
                          roomWidth={width}
                          roomHeight={height}
                          status={tableStatuses[table.id]}
                          isEditing
                          editionMode
                          positionValid={isPositionValid(table)}
                          CELL_SIZE={CELL_SIZE}
                          currentZoomScale={scale}
                          isSelected
                          roomColor={roomColor}
                          tableBg={tableBg}
                          onPress={() => onTablePress(table)}
                          onLongPress={onTableLongPress}
                          onUpdate={onTableUpdate}
                          onEditTap={onTableEditTap}
                        />
                      );
                    }

                    return (
                      <RoomTableService
                        key={table.id}
                        table={table}
                        status={tableStatuses[table.id]}
                        CELL_SIZE={CELL_SIZE}
                        isSelected={isEditing}
                        editionMode={editionMode}
                        outOfBounds={!tableInBounds}
                        roomColor={roomColor}
                        tableBg={tableBg}
                        onPress={onTablePress}
                        onLongPress={onTableLongPress}
                        selectedIcon={selectedIcon}
                        disabled={disabledTableIds?.has(table.id)}
                      />
                    );
                  })}
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
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
  gestureArea: {
    flex: 1,
    overflow: 'hidden',
  },
  transformLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Room;