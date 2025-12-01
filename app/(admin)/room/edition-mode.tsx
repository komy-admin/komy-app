/**
 * 🏗️ ROOM EDITION MODE - Point d'entrée principal pour l'édition des rooms
 *
 * ARCHITECTURE:
 * ├── RoomComponent (~/components/Room/Room.tsx)
 * │   └── Composant principal de visualisation et interaction avec la grille
 * │       ├── useRoomDimensions → Calcul dimensions et zoom optimal
 * │       ├── useRoomZoom → Gestion pan, pinch, wheel zoom
 * │       ├── useRoomValidation → Validation O(1) positions et collisions
 * │       └── RoomContext.Provider → Partage CELL_SIZE, currentZoom, editionMode
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
import { RoomCard } from '~/components/Room/RoomCard';
import { TableEditorSidebar } from '~/components/Room/TableEditorSidebar';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';
import { useToast } from '~/components/ToastProvider';
import { useRooms, useTables } from '~/hooks/useRestaurant';
import { useTableEditor } from '~/hooks/useTableEditor';
import { generateTableName, findAvailablePosition } from '~/lib/room-utils';
import { ArrowLeftToLine } from 'lucide-react-native';

export default function RoomEditionMode() {
  const router = useRouter();
  const { showToast } = useToast();

  // Utilisation des hooks Redux
  const { rooms, currentRoom, setCurrentRoom, loading: roomsLoading } = useRooms();
  const { currentRoomTables, selectedTable, setSelectedTable } = useTables();

  // Hook spécialisé pour l'édition haute performance
  const { createTableFast, updateTableFast, deleteTableFast, isCreateOperationInProgress } = useTableEditor();

  // Variables d'état local pour l'UI seulement
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

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
      console.error('Erreur lors de la mise à jour de la table:', error);
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

  const handleConfirmDelete = async () => {
    if (!selectedTable?.id) return;

    try {
      await deleteTableFast(selectedTable.id);
      setSelectedTable(null);
      setIsDeleteModalVisible(false);
      showToast('Table supprimée avec succès', 'success');
    } catch (error: any) {
      console.error('Erreur lors de la suppression de la table:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression de la table';
      showToast(errorMessage, 'error');
    }
  };

  const handleSaveTable = useCallback(async (updates: Partial<Table>) => {
    if (!selectedTable?.id) return;

    try {
      await updateTableFast(selectedTable.id, updates);
      setSelectedTable(null); // Fermer le panel
      showToast('Table modifiée avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la table:', error);
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
      console.error("Erreur lors de la création de la table:", error);
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

  const handleGoBack = () => {
    router.back();
  };

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
          {rooms.map((room, index) => (
            <Pressable
              key={`${room.name}-badge-${index}`}
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
      </View>

      {/* Layout flex: RoomComponent + Sidebar */}
      <View style={styles.contentContainer}>
        {/* Zone de la grille - Prend l'espace restant */}
        {currentRoom && (
          <View style={styles.roomContainer}>
            <RoomComponent
              key={currentRoom.id}
              tables={currentRoomTables}
              editingTableId={selectedTable?.id}
              editionMode={true}
              width={currentRoom.width}
              height={currentRoom.height}
              isLoading={roomsLoading}
              onTablePress={handleTablePress}
              onTableLongPress={handleTablePress}
              onTableUpdate={handleTableUpdate}
            />

            {/* RoomCard par-dessus la grille */}
            <View style={styles.cardContainer} pointerEvents="box-none">
              <RoomCard
                roomName={currentRoom.name}
                capacity={{ current: currentRoomTables.length }}
                EditMode={handleAddTable}
              />
            </View>
          </View>
        )}

        {/* Sidebar d'édition - Largeur fixe, pousse le RoomComponent */}
        {selectedTable && (
          <TableEditorSidebar
            table={selectedTable}
            onSave={handleSaveTable}
            onDelete={handleDeleteTable}
            onClose={() => setSelectedTable(null)}
          />
        )}
      </View>

      <DeleteConfirmationModal
        isVisible={isDeleteModalVisible}
        onClose={() => setIsDeleteModalVisible(false)}
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
    flex: 1,
  },
  badgeContent: {
    alignItems: 'center',
    height: '100%',
  },
  // Nouveau layout flex
  contentContainer: {
    flex: 1,
    flexDirection: 'row', // Layout horizontal
  },
  roomContainer: {
    flex: 1, // Prend tout l'espace disponible (réduit automatiquement si sidebar)
    position: 'relative',
  },
  cardContainer: {
    position: 'absolute',
    bottom: 0,
    right: 10,
    left: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});