import React, { useMemo } from "react";
import { View, ViewStyle } from "react-native";
import { Table } from "~/types/table.types";

interface RoomChairsProps {
  position: 'top' | 'right' | 'bottom' | 'left';
  table: Table;
  CELL_SIZE: number;
}

const GAP = 10;

const RoomChairsComponent = ({ position, table, CELL_SIZE }: RoomChairsProps) => {
  const isSide = position === 'left' || position === 'right';

  const chairCount = useMemo(() => {
    if (!table.seats) return 0;

    const horizontalSpace = Math.floor(table.width * CELL_SIZE / (30 + GAP));
    const verticalSpace = Math.floor(table.height * CELL_SIZE / (30 + GAP));

    let totalChairs = table.seats;
    const distribution = { top: 0, bottom: 0, left: 0, right: 0 };

    if (totalChairs > 0) { distribution.top = 1; totalChairs--; }
    if (totalChairs > 0) { distribution.bottom = 1; totalChairs--; }
    if (totalChairs > 0) { distribution.left = 1; totalChairs--; }
    if (totalChairs > 0) { distribution.right = 1; totalChairs--; }

    while (totalChairs > 0) {
      const availableSides = [
        { side: 'top' as const, space: horizontalSpace - distribution.top },
        { side: 'bottom' as const, space: horizontalSpace - distribution.bottom },
        { side: 'left' as const, space: verticalSpace - distribution.left },
        { side: 'right' as const, space: verticalSpace - distribution.right },
      ].filter(s => s.space > 0);

      if (availableSides.length === 0) break;
      availableSides.sort((a, b) => b.space - a.space);
      distribution[availableSides[0].side]++;
      totalChairs--;
    }

    return distribution[position];
  }, [table.seats, table.width, table.height, CELL_SIZE, position]);

  if (chairCount === 0) return null;

  const containerStyle: ViewStyle = {
    position: 'absolute',
    zIndex: -1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: isSide ? 'column' : 'row',
    ...(isSide
      ? { [position]: 0, width: 28, height: '100%' }
      : { [position]: 0, width: '100%', height: 28 }
    ),
  };

  return (
    <View style={containerStyle}>
      <View style={{ flexDirection: isSide ? 'column' : 'row', justifyContent: 'center', alignItems: 'center' }}>
        {Array.from({ length: chairCount }, (_, i) => (
          <View
            key={`${position}-${i}`}
            style={{
              width: isSide ? 20 : 30,
              height: isSide ? 30 : 20,
              backgroundColor: '#D9D9D9',
              borderRadius: 50,
              marginLeft: !isSide && i > 0 ? GAP : 0,
              marginTop: isSide && i > 0 ? GAP : 0,
            }}
          />
        ))}
      </View>
    </View>
  );
};

export const RoomChairs = React.memo(RoomChairsComponent, (prev, next) => (
  prev.position === next.position &&
  prev.table.seats === next.table.seats &&
  prev.table.width === next.table.width &&
  prev.table.height === next.table.height &&
  prev.CELL_SIZE === next.CELL_SIZE
));

RoomChairs.displayName = 'RoomChairs';
