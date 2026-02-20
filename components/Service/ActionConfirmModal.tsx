import { memo, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { CustomModal } from '@/components/CustomModal';
import { ItemNameRow } from './ItemNameRow';

interface ActionConfirmModalProps {
  isVisible: boolean;
  itemsData: {
    orderLineIds: string[];
    orderLineItemIds: string[];
    itemTypeNames?: string[];
    count: number;
    itemNames: string[];
  } | null;
  onClose: () => void;
  onConfirm: () => void;
  variant: 'claim' | 'serve';
}

const VARIANT_CONFIG = {
  claim: {
    title: 'Confirmation - Réclamer',
    confirmText: 'Confirmer la réclamation',
    confirmColor: '#FB923C',
  },
  serve: {
    title: 'Confirmation - Servir',
    confirmText: 'Confirmer le service',
    confirmColor: '#10B981',
  },
} as const;

export const ActionConfirmModal = memo<ActionConfirmModalProps>(({
  isVisible,
  itemsData,
  onClose,
  onConfirm,
  variant,
}) => {
  const windowDimensions = useWindowDimensions();
  const config = VARIANT_CONFIG[variant];

  const modalDimensions = useMemo(() => ({
    width: Math.min(windowDimensions.width * 0.45, 500),
    height: Math.min(windowDimensions.height * 0.6, 450),
  }), [windowDimensions.width, windowDimensions.height]);

  const confirmButtonStyle = useMemo(() => ([
    styles.confirmButton,
    { backgroundColor: config.confirmColor },
  ]), [config.confirmColor]);

  if (!itemsData) return null;

  return (
    <CustomModal
      isVisible={isVisible}
      onClose={onClose}
      width={modalDimensions.width}
      height={modalDimensions.height}
      title={config.title}
    >
      <View style={styles.container}>
        {/* Description */}
        {variant === 'claim' && itemsData.itemTypeNames ? (
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
        ) : (
          <Text style={styles.descriptionText}>
            Vous êtes sur le point de servir {itemsData.count} article{itemsData.count > 1 ? 's' : ''} :
          </Text>
        )}

        {/* Liste des items */}
        <ScrollView style={styles.itemsList}>
          {itemsData.itemNames.map((itemName, index) => (
            <ItemNameRow key={index} itemName={itemName} index={index} />
          ))}
        </ScrollView>

        {/* Boutons d'action */}
        <View style={styles.actionsRow}>
          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Annuler</Text>
          </Pressable>

          <Pressable onPress={onConfirm} style={confirmButtonStyle}>
            <Text style={styles.confirmText}>{config.confirmText}</Text>
          </Pressable>
        </View>
      </View>
    </CustomModal>
  );
});

ActionConfirmModal.displayName = 'ActionConfirmModal';

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
    marginBottom: 12,
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
    ...Platform.select({
      web: { cursor: 'pointer' as any },
    }),
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
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' as any },
    }),
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
