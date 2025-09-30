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

export const RoomTableMobile: React.FC<TableViewProps> = ({
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
    const gridX = Math.round(newX / CELL_SIZE);
    const gridY = Math.round(newY / CELL_SIZE);

    // Vérifier les collisions avec d'autres tables
    const hasCollision = tables.some(otherTable => {
      if (otherTable.id === table.id) return false;

      const tableWidth = Math.round(currentWidth.value / CELL_SIZE);
      const tableHeight = Math.round(currentHeight.value / CELL_SIZE);

      return (
        gridX < otherTable.xStart + otherTable.width &&
        gridX + tableWidth > otherTable.xStart &&
        gridY < otherTable.yStart + otherTable.height &&
        gridY + tableHeight > otherTable.yStart
      );
    });

    // Si pas de collision, mettre à jour
    if (!hasCollision) {
      // Mettre à jour les positions actuelles
      currentX.value = newX;
      currentY.value = newY;
      translateX.value = 0;
      translateY.value = 0;

      onUpdate(table.id, {
        xStart: Math.max(0, gridX),
        yStart: Math.max(0, gridY)
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
    const updates: Partial<Table> = {
      width: Math.max(MIN_CELLS, gridWidth),
      height: Math.max(MIN_CELLS, gridHeight)
    };
    if (newX !== undefined) {
      updates.xStart = Math.max(0, Math.round(newX / CELL_SIZE));
    }
    if (newY !== undefined) {
      updates.yStart = Math.max(0, Math.round(newY / CELL_SIZE));
    }
    onUpdate(table.id, updates);
  }, [CELL_SIZE, onUpdate, table.id]);

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
        currentWidth.value = width.value;
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

        currentWidth.value = width.value;
        currentX.value = newX;
        translateX.value = 0;

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
        currentHeight.value = height.value;
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

        currentHeight.value = height.value;
        currentY.value = newY;
        translateY.value = 0;

        runOnJS(handleUpdateSize)(currentWidth.value, height.value, undefined, newY);
      })
      .runOnJS(false),
  [isEditing, editionMode, handleUpdateSize]);

  // Geste de drag pour déplacer la table avec snap-to-grid en temps réel
  const dragGesture = useMemo(() =>
    Gesture.Pan()
      .enabled(isEditing && editionMode)
      .onStart(() => {
        'worklet';
        scale.value = withSpring(1.05);
        // Sauvegarder la position actuelle comme dernière position valide
        lastValidX.value = currentX.value;
        lastValidY.value = currentY.value;
        // Utiliser la position actuelle comme point de départ
        startX.value = currentX.value;
        startY.value = currentY.value;
        translateX.value = 0;
        translateY.value = 0;
      })
      .onUpdate((event) => {
        'worklet';
        // Calculer la nouvelle position avec snap-to-grid en temps réel
        const rawX = startX.value + event.translationX;
        const rawY = startY.value + event.translationY;

        // Snap to grid pendant le mouvement
        const snappedX = Math.round(rawX / CELL_SIZE);
        const snappedY = Math.round(rawY / CELL_SIZE);

        // Vérifier les limites de la room
        const constrainedX = Math.max(0, Math.min(snappedX, roomWidth - Math.round(currentWidth.value / CELL_SIZE)));
        const constrainedY = Math.max(0, Math.min(snappedY, roomHeight - Math.round(currentHeight.value / CELL_SIZE)));

        // Appliquer le mouvement snappé et contraint
        translateX.value = constrainedX * CELL_SIZE - currentX.value;
        translateY.value = constrainedY * CELL_SIZE - currentY.value;
      })
      .onEnd(() => {
        'worklet';
        scale.value = withSpring(1);

        // Calculer la position finale snappée
        const finalX = currentX.value + translateX.value;
        const finalY = currentY.value + translateY.value;

        // Appeler la fonction de validation qui vérifiera les collisions
        runOnJS(handleUpdatePosition)(finalX, finalY);
      })
      .runOnJS(false),
  [isEditing, editionMode, handleUpdatePosition]);

  // Geste composé uniquement pour la table principale (pas les handles)
  const composedGesture = useMemo(() => {
    if (isEditing && editionMode) {
      return dragGesture;
    } else {
      return Gesture.Exclusive(longPressGesture, tapGesture);
    }
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
    backgroundColor: status ? getStatusColor(status) : '#D9D9D9',
    ...(isEditing
      ? { borderWidth: 3, borderColor: '#2A2E33', borderStyle: 'solid' as const }
      : (status ? getStatusBorderStyle(status, table) : { borderWidth: 2, borderColor: '#AAAAAA', borderStyle: 'solid' as const })
    ),
  }), [status, isEditing, table]);

  return (
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