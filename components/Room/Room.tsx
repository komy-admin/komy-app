import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Order } from '~/types/order.types';
import { Toast } from '~/components/ui/toast';
import { RoomGrid } from '~/components/Room/RoomGrid';
import { RoomTable } from '~/components/Room/RoomTable';
import { getTableStatus } from '~/lib/utils';
import { RoomProvider } from '~/contexts/RoomContext';
import { useRoomDimensions } from '~/hooks/room/useRoomDimensions';
import { useRoomZoom } from '~/hooks/room/useRoomZoom';
import { useRoomValidation } from '~/hooks/room/useRoomValidation';

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
  containerDimensions?: { width: number; height: number };
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
    pinchGesture,
    resetTransform
  } = useRoomZoom({
    initialZoom: dimensions?.initialZoom || 1
  });

  // 🎯 HOOK: Validation des positions de tables
  const { isPositionValid, getValidationDetails } = useRoomValidation({
    tables,
    editingTableId,
    roomWidth: width,
    roomHeight: height
  });

  // État local pour les tables visibles et les toasts
  const [visibleTables, setVisibleTables] = useState<Table[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  function showToastMessage(message: string) {
    setToastMessage(message);
    setShowToast(true);
  }

  // Validation de position pendant le drag & drop
  const checkTableValidity = useCallback((table: Table) => {
    if (table.id !== editingTableId) return;

    const validation = getValidationDetails(table.id);
    if (!validation.isValid) {
      showToastMessage("Position invalide : la table doit rester dans les limites");
    }
  }, [editingTableId, getValidationDetails]);

  // Réinitialiser les transformations quand les dimensions changent
  useEffect(() => {
    resetTransform();
  }, [width, height, isLoading, containerDimensions, resetTransform]);

  useEffect(() => {
    if (isGridReady) {
      setVisibleTables(tables); // ✅ Accepte aussi les tableaux vides
    } else {
      setVisibleTables([]); // Vider si grille pas prête
    }
  }, [isGridReady, tables]);

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

  // Valider les tables en mode édition (sans repositionnement)
  useEffect(() => {
    if (editionMode && editingTableId) {
      const editingTable = tables.find(t => t.id === editingTableId);
      if (editingTable) {
        checkTableValidity(editingTable);
      }
    }
  }, [tables, editingTableId, editionMode, checkTableValidity]);

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

  // 🎯 Valeur du contexte pour partager les constantes avec RoomTable
  // ⚠️ IMPORTANT: Ce useMemo DOIT être AVANT le return conditionnel
  // pour respecter les règles des hooks React (nombre constant de hooks)
  const roomContextValue = useMemo(() => ({
    roomWidth: width,
    roomHeight: height,
    CELL_SIZE,
    editionMode,
    currentZoomScale: scale, // ⚡ Passer directement scale.value (SharedValue, pas state)
    tables
  }), [width, height, CELL_SIZE, editionMode, scale, tables]);

  if (isLoading || !dimensions || !isGridReady) {
    return (
      <View style={[styles.container, styles.loading]}>
        <View style={styles.loadingGrid} />
      </View>
    );
  }

  return (
    <RoomProvider value={roomContextValue}>
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
                  {visibleTables.map(table => {
                    const isEditing = editingTableId === table.id;
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
                  })}
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        </GestureDetector>
        <Toast
          visible={showToast}
          message={toastMessage}
          type="warning"
          duration={2000}
          onHide={() => setShowToast(false)}
        />
      </GestureHandlerRootView>
    </RoomProvider>
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