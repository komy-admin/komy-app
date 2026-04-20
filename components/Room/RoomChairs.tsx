import React, { useMemo } from "react";
import { View, ViewStyle } from "react-native";
import { Table } from "~/types/table.types";
import { colors } from '~/theme';

// --- Constantes partagées ---

const CHAIR_COLOR = colors.gray[300];
const GAP = 10;

// --- RoomChairs : distribution linéaire (tables carrées) ---

interface RoomChairsProps {
  position: 'top' | 'right' | 'bottom' | 'left';
  table: Table;
  CELL_SIZE: number;
}

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
              backgroundColor: CHAIR_COLOR,
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

// --- RoomChairsRounded : distribution sur capsule (tables rondes) ---
//
// borderRadius: 9999 sur un rectangle crée une CAPSULE (stadium) :
// - Table carrée → cercle
// - Table rectangulaire → 2 semicercles + 2 segments droits
//
// Les chaises (30x20) sont espacées uniformément le long du périmètre réel
// et orientées tangentiellement via un conteneur carré 30x30.

interface RoomChairsRoundedProps {
  table: Table;
  CELL_SIZE: number;
}

const RC_W = 30;        // Côté long (tangent au contour)
const RC_H = 20;        // Côté court (perpendiculaire)
const RC_BOX = 30;      // Conteneur carré pour rotation sans décalage
const TABLE_PADDING = 8; // Padding du innerContainer
const INSET = 6;        // Enfoncement des chaises vers l'intérieur

interface CapsulePoint { x: number; y: number; normal: number }

/** Calcule les positions des chaises sur le contour capsule de la table. */
function computeRoundedChairs(
  seats: number, containerW: number, containerH: number
): CapsulePoint[] {
  const cx = containerW / 2;
  const cy = containerH / 2;
  const tableW = containerW - TABLE_PADDING * 2;
  const tableH = containerH - TABLE_PADDING * 2;
  const r = Math.min(tableW, tableH) / 2 - INSET;
  const straight = Math.abs(tableW - tableH);
  const perimeter = 2 * Math.PI * r + 2 * straight;

  // Plafonner au nombre de chaises qui tiennent sur le périmètre (chaise 30px + gap 10px)
  const maxSeats = Math.floor(perimeter / (RC_W + GAP));
  seats = Math.min(seats, maxSeats);
  const isVertical = tableH >= tableW;

  // Pré-calcul des seuils de segments (évite de recalculer pour chaque chaise)
  const halfArc = Math.PI * r;
  const quarterArc = halfArc / 2;

  const getPoint = (t: number): CapsulePoint => {
    t = ((t % perimeter) + perimeter) % perimeter;

    if (straight === 0) {
      const a = -Math.PI / 2 + t / r;
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), normal: a };
    }

    if (isVertical) {
      const topCy = cy - straight / 2;
      const botCy = cy + straight / 2;

      if (t < quarterArc) {
        const a = -Math.PI / 2 + t / r;
        return { x: cx + r * Math.cos(a), y: topCy + r * Math.sin(a), normal: a };
      }
      t -= quarterArc;
      if (t < straight) {
        return { x: cx + r, y: topCy + t, normal: 0 };
      }
      t -= straight;
      if (t < halfArc) {
        const a = t / r;
        return { x: cx + r * Math.cos(a), y: botCy + r * Math.sin(a), normal: a };
      }
      t -= halfArc;
      if (t < straight) {
        return { x: cx - r, y: botCy - t, normal: Math.PI };
      }
      t -= straight;
      const a = Math.PI + t / r;
      return { x: cx + r * Math.cos(a), y: topCy + r * Math.sin(a), normal: a };
    }

    // Capsule horizontale
    const leftCx = cx - straight / 2;
    const rightCx = cx + straight / 2;
    const halfStraight = straight / 2;

    if (t < halfStraight) {
      return { x: cx + t, y: cy - r, normal: -Math.PI / 2 };
    }
    t -= halfStraight;
    if (t < halfArc) {
      const a = -Math.PI / 2 + t / r;
      return { x: rightCx + r * Math.cos(a), y: cy + r * Math.sin(a), normal: a };
    }
    t -= halfArc;
    if (t < straight) {
      return { x: rightCx - t, y: cy + r, normal: Math.PI / 2 };
    }
    t -= straight;
    if (t < halfArc) {
      const a = Math.PI / 2 + t / r;
      return { x: leftCx + r * Math.cos(a), y: cy + r * Math.sin(a), normal: a };
    }
    t -= halfArc;
    return { x: leftCx + t, y: cy - r, normal: -Math.PI / 2 };
  };

  const points: CapsulePoint[] = new Array(seats);
  for (let i = 0; i < seats; i++) {
    points[i] = getPoint((i / seats) * perimeter);
  }
  return points;
}

const RoomChairsRoundedComponent = ({ table, CELL_SIZE }: RoomChairsRoundedProps) => {
  const seats = table.seats || 0;

  const chairs = useMemo(() => {
    if (seats === 0) return null;

    const containerW = table.width * CELL_SIZE;
    const containerH = table.height * CELL_SIZE;
    const points = computeRoundedChairs(seats, containerW, containerH);

    return (
      <View style={{ position: 'absolute', width: containerW, height: containerH, zIndex: -1 }}>
        {points.map((pt, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: pt.x - RC_BOX / 2,
              top: pt.y - RC_BOX / 2,
              width: RC_BOX,
              height: RC_BOX,
              justifyContent: 'center',
              alignItems: 'center',
              transform: [{ rotate: `${pt.normal + Math.PI / 2}rad` }],
            }}
          >
            <View style={roundedChairStyle} />
          </View>
        ))}
      </View>
    );
  }, [seats, table.width, table.height, CELL_SIZE]);

  return chairs;
};

const roundedChairStyle: ViewStyle = {
  width: RC_W,
  height: RC_H,
  backgroundColor: CHAIR_COLOR,
  borderRadius: 50,
};

export const RoomChairsRounded = React.memo(RoomChairsRoundedComponent, (prev, next) => (
  prev.table.seats === next.table.seats &&
  prev.table.width === next.table.width &&
  prev.table.height === next.table.height &&
  prev.CELL_SIZE === next.CELL_SIZE
));

RoomChairsRounded.displayName = 'RoomChairsRounded';
