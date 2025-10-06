import React, { useMemo, useCallback } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { getStatusColor, getStatusBorderStyle } from "~/lib/utils";
import { Table } from "~/types/table.types";
import { Text } from "../ui";
import { Status } from "~/types/status.enum";
import { RoomChairs } from "./RoomChairs";
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';

interface TableViewProps {
  table: Table;
  tables: Table[]; // Pour vérifier les collisions
  roomWidth: number; // Largeur de la room en cellules
  roomHeight: number; // Hauteur de la room en cellules
  status?: Status;
  isEditing: boolean;
  editionMode: boolean;
  positionValid: boolean;
  CELL_SIZE: number;
  currentZoom: number;
  isSelected: boolean;
  onPress: (table: Table) => void;
  onLongPress: (table: Table) => void;
  onUpdate: (id: string, updates: Partial<Table>) => void;
}

export const RoomTable: React.FC<TableViewProps> = ({
  table,
  tables,
  roomWidth,
  roomHeight,
  status,
  isEditing,
  editionMode,
  positionValid,
  CELL_SIZE,
  currentZoom,
  isSelected,
  onPress,
  onLongPress,
  onUpdate
}) => {
  const MIN_CELLS = 2;

  // Positions animées pour le drag
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(table.xStart * CELL_SIZE);
  const startY = useSharedValue(table.yStart * CELL_SIZE);

  // Position actuelle de la table (mise à jour après chaque drag)
  const currentX = useSharedValue(table.xStart * CELL_SIZE);
  const currentY = useSharedValue(table.yStart * CELL_SIZE);

  // Position de départ pour revenir en cas de collision
  const lastValidX = useSharedValue(table.xStart * CELL_SIZE);
  const lastValidY = useSharedValue(table.yStart * CELL_SIZE);

  // Dimensions animées pour le resize
  const width = useSharedValue(table.width * CELL_SIZE);
  const height = useSharedValue(table.height * CELL_SIZE);
  const startWidth = useSharedValue(table.width * CELL_SIZE);
  const startHeight = useSharedValue(table.height * CELL_SIZE);

  // Dimensions actuelles (mise à jour après chaque resize)
  const currentWidth = useSharedValue(table.width * CELL_SIZE);
  const currentHeight = useSharedValue(table.height * CELL_SIZE);

  // Scale pour l'effet de sélection
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Aperçu fantôme pour le drag
  const ghostOpacity = useSharedValue(0);
  const ghostX = useSharedValue(0);
  const ghostY = useSharedValue(0);

  // Précalculs pour le drag (SharedValues pour accès worklet)
  const cachedTableWidthInCells = useSharedValue(0);
  const cachedTableHeightInCells = useSharedValue(0);
  const cachedMaxX = useSharedValue(0);
  const cachedMaxY = useSharedValue(0);

  // Vérifier si une position est valide (dans les limites et sans collision)
  const isValidPosition = useCallback((x: number, y: number, w: number, h: number) => {
    'worklet';
    // Vérifier les limites de la room
    if (x < 0 || y < 0 || x + w > roomWidth || y + h > roomHeight) {
      return false;
    }

    // Vérifier les collisions avec d'autres tables
    // NOTE: Cette vérification se fait côté JS, pas dans le worklet
    return true; // La vérification complète sera faite dans onEnd
  }, [roomWidth, roomHeight]);

  // Synchroniser les valeurs actuelles avec les props de la table
  React.useEffect(() => {
    currentX.value = table.xStart * CELL_SIZE;
    currentY.value = table.yStart * CELL_SIZE;
    currentWidth.value = table.width * CELL_SIZE;
    currentHeight.value = table.height * CELL_SIZE;

    // Mettre à jour les positions valides
    lastValidX.value = table.xStart * CELL_SIZE;
    lastValidY.value = table.yStart * CELL_SIZE;

    // Synchroniser aussi les valeurs animées
    width.value = table.width * CELL_SIZE;
    height.value = table.height * CELL_SIZE;
    translateX.value = 0;
    translateY.value = 0;
  }, [table.xStart, table.yStart, table.width, table.height]);

  // Callbacks
  const handlePress = useCallback(() => {
    onPress(table);
  }, [onPress, table]);

  const handleLongPress = useCallback(() => {
    onLongPress(table);
  }, [onLongPress, table]);

  const handleUpdatePosition = useCallback((newX: number, newY: number) => {
    // newX et newY sont déjà en pixels et snappés à la grille
    const gridX = newX / CELL_SIZE;
    const gridY = newY / CELL_SIZE;
    const tableWidth = Math.round(currentWidth.value / CELL_SIZE);
    const tableHeight = Math.round(currentHeight.value / CELL_SIZE);

    // Vérifier les collisions avec d'autres tables
    const hasCollision = tables.some(otherTable => {
      if (otherTable.id === table.id) return false;

      return (
        gridX < otherTable.xStart + otherTable.width &&
        gridX + tableWidth > otherTable.xStart &&
        gridY < otherTable.yStart + otherTable.height &&
        gridY + tableHeight > otherTable.yStart
      );
    });

    // Si pas de collision, mettre à jour
    if (!hasCollision) {
      // Mettre à jour les dernières positions valides
      lastValidX.value = newX;
      lastValidY.value = newY;

      // Mettre à jour les positions actuelles
      currentX.value = newX;
      currentY.value = newY;
      translateX.value = 0;
      translateY.value = 0;

      onUpdate(table.id, {
        xStart: gridX,
        yStart: gridY
      });
    } else {
      // Animation de retour à la dernière position valide
      const deltaX = lastValidX.value - currentX.value;
      const deltaY = lastValidY.value - currentY.value;

      translateX.value = withSpring(deltaX, {}, () => {
        // Une fois l'animation terminée, reset les valeurs
        translateX.value = 0;
        currentX.value = lastValidX.value;
      });

      translateY.value = withSpring(deltaY, {}, () => {
        translateY.value = 0;
        currentY.value = lastValidY.value;
      });
    }
  }, [CELL_SIZE, onUpdate, table.id, tables, currentWidth, currentHeight, lastValidX, lastValidY]);

  const handleUpdateSize = useCallback((newWidth: number, newHeight: number, newX?: number, newY?: number) => {
    const gridWidth = Math.round(newWidth / CELL_SIZE);
    const gridHeight = Math.round(newHeight / CELL_SIZE);

    // Position finale (grille)
    const finalX = newX !== undefined ? Math.round(newX / CELL_SIZE) : table.xStart;
    const finalY = newY !== undefined ? Math.round(newY / CELL_SIZE) : table.yStart;

    // Vérification des collisions avec d'autres tables
    const hasCollision = tables.some(otherTable => {
      if (otherTable.id === table.id) return false;

      return (
        finalX < otherTable.xStart + otherTable.width &&
        finalX + Math.max(MIN_CELLS, gridWidth) > otherTable.xStart &&
        finalY < otherTable.yStart + otherTable.height &&
        finalY + Math.max(MIN_CELLS, gridHeight) > otherTable.yStart
      );
    });

    // Vérification des limites de la room
    const withinBounds = (
      finalX >= 0 &&
      finalY >= 0 &&
      finalX + Math.max(MIN_CELLS, gridWidth) <= roomWidth &&
      finalY + Math.max(MIN_CELLS, gridHeight) <= roomHeight
    );

    if (!hasCollision && withinBounds) {
      // Position/dimensions valides → mettre à jour
      if (newX !== undefined) {
        currentX.value = newX;
        lastValidX.value = newX;
        translateX.value = 0; // Reset translation
      }
      if (newY !== undefined) {
        currentY.value = newY;
        lastValidY.value = newY;
        translateY.value = 0; // Reset translation
      }

      currentWidth.value = newWidth;
      currentHeight.value = newHeight;

      const updates: Partial<Table> = {
        width: Math.max(MIN_CELLS, gridWidth),
        height: Math.max(MIN_CELLS, gridHeight)
      };
      if (newX !== undefined) {
        updates.xStart = Math.max(0, finalX);
      }
      if (newY !== undefined) {
        updates.yStart = Math.max(0, finalY);
      }

      onUpdate(table.id, updates);
    } else {
      // Collision ou hors limites → retour aux dimensions valides
      width.value = withSpring(currentWidth.value);
      height.value = withSpring(currentHeight.value);

      // Si position a changé (resize left/top), retour à la position valide
      if (newX !== undefined) {
        const deltaX = lastValidX.value - currentX.value;
        translateX.value = withSpring(deltaX, {}, () => {
          translateX.value = 0;
          currentX.value = lastValidX.value;
        });
      }

      if (newY !== undefined) {
        const deltaY = lastValidY.value - currentY.value;
        translateY.value = withSpring(deltaY, {}, () => {
          translateY.value = 0;
          currentY.value = lastValidY.value;
        });
      }
    }
  }, [CELL_SIZE, onUpdate, table.id, tables, roomWidth, roomHeight, currentWidth, currentHeight, lastValidX, lastValidY]);

  // Geste de tap
  const tapGesture = useMemo(() =>
    Gesture.Tap()
      .onEnd(() => {
        'worklet';
        runOnJS(handlePress)();
      })
      .runOnJS(false),
    [handlePress]);

  // Geste de long press
  const longPressGesture = useMemo(() =>
    Gesture.LongPress()
      .minDuration(500)
      .onEnd(() => {
        'worklet';
        runOnJS(handleLongPress)();
      })
      .runOnJS(false),
    [handleLongPress]);

  // Gestes de redimensionnement avec snap-to-grid en temps réel
  const rightResizeGesture = useMemo(() =>
    Gesture.Pan()
      .enabled(isEditing && editionMode)
      .onStart(() => {
        'worklet';
        startWidth.value = currentWidth.value;
      })
      .onUpdate((event) => {
        'worklet';
        const rawWidth = startWidth.value + event.translationX;
        // Snap to grid pendant le resize
        const snappedWidth = Math.max(MIN_CELLS * CELL_SIZE, Math.round(rawWidth / CELL_SIZE) * CELL_SIZE);
        width.value = snappedWidth;
      })
      .onEnd(() => {
        'worklet';
        // Ne PAS mettre à jour currentWidth ici - laisser handleUpdateSize le faire
        runOnJS(handleUpdateSize)(width.value, currentHeight.value);
      })
      .runOnJS(false),
    [isEditing, editionMode, handleUpdateSize]);

  const leftResizeGesture = useMemo(() =>
    Gesture.Pan()
      .enabled(isEditing && editionMode)
      .onStart(() => {
        'worklet';
        startWidth.value = currentWidth.value;
        startX.value = currentX.value;
      })
      .onUpdate((event) => {
        'worklet';
        const rawWidth = startWidth.value - event.translationX;
        const snappedWidth = Math.max(MIN_CELLS * CELL_SIZE, Math.round(rawWidth / CELL_SIZE) * CELL_SIZE);
        const deltaWidth = snappedWidth - currentWidth.value;

        width.value = snappedWidth;
        translateX.value = -deltaWidth;
      })
      .onEnd(() => {
        'worklet';
        const deltaGrid = (width.value - currentWidth.value) / CELL_SIZE;
        const newX = currentX.value - deltaGrid * CELL_SIZE;

        // Ne PAS mettre à jour currentWidth/currentX/translateX ici - laisser handleUpdateSize tout gérer
        runOnJS(handleUpdateSize)(width.value, currentHeight.value, newX, undefined);
      })
      .runOnJS(false),
    [isEditing, editionMode, handleUpdateSize]);

  const bottomResizeGesture = useMemo(() =>
    Gesture.Pan()
      .enabled(isEditing && editionMode)
      .onStart(() => {
        'worklet';
        startHeight.value = currentHeight.value;
      })
      .onUpdate((event) => {
        'worklet';
        const rawHeight = startHeight.value + event.translationY;
        const snappedHeight = Math.max(MIN_CELLS * CELL_SIZE, Math.round(rawHeight / CELL_SIZE) * CELL_SIZE);
        height.value = snappedHeight;
      })
      .onEnd(() => {
        'worklet';
        // Ne PAS mettre à jour currentHeight ici - laisser handleUpdateSize le faire
        runOnJS(handleUpdateSize)(currentWidth.value, height.value);
      })
      .runOnJS(false),
    [isEditing, editionMode, handleUpdateSize]);

  const topResizeGesture = useMemo(() =>
    Gesture.Pan()
      .enabled(isEditing && editionMode)
      .onStart(() => {
        'worklet';
        startHeight.value = currentHeight.value;
        startY.value = currentY.value;
      })
      .onUpdate((event) => {
        'worklet';
        const rawHeight = startHeight.value - event.translationY;
        const snappedHeight = Math.max(MIN_CELLS * CELL_SIZE, Math.round(rawHeight / CELL_SIZE) * CELL_SIZE);
        const deltaHeight = snappedHeight - currentHeight.value;

        height.value = snappedHeight;
        translateY.value = -deltaHeight;
      })
      .onEnd(() => {
        'worklet';
        const deltaGrid = (height.value - currentHeight.value) / CELL_SIZE;
        const newY = currentY.value - deltaGrid * CELL_SIZE;

        // Ne PAS mettre à jour currentHeight/currentY/translateY ici - laisser handleUpdateSize tout gérer
        runOnJS(handleUpdateSize)(currentWidth.value, height.value, undefined, newY);
      })
      .runOnJS(false),
    [isEditing, editionMode, handleUpdateSize]);

  // Geste de drag fluide avec snap uniquement au relâchement
  const dragGesture = useMemo(() =>
    Gesture.Pan()
      .enabled(isEditing && editionMode)
      .onStart(() => {
        'worklet';
        scale.value = 1.05;
        lastValidX.value = currentX.value;
        lastValidY.value = currentY.value;
        startX.value = currentX.value;
        startY.value = currentY.value;
        translateX.value = 0;
        translateY.value = 0;

        // Précalculer une seule fois au début du drag
        cachedTableWidthInCells.value = Math.round(currentWidth.value / CELL_SIZE);
        cachedTableHeightInCells.value = Math.round(currentHeight.value / CELL_SIZE);
        cachedMaxX.value = roomWidth - cachedTableWidthInCells.value;
        cachedMaxY.value = roomHeight - cachedTableHeightInCells.value;
      })
      .onUpdate((event) => {
        'worklet';
        // Mouvement direct sans calcul intermédiaire
        translateX.value = event.translationX;
        translateY.value = event.translationY;

        // Calculs optimisés pour le fantôme
        const snappedGridX = Math.round((currentX.value + event.translationX) / CELL_SIZE);
        const snappedGridY = Math.round((currentY.value + event.translationY) / CELL_SIZE);

        const constrainedX = Math.max(0, Math.min(snappedGridX, cachedMaxX.value));
        const constrainedY = Math.max(0, Math.min(snappedGridY, cachedMaxY.value));

        ghostX.value = constrainedX * CELL_SIZE;
        ghostY.value = constrainedY * CELL_SIZE;
        ghostOpacity.value = 0.3;
      })
      .onEnd(() => {
        'worklet';
        scale.value = withSpring(1);
        ghostOpacity.value = withSpring(0);

        // Snap à la grille - réutiliser les valeurs précalculées
        const snappedGridX = Math.round((currentX.value + translateX.value) / CELL_SIZE);
        const snappedGridY = Math.round((currentY.value + translateY.value) / CELL_SIZE);

        const constrainedX = Math.max(0, Math.min(snappedGridX, cachedMaxX.value));
        const constrainedY = Math.max(0, Math.min(snappedGridY, cachedMaxY.value));

        const finalX = constrainedX * CELL_SIZE;
        const finalY = constrainedY * CELL_SIZE;

        runOnJS(handleUpdatePosition)(finalX, finalY);
      })
      .runOnJS(false),
  [isEditing, editionMode, handleUpdatePosition, roomWidth, roomHeight]);

  // Geste composé uniquement pour la table principale (pas les handles)
  const composedGesture = useMemo(() => {
    if (isEditing && editionMode) {
      return dragGesture;
    }
    return Gesture.Exclusive(longPressGesture, tapGesture);
  }, [isEditing, editionMode, dragGesture, longPressGesture, tapGesture]);

  // Style animé pour la table
  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute' as const,
      left: currentX.value + translateX.value,
      top: currentY.value + translateY.value,
      width: width.value,
      height: height.value,
      transform: [
        { scale: scale.value }
      ],
      opacity: opacity.value,
      zIndex: isSelected ? 10000 : 1000,
    };
  }, [isSelected]);

  // Style pour l'aperçu fantôme
  const ghostStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute' as const,
      left: ghostX.value,
      top: ghostY.value,
      width: width.value,
      height: height.value,
      opacity: ghostOpacity.value,
      zIndex: 999, // Juste en dessous de la table
      borderWidth: 2,
      borderColor: '#2A2E33',
      borderStyle: 'dashed',
      borderRadius: 5,
      backgroundColor: 'rgba(42, 46, 51, 0.1)',
    };
  });

  // Reset des animations quand la table change
  React.useEffect(() => {
    if (!isEditing) {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
    }
  }, [isEditing, table.xStart, table.yStart]);

  // Validation de position
  React.useEffect(() => {
    if (!positionValid && isEditing) {
      opacity.value = withSpring(0.5);
    } else {
      opacity.value = withSpring(1);
    }
  }, [positionValid, isEditing]);

  const tableStyle = useMemo(() => ({
    backgroundColor: !editionMode && status ? getStatusColor(status) : '#D9D9D9',
    ...(isEditing
      ? { borderWidth: 3, borderColor: '#2A2E33', borderStyle: 'solid' as const }
      : (status ? getStatusBorderStyle(status, table) : { borderWidth: 2, borderColor: '#AAAAAA', borderStyle: 'solid' as const })
    ),
  }), [status, isEditing, table]);

  return (
    <>
      {/* Aperçu fantôme de la position snappée */}
      {isEditing && editionMode && <Animated.View style={ghostStyle} pointerEvents="none" />}

      <GestureDetector gesture={composedGesture}>
        <Animated.View style={animatedStyle}>
        <RoomChairs position="top" table={table} CELL_SIZE={CELL_SIZE} />
        <RoomChairs position="left" table={table} CELL_SIZE={CELL_SIZE} />

        <View style={styles.innerContainer}>
          <View style={[styles.table, tableStyle]}>
            <Text style={styles.tableText}>{table.name}</Text>
          </View>
        </View>

        <RoomChairs position="right" table={table} CELL_SIZE={CELL_SIZE} />
        <RoomChairs position="bottom" table={table} CELL_SIZE={CELL_SIZE} />

        {isEditing && editionMode && (
          <>
            {/* Handle de redimensionnement droit */}
            <GestureDetector gesture={rightResizeGesture}>
              <Animated.View style={styles.rightHandle}>
                <View style={styles.handleDot} />
              </Animated.View>
            </GestureDetector>

            {/* Handle de redimensionnement gauche */}
            <GestureDetector gesture={leftResizeGesture}>
              <Animated.View style={styles.leftHandle}>
                <View style={styles.handleDot} />
              </Animated.View>
            </GestureDetector>

            {/* Handle de redimensionnement bas */}
            <GestureDetector gesture={bottomResizeGesture}>
              <Animated.View style={styles.bottomHandle}>
                <View style={styles.handleDot} />
              </Animated.View>
            </GestureDetector>

            {/* Handle de redimensionnement haut */}
            <GestureDetector gesture={topResizeGesture}>
              <Animated.View style={styles.topHandle}>
                <View style={styles.handleDot} />
              </Animated.View>
            </GestureDetector>
          </>
        )}
      </Animated.View>
    </GestureDetector>
    </>
  );
};

const styles = StyleSheet.create({
  innerContainer: {
    width: '100%',
    height: '100%',
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  table: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 3,
  },
  tableText: {
    color: '#2A2E33',
    fontWeight: 'bold',
  },
  rightHandle: {
    position: 'absolute',
    right: -5,
    top: '50%',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: -15 }],
  },
  leftHandle: {
    position: 'absolute',
    left: -5,
    top: '50%',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: -15 }],
  },
  bottomHandle: {
    position: 'absolute',
    bottom: -5,
    left: '50%',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -15 }],
  },
  topHandle: {
    position: 'absolute',
    top: -5,
    left: '50%',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -15 }],
  },
  handleDot: {
    width: 15,
    height: 15,
    backgroundColor: '#2A2E33',
    borderRadius: 10,
  },
});