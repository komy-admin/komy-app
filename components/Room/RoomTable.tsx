import React, { useEffect, useRef } from "react";
import { Animated, PanResponder, Platform, Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { getStatusColor, getStatusBorderStyle } from "~/lib/utils";
import { Table } from "~/types/table.types";
import { Text } from "../ui";
import { Status } from "~/types/status.enum";
import { RoomChairs } from "./RoomChairs";

interface TableViewProps {
  table: Table;
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
  const lastValidWidth = useRef(table.width);
  const lastValidHeight = useRef(table.height);
  const lastValidXStart = useRef(table.xStart);
  const lastValidYStart = useRef(table.yStart);
  const width = useRef(new Animated.Value(table.width * CELL_SIZE)).current;
  const height = useRef(new Animated.Value(table.height * CELL_SIZE)).current;
  const xStart = useRef(new Animated.Value(table.xStart * CELL_SIZE)).current;
  const yStart = useRef(new Animated.Value(table.yStart * CELL_SIZE)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const isDragging = useRef(false);
  const isResizing = useRef(false);

  // const isSizeValid = table.width >= MIN_CELLS && table.height >= MIN_CELLS;

  useEffect(() => {
    // Ne pas mettre à jour pendant le drag ou resize
    if (isDragging.current || isResizing.current) {
      return;
    }

    // Si position invalide et en mode édition, repositionner automatiquement
    if (!positionValid && isEditing) {
      // Animation de fade pour le repositionnement
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 80,
          useNativeDriver: true
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true
        })
      ]).start();

      // Repositionner à la dernière position valide
      onUpdate(table.id, {
        width: lastValidWidth.current,
        height: lastValidHeight.current,
        xStart: lastValidXStart.current,
        yStart: lastValidYStart.current
      });
      return;
    }

    // Mettre à jour les dernières positions valides si la position est valide
    if (positionValid) {
      lastValidWidth.current = table.width;
      lastValidHeight.current = table.height;
      lastValidXStart.current = table.xStart;
      lastValidYStart.current = table.yStart;
    }

    // Mise à jour normale des dimensions et positions
    width.setValue(table.width * CELL_SIZE);
    height.setValue(table.height * CELL_SIZE);
    xStart.setValue(table.xStart * CELL_SIZE);
    yStart.setValue(table.yStart * CELL_SIZE);
  }, [table.width, table.height, table.xStart, table.yStart, positionValid, isEditing]);

  const dragStartPosition = useRef({ x: 0, y: 0 });

  const dragPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isDragging.current = true;
        // Stocker la position initiale au début du drag
        dragStartPosition.current = {
          x: table.xStart * CELL_SIZE,
          y: table.yStart * CELL_SIZE
        };
      },
      onPanResponderMove: (_, gesture) => {
        // Calculer la nouvelle position basée sur la position initiale du drag
        const newXStart = Math.round((dragStartPosition.current.x + gesture.dx * (1 / currentZoom)) / CELL_SIZE) * CELL_SIZE;
        const newYStart = Math.round((dragStartPosition.current.y + gesture.dy * (1 / currentZoom)) / CELL_SIZE) * CELL_SIZE;

        // Mettre à jour l'animation en temps réel pour un mouvement fluide
        xStart.setValue(newXStart);
        yStart.setValue(newYStart);
      },
      onPanResponderRelease: (_, gesture) => {
        const newTableXStart = Math.round((xStart as any)._value / CELL_SIZE);
        const newTableYStart = Math.round((yStart as any)._value / CELL_SIZE);

        onUpdate(table.id, {
          xStart: newTableXStart,
          yStart: newTableYStart
        });
        isDragging.current = false;
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
      }
    })
  ).current;

  const resizeStartDimensions = useRef({ width: 0, height: 0, x: 0, y: 0 });

  const rightPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isResizing.current = true;
        resizeStartDimensions.current.width = table.width * CELL_SIZE;
      },
      onPanResponderMove: (_, gesture) => {
        const newWidth = Math.max(
          MIN_CELLS * CELL_SIZE,
          Math.round((resizeStartDimensions.current.width + gesture.dx * (1 / currentZoom)) / CELL_SIZE) * CELL_SIZE
        );
        width.setValue(newWidth);
      },
      onPanResponderRelease: () => {
        const newTableWidth = Math.round((width as any)._value / CELL_SIZE);
        onUpdate(table.id, { width: newTableWidth });
        isResizing.current = false;
      },
      onPanResponderTerminate: () => {
        isResizing.current = false;
      }
    })
  ).current;

  const leftPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isResizing.current = true;
        resizeStartDimensions.current.width = table.width * CELL_SIZE;
        resizeStartDimensions.current.x = table.xStart * CELL_SIZE;
      },
      onPanResponderMove: (_, gesture) => {
        const newWidth = Math.max(
          MIN_CELLS * CELL_SIZE,
          Math.round((resizeStartDimensions.current.width - gesture.dx * (1 / currentZoom)) / CELL_SIZE) * CELL_SIZE
        );
        const widthDiff = (newWidth - resizeStartDimensions.current.width) / CELL_SIZE;
        const newXStart = (table.xStart - widthDiff) * CELL_SIZE;
        width.setValue(newWidth);
        xStart.setValue(newXStart);
      },
      onPanResponderRelease: () => {
        const newTableWidth = Math.round((width as any)._value / CELL_SIZE);
        const newTableXStart = Math.round((xStart as any)._value / CELL_SIZE);
        onUpdate(table.id, {
          width: newTableWidth,
          xStart: newTableXStart
        });
        isResizing.current = false;
      },
      onPanResponderTerminate: () => {
        isResizing.current = false;
      }
    })
  ).current;

  const bottomPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isResizing.current = true;
        resizeStartDimensions.current.height = table.height * CELL_SIZE;
      },
      onPanResponderMove: (_, gesture) => {
        const newHeight = Math.max(
          MIN_CELLS * CELL_SIZE,
          Math.round((resizeStartDimensions.current.height + gesture.dy * (1 / currentZoom)) / CELL_SIZE) * CELL_SIZE
        );
        height.setValue(newHeight);
      },
      onPanResponderRelease: () => {
        const newTableHeight = Math.round((height as any)._value / CELL_SIZE);
        onUpdate(table.id, { height: newTableHeight });
        isResizing.current = false;
      },
      onPanResponderTerminate: () => {
        isResizing.current = false;
      }
    })
  ).current;

  const topPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isResizing.current = true;
        resizeStartDimensions.current.height = table.height * CELL_SIZE;
        resizeStartDimensions.current.y = table.yStart * CELL_SIZE;
      },
      onPanResponderMove: (_, gesture) => {
        const newHeight = Math.max(
          MIN_CELLS * CELL_SIZE,
          Math.round((resizeStartDimensions.current.height - gesture.dy * (1 / currentZoom)) / CELL_SIZE) * CELL_SIZE
        );
        const heightDiff = (newHeight - resizeStartDimensions.current.height) / CELL_SIZE;
        const newYStart = (table.yStart - heightDiff) * CELL_SIZE;
        height.setValue(newHeight);
        yStart.setValue(newYStart);
      },
      onPanResponderRelease: () => {
        const newTableHeight = Math.round((height as any)._value / CELL_SIZE);
        const newTableYStart = Math.round((yStart as any)._value / CELL_SIZE);
        onUpdate(table.id, {
          height: newTableHeight,
          yStart: newTableYStart
        });
        isResizing.current = false;
      },
      onPanResponderTerminate: () => {
        isResizing.current = false;
      }
    })
  ).current;

  const tablePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: () => {
        onPress(table);
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  return (
    Platform.OS === 'web' || Platform.OS === 'ios' ? (
      <Pressable
        onPress={() => onPress(table)}
        onLongPress={() => onLongPress(table)}
        delayLongPress={500}
        style={{ zIndex: isSelected ? 10000 : 1000 }}
      >
        <Animated.View
          style={[
            styles.tableContainer,
            {
              width,
              height,
              left: xStart,
              top: yStart,
            },
          ]}
        >
          <RoomChairs position="top" table={table} CELL_SIZE={CELL_SIZE} />
          <RoomChairs position="left" table={table} CELL_SIZE={CELL_SIZE} />

          <View style={styles.innerContainer}>
            <Animated.View
              style={[
                styles.table,
                {
                  backgroundColor: status ? getStatusColor(status) : '#D9D9D9',
                  opacity: 1,
                  ...(isEditing 
                    ? { borderWidth: 3, borderColor: '#2A2E33', borderStyle: 'solid' }
                    : (status ? getStatusBorderStyle(status, table) : { borderWidth: 2, borderColor: '#AAAAAA', borderStyle: 'solid' })
                  ),
                },
              ]}
            >
              <Text style={styles.tableText}>{table.name}</Text>
            </Animated.View>
          </View>

          <RoomChairs position="right" table={table} CELL_SIZE={CELL_SIZE} />
          <RoomChairs position="bottom" table={table} CELL_SIZE={CELL_SIZE} />

          {isEditing && editionMode && (
            <>
              <Animated.View
                {...dragPanResponder.panHandlers}
                style={styles.dragArea}
              />
              <Animated.View
                {...rightPanResponder.panHandlers}
                style={styles.rightHandle}
              >
                <View style={styles.handleDot} />
              </Animated.View>
              <Animated.View
                {...leftPanResponder.panHandlers}
                style={styles.leftHandle}
              >
                <View style={styles.handleDot} />
              </Animated.View>
              <Animated.View
                {...bottomPanResponder.panHandlers}
                style={styles.bottomHandle}
              >
                <View style={styles.handleDot} />
              </Animated.View>
              <Animated.View
                {...topPanResponder.panHandlers}
                style={styles.topHandle}
              >
                <View style={styles.handleDot} />
              </Animated.View>
            </>
          )}
        </Animated.View>
      </Pressable>) : (
      <Animated.View
        {...tablePanResponder.panHandlers}
        style={[
          styles.tableContainer,
          {
            width,
            height,
            left: xStart,
            top: yStart,
            opacity,
            zIndex: isSelected ? 20000 : 10000,
            elevation: isSelected ? 20000 : 10000,
          },
        ]}
      >
        <RoomChairs position="top" table={table} CELL_SIZE={CELL_SIZE} />
        <RoomChairs position="left" table={table} CELL_SIZE={CELL_SIZE} />

        <View style={styles.innerContainer}>
          <Animated.View
            style={[
              styles.table,
              {
                backgroundColor: status ? getStatusColor(status) : '#D9D9D9',
                opacity: 1,
                ...(isEditing 
                  ? { borderWidth: 3, borderColor: '#2A2E33', borderStyle: 'solid' }
                  : (status ? getStatusBorderStyle(status, table) : { borderWidth: 2, borderColor: '#AAAAAA', borderStyle: 'solid' })
                ),
              },
            ]}
          >
            <Text style={styles.tableText}>{table.name}</Text>
          </Animated.View>
        </View>

        <RoomChairs position="right" table={table} CELL_SIZE={CELL_SIZE} />
        <RoomChairs position="bottom" table={table} CELL_SIZE={CELL_SIZE} />

        {isEditing && editionMode && (
          <>
            <Animated.View
              {...dragPanResponder.panHandlers}
              style={styles.dragArea}
            />
            <Animated.View
              {...rightPanResponder.panHandlers}
              style={styles.rightHandle}
            >
              <View style={styles.handleDot} />
            </Animated.View>
            <Animated.View
              {...leftPanResponder.panHandlers}
              style={styles.leftHandle}
            >
              <View style={styles.handleDot} />
            </Animated.View>
            <Animated.View
              {...bottomPanResponder.panHandlers}
              style={styles.bottomHandle}
            >
              <View style={styles.handleDot} />
            </Animated.View>
            <Animated.View
              {...topPanResponder.panHandlers}
              style={styles.topHandle}
            >
              <View style={styles.handleDot} />
            </Animated.View>
          </>
        )}
      </Animated.View>
    )
  );
};

const styles = StyleSheet.create({
  tableContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  dragArea: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
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