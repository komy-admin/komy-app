/**
 * 🏓 COMPOSANT ROOMTABLESERVICE (VERSION LÉGÈRE)
 *
 * Version optimisée pour le mode SERVICE uniquement.
 * Affiche les tables avec leurs statuts sans la complexité du drag & drop.
 *
 * 🚀 OPTIMISATIONS vs RoomTable complet :
 * - SharedValues : 0 au lieu de 17+
 * - Gesture handlers : 2 au lieu de 7
 * - Pas de drag, resize, ghost preview
 * - Pas de collision detection
 * - Pas de sync complexe backend→UI
 * - Pas d'animation au tap (performance maximale)
 *
 * 🎨 UI :
 * - Bordure noire (#2A2E33) quand la table est sélectionnée
 *
 * 📊 GAIN DE PERFORMANCE :
 * Pour 15 tables : ~255 SharedValues + 75 gestures économisés
 * Réduction de ~94% de la charge en mode service
 */
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
import { Plus, Play } from 'lucide-react-native';

interface RoomTableServiceProps {
  table: Table;
  status?: Status;
  CELL_SIZE: number;
  isSelected: boolean;
  editionMode?: boolean;
  onPress: (table: Table) => void;
  onLongPress: (table: Table) => void;
}

const RoomTableService: React.FC<RoomTableServiceProps> = ({
  table,
  status,
  CELL_SIZE,
  isSelected,
  editionMode,
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

  // 🖐️ GESTES SIMPLES (2 au lieu de 7)
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

  // Style de la table basé sur le statut + bordure de sélection
  const tableStyle = useMemo(() => {
    // Bordure noire si sélectionnée
    if (isSelected) {
      return {
        backgroundColor: status ? getStatusColor(status) : '#FAFAFA',
        borderWidth: 3,
        borderColor: '#2A2E33',
        borderStyle: 'solid' as const,
      };
    }
    // Style normal basé sur le statut
    return {
      backgroundColor: status ? getStatusColor(status) : '#FAFAFA',
      ...(status
        ? getStatusBorderStyle(status, table)
        : { borderWidth: 1.5, borderColor: '#E5E7EB', borderStyle: 'solid' as const }
      ),
    };
  }, [status, table, isSelected, editionMode]);

  // Style du conteneur avec curseur pointer (web)
  const containerStyle = useMemo(() => ({
    position: 'absolute' as const,
    left: table.xStart * CELL_SIZE,
    top: table.yStart * CELL_SIZE,
    width: table.width * CELL_SIZE,
    height: table.height * CELL_SIZE,
    zIndex: isSelected ? 10000 : 1000,
    ...(Platform.OS === 'web' && {
      userSelect: 'none' as any,
      WebkitUserSelect: 'none' as any,
      cursor: 'pointer' as any,
    }),
  }), [table.xStart, table.yStart, table.width, table.height, CELL_SIZE, isSelected]);

  return (
    <View style={containerStyle}>
      <GestureDetector gesture={composedGesture}>
        <View style={{ width: '100%', height: '100%' }}>
          <RoomChairs position="top" table={table} CELL_SIZE={CELL_SIZE} />
          <RoomChairs position="left" table={table} CELL_SIZE={CELL_SIZE} />

          <View style={styles.innerContainer}>
            <View style={[styles.table, tableStyle]}>
              {hasOrder || editionMode ? (
                <Text style={styles.tableText}>{table.name}</Text>
              ) : (
                <View style={styles.emptyTableContent}>
                  <View style={[styles.emptyTableIcon, !isSelected && styles.emptyTableIconUnselected]}>
                    {isSelected ? (
                      <Play size={14} color="white" fill="white" />
                    ) : (
                      <Plus size={14} color="#9CA3AF" />
                    )}
                  </View>
                  <Text style={styles.emptyTableText} numberOfLines={1}>{table.name}</Text>
                </View>
              )}
            </View>
          </View>

          <RoomChairs position="right" table={table} CELL_SIZE={CELL_SIZE} />
          <RoomChairs position="bottom" table={table} CELL_SIZE={CELL_SIZE} />
        </View>
      </GestureDetector>
    </View>
  );
};

// 🚀 OPTIMISATION: React.memo avec comparaison granulaire
const RoomTableServiceMemoized = React.memo(RoomTableService, (prevProps, nextProps) => {
  return (
    prevProps.table.id === nextProps.table.id &&
    prevProps.table.xStart === nextProps.table.xStart &&
    prevProps.table.yStart === nextProps.table.yStart &&
    prevProps.table.width === nextProps.table.width &&
    prevProps.table.height === nextProps.table.height &&
    prevProps.table.name === nextProps.table.name &&
    prevProps.table.seats === nextProps.table.seats &&
    prevProps.status === nextProps.status &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.editionMode === nextProps.editionMode &&
    prevProps.CELL_SIZE === nextProps.CELL_SIZE
  );
});

RoomTableServiceMemoized.displayName = 'RoomTableService';

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
  emptyTableContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  emptyTableIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2A2E33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTableIconUnselected: {
    backgroundColor: '#FFFFFF',
  },
  emptyTableText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
});

export { RoomTableServiceMemoized as RoomTableService };
