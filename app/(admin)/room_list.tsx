import { View, StyleSheet, Text, useWindowDimensions, TextInput } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Button, ForkTable } from '~/components/ui';
import { CreditCard as Edit2, UtensilsCrossed, Trash } from 'lucide-react-native';
import { Room } from '~/types/room.types';
import { CustomModal } from '~/components/CustomModal';
import { RoomForm } from '~/components/form/RoomForm';
import { useToast } from '~/components/ToastProvider';
import { ActionMenu, ActionItem } from '~/components/ActionMenu';
import { useRooms, useRestaurant } from '~/hooks/useRestaurant';
import { SidePanel } from '~/components/SidePanel';
import { RoomFilters, RoomFilterState } from '~/components/filters/RoomFilters';
import { filterRooms, createEmptyFilters } from '~/utils/roomFilters';

export default function RoomListPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();
  const { width } = useWindowDimensions();

  // Initialiser la connexion WebSocket via useRestaurant
  const { isLoading: globalLoading } = useRestaurant();

  // Utilisation des hooks Redux
  const { rooms, loading, error, createRoom, updateRoom, deleteRoom, getRoomById } = useRooms();

  // State pour le filtrage
  const [filters, setFilters] = useState<RoomFilterState>(createEmptyFilters());

  // Filtrage des salles
  const filteredRooms = filterRooms(rooms, filters);

  const handleCreateRoom = () => {
    setCurrentRoom(null);
    setIsModalVisible(true);
  };

  const handleEditRoom = (id: string) => {
    const room = rooms.find(room => room.id === id);
    if (!room) return;
    setCurrentRoom(room);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setCurrentRoom(null);
  };

  const handleSaveRoom = async (room: Room) => {
    try {
      if (room.id) {
        await updateRoom(room.id, room);
        showToast('Salle modifiée avec succès', 'success');
      } else {
        await createRoom(room);
        showToast('Salle créée avec succès', 'success');
      }
      handleCloseModal();
    } catch (err) {
      console.error('Error saving room:', err);
      showToast('Erreur lors de la sauvegarde de la salle', 'error');
    }
  };

  const handleDeleteRoom = (id: string) => {
    const room = rooms.find(room => room.id === id);
    if (!room) return;
    setRoomToDelete(room);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!roomToDelete?.id) return;

    try {
      await deleteRoom(roomToDelete.id);
      showToast('Salle supprimée avec succès', 'success');
    } catch (err) {
      console.error('Error deleting room:', err);
      showToast('Erreur lors de la suppression de la salle', 'error');
    } finally {
      setIsDeleteModalVisible(false);
      setRoomToDelete(null);
    }
  };

  const navigateToRoomEdit = (roomId: string) => {
    router.push({
      pathname: "/(admin)/room_edition",
      params: { roomId }
    });
  };

  const getRoomActions = (room: Room): ActionItem[] => {
    return [
      {
        label: 'Modifier',
        icon: <Edit2 size={16} color="#4F46E5" />,
        onPress: () => handleEditRoom(room.id ? room.id : '')
      },
      {
        label: 'Mode édition',
        icon: <Edit2 size={16} color="#4F46E5" />,
        onPress: () => navigateToRoomEdit(room.id ? room.id : '')
      },
      {
        label: 'Supprimer',
        icon: <Trash size={16} color="#ef4444" />,
        type: 'destructive',
        onPress: () => handleDeleteRoom(room.id ? room.id : '')
      }
    ];
  };

  const roomTableColumns = [
    {
      label: 'Nom',
      key: 'name',
      width: '40%',
    },
    {
      label: 'Largeur',
      key: 'width',
      width: '17.5%',
    },
    {
      label: 'Hauteur',
      key: 'height',
      width: '17.5%',
    },
    {
      label: 'Tables',
      key: 'tableCount',
      width: '25%',
      render: (room: Room) => (
        <View style={styles.tableCountContainer}>
          <Text style={styles.tableCountText}>{room.tables?.length || 0}</Text>
          <UtensilsCrossed size={14} color="#2A2E33" style={styles.tableIcon} />
        </View>
      )
    }
  ];


  const handleFiltersChange = (newFilters: RoomFilterState) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters(createEmptyFilters());
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#FFFFFF' }}>
      <SidePanel title="Filtrage" width={width / 4} isCollapsed={isPanelCollapsed} onCollapsedChange={setIsPanelCollapsed}>
        <RoomFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />
      </SidePanel>

      <View style={{ flex: 1 }}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Liste des salles</Text>
          <View
            style={{
              width: 200,
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              backgroundColor: '#FBFBFB',
              zIndex: 10,
              shadowColor: '#000',
              shadowOffset: { width: -4, height: 0 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
            }}
          >
            <Button
              onPress={handleCreateRoom}
              className="w-[200px] h-[50px] flex items-center justify-center"
              style={{
                backgroundColor: '#2A2E33',
                borderRadius: 0,
                height: 50,
                width: 200,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: '#FBFBFB',
                  fontWeight: '500',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                }}
              >
                Créer une salle
              </Text>
            </Button>
          </View>
        </View>
        {loading || error ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ color: error ? '#ef4444' : '#666', fontSize: 16 }}>
              {loading ? 'Chargement...' : error || 'Erreur lors du chargement'}
            </Text>
          </View>
        ) : (
          <ForkTable
            data={filteredRooms}
            columns={roomTableColumns}
            onRowPress={handleEditRoom}
            useActionMenu={true}
            getActions={getRoomActions}
            loadingMessage="Chargement des salles..."
            emptyMessage="Aucune salle trouvée"
          />
        )}
      </View>

      <CustomModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        width={600}
        height={550}
        title={currentRoom ? "Modifier la salle" : "Créer une salle"}
      >
        <RoomForm
          room={currentRoom}
          onSave={handleSaveRoom}
          onCancel={handleCloseModal}
        />
      </CustomModal>

      <CustomModal
        isVisible={isDeleteModalVisible}
        onClose={() => {
          setIsDeleteModalVisible(false);
          setRoomToDelete(null);
        }}
        width={600}
        height={320}
        title="Confirmation de suppression"
        titleColor="#FF4444"
      >
        <View style={styles.deleteModalContent}>
          <View style={{ paddingTop: 20 }}>
            <Text style={styles.deleteMessage}>
              Êtes-vous sûr de vouloir supprimer la salle {roomToDelete?.name} ?
            </Text>
            <Text style={styles.deleteWarning}>
              {'(Cette action est irréversible.)'}
            </Text>
          </View>
          <View style={styles.deleteButtonContainer}>
            <Button
              onPress={confirmDelete}
              style={styles.deleteButton}
              variant="destructive"
            >
              <Text style={styles.deleteButtonText}>Supprimer</Text>
            </Button>
            <Button
              onPress={() => {
                setIsDeleteModalVisible(false);
                setRoomToDelete(null);
              }}
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
  headerContainer: {
    backgroundColor: '#FBFBFB',
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2E33',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
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
  tableCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tableCountText: {
    fontSize: 15,
    color: '#2A2E33',
    fontWeight: '400',
  },
  tableIcon: {
    marginTop: 2, // Ajustement fin pour l'alignement vertical
  },
});