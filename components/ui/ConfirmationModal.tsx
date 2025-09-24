import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CustomModal } from '../CustomModal';
import { Button } from './button';
import { Portal } from '@rn-primitives/portal';

interface ConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive' | 'outline';
  isLoading?: boolean;
  usePortal?: boolean;
}

export function ConfirmationModal({
  isVisible,
  onClose,
  onConfirm,
  title,
  message,
  description,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  confirmVariant = 'default',
  isLoading = false,
  usePortal = false,
}: ConfirmationModalProps) {
  const modalContent = (
    <CustomModal
      isVisible={isVisible}
      onClose={onClose}
      width={600}
      height={description ? 350 : 300}
      title={title}
    >
      <View style={styles.modalContent}>
        <View style={{ paddingTop: 20 }}>
          <Text style={styles.message}>
            {message}
          </Text>
          {description && (
            <Text style={styles.description}>
              {description}
            </Text>
          )}
        </View>
        <View style={styles.buttonContainer}>
          <Button
            variant="outline"
            onPress={onClose}
            disabled={isLoading}
            style={{ flex: 1, marginRight: 8 }}
          >
            <Text>{cancelText}</Text>
          </Button>
          <Button
            variant={confirmVariant}
            onPress={onConfirm}
            disabled={isLoading}
            style={{ flex: 1, marginLeft: 8 }}
          >
            <Text style={confirmVariant === 'destructive' ? { color: 'white' } : { color: 'white' }}>
              {isLoading ? 'Chargement...' : confirmText}
            </Text>
          </Button>
        </View>
      </View>
    </CustomModal>
  );

  return usePortal ? <Portal>{modalContent}</Portal> : modalContent;
}

const styles = StyleSheet.create({
  modalContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#1F2937',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    color: '#6B7280',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingBottom: 20,
  },
});