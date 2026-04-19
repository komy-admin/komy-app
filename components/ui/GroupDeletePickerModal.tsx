import { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { SlidePanel } from '~/components/ui/SlidePanel';
import { usePanelPortal } from '~/hooks/usePanelPortal';
import { Status } from '~/types/status.enum';
import { getStatusText, getStatusTextColor, getStatusBackgroundColor } from '~/lib/status.utils';
import { colors } from '~/theme';

export type VoidReason = 'correction' | 'unpaid' | 'offered' | 'other'

const VOID_REASONS: { value: VoidReason; label: string }[] = [
  { value: 'correction', label: 'Erreur de commande' },
  { value: 'unpaid', label: 'Impayé' },
  { value: 'offered', label: 'Offert' },
  { value: 'other', label: 'Autre raison' },
]

interface GroupDeletePickerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (quantity: number, reason?: string, notes?: string) => void;
  itemName: string;
  max: number;
  /** Si renseigné, affiche un avertissement avec le statut actuel */
  status?: Status;
}

export function GroupDeletePickerModal({
  isVisible,
  onClose,
  onConfirm,
  itemName,
  max,
  status,
}: GroupDeletePickerModalProps) {
  const { renderPanel, clearPanel } = usePanelPortal();
  const [quantity, setQuantity] = useState(max);
  const [selectedReason, setSelectedReason] = useState<VoidReason | null>(null);
  const [notes, setNotes] = useState('');

  const requiresReason = status && status !== Status.DRAFT;

  useEffect(() => {
    if (isVisible) {
      setQuantity(max);
      setSelectedReason(null);
      setNotes('');
    }
  }, [isVisible, max]);

  const handleClose = useCallback(() => {
    clearPanel();
    onClose();
  }, [clearPanel, onClose]);

  const handleConfirm = useCallback(() => {
    clearPanel();
    onConfirm(
      quantity,
      requiresReason ? (selectedReason || undefined) : undefined,
      requiresReason && selectedReason === 'other' ? notes : undefined
    );
  }, [clearPanel, onConfirm, quantity, requiresReason, selectedReason, notes]);

  const handleDecrement = useCallback(() => {
    setQuantity(prev => Math.max(1, prev - 1));
  }, []);

  const handleIncrement = useCallback(() => {
    setQuantity(prev => Math.min(max, prev + 1));
  }, [max]);

  const canConfirm = !requiresReason || (selectedReason && (selectedReason !== 'other' || notes.trim()));

  useEffect(() => {
    if (isVisible) {
      renderPanel(
        <GroupDeletePickerContent
          itemName={itemName}
          max={max}
          quantity={quantity}
          status={status}
          requiresReason={!!requiresReason}
          selectedReason={selectedReason}
          notes={notes}
          canConfirm={!!canConfirm}
          onReasonSelect={setSelectedReason}
          onNotesChange={setNotes}
          onClose={handleClose}
          onConfirm={handleConfirm}
          onDecrement={handleDecrement}
          onIncrement={handleIncrement}
        />
      );
    } else {
      clearPanel();
    }
  }, [isVisible, itemName, max, quantity, status, requiresReason, selectedReason, notes, canConfirm, handleClose, handleConfirm, handleDecrement, handleIncrement, renderPanel, clearPanel]);

  useEffect(() => {
    return () => clearPanel();
  }, [clearPanel]);

  return null;
}

