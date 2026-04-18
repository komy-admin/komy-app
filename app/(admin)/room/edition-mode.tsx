/**
 * Room Edition Mode - Édition des rooms et tables.
 *
 * Composants : RoomComponent (grille interactive), RoomFormContent (settings room),
 *              TableFormContent (édition table), DeleteConfirmationModal
 * Hooks : useRooms, useTables, useTableEditor, usePanelPortal
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable } from "react-native";
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import RoomComponent from '~/components/Room/Room';
import { AppHeader } from '~/components/ui/AppHeader';
import { TabBadgeItem } from '~/components/ui/TabBadgeItem';
import { Room } from '~/types/room.types';
import { Table } from "~/types/table.types";
import { TableFormContent } from '~/components/admin/TableForm/TableFormContent';
import { SlidePanel } from '~/components/ui/SlidePanel';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';
import { useToast } from '~/components/ToastProvider';
import { useRooms, useTables } from '~/hooks/useRestaurant';
import { useTableEditor } from '~/hooks/useTableEditor';
import { usePanelPortal } from '~/hooks/usePanelPortal';
import { generateTableName, findAvailablePosition } from '~/lib/room-utils';
import { useContainerLayout } from '~/hooks/room/useContainerLayout';
import { RoomFormContent, RoomModeSelection } from '~/components/admin/RoomForm';
import { Trash2 } from 'lucide-react-native';
import { EmptyRoomsState } from '~/components/Service/EmptyRoomsState';
import { HeaderActionButton } from '~/components/ui/HeaderActionButton';
import { showApiError } from '~/lib/apiErrorHandler';

// Constantes
const SLIDE_PANEL_WIDTH = 430;

export default function RoomEditionMode() {
  const { openCreate } = useLocalSearchParams<{ openCreate?: string }>();
  const { showToast } = useToast();

  // Utilisation des hooks Redux
  const { rooms, currentRoom, setCurrentRoom, updateRoom, createRoom, deleteRoom } = useRooms();
  const { currentRoomTables, enrichedTables, selectedTable, setSelectedTable } = useTables();

  const orderCountByRoom = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of enrichedTables) {
      if (t.orders && t.orders.length > 0) {
        map[t.roomId] = (map[t.roomId] || 0) + 1;
      }
    }
    return map;
  }, [enrichedTables]);

  // Hook spécialisé pour l'édition haute performance
  const { createTableFast, updateTableFast, deleteTableFast, isCreateOperationInProgress } = useTableEditor();

  // Panel portal pour le formulaire d'édition
  const { renderPanel, clearPanel } = usePanelPortal();

  // Mesure du conteneur de la room pour le zoom auto-fill
  const { dimensions: roomContainerDimensions, onLayout: handleRoomContainerLayout } = useContainerLayout();

  // Variables d'état local pour l'UI
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isEditPanelVisible, setIsEditPanelVisible] = useState(false);
  const [roomPanelMode, setRoomPanelMode] = useState<'closed' | 'selection' | 'create' | 'edit'>('closed');
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);
  const [isRoomDeleteModalVisible, setIsRoomDeleteModalVisible] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [isRoomDeleting, setIsRoomDeleting] = useState(false);

  // Définir la première room comme currentRoom si aucune n'est sélectionnée
  useEffect(() => {
    if (!currentRoom && rooms.length > 0) {
      setCurrentRoom(rooms[0].id);
    }
  }, [currentRoom, rooms, setCurrentRoom]);

  // Ouvrir le panel de création si demandé via paramètre URL
  useEffect(() => {
    if (openCreate === '1') {
      setRoomPanelMode('create');
    }
  }, [openCreate]);

  // Désélectionner la table lors de la navigation
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Cleanup : désélectionner lors du blur (navigation sortante)
        setSelectedTable(null);
      };
    }, [setSelectedTable])
  );

  const handleTableUpdate = useCallback(async (id: string, updates: Partial<Table>) => {
    try {
      await updateTableFast(id, updates);
    } catch (error) {
      showApiError(error, showToast, 'Erreur lors de la mise à jour de la table');
    }
  }, [updateTableFast, showToast]);

  const handleTablePress = useCallback((table: Table | null) => {
    if (selectedTable?.id === table?.id) {
      return;
    }
    setSelectedTable(table?.id || null);
  }, [selectedTable?.id, setSelectedTable]);

  const handleDeleteTable = useCallback(() => {
    setIsDeleteModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsDeleteModalVisible(false);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedTable?.id) return;

    try {
      await deleteTableFast(selectedTable.id);
      setSelectedTable(null);
      setIsEditPanelVisible(false);
      setIsDeleteModalVisible(false);
      showToast('Table supprimée avec succès', 'success');
    } catch (error) {
      setIsDeleteModalVisible(false);
      showApiError(error, showToast, 'Erreur lors de la suppression de la table');
    }
  }, [selectedTable?.id, deleteTableFast, setSelectedTable, showToast]);

  const handleEditTap = useCallback((_table: Table) => {
    setIsEditPanelVisible(true);
  }, []);

  const handleCloseEditPanel = useCallback(() => {
    setIsEditPanelVisible(false);
  }, []);

  const handleSaveTable = useCallback(async (updates: Partial<Table>) => {
    if (!selectedTable?.id) return;

    await updateTableFast(selectedTable.id, updates);
    setIsEditPanelVisible(false);
    setSelectedTable(null);
    showToast('Table modifiée avec succès', 'success');
  }, [selectedTable?.id, updateTableFast, setSelectedTable, showToast]);

  const handleAddTable = useCallback(async () => {
    if (!currentRoom?.id || isCreatingTable || isCreateOperationInProgress()) return;

    setIsCreatingTable(true);

    try {
      const position = findAvailablePosition(currentRoom, currentRoomTables, 2);
      if (!position) {
        showToast("Pas d'espace disponible pour une nouvelle table", 'error');
        return;
      }

      const tableToCreate = {
        name: generateTableName(currentRoom.name, currentRoomTables),
        xStart: position.x,
        yStart: position.y,
        width: 2,
        height: 2,
        roomId: currentRoom.id,
        seats: 4
      };

      // Utiliser le hook dédié pour la création haute performance
      const newTable = await createTableFast(tableToCreate);

      // Sélectionner directement la nouvelle table (transition fluide du sidebar)
      setSelectedTable(newTable.id);
      showToast('Table créée avec succès', 'success');

    } catch (error) {
      showApiError(error, showToast, 'Erreur lors de la création de la table');
    } finally {
      setIsCreatingTable(false);
    }
  }, [currentRoom, currentRoomTables, isCreatingTable, isCreateOperationInProgress, createTableFast, showToast, setSelectedTable]);

  const handleChangeRoom = useCallback((room: Room) => {
    if (!room.id) return;
    setCurrentRoom(room.id);
    setSelectedTable(null);
  }, [setCurrentRoom, setSelectedTable]);

  const handleOpenRoomPanel = useCallback(() => {
    setRoomPanelMode(rooms.length === 0 ? 'create' : 'selection');
  }, [rooms.length]);

  const handleCloseRoomPanel = useCallback(() => {
    setRoomPanelMode('closed');
    setRoomToEdit(null);
  }, []);

  const handleBackToSelection = useCallback(() => {
    setRoomPanelMode('selection');
    setRoomToEdit(null);
  }, []);

  const handleSelectCreateRoom = useCallback(() => {
    setRoomPanelMode('create');
  }, []);

  const handleSelectEditRoom = useCallback((room: Room) => {
    setRoomToEdit(room);
    setRoomPanelMode('edit');
  }, []);

  const handleSaveNewRoom = useCallback(async (roomData: Partial<Room>) => {
    const newRoom = await createRoom(roomData);
    setCurrentRoom(newRoom.id);
    setRoomPanelMode('closed');
    showToast('Salle créée avec succès', 'success');
  }, [createRoom, setCurrentRoom, showToast]);

  const handleDeleteRoom = useCallback((room: Room) => {
    setRoomToDelete(room);
    setRoomPanelMode('closed');
    setIsRoomDeleteModalVisible(true);
  }, []);

  const handleCloseRoomDeleteModal = useCallback(() => {
    setIsRoomDeleteModalVisible(false);
    setRoomToDelete(null);
  }, []);

  const handleConfirmDeleteRoom = useCallback(async () => {
    if (!roomToDelete?.id) return;

    setIsRoomDeleting(true);
    try {
      await deleteRoom(roomToDelete.id);
      showToast('Salle supprimée avec succès', 'success');
      setIsRoomDeleteModalVisible(false);
      setRoomToDelete(null);
    } catch (error) {
      setIsRoomDeleteModalVisible(false);

      showApiError(error, showToast, 'Erreur lors de la suppression de la salle');
    } finally {
      setIsRoomDeleting(false);
    }
  }, [roomToDelete?.id, deleteRoom, showToast]);

  const handleSaveRoomSettings = useCallback(async (roomData: Partial<Room>) => {
    if (!roomToEdit?.id) return;
    await updateRoom(roomToEdit.id, roomData);
    setRoomPanelMode('closed');
    setRoomToEdit(null);
    showToast('Salle mise à jour', 'success');
  }, [roomToEdit?.id, updateRoom, showToast]);

  // Sync selection panel (dépend de rooms)
  useEffect(() => {
    if (roomPanelMode !== 'selection') return;
    renderPanel(
      <SlidePanel visible={true} onClose={handleCloseRoomPanel} width={SLIDE_PANEL_WIDTH}>
        <RoomModeSelection
          rooms={rooms}
          onSelectCreate={handleSelectCreateRoom}
          onSelectEdit={handleSelectEditRoom}
          onDelete={handleDeleteRoom}
          onCancel={handleCloseRoomPanel}
        />
      </SlidePanel>
    );
  }, [roomPanelMode, rooms, renderPanel, handleCloseRoomPanel, handleSelectCreateRoom, handleSelectEditRoom, handleDeleteRoom]);

  // Sync other panel modes (ne dépend pas de rooms)
  useEffect(() => {
    if (roomPanelMode === 'selection') return;
    if (roomPanelMode === 'create') {
      renderPanel(
        <SlidePanel visible={true} onClose={handleCloseRoomPanel} width={SLIDE_PANEL_WIDTH}>
          <RoomFormContent
            room={null}
            onSave={handleSaveNewRoom}
            onCancel={handleCloseRoomPanel}
            onBack={handleBackToSelection}
          />
        </SlidePanel>
      );
    } else if (roomPanelMode === 'edit' && roomToEdit) {
      renderPanel(
        <SlidePanel visible={true} onClose={handleCloseRoomPanel} width={SLIDE_PANEL_WIDTH}>
          <RoomFormContent
            room={roomToEdit}
            onSave={handleSaveRoomSettings}
            onCancel={handleCloseRoomPanel}
            onBack={handleBackToSelection}
          />
        </SlidePanel>
      );
    } else if (isEditPanelVisible && selectedTable) {
      renderPanel(
        <SlidePanel visible={true} onClose={handleCloseEditPanel} width={SLIDE_PANEL_WIDTH}>
          <TableFormContent
            table={selectedTable}
            onSave={handleSaveTable}
            onCancel={handleCloseEditPanel}
          />
        </SlidePanel>
      );
    } else {
      clearPanel();
    }
  }, [roomPanelMode, roomToEdit, isEditPanelVisible, selectedTable, renderPanel, clearPanel, handleCloseRoomPanel, handleBackToSelection, handleSaveNewRoom, handleSaveRoomSettings, handleCloseEditPanel, handleSaveTable]);

  return (
    <View style={styles.container}>
      <AppHeader
        rightSlot={
          <View style={styles.actionButtonsContainer}>
            {currentRoom && (
              <HeaderActionButton
                label="AJOUTER TABLE"
                onPress={handleAddTable}
                disabled={isCreatingTable || isCreateOperationInProgress()}
                variant="light"
              />
            )}
            <HeaderActionButton
              label="GÉRER SALLES"
              onPress={handleOpenRoomPanel}
            />
          </View>
        }
        tabs={rooms.map((room) => {
          const count = orderCountByRoom[room.id] || 0;
          const isInactive = !room.isActive;
          return (
            <Pressable key={room.id} onPress={() => handleChangeRoom(room)}>
              {({ pressed }) => (
                <View style={pressed ? styles.pressed : undefined}>
                  <TabBadgeItem
                    name={room.name}
                    stats={`${count} commande${count !== 1 ? 's' : ''}`}
                    isActive={room.id === currentRoom?.id}
                    activeColor={room.color || '#6366F1'}
                    isInactive={isInactive}
                  />
                </View>
              )}
            </Pressable>
          );
        })}
      />
      {/* État vide : aucune room */}
      {rooms.length === 0 && (
        <EmptyRoomsState
          onCreateFirstRoom={() => setRoomPanelMode('create')}
          description="Créez votre première salle pour commencer à ajouter des tables."
        />
      )}

      {/* Zone de la grille avec RoomComponent */}
      {currentRoom && (
        <View style={styles.roomContainer} onLayout={handleRoomContainerLayout}>
          <RoomComponent
            key={currentRoom.id}
            tables={currentRoomTables}
            editingTableId={selectedTable?.id}
            editionMode={true}
            width={currentRoom.width}
            height={currentRoom.height}
            roomColor={currentRoom.color}
            isLoading={false}
            containerDimensions={roomContainerDimensions}
            fillContainer
            onTablePress={handleTablePress}
            onTableLongPress={handleTablePress}
            onTableUpdate={handleTableUpdate}
            onTableEditTap={handleEditTap}
          />

          {/* Bouton delete flottant quand une table est sélectionnée */}
          {selectedTable && !isEditPanelVisible && (
            <Pressable
              onPress={handleDeleteTable}
              style={styles.deleteButtonWrapper}
              accessibilityLabel="Supprimer la table"
              accessibilityRole="button"
            >
              <View style={styles.deleteButton}>
                <Trash2 size={24} color="#FFFFFF" strokeWidth={2} />
              </View>
            </Pressable>
          )}
        </View>
      )}
      <View style={[styles.editionBanner, currentRoom?.color && { backgroundColor: currentRoom.color }]}>
        <Text style={styles.editionBannerText}>
          <Text style={styles.editionBannerBold}>Mode édition</Text> : Ajouter / Modifier vos salles et vos tables
        </Text>
      </View>

      <DeleteConfirmationModal
        isVisible={isDeleteModalVisible}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        entityName={`"${selectedTable?.name}"`}
        entityType="la table"
      />

      <DeleteConfirmationModal
        isVisible={isRoomDeleteModalVisible}
        onClose={handleCloseRoomDeleteModal}
        onConfirm={handleConfirmDeleteRoom}
        entityName={`"${roomToDelete?.name}"`}
        entityType="la salle"
        isLoading={isRoomDeleting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  pressed: {
    opacity: 0.6,
  },
  editionBanner: {
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editionBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  editionBannerBold: {
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  roomContainer: {
    flex: 1,
    position: 'relative',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexShrink: 0,
  },
  deleteButtonWrapper: {
    position: 'absolute',
    bottom: 30,
    right: 25,
    zIndex: 1000,
  },
  deleteButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
});