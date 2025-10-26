import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { Status } from '~/types/status.enum';
import StatusSelector from '~/components/Service/StatusSelector';

export interface OrderDetailMultiSelectBarProps {
  selectedCount: number;
  onCancel: () => void;
  onStatusChange: (newStatus: Status) => void;
}

export const OrderDetailMultiSelectBar = React.memo<OrderDetailMultiSelectBarProps>(({
  selectedCount,
  onCancel,
  onStatusChange,
}) => {
  const [showStatusSelector, setShowStatusSelector] = useState(false);

  const handleStatusSelect = (newStatus: Status) => {
    setShowStatusSelector(false);
    onStatusChange(newStatus);
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.leftSection}>
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>{selectedCount}</Text>
          </View>
          <Text style={styles.label}>
            {selectedCount === 1 ? 'article sélectionné' : 'articles sélectionnés'}
          </Text>
        </View>

        <View style={styles.rightSection}>
          <Pressable
            onPress={() => setShowStatusSelector(true)}
            style={styles.statusButton}
          >
            <Text style={styles.statusButtonText}>Changer le statut</Text>
          </Pressable>

          <Pressable onPress={onCancel} style={styles.cancelButton}>
            <X size={20} color="#6B7280" strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>

      <StatusSelector
        visible={showStatusSelector}
        currentStatus={Status.PENDING}
        onClose={() => setShowStatusSelector(false)}
        onStatusSelect={handleStatusSelect}
      />
    </>
  );
});

OrderDetailMultiSelectBar.displayName = 'OrderDetailMultiSelectBar';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterBadge: {
    backgroundColor: '#6366F1',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    padding: 8,
  },
});
