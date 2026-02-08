import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { ArrowRightLeft, CreditCard, CheckCircle, Trash2 } from 'lucide-react-native';

export interface OrderDetailActionsProps {
  isClosed: boolean;
  onReassignTable: () => void;
  onPayment: () => void;
  onTerminate: () => void;
  onDelete: () => void;
}

export const OrderDetailActions = memo<OrderDetailActionsProps>(({
  isClosed,
  onReassignTable,
  onPayment,
  onTerminate,
  onDelete,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.actionsGrid}>
        {/* Assigner une autre table */}
        <Pressable
          style={styles.actionButton}
          onPress={onReassignTable}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
            <ArrowRightLeft size={20} color="#1E40AF" strokeWidth={2} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.actionText}>Assigner table</Text>
          </View>
        </Pressable>

        {/* Régler la note */}
        <Pressable
          style={styles.actionButton}
          onPress={onPayment}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#D1FAE5' }]}>
            <CreditCard size={20} color="#065F46" strokeWidth={2} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.actionText}>Régler la note</Text>
          </View>
        </Pressable>

        {/* Terminer (seulement si pas déjà fermé) */}
        {!isClosed && (
          <Pressable
            style={styles.actionButton}
            onPress={onTerminate}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
              <CheckCircle size={20} color="#92400E" strokeWidth={2} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.actionText}>Terminer</Text>
            </View>
          </Pressable>
        )}

        {/* Supprimer */}
        <Pressable
          style={styles.actionButton}
          onPress={onDelete}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
            <Trash2 size={20} color="#991B1B" strokeWidth={2} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.actionText}>Supprimer</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
});

OrderDetailActions.displayName = 'OrderDetailActions';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    })
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});
