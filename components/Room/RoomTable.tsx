import React, { useEffect, useRef } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, View, ViewStyle } from "react-native";
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

export const RoomTable: React.FC<TableViewProps> = ({ 
  table, 
  status, 
  isEditing, 
  editionMode, 
  positionValid, 
  CELL_SIZE, 
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

  // const isSizeValid = table.width >= MIN_CELLS && table.height >= MIN_CELLS;

  useEffect(() => {
    if (!positionValid) {
      // Retour à la dernière position valide
      onUpdate(table.id, {
        width: lastValidWidth.current,
        height: lastValidHeight.current,
        xStart: lastValidXStart.current,
        yStart: lastValidYStart.current
      });
    } else {
      // Mise à jour des dernières positions valides
      lastValidWidth.current = table.width;
      lastValidHeight.current = table.height;
      lastValidXStart.current = table.xStart;
      lastValidYStart.current = table.yStart;

      // Animation vers la nouvelle position
      Animated.parallel([
        Animated.spring(width, { toValue: table.width * CELL_SIZE, useNativeDriver: false }),
        Animated.spring(height, { toValue: table.height * CELL_SIZE, useNativeDriver: false }),
        Animated.spring(xStart, { toValue: table.xStart * CELL_SIZE, useNativeDriver: false }),
        Animated.spring(yStart, { toValue: table.yStart * CELL_SIZE, useNativeDriver: false })
      ]).start();
    }
  }, [positionValid, table]);

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
          MIN_CELLS * CELL_SIZE,
          Math.round((lastValidWidth.current * CELL_SIZE + gesture.dx) / CELL_SIZE) * CELL_SIZE
        );
        width.setValue(newWidth);
      },
      onPanResponderRelease: () => {
        const newTableWidth = Math.round(width._value / CELL_SIZE);
        onUpdate(table.id, { width: newTableWidth });
      }
    })
  ).current;

  const leftPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const newWidth = Math.max(
          MIN_CELLS * CELL_SIZE,
          Math.round((lastValidWidth.current * CELL_SIZE - gesture.dx) / CELL_SIZE) * CELL_SIZE
        );
        const newXStart = (lastValidXStart.current - ((newWidth / CELL_SIZE) - lastValidWidth.current)) * CELL_SIZE;
        width.setValue(newWidth);
        xStart.setValue(newXStart);
      },
      onPanResponderRelease: () => {
        const newTableWidth = Math.round(width._value / CELL_SIZE);
        onUpdate(table.id, { 
          width: newTableWidth, 
          xStart: lastValidXStart.current - (newTableWidth - lastValidWidth.current) 
        });
      }
    })
  ).current;

  const bottomPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const newHeight = Math.max(
          MIN_CELLS * CELL_SIZE,
          Math.round((lastValidHeight.current * CELL_SIZE + gesture.dy) / CELL_SIZE) * CELL_SIZE
        );
        height.setValue(newHeight);
      },
      onPanResponderRelease: () => {
        const newTableHeight = Math.round(height._value / CELL_SIZE);
        onUpdate(table.id, { height: newTableHeight });
      }
    })
  ).current;

  const topPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const newHeight = Math.max(
          MIN_CELLS * CELL_SIZE,
          Math.round((lastValidHeight.current * CELL_SIZE - gesture.dy) / CELL_SIZE) * CELL_SIZE
        );
        const newYStart = (lastValidYStart.current - ((newHeight / CELL_SIZE) - lastValidHeight.current)) * CELL_SIZE;
        height.setValue(newHeight);
        yStart.setValue(newYStart);
      },
      onPanResponderRelease: () => {
        const newTableHeight = Math.round(height._value / CELL_SIZE);
        onUpdate(table.id, { 
          height: newTableHeight, 
          yStart: lastValidYStart.current - (newTableHeight - lastValidHeight.current) 
        });
      }
    })
  ).current;

  const getChairsForSide = (position: 'top' | 'right' | 'bottom' | 'left'): number => {
    if (!table.seats) return 0;

    const horizontalSpace = Math.floor(table.width * CELL_SIZE / (30 + 10));
    const verticalSpace = Math.floor(table.height * CELL_SIZE / (30 + 10));

    let totalChairs = table.seats;
    const distribution = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    };

    if (totalChairs > 0) { distribution.top = 1; totalChairs--; }
    if (totalChairs > 0) { distribution.bottom = 1; totalChairs--; }
    if (totalChairs > 0) { distribution.left = 1; totalChairs--; }
    if (totalChairs > 0) { distribution.right = 1; totalChairs--; }

    while (totalChairs > 0) {
      const topSpace = horizontalSpace - distribution.top;
      const bottomSpace = horizontalSpace - distribution.bottom;
      const leftSpace = verticalSpace - distribution.left;
      const rightSpace = verticalSpace - distribution.right;

      const availableSides = [
        { side: 'top', space: topSpace > 0 ? topSpace : 0 },
        { side: 'bottom', space: bottomSpace > 0 ? bottomSpace : 0 },
        { side: 'left', space: leftSpace > 0 ? leftSpace : 0 },
        { side: 'right', space: rightSpace > 0 ? rightSpace : 0 }
      ].filter(side => side.space > 0);

      if (availableSides.length === 0) break;

      availableSides.sort((a, b) => b.space - a.space);
      distribution[availableSides[0].side as keyof typeof distribution]++;
      totalChairs--;
    }

    return distribution[position];
  };

  const renderChairs = (position: 'top' | 'right' | 'bottom' | 'left') => {
    const chairCount = getChairsForSide(position);
    if (chairCount === 0) return null;

    const chairs = [];
    const GAP = 10;
    const isSide = position === 'left' || position === 'right';
    
    const baseContainerStyle: ViewStyle = {
      position: 'absolute',
      width: '100%',
      height: 28,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: -1,
    };

    const positionStyle: ViewStyle = position === 'top' ? {
      top: 0
    } : position === 'bottom' ? {
      bottom: 0
    } : position === 'left' ? {
      left: 0,
      width: 28,
      height: '100%'
    } : {
      right: 0,
      width: 28,
      height: '100%'
    };

    const containerStyle = {
      ...baseContainerStyle,
      ...positionStyle,
      flexDirection: isSide ? 'column' : 'row',
      justifyContent: 'center',
      alignItems: 'center',
    };

    for (let i = 0; i < chairCount; i++) {
      chairs.push(
        <View
          key={i}
          style={{
            width: isSide ? 20 : 30,
            height: isSide ? 30 : 20,
            backgroundColor: '#D9D9D9',
            borderRadius: 50,
            marginLeft: !isSide && i > 0 ? GAP : 0,
            marginTop: isSide && i > 0 ? GAP : 0,
          }}
        />
      );
    }

    return (
      <View style={containerStyle}>
        <View style={{
          flexDirection: isSide ? 'column' : 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {chairs}
        </View>
      </View>
    );
  };

  return (
    <Pressable
      onPress={() => onPress(table)}
      onLongPress={() => onLongPress(table)}
      delayLongPress={500}
      style={{ zIndex: isEditing ? 1000 : 1 }}
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
        {renderChairs('top')}
        {renderChairs('left')}
        
        <View style={styles.innerContainer}>
          <Animated.View
            style={[
              styles.table,
              {
                backgroundColor: status ? getStatusColor(status) : '#D9D9D9',
                opacity: 1,
                borderWidth: isEditing ? 3 : 2,
                borderColor: isEditing ? '#2A2E33' : '#AAAAAA',
              },
            ]}
          >
            <Text style={styles.tableText}>{table.name}</Text>
          </Animated.View>
        </View>

        {renderChairs('right')}
        {renderChairs('bottom')}

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