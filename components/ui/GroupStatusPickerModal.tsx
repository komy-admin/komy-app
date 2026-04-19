import { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { SlidePanel } from '~/components/ui/SlidePanel';
import { usePanelPortal } from '~/hooks/usePanelPortal';
import { Status } from '~/types/status.enum';
import { getStatusColor, getStatusText, getStatusTextColor, getStatusBackgroundColor } from '~/lib/status.utils';
import { colors } from '~/theme';

const AVAILABLE_STATUSES = [
  Status.DRAFT,
  Status.PENDING,
  Status.SERVED,
];

interface GroupStatusPickerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (quantity: number, status: Status) => void;
  itemName: string;
  max: number;
  currentStatus: Status;
}

export function GroupStatusPickerModal({
  isVisible,
  onClose,
  onConfirm,
  itemName,
  max,
  currentStatus,
}: GroupStatusPickerModalProps) {
  const { renderPanel, clearPanel } = usePanelPortal();
  const [quantity, setQuantity] = useState(max);

  useEffect(() => {
    if (isVisible) setQuantity(max);
  }, [isVisible, max]);

  const handleClose = useCallback(() => {
    clearPanel();
    onClose();
  }, [clearPanel, onClose]);

  const handleStatusSelect = useCallback((status: Status) => {
    clearPanel();
    onConfirm(quantity, status);
  }, [clearPanel, onConfirm, quantity]);

  const handleDecrement = useCallback(() => {
    setQuantity(prev => Math.max(1, prev - 1));
  }, []);

  const handleIncrement = useCallback(() => {
    setQuantity(prev => Math.min(max, prev + 1));
  }, [max]);

  useEffect(() => {
    if (isVisible) {
      renderPanel(
        <GroupStatusPickerContent
          itemName={itemName}
          max={max}
          quantity={quantity}
          currentStatus={currentStatus}
          onClose={handleClose}
          onStatusSelect={handleStatusSelect}
          onDecrement={handleDecrement}
          onIncrement={handleIncrement}
        />
      );
    } else {
      clearPanel();
    }
  }, [isVisible, itemName, max, quantity, currentStatus, handleClose, handleStatusSelect, handleDecrement, handleIncrement, renderPanel, clearPanel]);

  useEffect(() => {
    return () => clearPanel();
  }, [clearPanel]);

  return null;
}

// Composant interne pour le contenu du panel
function GroupStatusPickerContent({
  itemName,
  max,
  quantity,
  currentStatus,
  onClose,
  onStatusSelect,
  onDecrement,
  onIncrement,
}: {
  itemName: string;
  max: number;
  quantity: number;
  currentStatus: Status;
  onClose: () => void;
  onStatusSelect: (status: Status) => void;
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
            <Text style={styles.bannerBold}>Modifier</Text>
            {' : Statut des articles'}
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

        {/* Status cards */}
        <View style={styles.statusSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Statut</Text>
          </View>
          <View style={styles.statusGrid}>
            {AVAILABLE_STATUSES.map((status) => {
              const isActive = currentStatus === status;
              const statusBg = getStatusBackgroundColor(status);
              const statusBorder = getStatusColor(status);
              const textColor = getStatusTextColor(status);

              return (
                <View
                  key={status}
                  style={[
                    styles.statusCardWrapper,
                    {
                      backgroundColor: statusBg,
                      borderColor: isActive ? colors.brand.dark : statusBorder,
                      borderWidth: isActive ? 2.5 : 1.5,
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => onStatusSelect(status)}
                    style={styles.statusCard}
                  >
                    <View style={[styles.statusDot, { backgroundColor: statusBorder }]} />
                    <Text style={[styles.statusText, { color: textColor }]}>
                      {getStatusText(status)}
                    </Text>
                    <Text style={[styles.statusSelectLabel, { color: textColor }]}>
                      {isActive ? 'ACTUEL' : 'SÉLECTIONNER'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
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
    backgroundColor: colors.brand.dark,
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
    backgroundColor: colors.neutral[100],
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[600],
  },
  // Quantity
  quantitySection: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
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
  // Status cards
  statusSection: {
    flex: 1,
  },
  statusGrid: {
    padding: 16,
    gap: 10,
  },
  statusCardWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
      transition: 'all 0.12s ease',
    } as any : {}),
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusSelectLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    opacity: 0.6,
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
