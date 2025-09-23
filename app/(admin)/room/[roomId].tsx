import { View, StyleSheet, Text } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { RoomForm } from '~/components/form/RoomForm';
import { useToast } from '~/components/ToastProvider';
import { useRooms } from '~/hooks/useRestaurant';
import { AdminFormView, useAdminFormView } from '~/components/admin/AdminFormView';
import { Room } from '~/types/room.types';

export default function RoomEditPage() {
  const { roomId } = useLocalSearchParams();
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const roomFormView = useAdminFormView();
  const { showToast } = useToast();
  const router = useRouter();
  const { rooms, updateRoom, getRoomById } = useRooms();

  // Charger la salle et ouvrir le formulaire
  useEffect(() => {
    if (roomId && typeof roomId === 'string') {
      const room = rooms.find(r => r.id === roomId);
      if (room) {
        setCurrentRoom(room);
        roomFormView.openEdit();
      } else {
        showToast('Salle non trouvée', 'error');
        router.back();
      }
    }
  }, [roomId, rooms]);

  const handleSaveRoom = async (getFormData: () => any) => {
    try {
      const formResult = getFormData();
      if (!formResult.isValid) {
        return false;
      }

      const room = formResult.data;
      if (room.id) {
        await updateRoom(room.id, room);
        showToast('Salle modifiée avec succès', 'success');
        router.replace('/(admin)/room');
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Error updating room:', err);
      const errorMessage = err?.message || 'Erreur lors de la modification de la salle';
      showToast(errorMessage, 'error');
      return false;
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {currentRoom ? `Modification de "${currentRoom.name}"` : 'Chargement...'}
        </Text>
      </View>

      {currentRoom && (
        <AdminFormView
          visible={roomFormView.isVisible}
          mode="edit"
          title={`Modification de "${currentRoom.name}"`}
          onClose={handleClose}
          onCancel={handleClose}
          onSave={handleSaveRoom}
        >
          <RoomForm room={currentRoom} />
        </AdminFormView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FBFBFB',
    height: 50,
    justifyContent: 'center',
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2E33',
  },
});