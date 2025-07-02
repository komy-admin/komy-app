import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams } from 'expo-router';
import RoomComponent from '~/components/Room/Room';
import { Badge, Button } from "~/components/ui";
import { Room } from '~/types/room.types';
import { Table } from "~/types/table.types";
import { RoomCard } from '~/components/Room/RoomCard';
import { CustomModal } from '~/components/CustomModal';
import TableForm from '~/components/form/TableForm';
import { useToast } from '~/components/ToastProvider';
import { useRooms, useTables, useRestaurant } from '~/hooks/useRestaurant';

export default function RoomPage() {
  const params = useLocalSearchParams();
  const roomId = params.roomId as string;
  const { showToast } = useToast();
  
  // Initialiser la connexion WebSocket via useRestaurant
  const { isLoading: globalLoading } = useRestaurant();
  
  // Utilisation des hooks Redux
  const { rooms, currentRoom, setCurrentRoom, loading: roomsLoading, error: roomsError } = useRooms();
  const { getTablesByRoom, selectedTable, setSelectedTable, createTable, updateTable, deleteTable } = useTables();
  
  // Variables d'état local pour l'UI seulement
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isTableUpdated, setIsTableUpdated] = useState(false);
  
  // Récupérer les tables de la salle actuelle depuis le store
  const tables = getTablesByRoom(roomId);

  // Initialiser la salle actuelle quand le roomId change
  useEffect(() => {
    if (roomId && rooms.length > 0) {
      const room = rooms.find(r => r.id === roomId);
      if (room && room.id !== currentRoom?.id) {
        setCurrentRoom(room.id);
        setSelectedTable(null);
      }
    }
  }, [roomId, rooms, currentRoom?.id, setCurrentRoom, setSelectedTable]);

  const handleTableUpdate = async (id: string, updates: Partial<Table>) => {
    try {
      await updateTable(id, updates);
      
      if (isTableUpdated) {
        showToast('Table mise à jour avec succès', 'success');
        setIsTableUpdated(false);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la table:', error);
      showToast('Erreur lors de la mise à jour de la table', 'error');
    }
  };

  const handleTablePress = (table: Table | null) => {
    if (selectedTable?.id === table?.id) {
      return;
    }
    setSelectedTable(table);
  };

  const handleEditTable = () => {
    setIsEditModalVisible(true);
  };

  const handleDeleteTable = () => {
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTable?.id) return;

    try {
      await deleteTable(selectedTable.id);
      setSelectedTable(null);
      setIsDeleteModalVisible(false);
      showToast('Table supprimée avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la suppression de la table:', error);
      showToast('Erreur lors de la suppression de la table', 'error');
    }
  };

  const handleSaveTable = async (updates: Partial<Table>) => {
    if (!selectedTable?.id) return;
    
    try {
      setIsTableUpdated(true);
      await handleTableUpdate(selectedTable.id, updates);
      setIsEditModalVisible(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la table:', error);
      showToast('Erreur lors de la sauvegarde de la table', 'error');
    }
  };

  const handleAddTable = async () => {
    if (!currentRoom?.id) return;

    if (isCreatingTable) return;
    setIsCreatingTable(true);

    function generateName() {
      const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      const number = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      return `${letter}${number}`;
    }

    const DEFAULT_TABLE_SIZE = 2;
    const SPACING = 0;
    
    const isPositionValid = (x: number, y: number): boolean => {
      if (x < 0 || y < 0 || x >= (currentRoom?.width || 0) || y >= (currentRoom?.height || 0)) {
        return false;
      }

      if (x + DEFAULT_TABLE_SIZE > (currentRoom?.width || 0) || 
          y + DEFAULT_TABLE_SIZE > (currentRoom?.height || 0)) {
        return false;
      }

      return !tables.some(table => {
        const hasCollision = (x < table.xStart + table.width + SPACING &&
                            x + DEFAULT_TABLE_SIZE + SPACING > table.xStart &&
                            y < table.yStart + table.height + SPACING &&
                            y + DEFAULT_TABLE_SIZE + SPACING > table.yStart);
        return hasCollision;
      });
    };

    let validPosition = null;
    
    const maxX = (currentRoom?.width || 0) - DEFAULT_TABLE_SIZE;
    const maxY = (currentRoom?.height || 0) - DEFAULT_TABLE_SIZE;

    for (let y = 0; y <= maxY && !validPosition; y++) {
      for (let x = 0; x <= maxX && !validPosition; x++) {
        if (isPositionValid(x, y)) {
          validPosition = { x, y };
          break;
        }
      }
    }

    if (!validPosition) {
      const errorMessage = "Pas d'espace disponible pour une nouvelle table";
      console.error(errorMessage);
      showToast(errorMessage, 'error');
      setIsCreatingTable(false);
      return;
    }

    const tableToCreate = {
      name: generateName(),
      xStart: validPosition.x,
      yStart: validPosition.y,
      width: DEFAULT_TABLE_SIZE,
      height: DEFAULT_TABLE_SIZE,
      roomId: currentRoom.id,
      seats: 2
    };

    try {
      const newTable = await createTable(tableToCreate);
      handleTablePress(newTable);
      showToast('Table créée avec succès', 'success');
    } catch (error) {
      console.error("Erreur lors de la création de la table:", error);
      showToast("Erreur lors de la création de la table", 'error');
    } finally {
      setIsCreatingTable(false);
    }
  };

  const handleChangeRoom = (room: Room) => {
    if (!room.id) return;
    setCurrentRoom(room.id);
    setSelectedTable(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
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
      
      <RoomComponent
        key={currentRoom?.id || 'new-room'}
        tables={tables}
        editingTableId={selectedTable?.id}
        editionMode={true}
        width={currentRoom?.width || 10}
        height={currentRoom?.height || 10}
        isLoading={roomsLoading}
        onTablePress={handleTablePress}
        onTableLongPress={handleTablePress}
        onTableUpdate={handleTableUpdate}
        onEditTable={handleEditTable}
        onDeleteTable={handleDeleteTable}
      />
      
      <View style={styles.cardContainer} pointerEvents="box-none">
        {currentRoom && (
          <RoomCard
            roomName={currentRoom.name}
            capacity={{ current: tables.length }}
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

      <CustomModal
        isVisible={isDeleteModalVisible}
        onClose={() => setIsDeleteModalVisible(false)}
        width={600}
        height={320}
        title="Confirmation de suppression"
        titleColor="#FF4444"
      >
        <View style={styles.deleteModalContent}>
          <View style={{ paddingTop: 20 }}>
            <Text style={styles.deleteMessage}>
              Êtes-vous sûr de vouloir supprimer la table {selectedTable?.name} ?
            </Text>
            <Text style={styles.deleteWarning}>
              {'(Cette action est irréversible.)'}
            </Text>
          </View>
          <View style={styles.deleteButtonContainer}>
            <Button
              onPress={handleConfirmDelete}
              style={styles.deleteButton}
              variant="destructive"
            >
              <Text style={styles.deleteButtonText}>Supprimer</Text>
            </Button>
            <Button
              onPress={() => setIsDeleteModalVisible(false)}
              variant="ghost"
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Button>
          </View>
        </View>
      </CustomModal>
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
    paddingHorizontal: 15,
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
  deleteModalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteMessage: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
    color: '#2A2E33',
  },
  deleteWarning: {
    fontSize: 14,
    color: '#FF4444',
    marginBottom: 40,
    textAlign: 'center',
  },
  deleteButtonContainer: {
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 12,
  },
  deleteButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    width: '100%',
    borderRadius: 6,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    width: '100%',
    marginBottom: 7,
  },
  cancelButtonText: {
    color: '#2A2E33',
    fontSize: 14,
    fontWeight: '500',
  },
});