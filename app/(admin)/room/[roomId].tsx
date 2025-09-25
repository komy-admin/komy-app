import { View, StyleSheet, Text } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '~/components/ui';
import { FormHeader } from '~/components/admin/FormHeader';
import { RoomForm } from '~/components/form/RoomForm';
import { useToast } from '~/components/ToastProvider';
import { useRooms } from '~/hooks/useRestaurant';
import { AdminFormView, useAdminFormView } from '~/components/admin/AdminFormView';
import { Room } from '~/types/room.types';

export default function RoomEditPage() {
  const { roomId } = useLocalSearchParams();
  const [currentRoom, setCurrentRoomState] = useState<Room | null>(null);
  const roomFormView = useAdminFormView();
  const { showToast } = useToast();
  const router = useRouter();
  const { rooms, updateRoom, getRoomById, setCurrentRoom } = useRooms();

  // Charger la salle et ouvrir le formulaire
  useEffect(() => {
    if (roomId && typeof roomId === 'string') {
      const room = rooms.find(r => r.id === roomId);
      if (room) {
        setCurrentRoomState(room);
        roomFormView.openEdit();
      } else if (rooms.length > 0) {
        // Ne montrer l'erreur et naviguer que si les rooms sont chargées
        showToast('Salle non trouvée', 'error');
        router.replace('/(admin)/room');
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
    router.replace('/(admin)/room');
  };

  const navigateToEditionMode = () => {
    // Définir la currentRoom avant de naviguer
    if (roomId && typeof roomId === 'string') {
      const room = rooms.find(r => r.id === roomId);
      if (room) {
        setCurrentRoom(roomId);
      }
    }
    router.push('/(admin)/room/edition-mode');
  };

  return (
    <View style={styles.container}>
      <FormHeader
        title={currentRoom ? `Modification de "${currentRoom.name}"` : 'Chargement...'}
        onBack={handleClose}
        rightElement={
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
              onPress={navigateToEditionMode}
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
                Mode édition
              </Text>
            </Button>
          </View>
        }
      />

      {/* AdminFormView sans header */}
      {currentRoom && (
        <AdminFormView
          visible={roomFormView.isVisible}
          mode="edit"
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
});