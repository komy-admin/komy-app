import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { Table } from '~/types/table.types';
import { RoomGrid } from '~/components/Room/RoomGrid';
import { RoomTable } from '~/components/Room/RoomTable';
import { RoomTableService } from '~/components/Room/RoomTableService';
import { getTableStatus } from '~/lib/utils';
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
  containerDimensions
}) => {
  // 🎯 HOOK: Gestion des dimensions et du zoom optimal
  const { dimensions, isGridReady, CELL_SIZE, EXTRA_LINES } = useRoomDimensions({
    roomWidth: width,
    roomHeight: height,
    isLoading,
    containerDimensions
  });

  // 🎯 HOOK: Gestion du zoom (pan, pinch, wheel)
  const {
    translateX,
    translateY,
    scale,
    panGesture,
    pinchGesture
  } = useRoomZoom({
    initialZoom: dimensions?.initialZoom || 1
  });

  // 🎯 HOOK: Validation des positions de tables
  const { isPositionValid } = useRoomValidation({
    tables,
    editingTableId,
    roomWidth: width,
    roomHeight: height
  });

  // 🚀 OPTIMISATION: Suppression du state visibleTables
  // Avec la KEY prop sur Room, le composant remount proprement à chaque changement de room
  // Plus besoin d'un state intermédiaire qui cause un double rendu

  // 🚀 OPTIMISATION CRITIQUE: Memoïser les statuts des tables
  // Évite de recalculer getTableStatus() pour CHAQUE table à CHAQUE render
  const tableStatuses = useMemo(() => {
    return tables.reduce((acc, table) => {
      acc[table.id] = getTableStatus(table);
      return acc;
    }, {} as Record<string, ReturnType<typeof getTableStatus>>);
  }, [tables]);

  const handleBackgroundPress = useCallback(() => {
    // 🎯 En mode édition : ne pas désélectionner au tap background
    // La désélection se fait uniquement via :
    // 1. Bouton fermer (X) du sidebar
    // 2. Sélection d'une autre table
    if (!editionMode) {
      onTablePress(null);
    }
  }, [editionMode, onTablePress]);

  const tapGesture = useMemo(() =>
    Gesture.Tap()
      .onEnd(() => {
        'worklet';
        runOnJS(handleBackgroundPress)();
      }),
  [handleBackgroundPress]);

  const composedGesture = useMemo(() =>
    Gesture.Simultaneous(
      panGesture,
      pinchGesture,
      Gesture.Exclusive(tapGesture)
    ),
  [panGesture, pinchGesture, tapGesture]);

  // 🔍 SÉPARATION DES TRANSFORMS (Fix détection gestures sur grandes grilles)
  // AVANT: scale + translate sur même vue → zone gestures réduite à scale% sur grandes rooms
  // APRÈS: translate sur vue externe (gestures 100%), scale sur vue interne (visuel seulement)
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
        {/* Vue externe: SEULEMENT translate → zone gestures 100% même sur grandes rooms */}
        <Animated.View style={[styles.animatedContainer, translateStyle]}>
          {/* Vue interne: SEULEMENT scale → visuel zoomé, gestures non affectées */}
          <Animated.View style={scaleStyle}>
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
                {/* 🚀 OPTIMISATION v2.1: Composant adapté selon le contexte
                    - Table sélectionnée en mode édition → RoomTable complet (drag, resize)
                    - Toutes les autres tables → RoomTableService léger

                    Gain mode édition: ~88% réduction SharedValues (255 → 31 pour 15 tables)
                    Gain mode service: ~94% réduction SharedValues */}
                {tables.map(table => {
                  const isEditing = editingTableId === table.id;

                  // 🔧 SEULE la table sélectionnée en mode édition utilise RoomTable complet
                  // Toutes les autres (même en editionMode) utilisent le composant léger
                  if (editionMode && isEditing) {
                    return (
                      <RoomTable
                        key={table.id}
                        table={table}
                        tables={tables}
                        roomWidth={width}
                        roomHeight={height}
                        status={tableStatuses[table.id]}
                        isEditing={isEditing}
                        editionMode={editionMode}
                        positionValid={isPositionValid(table)}
                        CELL_SIZE={CELL_SIZE}
                        currentZoomScale={scale}
                        isSelected={isEditing}
                        onPress={() => onTablePress(table)}
                        onLongPress={onTableLongPress}
                        onUpdate={onTableUpdate}
                      />
                    );
                  }

                  // 🎯 Composant léger pour toutes les autres tables
                  return (
                    <RoomTableService
                      key={table.id}
                      table={table}
                      status={tableStatuses[table.id]}
                      CELL_SIZE={CELL_SIZE}
                      isSelected={isEditing}
                      onPress={onTablePress}
                      onLongPress={onTableLongPress}
                    />
                  );
                })}
              </View>
            </View>
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