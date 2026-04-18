/**
 * RoomTable - Table interactive avec drag & drop, resize et snap-to-grid.
 *
 * ARCHITECTURE :
 * - Coordonnées : Backend en GRILLE (entiers) ↔ UI en PIXELS (grille * CELL_SIZE)
 * - Flux : Backend props → SharedValues → Animations → Visual → Gesture → Validation → onUpdate()
 * - Validation : limites room + collisions AABB + taille min (MIN_CELLS)
 * - Si invalide → rollback vers backend (source de vérité)
 *
 * SHARED VALUES (17+) :
 * - Position : translateX/Y (drag offset), currentX/Y (position courante), lastValidX/Y (rollback)
 * - Dimensions : width/height (visuelles), currentWidth/Height (courantes), startWidth/Height (référence)
 * - Effets : scale (zoom au grab), opacity (feedback validité), ghost (preview snap position)
 * - Cache : cachedTable*InCells, cachedMax* (limites pré-calculées pour éviter 60fps de calculs)
 *
 * GESTURES (7) :
 * - Mode édition sélectionné : drag (pan libre) + 4 resize handles (haut/bas/gauche/droite) + editTap
 * - Mode non-sélectionné : tap (sélection) + longPress (sélection)
 */
import React, { useMemo, useCallback } from "react";
import { Platform, StyleSheet, View, Text as RNText } from "react-native";
import { getStatusColor } from "~/lib/utils";
import { Table } from "~/types/table.types";
import { isTableInBounds } from "~/hooks/room/useRoomValidation";
import { Status } from "~/types/status.enum";
import { shadows } from "~/theme";
import { RoomChairs, RoomChairsRounded } from "./RoomChairs";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
  SharedValue,
} from 'react-native-reanimated';

const MIN_CELLS = 2;

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
  currentZoomScale: SharedValue<number>; // ⚡ SharedValue direct (pas number)
  isSelected: boolean;
  roomColor?: string | null;
  tableBg?: string;
  onPress: (table: Table) => void;
  onLongPress: (table: Table) => void;
  onUpdate: (id: string, updates: Partial<Table>) => void;
  onEditTap?: (table: Table) => void;
}

