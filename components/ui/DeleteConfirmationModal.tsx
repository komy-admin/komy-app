import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { CustomModal } from '~/components/CustomModal';
import { Button } from '~/components/ui';
import { Portal } from '@rn-primitives/portal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DeleteConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entityName: string;
  entityType: string;
  isLoading?: boolean;
  usePortal?: boolean; // Nouveau prop pour contrôler l'utilisation du Portal
}

export function DeleteConfirmationModal({
  isVisible,
  onClose,
  onConfirm,
  entityName,
  entityType,
  isLoading = false,
  usePortal = false // Par défaut, n'utilise pas le Portal
}: DeleteConfirmationModalProps) {
  // Utilise une largeur responsive: max 90% de l'écran ou 400px
  const modalWidth = Math.min(SCREEN_WIDTH * 0.9, 400);

  const modalContent = (
    <CustomModal
      isVisible={isVisible}
      onClose={onClose}
      width={modalWidth}
      height={320}
      title="Confirmation de suppression"
      titleColor="#FF4444"
    >
      <View style={styles.deleteModalContent}>
        <View style={{ paddingTop: 20 }}>
          <Text style={styles.deleteMessage}>
            Êtes-vous sûr de vouloir supprimer {entityType} {entityName} ?
          </Text>
          <Text style={styles.deleteWarning}>
            {'(Cette action est irréversible.)'}
          </Text>
        </View>
        <View style={styles.deleteButtonContainer}>
          <Button
            onPress={onConfirm}
            style={styles.deleteButton}
            variant="destructive"
            disabled={isLoading}
          >
            <Text style={styles.deleteButtonText}>
              {isLoading ? 'Suppression...' : 'Supprimer'}
            </Text>
          </Button>
          <Button
            onPress={onClose}
            variant="ghost"
            style={styles.cancelButton}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </Button>
        </View>
      </View>
    </CustomModal>
  );

  // Utilise Portal conditionnellement
  return usePortal ? (
    <Portal name="delete-confirmation-modal">
      {modalContent}
    </Portal>
  ) : (
    modalContent
  );
}

const styles = StyleSheet.create({
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
});