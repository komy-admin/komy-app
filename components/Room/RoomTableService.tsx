/**
 * RoomTableService - Version légère de RoomTable pour le mode service et les tables non-sélectionnées.
 *
 * Pas de drag, resize, ghost preview ni collision detection.
 * 0 SharedValues (vs 17+ pour RoomTable), 2 gestures (tap + longPress).
 */
import React, { useMemo, useCallback } from "react";
import { Platform, StyleSheet, View, Text as RNText } from "react-native";
import { getStatusColor, getPriorityItemTypeDetailsForStatus } from "~/lib/utils";
import { Table } from "~/types/table.types";
import { Status } from "~/types/status.enum";
import { RoomChairs, RoomChairsRounded } from "./RoomChairs";
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import { Plus, Play } from 'lucide-react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAppSelector } from "~/store/hooks";
import { selectItemTypesRecord } from "~/store/selectors";

const ICON_SIZE = 16;

interface RoomTableServiceProps {
  table: Table;
  status?: Status;
  CELL_SIZE: number;
  isSelected: boolean;
  editionMode?: boolean;
  outOfBounds?: boolean;
  roomColor?: string | null;
  tableBg?: string;
  onPress: (table: Table) => void;
  onLongPress: (table: Table) => void;
}

const RoomTableService: React.FC<RoomTableServiceProps> = ({
  table,
  status,
  CELL_SIZE,
  isSelected,
  editionMode,
  outOfBounds = false,
  roomColor,
  tableBg = '#F5F4FA',
  onPress,
  onLongPress,
}) => {
  // Callbacks mémoïsés
  const handlePress = useCallback(() => {
    onPress(table);
  }, [onPress, table]);

  const handleLongPress = useCallback(() => {
    // Feedback haptique géré ailleurs, juste le callback
    onLongPress(table);
  }, [onLongPress, table]);

  // Gestes simples : tap + longPress
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

  // Geste composé : longPress prioritaire sur tap
  const composedGesture = useMemo(() =>
    Gesture.Exclusive(longPressGesture, tapGesture),
    [longPressGesture, tapGesture]);

  const hasOrder = !!status;

  const orderTimeStr = useMemo(() => {
    const order = table.orders?.[0];
    if (!order?.createdAt) return '';
    const d = new Date(order.createdAt);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }, [table.orders?.[0]?.createdAt]);

  // Icône de l'itemType prioritaire (résolu via Redux store)
  const itemTypesRecord = useAppSelector(selectItemTypesRecord);
  const priorityIcon = useMemo(() => {
    const lines = table.orders?.[0]?.lines;
    if (!lines || !status) return '';
    const details = getPriorityItemTypeDetailsForStatus(lines, status);
    // L'icône du snapshot est souvent vide, on résout via le store
    if (details.icon) return details.icon;
    if (details.id && itemTypesRecord[details.id]) return itemTypesRecord[details.id].icon || '';
    return '';
  }, [table.orders?.[0]?.id, table.orders?.[0]?.updatedAt, status, itemTypesRecord]);

  const tableBorderRadius = table.shape === 'rounded' ? 9999 : 8;

  // Style pour tables sans commande ou en mode édition
  const tableStyle = useMemo(() => {
    if (outOfBounds) {
      return {
        backgroundColor: '#FEE2E2',
        borderWidth: 2,
        borderColor: '#EF4444',
        borderStyle: 'dashed' as const,
        borderRadius: tableBorderRadius,
      };
    }
    if (isSelected) {
      return {
        backgroundColor: status ? getStatusColor(status) : tableBg,
        borderWidth: 3,
        borderColor: '#2A2E33',
        borderStyle: 'solid' as const,
        borderRadius: tableBorderRadius,
      };
    }
    return {
      backgroundColor: status ? getStatusColor(status) : tableBg,
      borderWidth: status ? 2 : 0,
      borderColor: '#2A2E33',
      borderStyle: 'solid' as const,
      borderRadius: tableBorderRadius,
    };
  }, [status, isSelected, outOfBounds, tableBg, tableBorderRadius]);

  // Style du conteneur avec curseur pointer (web)
  const containerStyle = useMemo(() => ({
    position: 'absolute' as const,
    left: table.xStart * CELL_SIZE,
    top: table.yStart * CELL_SIZE,
    width: table.width * CELL_SIZE,
    height: table.height * CELL_SIZE,
    zIndex: isSelected ? 10000 : 1000,
    opacity: outOfBounds ? 0.6 : 1,
    ...(Platform.OS === 'web' && {
      userSelect: 'none' as any,
      WebkitUserSelect: 'none' as any,
      cursor: 'pointer' as any,
    }),
  }), [table.xStart, table.yStart, table.width, table.height, CELL_SIZE, isSelected, outOfBounds]);

  return (
    <View style={containerStyle}>
      <GestureDetector gesture={composedGesture}>
        <View style={styles.fullSize}>
          {table.shape === 'rounded' ? (
            <RoomChairsRounded table={table} CELL_SIZE={CELL_SIZE} />
          ) : (
            <>
              <RoomChairs position="top" table={table} CELL_SIZE={CELL_SIZE} />
              <RoomChairs position="left" table={table} CELL_SIZE={CELL_SIZE} />
            </>
          )}

          <View style={styles.innerContainer}>
            {editionMode ? (
              <View style={[styles.table, tableStyle]}>
                <View style={styles.emptyTableContent}>
                  <View style={[styles.emptyTableIcon]}>
                    <MaterialCommunityIcons name="square-edit-outline" size={18} color={roomColor || '#6366F1'} />
                  </View>
                  <RNText style={styles.emptyTableText} numberOfLines={1}>{table.name}</RNText>
                </View>
              </View>
            ) : (
              <View style={[styles.table, tableStyle]}>
                <View style={styles.emptyTableContent}>
                  <View style={[styles.emptyTableIcon, hasOrder && { backgroundColor: roomColor || '#6366F1' }, isSelected && !hasOrder && styles.emptyTableIconSelected]}>
                    {hasOrder && priorityIcon ? (
                      <MaterialCommunityIcons name={priorityIcon as any} size={ICON_SIZE} color="#FFFFFF" />
                    ) : isSelected ? (
                      <Play size={ICON_SIZE - 2} color="#FFFFFF" fill="#FFFFFF" />
                    ) : (
                      <Plus size={ICON_SIZE} color={roomColor || '#6366F1'} />
                    )}
                  </View>
                  <RNText style={styles.emptyTableText} numberOfLines={1}>
                    {table.name}
                    {orderTimeStr ? <RNText style={styles.timeText}> - {orderTimeStr}</RNText> : null}
                  </RNText>
                </View>
              </View>
            )}
          </View>

          {table.shape !== 'rounded' && (
            <>
              <RoomChairs position="right" table={table} CELL_SIZE={CELL_SIZE} />
              <RoomChairs position="bottom" table={table} CELL_SIZE={CELL_SIZE} />
            </>
          )}
        </View>
      </GestureDetector>
    </View>
  );
};

