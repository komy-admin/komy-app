import { View, StyleSheet, Text, ScrollView, useWindowDimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { SidePanel } from '~/components/SidePanel';
import { Button, ForkTable } from '~/components/ui';
import { CreditCard as Edit2, UtensilsCrossed, Square, Trash } from 'lucide-react-native';
import { roomApiService } from '~/api/room.api';
import { Room } from '~/types/room.types';
import { CustomModal } from '~/components/CustomModal';
import { RoomForm } from '~/components/form/RoomForm';
import { useToast } from '~/components/ToastProvider';
import { FilterBar } from '~/components/filters/Filter';
import { FilterConfig } from '~/hooks/useFilter/types';
import { useFilter } from '~/hooks/useFilter';
import { ActionMenu, ActionItem } from '~/components/ActionMenu';

export default function RoomListPage() {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const { showToast } = useToast();
  const router = useRouter();
  
  const filterRoom: FilterConfig<Room>[] = [
    { 
      field: 'name', 
      type: 'text',
      label: 'Nom',
      operator: 'like',
      show: true
    },
    { 
      field: 'width', 
      type: 'number',
      label: 'Largeur',
      operator: 'between',
      show: true
    },
    { 
      field: 'height', 
      type: 'number',
      label: 'Hauteur',
      operator: 'between',
      show: true
    }
  ];

  const { updateFilter, loading, clearFilters, queryParams } = useFilter<Room>({
    config: filterRoom,
    service: roomApiService,
    onDataChange: (response) => setRooms(response.data)
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const { data } = await roomApiService.getAll();
      setRooms(data);
    } catch (err) {
      console.error('Error loading rooms:', err);
      showToast('Erreur lors du chargement des salles', 'error');
    } finally {
      setIsLoading(false);
    }
  };

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
        await roomApiService.update(room.id, room);
        setRooms(prevRooms => prevRooms.map(r => r.id === room.id ? room : r));
        showToast('Salle modifiée avec succès', 'success');
      } else {
        const newRoom = await roomApiService.create(room);
        setRooms(prevRooms => [...prevRooms, newRoom]);
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
    if (!roomToDelete) return;
    
    try {
      if (roomToDelete?.id) {
        await roomApiService.delete(roomToDelete.id);
      } else {
        throw new Error("Room ID is undefined");
      }
      setRooms(rooms.filter(room => room.id !== roomToDelete.id));
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

  const { width } = useWindowDimensions();

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#FFFFFF' }}>
      <SidePanel 
        title="Filtrage" 
        width={width / 4} 
        isCollapsed={isPanelCollapsed} 
        onCollapsedChange={setIsPanelCollapsed}
      >
        <View style={{ padding: 15 }}>
          <FilterBar
            config={filterRoom}
            onUpdateFilter={updateFilter}
            onClearFilters={clearFilters}
            activeFilters={queryParams.filters || []}
          />
        </View>
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
        <ForkTable
          data={rooms}
          columns={roomTableColumns}
          onRowPress={handleEditRoom}
          useActionMenu={true}
          getActions={getRoomActions}
        />
      </View>

      <CustomModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        width={600}
        height={520}
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
        height={300}
        title="Confirmation de suppression"
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
    marginBottom: 20,
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
  }
});