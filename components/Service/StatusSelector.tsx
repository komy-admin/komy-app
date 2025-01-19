import { View, Text, Pressable, Modal, StyleSheet, Platform } from 'react-native';
import { Status } from '~/types/status.enum';
import { getStatusColor, getStatusText } from '~/lib/utils';
import { Check } from 'lucide-react-native';

interface StatusSelectorProps {
  visible: boolean;
  currentStatus: Status;
  onClose: () => void;
  onStatusSelect: (status: Status) => void;
}

const AVAILABLE_STATUSES = [
  Status.DRAFT,
  Status.PENDING,
  Status.READY,
  Status.INPROGRESS,
];

export default function StatusSelector({ 
  visible, 
  currentStatus, 
  onClose, 
  onStatusSelect 
}: StatusSelectorProps) {
  const renderStatusButton = (status: Status) => {
    const backgroundColor = getStatusColor(status);

    // Wrapper avec View pour garantir le background
    return (
      <View 
        key={status} 
        style={[styles.statusButtonWrapper, { backgroundColor }]}
      >
        <Pressable
          onPress={() => {
            onStatusSelect(status);
            onClose();
          }}
          android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
          style={({ pressed }) => [
            styles.statusButton,
            { opacity: pressed ? 0.7 : 1 }
          ]}
        >
          <View style={styles.statusButtonContent}>
            <Text style={styles.statusText}>
              {getStatusText(status)}
            </Text>
            {currentStatus === status && (
              <Check size={20} color="#1A1A1A" />
            )}
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Pressable 
          onPress={onClose}
          style={styles.overlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.title}>
              Changer le statut
            </Text>
            {AVAILABLE_STATUSES.map(renderStatusButton)}
          </View>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    color: '#1A1A1A',
  },
  statusButtonWrapper: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',  // Important pour le ripple effect sur Android
  },
  statusButton: {
    width: '100%',
  },
  statusButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  }
});