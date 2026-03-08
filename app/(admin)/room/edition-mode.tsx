/**
 * Room Edition Mode - Édition des rooms et tables.
 *
 * Composants : RoomComponent (grille interactive), RoomFormContent (settings room),
 *              TableFormContent (édition table), DeleteConfirmationModal
 * Hooks : useRooms, useTables, useTableEditor, usePanelPortal
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform } from "react-native";
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import RoomComponent from '~/components/Room/Room';
import { RoomBadgeItem } from '~/components/Service/RoomBadgeItem';
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
import { LayoutPanelLeft, Trash2 } from 'lucide-react-native';

// Constantes
const SLIDE_PANEL_WIDTH = 450;

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
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la table';
      showToast(errorMessage, 'error');
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
    } catch (error: any) {
      setIsDeleteModalVisible(false);

      let errorMessage = 'Erreur lors de la suppression de la table';

      // Gestion spécifique des erreurs courantes
      if (error.response?.status === 409) {
        errorMessage = 'Impossible de supprimer : cette table a des commandes en cours';
      } else if (error.response?.status === 404) {
        errorMessage = 'Table introuvable (déjà supprimée ?)';
      } else if (error.response?.status === 403) {
        errorMessage = 'Vous n\'avez pas les permissions pour supprimer cette table';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = `Erreur : ${error.message}`;
      }

      showToast(errorMessage, 'error');
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
  }, [selectedTable?.id, updateTableFast, setSelectedTable]);

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
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la création de la table";
      showToast(errorMessage, 'error');
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
    try {
      const newRoom = await createRoom(roomData);
      setCurrentRoom(newRoom.id);
      setRoomPanelMode('closed');
      showToast('Salle créée avec succès', 'success');
    } catch (error: any) {
      let errorMessage = 'Erreur lors de la création';

      if (error.response?.status === 409) {
        errorMessage = error.response.data?.message || 'Une salle avec ce nom existe déjà';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      showToast(errorMessage, 'error');
    }
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
    } catch (error: any) {
      setIsRoomDeleteModalVisible(false);

      let errorMessage = 'Erreur lors de la suppression de la salle';

      if (error.response?.status === 409) {
        errorMessage = 'Impossible de supprimer : cette salle a des commandes en cours';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showToast(errorMessage, 'error');
    } finally {
      setIsRoomDeleting(false);
    }
  }, [roomToDelete?.id, deleteRoom, showToast]);

  const handleSaveRoomSettings = useCallback(async (roomData: Partial<Room>) => {
    if (!roomToEdit?.id) return;
    try {
      await updateRoom(roomToEdit.id, roomData);
      setRoomPanelMode('closed');
      setRoomToEdit(null);
      showToast('Salle mise à jour', 'success');
    } catch (error: any) {
      let errorMessage = 'Erreur lors de la mise à jour';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      showToast(errorMessage, 'error');
    }
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
      <View style={styles.editionBanner}>
        <Text style={styles.editionBannerText}>
          <Text style={styles.editionBannerBold}>Mode édition</Text> : Ajouter / Modifier vos salles et vos tables
        </Text>
      </View>
      <View style={styles.headerContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.badgeContainer}
          contentContainerStyle={styles.badgeContent}
        >
          {rooms.map((room) => (
            <RoomBadgeItem
              key={room.id}
              room={room}
              isActive={room.id === currentRoom?.id}
              orderCount={orderCountByRoom[room.id] || 0}
              onPress={handleChangeRoom}
              showInactiveIndicator
            />
          ))}
        </ScrollView>

        {/* Boutons d'action */}
        <View style={styles.actionButtonsContainer}>
          {currentRoom && (
            <Pressable
              onPress={handleAddTable}
              disabled={isCreatingTable || isCreateOperationInProgress()}
              style={styles.addButton}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
            >
              {({ pressed }) => (
                <View style={[
                  styles.addButtonInner,
                  pressed && Platform.OS === 'ios' && { opacity: 0.8 }
                ]}>
                  <Text style={styles.addButtonText}>
                    AJOUTER UNE TABLE
                  </Text>
                </View>
              )}
            </Pressable>
          )}
          <Pressable
            onPress={handleOpenRoomPanel}
            style={styles.settingsButton}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
          >
            {({ pressed }) => (
              <View style={[
                styles.settingsButtonInner,
                pressed && Platform.OS === 'ios' && { opacity: 0.8 }
              ]}>
                <LayoutPanelLeft size={20} color="#FBFBFB" />
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* État vide : aucune room */}
      {rooms.length === 0 && (
        <View style={styles.emptyContainer}>
          <LayoutPanelLeft size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Aucune salle configurée</Text>
          <Text style={styles.emptyDescription}>
            Créez votre première salle pour commencer à ajouter des tables.
          </Text>
          <Pressable onPress={() => setRoomPanelMode('create')} style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Créer une salle</Text>
          </Pressable>
        </View>
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
  headerContainer: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 10,
    elevation: 5,
    ...Platform.select({
      android: { shadowColor: 'transparent' },
    }),
  },
  badgeContainer: {
    flex: 1,
  },
  badgeContent: {
    alignItems: 'flex-end',
  },
  roomContainer: {
    flex: 1,
    position: 'relative',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexShrink: 0,
  },
  addButton: {
    backgroundColor: '#2A2E33',
    height: 60,
    width: 200,
    borderLeftWidth: 1,
    borderLeftColor: '#EFEFEF',
  },
  addButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    color: '#FBFBFB',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  settingsButton: {
    backgroundColor: '#475569',
    height: 60,
    width: 60,
    borderLeftWidth: 1,
    borderLeftColor: '#EFEFEF',
  },
  settingsButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonWrapper: {
    position: 'absolute',
    bottom: 30,
    right: 25,
    zIndex: 1000,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    backgroundColor: '#F4F5F7',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2E33',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 320,
  },
  emptyButton: {
    backgroundColor: '#2A2E33',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  deleteButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});