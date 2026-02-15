import { memo, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { CustomModal } from '@/components/CustomModal';
import { ItemNameRow } from './ItemNameRow';

interface ClaimConfirmModalProps {
  isVisible: boolean;
  itemsData: {
    orderLineIds: string[];
    orderLineItemIds: string[];
    itemTypeNames: string[];
    count: number;
    itemNames: string[];
  } | null;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Modal mémoïsée pour confirmer la réclamation d'articles
 */
export const ClaimConfirmModal = memo<ClaimConfirmModalProps>(({
  isVisible,
  itemsData,
  onClose,
  onConfirm
}) => {
  const windowDimensions = useWindowDimensions();

  // ✅ useMemo : Dimensions de la modal
  const modalDimensions = useMemo(() => ({
    width: Math.min(windowDimensions.width * 0.45, 500),
    height: Math.min(windowDimensions.height * 0.6, 450),
  }), [windowDimensions.width, windowDimensions.height]);

  if (!itemsData) return null;

  return (
    <CustomModal
      isVisible={isVisible}
      onClose={onClose}
      width={modalDimensions.width}
      height={modalDimensions.height}
      title="Confirmation - Réclamer"
    >
      <View style={styles.container}>
        {/* Description */}
        <View style={styles.descriptionRow}>
          <Text style={styles.descriptionText}>
            Vous êtes sur le point de réclamer {itemsData.count} article{itemsData.count > 1 ? 's' : ''} de type{' '}
          </Text>
          <Text style={styles.itemTypeName}>
            {itemsData.itemTypeNames.map(n => `"${n}"`).join(' + ')}
          </Text>
          <Text style={styles.descriptionText}>
            {' '}:
          </Text>
        </View>

        {/* Liste des items */}
        <ScrollView style={styles.itemsList}>
          {itemsData.itemNames.map((itemName, index) => (
            <ItemNameRow key={index} itemName={itemName} index={index} />
          ))}
        </ScrollView>

        {/* Boutons d'action */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={onClose}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>Annuler</Text>
          </Pressable>

          <Pressable
            onPress={onConfirm}
            style={styles.confirmButton}
          >
            <Text style={styles.confirmText}>Confirmer la réclamation</Text>
          </Pressable>
        </View>
      </View>
    </CustomModal>
  );
});

ClaimConfirmModal.displayName = 'ClaimConfirmModal';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  descriptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  itemTypeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  itemsList: {
    flex: 1,
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    ...(Platform.OS === 'web' && { cursor: 'pointer' })
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#FB923C',
    alignItems: 'center',
    ...(Platform.OS === 'web' && { cursor: 'pointer' })
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
