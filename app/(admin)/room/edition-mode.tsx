import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform } from "react-native";
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import RoomComponent from '~/components/Room/Room';
import { Badge, Button } from "~/components/ui";
import { Room } from '~/types/room.types';
import { Table } from "~/types/table.types";
import { RoomCard } from '~/components/Room/RoomCard';
import { CustomModal } from '~/components/CustomModal';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';
import TableForm from '~/components/form/TableForm';
import { useToast } from '~/components/ToastProvider';
import { useRooms, useTables, useRestaurant } from '~/hooks/useRestaurant';
import { useTableEditor } from '~/hooks/useTableEditor';
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
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
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

  const handleEditTable = () => {
    setIsEditModalVisible(true);
  };

  const handleDeleteTable = () => {
    setIsDeleteModalVisible(true);
  };

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

  const handleSaveTable = async (updates: Partial<Table>) => {
    if (!selectedTable?.id) return;

    try {
      await updateTableFast(selectedTable.id, updates);
      setIsEditModalVisible(false);
      showToast('Table modifiée avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la table:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la sauvegarde de la table';
      showToast(errorMessage, 'error');
    }
  };

  // Fonction utilitaire pour générer un nom de table
  const generateTableName = useCallback(() => {
    const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const number = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${letter}${number}`;
  }, []);

  // Fonction utilitaire pour trouver une position valide (optimisée)
  const findAvailablePosition = useCallback((tableSize = 2) => {
    if (!currentRoom) return null;

    // Créer une grille d'occupation pour optimiser la recherche
    const grid = Array(currentRoom.height).fill(null).map(() => Array(currentRoom.width).fill(false));

    // Marquer les zones occupées par les tables existantes
    currentRoomTables.forEach(table => {
      for (let y = table.yStart; y < table.yStart + table.height; y++) {
        for (let x = table.xStart; x < table.xStart + table.width; x++) {
          if (grid[y] && grid[y][x] !== undefined) {
            grid[y][x] = true;
          }
        }
      }
    });

    // Chercher une position libre en vérifiant la grille
    for (let y = 0; y <= currentRoom.height - tableSize; y++) {
      for (let x = 0; x <= currentRoom.width - tableSize; x++) {
        let canPlace = true;

        // Vérifier si la zone est libre
        for (let dy = 0; dy < tableSize && canPlace; dy++) {
          for (let dx = 0; dx < tableSize && canPlace; dx++) {
            if (grid[y + dy]?.[x + dx]) {
              canPlace = false;
            }
          }
        }

        if (canPlace) {
          return { x, y };
        }
      }
    }
    return null;
  }, [currentRoom, currentRoomTables]);

  const handleAddTable = useCallback(async () => {
    if (!currentRoom?.id || isCreatingTable || isCreateOperationInProgress()) return;

    setIsCreatingTable(true);

    try {
      // Désélectionner la table courante avant d'ajouter une nouvelle
      setSelectedTable(null);

      const position = findAvailablePosition(2);
      if (!position) {
        showToast("Pas d'espace disponible pour une nouvelle table", 'error');
        setIsCreatingTable(false);
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

      // Sélectionner la nouvelle table
      handleTablePress(newTable);
      showToast('Table créée avec succès', 'success');

    } catch (error) {
      console.error("Erreur lors de la création de la table:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la création de la table";
      showToast(errorMessage, 'error');
    } finally {
      setIsCreatingTable(false);
    }
  }, [currentRoom?.id, isCreatingTable, isCreateOperationInProgress, findAvailablePosition, generateTableName, createTableFast, handleTablePress, showToast, setSelectedTable]);

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

      {currentRoom && (
        <View style={{ flex: 1, zIndex: 1, elevation: 0 }}>
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
            onEditTable={handleEditTable}
            onDeleteTable={handleDeleteTable}
          />
        </View>
      )}

      <View style={styles.cardContainer} pointerEvents="box-none">
        {currentRoom && (
          <RoomCard
            roomName={currentRoom.name}
            capacity={{ current: currentRoomTables.length }}
            EditMode={handleAddTable}
          />
        )}
      </View>

      <CustomModal
        isVisible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        width={600}
        height={450}
        title="Modifier la table"
      >
        <TableForm
          table={selectedTable}
          onSave={handleSaveTable}
          onCancel={() => setIsEditModalVisible(false)}
        />
      </CustomModal>

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
  cardContainer: {
    position: 'absolute',
    bottom: 5,
    right: 10,
    left: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});