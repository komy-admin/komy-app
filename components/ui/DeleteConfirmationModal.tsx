import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { CustomModal } from '~/components/CustomModal';
import { Button } from '~/components/ui';
import { Portal } from '@rn-primitives/portal';

interface DeleteConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entityName: string;
  entityType: string;
  isLoading?: boolean;
  usePortal?: boolean;
}

/**
 * Modal de confirmation de suppression responsive
 * Width : 90% de l'écran avec max 600px (s'adapte à tous les formats)
 * Height : Auto (s'adapte au contenu automatiquement)
 */
export function DeleteConfirmationModal({
  isVisible,
  onClose,
  onConfirm,
  entityName,
  entityType,
  isLoading = false,
  usePortal = false
}: DeleteConfirmationModalProps) {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  // Écouter les changements de dimensions (rotation, resize)
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });

    return () => subscription?.remove();
  }, []);

  // Width : 90% avec max 600px - simple et universel
  const modalWidth = Math.min(screenWidth * 0.9, 600);

  const modalContent = (
    <CustomModal
      isVisible={isVisible}
      onClose={onClose}
      width={modalWidth}
      height="auto"
      title="Confirmation de suppression"
      titleColor="#FF4444"
    >
      <View style={styles.deleteModalContent}>
        <View>
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
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 10,
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