// React.memo avec comparaison granulaire
const RoomTableServiceMemoized = React.memo(RoomTableService, (prevProps, nextProps) => {
  return (
    prevProps.table.id === nextProps.table.id &&
    prevProps.table.xStart === nextProps.table.xStart &&
    prevProps.table.yStart === nextProps.table.yStart &&
    prevProps.table.width === nextProps.table.width &&
    prevProps.table.height === nextProps.table.height &&
    prevProps.table.name === nextProps.table.name &&
    prevProps.table.seats === nextProps.table.seats &&
    prevProps.table.shape === nextProps.table.shape &&
    prevProps.table.orders?.[0]?.id === nextProps.table.orders?.[0]?.id &&
    prevProps.table.orders?.[0]?.updatedAt === nextProps.table.orders?.[0]?.updatedAt &&
    prevProps.status === nextProps.status &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.editionMode === nextProps.editionMode &&
    prevProps.outOfBounds === nextProps.outOfBounds &&
    prevProps.roomColor === nextProps.roomColor &&
    prevProps.tableBg === nextProps.tableBg &&
    prevProps.CELL_SIZE === nextProps.CELL_SIZE
  );
});

RoomTableServiceMemoized.displayName = 'RoomTableService';

const styles = StyleSheet.create({
  fullSize: {
    width: '100%',
    height: '100%',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
  },
  // --- Contenu des tables ---
  emptyTableContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyTableIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTableIconSelected: {
    backgroundColor: '#2A2E33',
  },
  emptyTableText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2A2E33',
  },
  timeText: {
    fontWeight: '400',
    color: '#2A2E33',
  },
});

export { RoomTableServiceMemoized as RoomTableService };
