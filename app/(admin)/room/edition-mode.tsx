/**
 * 🏗️ ROOM EDITION MODE - Point d'entrée principal pour l'édition des rooms
 *
 * ARCHITECTURE:
 * ├── RoomComponent (~/components/Room/Room.tsx)
 * │   └── Composant principal de visualisation et interaction avec la grille
 * │       ├── useRoomDimensions → Calcul dimensions et zoom optimal
 * │       ├── useRoomZoom → Gestion pan, pinch, wheel zoom
 * │       └── useRoomValidation → Validation O(1) positions et collisions
 * │
 * ├── RoomTable (~/components/Room/RoomTable.tsx)
 * │   └── Table individuelle draggable/resizable avec React.memo (95%+ re-renders évités)
 * │
 * ├── TableEditorSidebar (~/components/Room/TableEditorSidebar.tsx)
 * │   └── Sidebar responsive (25% width) pour éditer nom/couverts d'une table
 * │
 * ├── RoomCard (~/components/Room/RoomCard.tsx)
 * │   └── Card flottante affichant infos room + bouton "Ajouter table"
 * │
 * └── DeleteConfirmationModal (~/components/ui/DeleteConfirmationModal.tsx)
 *     └── Modale de confirmation avant suppression table
 *
 * HOOKS REDUX:
 * ├── useRooms() → Gestion state rooms (currentRoom, setCurrentRoom, loading)
 * ├── useTables() → Gestion state tables filtrées par room (currentRoomTables, selectedTable)
 * └── useTableEditor() → CRUD optimisé (createTableFast, updateTableFast, deleteTableFast)
 *
 * UTILS:
 * ├── generateTableName() → Génère nom auto "Table 1", "Table 2"...
 * └── findAvailablePosition() → Trouve espace libre dans grille pour nouvelle table
 *
 * FLUX DRAG & DROP:
 * User drag table → RoomTable.onUpdate() → handleTableUpdate()
 * → useTableEditor.updateTableFast() → PATCH /api/table/:id → Redux update
 * → WebSocket broadcast → Re-render optimisé (React.memo)
 */

import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform } from "react-native";
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import RoomComponent from '~/components/Room/Room';
import { Badge } from "~/components/ui";
import { Room } from '~/types/room.types';
import { Table } from "~/types/table.types";
import { TableQuickActions } from '~/components/Room/TableQuickActions';
import { TableFormContent } from '~/components/admin/TableForm/TableFormContent';
import { SlidePanel } from '~/components/ui/SlidePanel';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';
import { useToast } from '~/components/ToastProvider';
import { useRooms, useTables } from '~/hooks/useRestaurant';
import { useTableEditor } from '~/hooks/useTableEditor';
import { usePanelPortal } from '~/hooks/usePanelPortal';
import { generateTableName, findAvailablePosition } from '~/lib/room-utils';
import { useContainerLayout } from '~/hooks/room/useContainerLayout';
import { ArrowLeftToLine } from 'lucide-react-native';

// Constantes
const SLIDE_PANEL_WIDTH = 400;

export default function RoomEditionMode() {
  const router = useRouter();
  const { showToast } = useToast();

  // Utilisation des hooks Redux
  const { rooms, currentRoom, setCurrentRoom, loading: roomsLoading } = useRooms();
  const { currentRoomTables, selectedTable, setSelectedTable } = useTables();

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

  // Définir la première room comme currentRoom si aucune n'est sélectionnée
  useEffect(() => {
    if (!currentRoom && rooms.length > 0) {
      setCurrentRoom(rooms[0].id);
    }
  }, [currentRoom, rooms, setCurrentRoom]);

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

  const handleOpenEditPanel = useCallback(() => {
    setIsEditPanelVisible(true);
  }, []);

  const handleCloseEditPanel = useCallback(() => {
    setIsEditPanelVisible(false);
  }, []);

  const handleSaveTable = useCallback(async (updates: Partial<Table>) => {
    if (!selectedTable?.id) return;

    try {
      await updateTableFast(selectedTable.id, updates);
      setIsEditPanelVisible(false);
      setSelectedTable(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la sauvegarde de la table';
      showToast(errorMessage, 'error');
    }
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
        name: generateTableName(),
        xStart: position.x,
        yStart: position.y,
        width: 2,
        height: 2,
        roomId: currentRoom.id,
        seats: 2
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

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  // Sync panel with global portal
  useEffect(() => {
    if (isEditPanelVisible && selectedTable) {
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
  }, [isEditPanelVisible, selectedTable, renderPanel, clearPanel, handleCloseEditPanel, handleSaveTable]);

  return (
    <View style={styles.container}>
      <View style={[
        styles.headerContainer,
        {
          zIndex: 10,
          elevation: 5,
          borderBottomWidth: 1,
          borderBottomColor: '#EFEFEF',
          ...Platform.select({
            android: {
              shadowColor: 'transparent', // Pas d'ombre visible sur Android
            },
          }),
        }
      ]}>
        <Pressable
          onPress={handleGoBack}
          style={styles.backButton}
        >
          <ArrowLeftToLine size={20} color="#2A2E33" />
        </Pressable>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.badgeContainer}
          contentContainerStyle={styles.badgeContent}
        >
          {rooms.map((room) => (
            <Pressable
              key={room.id}
              onPress={() => handleChangeRoom(room)}>
              <Badge
                variant="outline"
                className='mx-1'
                active={room.id === currentRoom?.id}
                size='lg'
              >
                <Text>{room.name}</Text>
              </Badge>
            </Pressable>
          ))}
        </ScrollView>

        {/* Bouton Ajouter une table */}
        <View style={styles.addButtonContainer}>
          <Pressable
            onPress={handleAddTable}
            disabled={!currentRoom || isCreatingTable || isCreateOperationInProgress()}
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
        </View>
      </View>

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
            isLoading={roomsLoading}
            containerDimensions={roomContainerDimensions}
            fillContainer
            onTablePress={handleTablePress}
            onTableLongPress={handleTablePress}
            onTableUpdate={handleTableUpdate}
          />

          {/* TableQuickActions - Bouton flottant quand une table est sélectionnée */}
          {selectedTable && !isEditPanelVisible && (
            <TableQuickActions
              onEdit={handleOpenEditPanel}
              onDelete={handleDeleteTable}
            />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    backgroundColor: '#FBFBFB',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRightWidth: 1,
    borderRightColor: '#EFEFEF',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2E33',
    marginRight: 20,
  },
  badgeContainer: {
    marginLeft: 10,
    flex: 1,
  },
  badgeContent: {
    alignItems: 'center',
    height: '100%',
  },
  roomContainer: {
    flex: 1,
    position: 'relative',
  },
  addButtonContainer: {
    width: 200,
    flexShrink: 0,
  },
  addButton: {
    backgroundColor: '#2A2E33',
    height: 50,
    width: '100%',
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
});