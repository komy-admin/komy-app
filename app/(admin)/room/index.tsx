import { View, StyleSheet, Text, useWindowDimensions } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Button, ForkTable } from '~/components/ui';
import { CreditCard as Edit2, UtensilsCrossed, Trash } from 'lucide-react-native';
import { Room } from '~/types/room.types';
import { useToast } from '~/components/ToastProvider';
import { ActionItem } from '~/components/ActionMenu';
import { useRooms, useTables } from '~/hooks/useRestaurant';
import { SidePanel } from '~/components/SidePanel';
import { RoomFilters, RoomFilterState } from '~/components/filters/RoomFilters';
import { filterRooms, createEmptyFilters } from '~/utils/roomFilters';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';

export default function RoomListPage() {
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true);
  const { showToast } = useToast();
  const router = useRouter();
  const { width } = useWindowDimensions();


  // Utilisation des hooks Redux
  const { rooms, loading, error, deleteRoom, setCurrentRoom } = useRooms();
  const { tables } = useTables();

  // State pour le filtrage
  const [filters, setFilters] = useState<RoomFilterState>(createEmptyFilters());

  // Filtrage des salles
  const filteredRooms = filterRooms(rooms, filters);


  const handleCreateRoom = () => {
    router.push('/(admin)/room/create');
  };

  const handleEditRoom = (id: string) => {
    router.push(`/(admin)/room/${id}`);
  };

  const handleDeleteRoom = (id: string) => {
    const room = rooms.find(room => room.id === id);
    if (!room) return;
    setRoomToDelete(room);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!roomToDelete?.id) return;

    setIsDeleting(true);
    try {
      await deleteRoom(roomToDelete.id);
      showToast('Salle supprimée avec succès', 'success');
    } catch (err: any) {
      console.error('Error deleting room:', err);
      const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression de la salle';
      showToast(errorMessage, 'error');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalVisible(false);
      setRoomToDelete(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalVisible(false);
    setRoomToDelete(null);
  };

  const navigateToRoomEditionMode = (roomId: string) => {
    const room = rooms.find(room => room.id === roomId);
    if (!room) return;
    setCurrentRoom(roomId);
    router.push({
      pathname: "/(admin)/room/edition-mode",
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
        onPress: () => navigateToRoomEditionMode(room.id ? room.id : '')
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
      render: (room: Room) => {
        const roomTableCount = tables.filter(table => table.roomId === room.id).length;
        return (
          <View style={styles.tableCountContainer}>
            <Text style={styles.tableCountText}>{roomTableCount}</Text>
            <UtensilsCrossed size={14} color="#2A2E33" style={styles.tableIcon} />
          </View>
        );
      }
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

      <DeleteConfirmationModal
        isVisible={isDeleteModalVisible}
        onClose={handleCloseDeleteModal}
        onConfirm={confirmDelete}
        entityName={roomToDelete?.name || ''}
        entityType="la salle"
        isLoading={isDeleting}
      />
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