function GroupDeletePickerContent({
  itemName,
  max,
  quantity,
  status,
  requiresReason,
  selectedReason,
  notes,
  canConfirm,
  onReasonSelect,
  onNotesChange,
  onClose,
  onConfirm,
  onDecrement,
  onIncrement,
}: {
  itemName: string;
  max: number;
  quantity: number;
  status?: Status;
  requiresReason: boolean;
  selectedReason: VoidReason | null;
  notes: string;
  canConfirm: boolean;
  onReasonSelect: (reason: VoidReason) => void;
  onNotesChange: (text: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <SlidePanel
      visible={true}
      onClose={onClose}
      width={430}
    >
      <View style={styles.container}>
        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            <Text style={styles.bannerBold}>Supprimer</Text>
            {' : Articles'}
          </Text>
        </View>

        {/* Item info */}
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={1}>{itemName}</Text>
          {max > 1 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>x{max}</Text>
            </View>
          )}
        </View>

        {/* Status warning */}
        {status && (
          <View style={[styles.warningSection, { backgroundColor: getStatusBackgroundColor(status) }]}>
            <Text style={[styles.warningText, { color: getStatusTextColor(status) }]}>
              Statut actuel : <Text style={styles.warningBold}>{getStatusText(status)}</Text>
            </Text>
          </View>
        )}

        {/* Reason picker (only for non-draft items) */}
        {requiresReason && (
          <View style={styles.reasonSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Motif de suppression</Text>
            </View>
            <View style={styles.reasonList}>
              {VOID_REASONS.map((reason) => {
                const isSelected = selectedReason === reason.value;
                return (
                  <Pressable
                    key={reason.value}
                    onPress={() => onReasonSelect(reason.value)}
                    style={[
                      styles.reasonButton,
                      isSelected && styles.reasonButtonSelected,
                    ]}
                  >
                    <Text style={[
                      styles.reasonText,
                      isSelected && styles.reasonTextSelected,
                    ]}>
                      {reason.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {selectedReason === 'other' && (
              <View style={styles.notesContainer}>
                <TextInput
                  placeholder="Précisez la raison..."
                  value={notes}
                  onChangeText={onNotesChange}
                  style={styles.notesInput}
                  multiline
                  numberOfLines={2}
                  placeholderTextColor={colors.gray[400]}
                />
              </View>
            )}
          </View>
        )}

        {/* Quantity picker */}
        {max > 1 && (
          <View style={styles.quantitySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quantité</Text>
            </View>
            <View style={styles.pickerRow}>
              <Pressable
                onPress={onDecrement}
                style={[styles.pickerButton, quantity <= 1 && styles.pickerButtonDisabled]}
                disabled={quantity <= 1}
              >
                <Minus size={18} color={quantity <= 1 ? colors.gray[300] : colors.gray[700]} strokeWidth={2.5} />
              </Pressable>

              <View style={styles.quantityDisplay}>
                <Text style={styles.quantityText}>{quantity}</Text>
                <Text style={styles.quantityMax}>/ {max}</Text>
              </View>

              <Pressable
                onPress={onIncrement}
                style={[styles.pickerButton, quantity >= max && styles.pickerButtonDisabled]}
                disabled={quantity >= max}
              >
                <Plus size={18} color={quantity >= max ? colors.gray[300] : colors.gray[700]} strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>
        )}

        {/* Delete button */}
        <View style={styles.deleteSection}>
          <Pressable
            onPress={onConfirm}
            disabled={!canConfirm}
            style={({ pressed }) => [
              styles.deleteButton,
              !canConfirm && styles.deleteButtonDisabled,
              pressed && canConfirm && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text style={styles.deleteButtonText}>Confirmer la suppression</Text>
          </Pressable>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Annuler</Text>
          </Pressable>
        </View>
      </View>
    </SlidePanel>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Banner
  banner: {
    backgroundColor: colors.error.text,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  bannerBold: {
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Item header
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  itemName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.neutral[800],
    letterSpacing: 0.3,
  },
  countBadge: {
    backgroundColor: colors.error.bg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.error.text,
  },
  // Warning
  warningSection: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  warningText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[500],
    textAlign: 'center',
  },
  warningBold: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  // Reason
  reasonSection: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  reasonList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  reasonButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
  },
  reasonButtonSelected: {
    backgroundColor: colors.error.text,
    borderColor: colors.error.text,
  },
  reasonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
  },
  reasonTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  notesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.gray[700],
    backgroundColor: colors.white,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  // Section header
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.gray[100],
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Quantity
  quantitySection: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 16,
  },
  pickerButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  pickerButtonDisabled: {
    opacity: 0.4,
    ...(Platform.OS === 'web' ? { cursor: 'default' as any } : {}),
  },
  quantityDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    minWidth: 55,
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.gray[800],
  },
  quantityMax: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[400],
  },
  // Delete button
  deleteSection: {
    padding: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.error.text,
    paddingVertical: 16,
    borderRadius: 12,
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
      transition: 'all 0.12s ease',
    } as any : {}),
  },
  deleteButtonDisabled: {
    backgroundColor: colors.gray[300],
    ...(Platform.OS === 'web' ? { cursor: 'default' as any } : {}),
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  // Spacer
  spacer: {
    flex: 1,
  },
  // Footer
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[600],
  },
});