const RoomTable: React.FC<TableViewProps> = ({
  table,
  tables,
  roomWidth,
  roomHeight,
  status,
  isEditing,
  editionMode,
  positionValid,
  CELL_SIZE,
  currentZoomScale,
  isSelected,
  roomColor,
  tableBg = '#F5F4FA',
  onPress,
  onLongPress,
  onUpdate,
  onEditTap,
}) => {
  // --- SHARED VALUES : Position ---
  // translateX/Y : offset libre pendant le drag, remis à 0 après validation
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  // startX/Y : position capturée au début du geste (référence stable pour calculs)
  const startX = useSharedValue(table.xStart * CELL_SIZE);
  const startY = useSharedValue(table.yStart * CELL_SIZE);
  // currentX/Y : position courante en pixels (source de vérité UI, synchronisée avec le backend)
  const currentX = useSharedValue(table.xStart * CELL_SIZE);
  const currentY = useSharedValue(table.yStart * CELL_SIZE);
  // lastValidX/Y : dernière position validée (pour rollback si collision ou hors-limites)
  const lastValidX = useSharedValue(table.xStart * CELL_SIZE);
  const lastValidY = useSharedValue(table.yStart * CELL_SIZE);

  // --- SHARED VALUES : Dimensions ---
  // width/height : dimensions visuelles animées pendant le resize
  const width = useSharedValue(table.width * CELL_SIZE);
  const height = useSharedValue(table.height * CELL_SIZE);
  // startWidth/Height : dimensions capturées au début du resize (référence stable)
  const startWidth = useSharedValue(table.width * CELL_SIZE);
  const startHeight = useSharedValue(table.height * CELL_SIZE);
  // currentWidth/Height : dimensions courantes (source de vérité UI)
  const currentWidth = useSharedValue(table.width * CELL_SIZE);
  const currentHeight = useSharedValue(table.height * CELL_SIZE);

  // --- SHARED VALUES : Effets visuels ---
  const scale = useSharedValue(1);    // Zoom visuel au grab (1.05x)
  const opacity = useSharedValue(1);  // Feedback visuel de validité (0.5 si invalide)

  // --- SHARED VALUES : Ghost preview ---
  // Aperçu en pointillé de la position snappée pendant le drag
  const ghostOpacity = useSharedValue(0);
  const ghostX = useSharedValue(0);
  const ghostY = useSharedValue(0);

  // --- SHARED VALUES : Cache de performance ---
  // Pré-calculés dans onStart pour éviter des recalculs à chaque frame (60fps)
  const cachedTableWidthInCells = useSharedValue(0);
  const cachedTableHeightInCells = useSharedValue(0);
  const cachedMaxX = useSharedValue(0);  // roomWidth - tableWidth (limite droite)
  const cachedMaxY = useSharedValue(0);  // roomHeight - tableHeight (limite basse)

  // --- SYNC BACKEND → SHARED VALUES ---
  // Quand le backend pousse de nouvelles valeurs (via WebSocket ou API response),
  // on met à jour toutes les SharedValues. Skip si déjà synchronisé pour éviter les cascades.
  React.useEffect(() => {
    const targetX = table.xStart * CELL_SIZE;
    const targetY = table.yStart * CELL_SIZE;
    const targetWidth = table.width * CELL_SIZE;
    const targetHeight = table.height * CELL_SIZE;

    const alreadySynced =
      currentX.value === targetX &&
      currentY.value === targetY &&
      currentWidth.value === targetWidth &&
      currentHeight.value === targetHeight;
    if (alreadySynced) return;

    currentX.value = targetX;
    currentY.value = targetY;
    currentWidth.value = targetWidth;
    currentHeight.value = targetHeight;
    lastValidX.value = targetX;
    lastValidY.value = targetY;
    width.value = targetWidth;
    height.value = targetHeight;
    translateX.value = 0;
    translateY.value = 0;
  }, [table.xStart, table.yStart, table.width, table.height]);

  const tableBorderRadius = table.shape === 'rounded' ? 9999 : 8;

  // --- CALLBACKS ---
  const handlePress = useCallback(() => {
    onPress(table);
  }, [onPress, table]);

  const handleLongPress = useCallback(() => {
    onLongPress(table);
  }, [onLongPress, table]);

  const handleEditTap = useCallback(() => {
    onEditTap?.(table);
  }, [onEditTap, table]);

  // --- COLLISION DETECTION ---
  // Détection AABB (Axis-Aligned Bounding Box) en coordonnées grille.
  // Vérifie si la position (x,y,w,h) chevauche une autre table.
  const checkCollision = useCallback((x: number, y: number, w: number, h: number): boolean => {
    return tables.some(otherTable => {
      if (otherTable.id === table.id) return false;
      return (
        x < otherTable.xStart + otherTable.width &&
        x + w > otherTable.xStart &&
        y < otherTable.yStart + otherTable.height &&
        y + h > otherTable.yStart
      );
    });
  }, [tables, table.id]);

  // --- VALIDATION POSITION (après drag) ---
  // Convertit pixels → grille, vérifie bounds + collisions.
  // Si valide : met à jour les SharedValues + appelle onUpdate (→ backend).
  // Si invalide : rollback animé vers lastValidX/Y.
  const handleUpdatePosition = useCallback((newX: number, newY: number) => {
    const gridX = Math.round(newX / CELL_SIZE);
    const gridY = Math.round(newY / CELL_SIZE);
    const tableWidth = Math.round(currentWidth.value / CELL_SIZE);
    const tableHeight = Math.round(currentHeight.value / CELL_SIZE);

    const withinBounds = isTableInBounds(
      { xStart: gridX, yStart: gridY, width: tableWidth, height: tableHeight },
      roomWidth, roomHeight
    );

    const hasCollision = checkCollision(gridX, gridY, tableWidth, tableHeight);

    if (!hasCollision && withinBounds) {
      const validX = gridX * CELL_SIZE;
      const validY = gridY * CELL_SIZE;
      lastValidX.value = validX;
      lastValidY.value = validY;
      currentX.value = validX;
      currentY.value = validY;
      translateX.value = 0;
      translateY.value = 0;
      onUpdate(table.id, { xStart: gridX, yStart: gridY });
    } else {
      // Rollback animation
      const deltaX = lastValidX.value - currentX.value;
      const deltaY = lastValidY.value - currentY.value;
      translateX.value = withSpring(deltaX, {}, () => {
        translateX.value = 0;
        currentX.value = lastValidX.value;
      });
      translateY.value = withSpring(deltaY, {}, () => {
        translateY.value = 0;
        currentY.value = lastValidY.value;
      });
    }
  }, [CELL_SIZE, onUpdate, table.id, checkCollision, roomWidth, roomHeight, currentWidth, currentHeight, lastValidX, lastValidY]);

  // --- VALIDATION DIMENSIONS (après resize) ---
  // Convertit pixels → grille, applique contrainte MIN_CELLS, vérifie bounds + collisions.
  // Si valide : met à jour SharedValues + onUpdate. Gère aussi le déplacement X/Y (left/top resize).
  // Si invalide : rollback animé vers les valeurs backend (source de vérité absolue).
  const handleUpdateSize = useCallback((newWidth: number, newHeight: number, newX?: number, newY?: number) => {
    const gridWidth = Math.round(newWidth / CELL_SIZE);
    const gridHeight = Math.round(newHeight / CELL_SIZE);
    const finalGridX = newX !== undefined ? Math.round(newX / CELL_SIZE) : table.xStart;
    const finalGridY = newY !== undefined ? Math.round(newY / CELL_SIZE) : table.yStart;
    const constrainedWidth = Math.max(MIN_CELLS, gridWidth);
    const constrainedHeight = Math.max(MIN_CELLS, gridHeight);

    const withinBounds = isTableInBounds(
      { xStart: finalGridX, yStart: finalGridY, width: constrainedWidth, height: constrainedHeight },
      roomWidth, roomHeight
    );

    const hasCollision = checkCollision(finalGridX, finalGridY, constrainedWidth, constrainedHeight);

    if (!hasCollision && withinBounds) {
      const validX = finalGridX * CELL_SIZE;
      const validY = finalGridY * CELL_SIZE;
      const validWidth = constrainedWidth * CELL_SIZE;
      const validHeight = constrainedHeight * CELL_SIZE;

      if (newX !== undefined) {
        currentX.value = validX;
        lastValidX.value = validX;
        translateX.value = 0;
      }
      if (newY !== undefined) {
        currentY.value = validY;
        lastValidY.value = validY;
        translateY.value = 0;
      }

      currentWidth.value = validWidth;
      currentHeight.value = validHeight;

      const updates: Partial<Table> = {
        width: constrainedWidth,
        height: constrainedHeight
      };
      if (newX !== undefined) {
        updates.xStart = finalGridX;
      }
      if (newY !== undefined) {
        updates.yStart = finalGridY;
      }

      onUpdate(table.id, updates);
    } else {
      // Rollback to backend values (source of truth)
      const backendWidth = table.width * CELL_SIZE;
      const backendHeight = table.height * CELL_SIZE;
      const backendX = table.xStart * CELL_SIZE;
      const backendY = table.yStart * CELL_SIZE;

      width.value = withSpring(backendWidth);
      height.value = withSpring(backendHeight);
      currentX.value = backendX;
      currentY.value = backendY;
      currentWidth.value = backendWidth;
      currentHeight.value = backendHeight;
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    }
  }, [CELL_SIZE, onUpdate, table.id, table.xStart, table.yStart, table.width, table.height, checkCollision, roomWidth, roomHeight, currentWidth, currentHeight, lastValidX, lastValidY]);

  // --- GESTURES : Sélection (mode non-édition) ---
  // Tap simple pour sélectionner, longPress pour sélection alternative
  const tapGesture = useMemo(() =>
    Gesture.Tap()
      .runOnJS(true)
      .onEnd(handlePress),
    [handlePress]);

  const longPressGesture = useMemo(() =>
    Gesture.LongPress()
      .minDuration(500)
      .runOnJS(true)
      .onEnd(handleLongPress),
    [handleLongPress]);

  // --- GESTURES : Resize (4 handles, snap-to-grid, zoom-compensé) ---
  // Chaque handle modifie width/height avec compensation du zoom courant.
  // Left/Top modifient aussi la position (la table grandit vers la gauche/haut).

  const rightResizeGesture = useMemo(() =>
    Gesture.Pan()
      .enabled(isEditing && editionMode)
      .onStart(() => {
        'worklet';
        startWidth.value = currentWidth.value;
      })
      .onUpdate((event) => {
        'worklet';
        // Compenser le zoom pour que le resize suive le curseur
        const compensatedTranslationX = event.translationX / currentZoomScale.value;
        const rawWidth = startWidth.value + compensatedTranslationX;
        // Snap to grid avec taille minimum
        width.value = Math.max(MIN_CELLS * CELL_SIZE, Math.round(rawWidth / CELL_SIZE) * CELL_SIZE);
      })
      .onEnd(() => {
        'worklet';
        runOnJS(handleUpdateSize)(width.value, currentHeight.value);
      })
      .runOnJS(false),
    [isEditing, editionMode, handleUpdateSize]);

  // Left resize : modifie width ET xStart (la table se déplace vers la gauche)
  // Utilise startWidth/startX capturés dans onStart comme référence stable
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
        const compensatedTranslationX = event.translationX / currentZoomScale.value;
        // Tirer vers la gauche = réduire translationX = agrandir la table
        const rawWidth = startWidth.value - compensatedTranslationX;
        const snappedWidth = Math.max(MIN_CELLS * CELL_SIZE, Math.round(rawWidth / CELL_SIZE) * CELL_SIZE);
        // Delta par rapport au startWidth (pas currentWidth qui peut changer)
        const deltaWidth = snappedWidth - startWidth.value;
        width.value = snappedWidth;
        // Compenser visuellement le déplacement vers la gauche
        translateX.value = -deltaWidth;
      })
      .onEnd(() => {
        'worklet';
        const deltaGrid = (width.value - startWidth.value) / CELL_SIZE;
        // Nouvelle position X = startX décalé du delta
        const newX = startX.value - deltaGrid * CELL_SIZE;
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
        const compensatedTranslationY = event.translationY / currentZoomScale.value;
        const rawHeight = startHeight.value + compensatedTranslationY;
        height.value = Math.max(MIN_CELLS * CELL_SIZE, Math.round(rawHeight / CELL_SIZE) * CELL_SIZE);
      })
      .onEnd(() => {
        'worklet';
        runOnJS(handleUpdateSize)(currentWidth.value, height.value);
      })
      .runOnJS(false),
    [isEditing, editionMode, handleUpdateSize]);

  // Top resize : modifie height ET yStart (même logique que left resize sur l'axe Y)
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
        const compensatedTranslationY = event.translationY / currentZoomScale.value;
        const rawHeight = startHeight.value - compensatedTranslationY;
        const snappedHeight = Math.max(MIN_CELLS * CELL_SIZE, Math.round(rawHeight / CELL_SIZE) * CELL_SIZE);
        height.value = snappedHeight;
        translateY.value = -(snappedHeight - startHeight.value);
      })
      .onEnd(() => {
        'worklet';
        const deltaGrid = (height.value - startHeight.value) / CELL_SIZE;
        const newY = startY.value - deltaGrid * CELL_SIZE;
        runOnJS(handleUpdateSize)(currentWidth.value, height.value, undefined, newY);
      })
      .runOnJS(false),
    [isEditing, editionMode, handleUpdateSize]);

  // --- GESTURE : Drag (déplacement libre + ghost preview + snap final) ---
  // onStart : capture position initiale, pré-calcule les limites de la room
  // onUpdate : déplacement libre (compensé zoom) + ghost preview snappé sur la grille
  // onEnd : snap final sur la grille, validation bounds + collisions via handleUpdatePosition
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
        // Precompute limits once (avoids 60fps recalculations)
        cachedTableWidthInCells.value = Math.round(currentWidth.value / CELL_SIZE);
        cachedTableHeightInCells.value = Math.round(currentHeight.value / CELL_SIZE);
        cachedMaxX.value = roomWidth - cachedTableWidthInCells.value;
        cachedMaxY.value = roomHeight - cachedTableHeightInCells.value;
      })
      .onUpdate((event) => {
        'worklet';
        const compensatedTranslationX = event.translationX / currentZoomScale.value;
        const compensatedTranslationY = event.translationY / currentZoomScale.value;
        translateX.value = compensatedTranslationX;
        translateY.value = compensatedTranslationY;

        // Ghost preview at snapped position
        const snappedGridX = Math.round((currentX.value + compensatedTranslationX) / CELL_SIZE);
        const snappedGridY = Math.round((currentY.value + compensatedTranslationY) / CELL_SIZE);
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

        const snappedGridX = Math.round((currentX.value + translateX.value) / CELL_SIZE);
        const snappedGridY = Math.round((currentY.value + translateY.value) / CELL_SIZE);
        const constrainedX = Math.max(0, Math.min(snappedGridX, cachedMaxX.value));
        const constrainedY = Math.max(0, Math.min(snappedGridY, cachedMaxY.value));
        runOnJS(handleUpdatePosition)(constrainedX * CELL_SIZE, constrainedY * CELL_SIZE);
      })
      .runOnJS(false),
  [isEditing, editionMode, handleUpdatePosition, roomWidth, roomHeight]);

  // --- GESTURE : Edit tap (tap sur table sélectionnée → ouvre le panel d'édition) ---
  const editTapGesture = useMemo(() =>
    Gesture.Tap()
      .runOnJS(true)
      .onEnd(handleEditTap),
    [handleEditTap]);

  // --- GESTURE COMPOSÉE ---
  // Mode édition sélectionné : Race(editTap, drag) → le drag démarre si le tap ne match pas
  // Mode non-sélectionné : Exclusive(longPress, tap) → longPress prioritaire sur tap
  const composedGesture = useMemo(() => {
    if (isEditing && editionMode) {
      return Gesture.Race(editTapGesture, dragGesture);
    }
    return Gesture.Exclusive(longPressGesture, tapGesture);
  }, [isEditing, editionMode, editTapGesture, dragGesture, longPressGesture, tapGesture]);

  // --- STYLES ANIMÉS ---
  // Position + dimensions + scale + opacity, recalculés à chaque frame par Reanimated
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

  // Ghost preview : rectangle en pointillé montrant la position snappée sur la grille
  // Reste carré (borderRadius: 5) même pour les tables arrondies pour montrer l'espace grille
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

  // --- EFFETS : Reset et feedback visuel ---
  // Remise à zéro des animations quand la table n'est plus en édition
  React.useEffect(() => {
    if (!isEditing) {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
    }
  }, [isEditing]);

  // Feedback visuel : opacity réduite si la position est invalide (collision ou hors-limites)
  React.useEffect(() => {
    if (!positionValid && isEditing) {
      opacity.value = withSpring(0.5);
    } else {
      opacity.value = withSpring(1);
    }
  }, [positionValid, isEditing]);

  const tableStyle = useMemo(() => ({
    backgroundColor: status ? getStatusColor(status) : tableBg,
    borderRadius: tableBorderRadius,
    ...(isEditing
      ? { borderWidth: 3, borderColor: '#2A2E33', borderStyle: 'solid' as const }
      : { borderWidth: 2, borderColor: '#AAAAAA', borderStyle: 'solid' as const }
    ),
  }), [status, isEditing, tableBg, tableBorderRadius]);

  // --- STYLES STATIQUES ---
  // Web : cursor move en mode édition + texte non-sélectionnable
  const containerStyle = useMemo(() => ({
    ...(Platform.OS === 'web' && {
      userSelect: 'none' as any,
      WebkitUserSelect: 'none' as any,
      ...(isEditing && editionMode && {
        cursor: 'move' as any,
      }),
    }),
  }), [isEditing, editionMode]);

  return (
    <>
      {isEditing && editionMode && <Animated.View style={ghostStyle} pointerEvents="none" />}

      <Animated.View style={animatedStyle}>
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[{ width: '100%', height: '100%' }, containerStyle]}>
            {!(isEditing && isSelected) && (
              table.shape === 'rounded'
                ? <RoomChairsRounded table={table} CELL_SIZE={CELL_SIZE} />
                : <>
                    <RoomChairs position="top" table={table} CELL_SIZE={CELL_SIZE} />
                    <RoomChairs position="left" table={table} CELL_SIZE={CELL_SIZE} />
                  </>
            )}

            <View style={styles.innerContainer}>
              <View style={[styles.table, tableStyle]}>
                <View style={styles.emptyTableContent}>
                  <View style={[styles.emptyTableIcon, isSelected && { backgroundColor: roomColor || '#6366F1' }]}>
                    <MaterialCommunityIcons name="table-furniture" size={18} color={isSelected ? '#FFFFFF' : '#9CA3AF'} />
                  </View>
                  <RNText style={styles.emptyTableText} numberOfLines={1}>{table.name}</RNText>
                </View>
              </View>
            </View>

            {!(isEditing && isSelected) && table.shape !== 'rounded' && (
              <>
                <RoomChairs position="right" table={table} CELL_SIZE={CELL_SIZE} />
                <RoomChairs position="bottom" table={table} CELL_SIZE={CELL_SIZE} />
              </>
            )}
          </Animated.View>
        </GestureDetector>

        {isEditing && editionMode && (
          <>
            <GestureDetector gesture={rightResizeGesture}>
              <Animated.View style={styles.rightHandle}>
                <View style={styles.handleDot} />
              </Animated.View>
            </GestureDetector>
            <GestureDetector gesture={leftResizeGesture}>
              <Animated.View style={styles.leftHandle}>
                <View style={styles.handleDot} />
              </Animated.View>
            </GestureDetector>
            <GestureDetector gesture={bottomResizeGesture}>
              <Animated.View style={styles.bottomHandle}>
                <View style={styles.handleDot} />
              </Animated.View>
            </GestureDetector>
            <GestureDetector gesture={topResizeGesture}>
              <Animated.View style={styles.topHandle}>
                <View style={styles.handleDot} />
              </Animated.View>
            </GestureDetector>
          </>
        )}
      </Animated.View>
    </>
  );
};

