import React, { memo, useMemo } from 'react';
import { View, Text as RNText, Pressable, StyleSheet, Platform, ScrollView, TextInput } from 'react-native';
import {
  Send,
  Plus,
  Repeat,
  Wallet,
  CircleCheck,
  Trash2,
  Clock,
  ShoppingBag,
  MapPin,
  Lock,
} from 'lucide-react-native';
import { LucideIcon } from 'lucide-react-native';
import { Order } from '~/types/order.types';
import { Status } from '~/types/status.enum';
import {
  formatPrice,
  formatDate,
  DateFormat,
  getStatusText,
  getStatusColor,
  getStatusTextColor,
  getOrderGlobalStatus,
} from '~/lib/utils';

export interface OrderDetailActionsProps {
  onAddItem: () => void;
  onClaim: () => void;
  onServe: () => void;
  hasDraftItems: boolean;
  hasReadyItems: boolean;
  onReassignTable: () => void;
  onPayment: () => void;
  onTerminate: () => void;
  onDelete: () => void;
  order: Order;
}

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  color: string;
  bg: string;
  border: string;
  disabled?: boolean;
}

const ActionButton = memo<ActionButtonProps>(({ icon: Icon, label, onPress, color, bg, border, disabled }) => (
  <Pressable
    onPress={disabled ? undefined : onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.card,
      { backgroundColor: bg, borderColor: border },
      disabled && { opacity: 0.5 },
      pressed && !disabled && { opacity: 0.7, transform: [{ scale: 0.97 }] },
    ]}
  >
    <Icon size={22} color={color} strokeWidth={1.8} />
    <RNText style={styles.cardLabel}>{label}</RNText>
    {disabled && (
      <View style={styles.lockOverlay}>
        <Lock size={24} color="#2A2E33" strokeWidth={2} />
      </View>
    )}
  </Pressable>
));

ActionButton.displayName = 'ActionButton';

