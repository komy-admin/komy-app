import React, { useEffect, useRef } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, View } from "react-native";
import { getStatusColor } from "~/lib/utils";
import { Table } from "~/types/table.types";
import { Text } from "../ui";
import { Status } from "~/types/status.enum";

interface TableViewProps {
  table: Table;
  status?: Status;
  isEditing: boolean;
  editionMode: boolean;
  positionValid: boolean;
  CELL_SIZE: number;
  onPress: (table: Table) => void;
  onLongPress: (table: Table) => void;
  onUpdate: (id: string, updates: Partial<Table>) => void;
}

export const RoomTable: React.FC<TableViewProps> = ({ table, status, isEditing, editionMode, positionValid, CELL_SIZE, onPress, onLongPress, onUpdate }) => {
  const lastValidWidth = useRef(table.width);
  const lastValidHeight = useRef(table.height);
  const lastValidXStart = useRef(table.xStart);
  const lastValidYStart = useRef(table.yStart);
  const width = useRef(new Animated.Value(table.width * CELL_SIZE)).current;
  const height = useRef(new Animated.Value(table.height * CELL_SIZE)).current;
  const xStart = useRef(new Animated.Value(table.xStart * CELL_SIZE)).current;
  const yStart = useRef(new Animated.Value(table.yStart * CELL_SIZE)).current;

  useEffect(() => {
    lastValidWidth.current = table.width;
    lastValidHeight.current = table.height;
    lastValidXStart.current = table.xStart;
    lastValidYStart.current = table.yStart;
    width.setValue(table.width * CELL_SIZE);
    height.setValue(table.height * CELL_SIZE);
    xStart.setValue(table.xStart * CELL_SIZE);
    yStart.setValue(table.yStart * CELL_SIZE);
  }, [table.width, table.height, table.xStart, table.yStart]);

  const dragPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const newXStart = Math.round((lastValidXStart.current * CELL_SIZE + gesture.dx) / CELL_SIZE) * CELL_SIZE;
        const newYStart = Math.round((lastValidYStart.current * CELL_SIZE + gesture.dy) / CELL_SIZE) * CELL_SIZE;
        
        xStart.setValue(newXStart);
        yStart.setValue(newYStart);
      },
      onPanResponderRelease: (_, gesture) => {
        const newTableXStart = Math.round(xStart._value / CELL_SIZE);
        const newTableYStart = Math.round(yStart._value / CELL_SIZE);
        
        lastValidXStart.current = newTableXStart;
        lastValidYStart.current = newTableYStart;
        
        onUpdate(table.id, { 
          xStart: newTableXStart,
          yStart: newTableYStart 
        });
      }
    })
  ).current;

  const rightPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const newWidth = Math.max(
          CELL_SIZE,
          Math.round((lastValidWidth.current * CELL_SIZE + gesture.dx) / CELL_SIZE) * CELL_SIZE
        );
        width.setValue(newWidth);
      },
      onPanResponderRelease: (_, gesture) => {
        const newTableWidth = Math.round(width._value / CELL_SIZE);
        lastValidWidth.current = newTableWidth;
        onUpdate(table.id, { width: newTableWidth, xStart: lastValidXStart.current });
      }
    })
  ).current;

  const leftPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const newWidth = Math.max(
          CELL_SIZE,
          Math.round((lastValidWidth.current * CELL_SIZE - gesture.dx) / CELL_SIZE) * CELL_SIZE
        );
        const newXStart = (lastValidXStart.current - ((newWidth / CELL_SIZE) - lastValidWidth.current)) * CELL_SIZE
        width.setValue(newWidth);
        xStart.setValue(newXStart)
      },
      onPanResponderRelease: (_, gesture) => {
        const newTableWidth = Math.round(width._value / CELL_SIZE);
        onUpdate(table.id, { width: newTableWidth, xStart: lastValidXStart.current - (newTableWidth - lastValidWidth.current) });
      }
    })
  ).current;

  const bottomPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const newHeight = Math.max(
          CELL_SIZE,
          Math.round((lastValidHeight.current * CELL_SIZE + gesture.dy) / CELL_SIZE) * CELL_SIZE
        );
        height.setValue(newHeight);
      },
      onPanResponderRelease: (_, gesture) => {
        const newTableHeight = Math.round(height._value / CELL_SIZE);
        lastValidHeight.current = newTableHeight; 
        onUpdate(table.id, { height: newTableHeight, yStart: lastValidYStart.current });
      }
    })
  ).current;

  const topPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const newHeight = Math.max(
          CELL_SIZE,
          Math.round((lastValidHeight.current * CELL_SIZE - gesture.dy) / CELL_SIZE) * CELL_SIZE
        );
        const newYStart = (lastValidYStart.current - ((newHeight / CELL_SIZE) - lastValidHeight.current)) * CELL_SIZE
        height.setValue(newHeight);
        yStart.setValue(newYStart)
      },
      onPanResponderRelease: (_, gesture) => {
        const newTableHeight = Math.round(height._value / CELL_SIZE);
        onUpdate(table.id, { height: newTableHeight, yStart: lastValidYStart.current - (newTableHeight - lastValidHeight.current) });
      }
    })
  ).current;

  const getTableColor = (table: Table) => {
    if (editionMode) {
      return positionValid ? '#D9D9D9' : '#F4A698'
    } else {
      return status ? getStatusColor(status) : '#D9D9D9';
    }
  }

  return (
    <Pressable
      onPress={() => onPress(table)}
      onLongPress={() => onLongPress(table)}
      delayLongPress={500}
    >
      <Animated.View
        style={[
          styles.tableContainer,
          {
            width: width,
            height: height,
            left: xStart,
            top: yStart,
            zIndex: isEditing ? 10 : 1,
          },
        ]}
      >
        {/* Chaise du haut */}
        <View style={[styles.chairContainer, styles.topChairContainer]}>
          <View style={styles.chair} />
        </View>
        
        <View style={styles.innerContainer}>
          <Animated.View
            style={[
              styles.table,
              {
                backgroundColor: getTableColor(table),
                opacity: 1,
                borderWidth: isEditing ? 3 : 2,
                borderColor: isEditing ? '#2A2E33' : '#AAAAAA',
              },
            ]}
          >
            <Text style={styles.tableText}>{table.name}</Text>
          </Animated.View>
        </View>

        {/* Chaise du bas */}
        <View style={[styles.chairContainer, styles.bottomChairContainer]}>
          <View style={styles.chair} />
        </View>

        {isEditing && editionMode && (
          <>
            <Animated.View
              {...dragPanResponder.panHandlers}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                opacity: 0
              }}
            >
              <View style={{
                width: '100%',
                height: '100%',
                opacity: 0
              }} />
            </Animated.View>
            <Animated.View
              {...rightPanResponder.panHandlers}
              style={styles.rightHandleHitArea}
            >
              <View style={styles.handleDot} />
            </Animated.View>
            <Animated.View
              {...leftPanResponder.panHandlers}
              style={styles.leftHandleHitArea}
            >
              <View style={styles.handleDot} />
            </Animated.View>
            <Animated.View
              {...bottomPanResponder.panHandlers}
              style={styles.bottomHandleHitArea}
            >
              <View style={styles.handleDot} />
            </Animated.View>
            <Animated.View
              {...topPanResponder.panHandlers}
              style={styles.topHandleHitArea}
            >
              <View style={styles.handleDot} />
            </Animated.View>
          </>
        )}
      </Animated.View>
    </Pressable>
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
    margin: 16,
  },
  tableText: {
    color: '#2A2E33',
    fontWeight: 'bold',
  },
  chairContainer: {
    position: 'absolute',
    width: '100%',
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  chair: {
    width: 30,
    height: 20,
    backgroundColor: '#D9D9D9',
    borderRadius: 50,
  },
  topChairContainer: {
    top: 0,
  },
  bottomChairContainer: {
    bottom: 0,
  },
  rightHandleHitArea: {
    position: 'absolute',
    right: -15.5,
    top: '50%',
    width: 50,
    height: 50,
    transform: [{ translateY: -25 }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftHandleHitArea: {
    position: 'absolute',
    left: -15.5,
    top: '50%',
    width: 50,
    height: 50,
    transform: [{ translateY: -25 }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomHandleHitArea: {
    position: 'absolute',
    bottom: -15.5,
    left: '50%',
    width: 50,
    height: 50,
    transform: [{ translateX: -25 }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHandleHitArea: {
    position: 'absolute',
    top: -15.5,
    left: '50%',
    width: 50,
    height: 50,
    transform: [{ translateX: -25 }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleDot: {
    width: 15,
    height: 15,
    backgroundColor: '#2A2E33',
    borderRadius: 10,
  },
});