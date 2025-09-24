import { View, StyleSheet, Text } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { RoomForm } from '~/components/form/RoomForm';
import { useToast } from '~/components/ToastProvider';
import { useRooms } from '~/hooks/useRestaurant';
import { AdminFormView, useAdminFormView } from '~/components/admin/AdminFormView';

export default function RoomCreatePage() {
  const roomFormView = useAdminFormView();
  const { showToast } = useToast();
  const router = useRouter();
  const { createRoom } = useRooms();

  // Ouvrir le formulaire immédiatement au montage
  React.useEffect(() => {
    roomFormView.openCreate();
  }, []);

  const handleSaveRoom = async (getFormData: () => any) => {
    try {
      const formResult = getFormData();
      if (!formResult.isValid) {
        return false;
      }

      const room = formResult.data;
      await createRoom(room);
      showToast('Salle créée avec succès', 'success');
      router.replace('/(admin)/room');
      return true;
    } catch (err: any) {
      console.error('Error creating room:', err);
      const errorMessage = err?.message || 'Erreur lors de la création de la salle';
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
        <Text style={styles.title}>Création d'une nouvelle salle</Text>
      </View>

      <AdminFormView
        visible={roomFormView.isVisible}
        mode="create"
        title="Création d'une salle"
        onClose={handleClose}
        onCancel={handleClose}
        onSave={handleSaveRoom}
      >
        <RoomForm room={null} />
      </AdminFormView>
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