const RoomTableMemoized = React.memo(RoomTable, (prevProps, nextProps) => {
  return (
    prevProps.table.id === nextProps.table.id &&
    prevProps.table.xStart === nextProps.table.xStart &&
    prevProps.table.yStart === nextProps.table.yStart &&
    prevProps.table.width === nextProps.table.width &&
    prevProps.table.height === nextProps.table.height &&
    prevProps.table.name === nextProps.table.name &&
    prevProps.table.seats === nextProps.table.seats &&
    prevProps.table.shape === nextProps.table.shape &&
    prevProps.status === nextProps.status &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.positionValid === nextProps.positionValid &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.roomColor === nextProps.roomColor &&
    prevProps.tableBg === nextProps.tableBg
  );
});

RoomTableMemoized.displayName = 'RoomTable';

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
    ...shadows.bottom,
  },
  emptyTableContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyTableIcon: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTableText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2A2E33',
  },
  // Resize handles
  rightHandle: {
    position: 'absolute',
    right: -4,
    top: '50%',
    width: 24,
    height: 24,
    transform: [{ translateY: -12 }],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10001,
    ...(Platform.OS === 'web' && { cursor: 'ew-resize' as any }),
  },
  leftHandle: {
    position: 'absolute',
    left: -4,
    top: '50%',
    width: 24,
    height: 24,
    transform: [{ translateY: -12 }],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10001,
    ...(Platform.OS === 'web' && { cursor: 'ew-resize' as any }),
  },
  bottomHandle: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    width: 24,
    height: 24,
    transform: [{ translateX: -12 }],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10001,
    ...(Platform.OS === 'web' && { cursor: 'ns-resize' as any }),
  },
  topHandle: {
    position: 'absolute',
    top: -4,
    left: '50%',
    width: 24,
    height: 24,
    transform: [{ translateX: -12 }],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10001,
    ...(Platform.OS === 'web' && { cursor: 'ns-resize' as any }),
  },
  handleDot: {
    width: 14,
    height: 14,
    backgroundColor: '#2A2E33',
    borderRadius: 7,
  },
});

export { RoomTableMemoized as RoomTable };