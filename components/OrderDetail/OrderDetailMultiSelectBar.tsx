import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { X, Settings, CheckSquare, Square } from 'lucide-react-native';
import { Status } from '~/types/status.enum';
import StatusSelector from '~/components/Service/StatusSelector';

export interface OrderDetailMultiSelectBarProps {
  selectedCount: number;
  totalVisibleCount: number;
  onCancel: () => void;
  onStatusChange: (newStatus: Status) => void;
  onSelectAll: () => void;
}

export const OrderDetailMultiSelectBar = React.memo<OrderDetailMultiSelectBarProps>(({
  selectedCount,
  totalVisibleCount,
  onCancel,
  onStatusChange,
  onSelectAll,
}) => {
  const [showStatusSelector, setShowStatusSelector] = useState(false);

  const handleStatusSelect = (newStatus: Status) => {
    setShowStatusSelector(false);
    onStatusChange(newStatus);
  };

  const allSelected = selectedCount === totalVisibleCount && totalVisibleCount > 0;
  const hasSelection = selectedCount > 0;

  return (
    <>
      <View style={styles.container}>
        <View style={styles.badge}>
          {/* Info sélection */}
          <View style={styles.info}>
            <View style={styles.numberBadge}>
              <Text style={styles.number}>{selectedCount}</Text>
            </View>
            <Text style={styles.infoText}>SÉLECTIONNÉ{selectedCount > 1 ? 'S' : ''}</Text>
          </View>

          {/* Séparateur */}
          <View style={styles.divider} />

          {/* Tout sélectionner/désélectionner */}
          <Pressable
            onPress={onSelectAll}
            style={[styles.selectAll, allSelected && styles.selectAllActive]}
          >
            {allSelected ? (
              <CheckSquare size={18} color="#DC2626" strokeWidth={2.5} />
            ) : (
              <Square size={18} color="#6366F1" strokeWidth={2.5} />
            )}
            <Text style={[styles.selectAllLabel, allSelected && styles.selectAllLabelActive]}>
              {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
            </Text>
          </Pressable>

          {/* Séparateur */}
          <View style={styles.divider} />

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.actionBtn}>
              <X size={20} color="#6B7280" strokeWidth={2.5} />
            </Pressable>

            <Pressable
              onPress={() => setShowStatusSelector(true)}
              style={[styles.actionBtnPrimary, !hasSelection && styles.actionBtnDisabled]}
              disabled={!hasSelection}
            >
              <Settings size={20} color={hasSelection ? "#FFFFFF" : "#9CA3AF"} strokeWidth={2.5} />
            </Pressable>
          </View>
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
    bottom: 20,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  // Info sélection
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  number: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  // Séparateur
  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E7EB',
  },
  // Tout sélectionner/désélectionner
  selectAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
  },
  selectAllActive: {
    backgroundColor: '#FEE2E2',
  },
  selectAllLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366F1',
    letterSpacing: 0.2,
  },
  selectAllLabelActive: {
    color: '#DC2626',
  },
  // Actions
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnPrimary: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  actionBtnDisabled: {
    backgroundColor: '#F3F4F6',
    shadowOpacity: 0,
    elevation: 0,
  },
});
