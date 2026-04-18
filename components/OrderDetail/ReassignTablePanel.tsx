import { memo, useState, useCallback, useMemo } from 'react';
import { View, Pressable, Text as RNText, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Text } from '~/components/ui';
import { AppHeader } from '~/components/ui/AppHeader';
import { TabBadgeItem } from '~/components/ui/TabBadgeItem';
import RoomComponent from '~/components/Room/Room';
import { Room } from '~/types/room.types';
import { Table } from '~/types/table.types';

const NOOP = () => {};

interface ReassignTablePanelProps {
  rooms: Room[];
  reassignRoomId: string | null;
  enrichedTables: Table[];
  reassignRoom: Room | null;
  reassignRoomTables: Table[];
  currentTableId?: string;
  isReassigning: boolean;
  onRoomChange: (room: Room) => void;
  onConfirm: (table: Table) => void;
  onBack: () => void;
}

export const ReassignTablePanel = memo<ReassignTablePanelProps>(({
  rooms,
  reassignRoomId,
  enrichedTables,
  reassignRoom,
  reassignRoomTables,
  currentTableId,
  isReassigning,
  onRoomChange,
  onConfirm,
  onBack,
}) => {
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const handleLayout = useCallback((e: any) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerDimensions({ width, height });
  }, []);

  const orderCountByRoom = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of enrichedTables) {
      if (t.orders && t.orders.length > 0) {
        map[t.roomId] = (map[t.roomId] || 0) + 1;
      }
    }
    return map;
  }, [enrichedTables]);

  // Tables occupées (avec commande) = disabled
  const disabledTableIds = useMemo(() => {
    const ids = new Set<string>();
    reassignRoomTables.forEach(table => {
      if (table.id === currentTableId || (table.orders && table.orders.length > 0)) {
        ids.add(table.id);
      }
    });
    return ids;
  }, [reassignRoomTables, currentTableId]);

  const handleTablePress = useCallback((table: Table | null) => {
    if (!table) return;
    if (disabledTableIds.has(table.id)) return;
    setSelectedTable(table);
  }, [disabledTableIds]);

  const handleConfirm = useCallback(() => {
    if (!selectedTable || isReassigning) return;
    onConfirm(selectedTable);
  }, [selectedTable, isReassigning, onConfirm]);

  const handleRoomChange = useCallback((room: Room) => {
    setSelectedTable(null);
    onRoomChange(room);
  }, [onRoomChange]);

  return (
    <View style={styles.container}>
      {/* Room tabs */}
      <AppHeader
        tabs={
          rooms.length === 0 ? (
            <Text style={styles.emptyText}>Aucune room disponible</Text>
          ) : (
            rooms.map((room) => {
              const count = orderCountByRoom[room.id] || 0;
              return (
                <Pressable key={room.id} onPress={() => handleRoomChange(room)}>
                  {({ pressed }) => (
                    <View style={pressed ? styles.pressed : undefined}>
                      <TabBadgeItem
                        name={room.name}
                        stats={`${count} commande${count !== 1 ? 's' : ''}`}
                        isActive={room.id === reassignRoomId}
                        activeColor={room.color || '#6366F1'}
                      />
                    </View>
                  )}
                </Pressable>
              );
            })
          )
        }
      />

      {/* Room canvas + footer overlay */}
      <View style={styles.roomContainer} onLayout={handleLayout}>
        <RoomComponent
          key={reassignRoom?.id || 'no-room'}
          tables={reassignRoomTables}
          editingTableId={selectedTable?.id || currentTableId}
          editionMode={false}
          isLoading={isReassigning}
          width={reassignRoom?.width}
          height={reassignRoom?.height}
          roomColor={reassignRoom?.color}
          containerDimensions={containerDimensions}
          fillContainer
          onTablePress={handleTablePress}
          onTableLongPress={handleTablePress}
          onTableUpdate={NOOP}
          selectedIcon="move"
          disabledTableIds={disabledTableIds}
        />
      </View>

      {/* Banner */}
      <View style={[styles.banner, reassignRoom?.color && { backgroundColor: reassignRoom.color }]}>
        <RNText style={styles.bannerText}>
          <RNText style={styles.bannerBold}>Changement de table</RNText>
          {' : Nouvelle assignation'}
        </RNText>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          onPress={onBack}
          style={[styles.actionButton, styles.cancelButton]}
        >
          <RNText style={styles.cancelText}>Annuler</RNText>
        </Pressable>

        <Pressable
          onPress={handleConfirm}
          disabled={!selectedTable || isReassigning}
          style={[
            styles.actionButton,
            styles.confirmButton,
            !selectedTable && { opacity: 0.5 },
          ]}
        >
          {isReassigning ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <RNText style={styles.confirmText}>
              {selectedTable
                ? `Déplacer vers ${selectedTable.name}`
                : 'Sélectionner une table'}
            </RNText>
          )}
        </Pressable>
      </View>
    </View>
  );
});

ReassignTablePanel.displayName = 'ReassignTablePanel';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
  },
  banner: {
    backgroundColor: '#3B82F6',
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  bannerBold: {
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  roomContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  confirmButton: {
    flex: 2,
    backgroundColor: '#2A2E33',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  pressed: {
    opacity: 0.6,
  },
  emptyText: {
    color: '#999',
  },
});