const darkenColor = (hex: string, amount: number = 0.25): string => {
  const c = hex.replace('#', '');
  const r = Math.max(0, Math.round(parseInt(c.substring(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(c.substring(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(c.substring(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const formatDuration = (createdAt: string): string => {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '< 1 min';
  if (diffMin < 60) return `${diffMin} min`;
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`;
};

export const OrderDetailActions = memo<OrderDetailActionsProps>(({
  onAddItem,
  onClaim,
  onServe,
  hasDraftItems,
  hasReadyItems,
  onReassignTable,
  onPayment,
  onTerminate,
  onDelete,
  order,
}) => {
  const summary = useMemo(() => {
    const lines = order.lines || [];
    const totalItems = lines.reduce((count, l) => count + (l.type === 'MENU' && l.items ? l.items.length : 1), 0);
    const totalAmount = lines.reduce((sum, l) => sum + (l.totalPrice || 0), 0);
    const paidAmount = order.paidAmount || 0;
    const remaining = Math.max(0, totalAmount - paidAmount);
    return { totalItems, totalAmount, paidAmount, remaining };
  }, [order]);

  const hasPayments = order.paymentStatus !== 'unpaid';

  const globalStatus = useMemo(() => getOrderGlobalStatus(order), [order]);

  const orderInfo = useMemo(() => ({
    tableName: order.table?.name || '—',
    duration: formatDuration(order.createdAt),
  }), [order]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Actions */}
        <View style={styles.section}>
          <RNText style={styles.sectionLabel}>Actions</RNText>
          <View style={styles.actionsStack}>
            <View style={styles.actionsRow}>
              {(hasDraftItems || hasReadyItems) && (
                <ActionButton
                  icon={Send}
                  color={hasReadyItems ? '#059669' : '#D97706'}
                  bg={hasReadyItems ? '#ECFDF5' : '#FFFBEB'}
                  border={hasReadyItems ? '#6EE7B7' : '#FBBF24'}
                  label={hasReadyItems ? 'Servir' : 'Réclamer'}
                  onPress={hasReadyItems ? onServe : onClaim}
                />
              )}

              <ActionButton
                icon={Plus}
                color="#4F46E5"
                bg="#EEF2FF"
                border="#A5B4FC"
                label="Ajouter"
                onPress={onAddItem}
              />
            </View>

            <View style={styles.actionsRow}>
              <ActionButton
                icon={Repeat}
                color="#2563EB"
                bg="#EFF6FF"
                border="#93C5FD"
                label="Changer table"
                onPress={onReassignTable}
              />

              <ActionButton
                icon={Wallet}
                color="#059669"
                bg="#ECFDF5"
                border="#6EE7B7"
                label="Paiement"
                onPress={onPayment}
                disabled={order.paymentStatus === 'paid'}
              />
            </View>
          </View>
        </View>

        <View style={[styles.section, { marginTop: 20 }]}>
          <RNText style={styles.sectionLabel}>Clôture</RNText>
          <View style={styles.actionsRow}>
            {order.status !== Status.TERMINATED && (
              <ActionButton
                icon={CircleCheck}
                color="#D97706"
                bg="#FFFBEB"
                border="#FBBF24"
                label="Terminer"
                onPress={onTerminate}
                disabled={order.paymentStatus !== 'paid'}
              />
            )}

            <ActionButton
              icon={Trash2}
              color="#DC2626"
              bg="#FEF2F2"
              border="#FCA5A5"
              label="Supprimer"
              onPress={onDelete}
              disabled={hasPayments}
            />
          </View>
        </View>

        {/* Note */}
        <View style={[styles.section, { marginTop: 20, flex: 1 }]}>
          <RNText style={styles.sectionLabel}>Note</RNText>
          <View style={styles.noteCard}>
            <TextInput
              style={styles.noteInput}
              placeholder="Ajouter une note..."
              placeholderTextColor="#C4C9D1"
              multiline
              textAlignVertical="top"
              // TODO: wire to API when backend supports order.note
            />
          </View>
        </View>
      </ScrollView>

      {/* Infos commande */}
      <View style={styles.infoSection}>
        <RNText style={styles.sectionLabel}>Informations</RNText>
        <View style={styles.infoGrid}>
          <View style={styles.infoTile}>
            <MapPin size={16} color="#9CA3AF" strokeWidth={1.8} />
            <RNText style={styles.infoTileValue}>{orderInfo.tableName}</RNText>
            <RNText style={styles.infoTileLabel}>Table</RNText>
          </View>
          <View style={styles.infoTile}>
            <ShoppingBag size={16} color="#9CA3AF" strokeWidth={1.8} />
            <RNText style={styles.infoTileValue}>{summary.totalItems}</RNText>
            <RNText style={styles.infoTileLabel}>Article{summary.totalItems > 1 ? 's' : ''}</RNText>
          </View>
          <View style={[styles.infoTile, { backgroundColor: getStatusColor(globalStatus), borderColor: darkenColor(getStatusColor(globalStatus), 0.2) }]}>
            <View style={[styles.infoTileStatusDot, { backgroundColor: getStatusTextColor(globalStatus) }]} />
            <RNText style={[styles.infoTileValue, { color: getStatusTextColor(globalStatus) }]}>
              {getStatusText(globalStatus)}
            </RNText>
            <RNText style={[styles.infoTileLabel, { color: getStatusTextColor(globalStatus), opacity: 0.7 }]}>Statut</RNText>
          </View>
        </View>
      </View>

      {/* Récap en bas */}
      <View style={styles.summary}>
        <View style={styles.infoGrid}>
          <View style={styles.infoTile}>
            <Clock size={16} color="#9CA3AF" strokeWidth={1.8} />
            <RNText style={styles.infoTileValue}>{formatDate(order.createdAt, DateFormat.TIME)}</RNText>
            <RNText style={styles.infoTileLabel}>Début</RNText>
          </View>
          <View style={styles.infoTile}>
            <Clock size={16} color="#9CA3AF" strokeWidth={1.8} />
            <RNText style={styles.infoTileValue}>{orderInfo.duration}</RNText>
            <RNText style={styles.infoTileLabel}>Durée</RNText>
          </View>
          <View style={[
            styles.infoTile,
            summary.remaining > 0 && summary.paidAmount > 0 && {
              backgroundColor: '#FFFBEB',
              borderColor: '#FBBF24',
            },
            summary.remaining === 0 && summary.paidAmount > 0 && {
              backgroundColor: '#ECFDF5',
              borderColor: '#6EE7B7',
            },
          ]}>
            <Wallet size={16} color={summary.remaining > 0 && summary.paidAmount > 0 ? '#D97706' : summary.remaining === 0 && summary.paidAmount > 0 ? '#059669' : '#9CA3AF'} strokeWidth={1.8} />
            {summary.paidAmount > 0 && summary.remaining > 0 ? (
              <>
                <RNText style={styles.totalStrikethrough}>{formatPrice(summary.totalAmount)}</RNText>
                <RNText style={styles.remainingValue}>{formatPrice(summary.remaining)}</RNText>
                <RNText style={[styles.infoTileLabel, { color: '#D97706' }]}>À payer</RNText>
              </>
            ) : (
              <>
                <RNText style={[
                  styles.infoTileValue,
                  summary.remaining === 0 && summary.paidAmount > 0 && { color: '#059669' },
                ]}>
                  {formatPrice(summary.totalAmount)}
                </RNText>
                <RNText style={[
                  styles.infoTileLabel,
                  summary.remaining === 0 && summary.paidAmount > 0 && { color: '#059669' },
                ]}>
                  {summary.remaining === 0 && summary.paidAmount > 0 ? 'Payé' : 'Total'}
                </RNText>
              </>
            )}
          </View>
        </View>

      </View>

    </View>
  );
});

OrderDetailActions.displayName = 'OrderDetailActions';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  scrollArea: {
    flex: 1,
    marginBottom: 16,
  },
  scrollContent: {
    flexGrow: 1,
  },
  section: {},
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingLeft: 2,
  },
  actionsStack: {
    gap: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 10,
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
      transition: 'all 0.12s ease',
    } as any : {}),
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
      },
    }),
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },

  // Info tiles (top + bottom)
  infoGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  infoTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  infoTileValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  infoTileLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoTileStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Note
  noteCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 80,
  },
  noteInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 14,
    paddingRight: 14,
    lineHeight: 20,
    ...(Platform.OS === 'web' ? {
      outlineStyle: 'none',
    } as any : {}),
  },

  // Info + Summary
  infoSection: {
    paddingBottom: 12,
  },
  summary: {
    paddingTop: 10,
    gap: 10,
  },
  totalStrikethrough: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  remainingValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D97706',
  },

});
