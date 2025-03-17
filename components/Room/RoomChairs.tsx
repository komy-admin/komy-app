import { View, ViewStyle } from "react-native";
import { Table } from "~/types/table.types";

interface RoomChairsProps {
  position: 'top' | 'right' | 'bottom' | 'left';
  table: Table;
  CELL_SIZE: number;
}

export const RoomChairs = ({ position, table, CELL_SIZE }: RoomChairsProps) => {

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