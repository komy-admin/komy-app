import React, { memo, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { View, Text as RNText, Pressable, StyleSheet, Platform, TextInput, LayoutChangeEvent } from 'react-native';
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
  onReassignTable?: () => void;
  onPayment: () => void;
  onTerminate: () => void;
  onDelete: () => void;
  onNoteChange?: (note: string) => void;
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
  disabledReason?: string;
  compact?: boolean;
}

const ActionButton = memo<ActionButtonProps>(({ icon: Icon, label, onPress, color, bg, border, disabled, disabledReason, compact }) => (
  <Pressable
    onPress={disabled ? undefined : onPress}
    disabled={disabled}
    style={{ flex: 1 }}
  >
    {({ pressed }) => (
      <View style={[
        styles.card,
        disabled
          ? { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB' }
          : { backgroundColor: bg, borderColor: border },
        pressed && !disabled && { opacity: 0.7, transform: [{ scale: 0.97 }] },
      ]}>
        <View style={[styles.glassOverlay, compact && styles.glassOverlayCompact]}>
          <Icon size={compact ? 16 : 20} color={disabled ? '#9CA3AF' : color} strokeWidth={1.8} />
          <RNText style={[styles.cardLabel, compact && styles.cardLabelCompact, { color: disabled ? '#9CA3AF' : color }]} numberOfLines={1}>{label}</RNText>
        </View>
        {disabled && (
          <View style={[styles.lockOverlay, compact && styles.lockOverlayCompact]}>
            <Lock size={compact ? 16 : 20} color="#9CA3AF" strokeWidth={1.8} />
            <RNText style={[styles.lockLabel, compact && styles.lockLabelCompact]} numberOfLines={1}>{label}</RNText>
            {disabledReason && (
              <RNText style={[styles.disabledReason, compact && styles.disabledReasonCompact]} numberOfLines={1}>({disabledReason})</RNText>
            )}
          </View>
        )}
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
  onNoteChange,
  order,
}) => {
  const [noteText, setNoteText] = useState(order.note ?? '');
  const lastSavedNote = useRef(order.note ?? '');

  useEffect(() => {
    const incoming = order.note ?? '';
    if (incoming !== lastSavedNote.current) {
      setNoteText(incoming);
      lastSavedNote.current = incoming;
    }
  }, [order.note]);

  const handleNoteBlur = useCallback(() => {
    const trimmed = noteText.trim();
    const current = order.note ?? '';
    if (trimmed !== current) {
      lastSavedNote.current = trimmed;
      onNoteChange?.(trimmed);
    }
  }, [noteText, order.note, onNoteChange]);
  const summary = useMemo(() => {
    const lines = order.lines || [];
    const totalItems = lines.reduce((count, l) => count + (l.type === 'MENU' && l.items ? l.items.length : 1), 0);
    const totalAmount = order.totalAmount || 0;
    const paidAmount = order.paidAmount || 0;
    const remaining = Math.max(0, totalAmount - paidAmount);
    return { totalItems, totalAmount, paidAmount, remaining };
  }, [order]);

  const hasPayments = !!order.paymentStatus && order.paymentStatus !== 'unpaid';

  const globalStatus = useMemo(() => getOrderGlobalStatus(order), [order]);

  const orderInfo = useMemo(() => ({
    tableName: order.table?.name || '—',
    duration: formatDuration(order.createdAt),
  }), [order]);

  const [rowH, setRowH] = useState(80);
  const onRowLayout = useCallback((e: LayoutChangeEvent) => {
    setRowH(e.nativeEvent.layout.height);
  }, []);

  // Seuils adaptatifs
  const compactButtons = rowH < 55;
  const compactTiles = rowH < 65;

  return (
    <View style={styles.container}>
      {/* Actions */}
      <RNText style={styles.sectionLabel}>Actions</RNText>
      <View style={styles.row} onLayout={onRowLayout}>
        {(hasDraftItems || hasReadyItems) && (
          <ActionButton
            icon={Send}
            color={hasReadyItems ? '#059669' : '#D97706'}
            bg={hasReadyItems ? '#ECFDF5' : '#FFFBEB'}
            border={hasReadyItems ? '#6EE7B7' : '#FBBF24'}
            label={hasReadyItems ? 'Servir' : 'Réclamer'}
            onPress={hasReadyItems ? onServe : onClaim}
            compact={compactButtons}
          />
        )}
        <ActionButton
          icon={Plus}
          color="#4F46E5"
          bg="#EEF2FF"
          border="#A5B4FC"
          label="Ajouter"
          onPress={onAddItem}
          compact={compactButtons}
        />
      </View>
      <View style={styles.row}>
        {onReassignTable && (
          <ActionButton
            icon={Repeat}
            color="#2563EB"
            bg="#EFF6FF"
            border="#93C5FD"
            label="Changer table"
            onPress={onReassignTable}
            compact={compactButtons}
          />
        )}
        <ActionButton
          icon={Wallet}
          color="#059669"
          bg="#ECFDF5"
          border="#6EE7B7"
          label="Paiement"
          onPress={onPayment}
          disabled={order.paymentStatus === 'paid'}
          disabledReason="Commande déjà payée"
          compact={compactButtons}
        />
      </View>

      {/* Clôture */}
      <RNText style={styles.sectionLabel}>Clôture</RNText>
      <View style={styles.row}>
        {order.status !== Status.TERMINATED && (
          <ActionButton
            icon={CircleCheck}
            color="#D97706"
            bg="#FFFBEB"
            border="#FBBF24"
            label="Terminer"
            onPress={onTerminate}
            disabled={order.paymentStatus !== 'paid'}
            disabledReason="Paiement requis"
            compact={compactButtons}
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
          disabledReason="Paiement enregistré"
          compact={compactButtons}
        />
      </View>

      {/* Note */}
      <RNText style={styles.sectionLabel}>Note</RNText>
      <View style={styles.noteWrapper}>
        <View style={styles.noteCard}>
          <TextInput
            style={styles.noteInput}
            placeholder="Ajouter une note..."
            placeholderTextColor="#C4C9D1"
            multiline
            textAlignVertical="top"
            value={noteText}
            onChangeText={setNoteText}
            onBlur={handleNoteBlur}
          />
        </View>
      </View>

      {/* Informations */}
      <RNText style={styles.sectionLabel}>Informations</RNText>
      <View style={styles.row}>
        <View style={[styles.infoTile, compactTiles && styles.infoTileCompact]}>
          <MapPin size={compactTiles ? 14 : 16} color="#9CA3AF" strokeWidth={1.8} />
          <RNText style={[styles.infoTileValue, compactTiles && styles.infoTileValueCompact]}>{orderInfo.tableName}</RNText>
          {!compactTiles && <RNText style={styles.infoTileLabel}>Table</RNText>}
        </View>
        <View style={[styles.infoTile, compactTiles && styles.infoTileCompact]}>
          <ShoppingBag size={compactTiles ? 14 : 16} color="#9CA3AF" strokeWidth={1.8} />
          <RNText style={[styles.infoTileValue, compactTiles && styles.infoTileValueCompact]}>{summary.totalItems}</RNText>
          {!compactTiles && <RNText style={styles.infoTileLabel}>Article{summary.totalItems > 1 ? 's' : ''}</RNText>}
        </View>
        <View style={[styles.infoTile, compactTiles && styles.infoTileCompact, { backgroundColor: getStatusColor(globalStatus), borderColor: darkenColor(getStatusColor(globalStatus), 0.2) }]}>
          {!compactTiles && <View style={[styles.infoTileStatusDot, { backgroundColor: getStatusTextColor(globalStatus) }]} />}
          <RNText style={[styles.infoTileValue, compactTiles && styles.infoTileValueCompact, { color: getStatusTextColor(globalStatus) }]}>
            {getStatusText(globalStatus)}
          </RNText>
          {!compactTiles && <RNText style={[styles.infoTileLabel, { color: getStatusTextColor(globalStatus), opacity: 0.7 }]}>Statut</RNText>}
        </View>
      </View>

      {/* Récap */}
      <View style={styles.row}>
        <View style={[styles.infoTile, compactTiles && styles.infoTileCompact]}>
          {!compactTiles && <Clock size={16} color="#9CA3AF" strokeWidth={1.8} />}
          <RNText style={[styles.infoTileValue, compactTiles && styles.infoTileValueCompact]}>{formatDate(order.createdAt, DateFormat.TIME)}</RNText>
          <RNText style={[styles.infoTileLabel, compactTiles && styles.infoTileLabelCompact]}>Début</RNText>
        </View>
        <View style={[styles.infoTile, compactTiles && styles.infoTileCompact]}>
          {!compactTiles && <Clock size={16} color="#9CA3AF" strokeWidth={1.8} />}
          <RNText style={[styles.infoTileValue, compactTiles && styles.infoTileValueCompact]}>{orderInfo.duration}</RNText>
          <RNText style={[styles.infoTileLabel, compactTiles && styles.infoTileLabelCompact]}>Durée</RNText>
        </View>
        <View style={[
          styles.infoTile,
          compactTiles && styles.infoTileCompact,
          summary.remaining > 0 && summary.paidAmount > 0 && {
            backgroundColor: '#FFFBEB',
            borderColor: '#FBBF24',
          },
          summary.remaining === 0 && summary.paidAmount > 0 && {
            backgroundColor: '#ECFDF5',
            borderColor: '#6EE7B7',
          },
        ]}>
          {!compactTiles && <Wallet size={16} color={summary.remaining > 0 && summary.paidAmount > 0 ? '#D97706' : summary.remaining === 0 && summary.paidAmount > 0 ? '#059669' : '#9CA3AF'} strokeWidth={1.8} />}
          {summary.paidAmount > 0 && summary.remaining > 0 ? (
            <>
              <View style={styles.remainingRow}>
                <RNText style={[styles.remainingValue, compactTiles && { fontSize: 13 }]}>{formatPrice(summary.remaining)}</RNText>
                <RNText style={styles.totalStrikethrough}>{formatPrice(summary.totalAmount)}</RNText>
              </View>
              <RNText style={[styles.infoTileLabel, compactTiles && styles.infoTileLabelCompact, { color: '#D97706' }]}>À payer</RNText>
            </>
          ) : (
            <>
              <RNText style={[
                styles.infoTileValue,
                compactTiles && styles.infoTileValueCompact,
                summary.remaining === 0 && summary.paidAmount > 0 && { color: '#059669' },
              ]}>
                {formatPrice(summary.totalAmount)}
              </RNText>
              <RNText style={[
                styles.infoTileLabel,
                compactTiles && styles.infoTileLabelCompact,
                summary.remaining === 0 && summary.paidAmount > 0 && { color: '#059669' },
              ]}>
                {summary.remaining === 0 && summary.paidAmount > 0 ? 'Payé' : 'Total'}
              </RNText>
            </>
          )}
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
    padding: 16,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: -4, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingLeft: 2,
  },

  // Row — hauteur fixe, shrink si viewport trop petit
  row: {
    minHeight: 50,
    maxHeight: 105,
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },

  // Boutons — mode normal (vertical)
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    } as any : {}),
  },
  // Glass overlay iso item cards
  glassOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 10,
  },
  glassOverlayCompact: {
    flexDirection: 'row',
    gap: 6,
    padding: 8,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardLabelCompact: {
    fontSize: 11,
  },

  // Lock overlay — gris discret
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  lockOverlayCompact: {
    flexDirection: 'row',
    gap: 5,
  },
  lockLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  lockLabelCompact: {
    fontSize: 11,
  },
  disabledReason: {
    fontSize: 9,
    fontWeight: '600',
    color: '#2A2E33',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  disabledReasonCompact: {
    fontSize: 7,
  },

  // Info tiles — mode normal
  infoTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 6,
    overflow: 'hidden',
  },
  // Info tiles — mode compact (icône + valeur sur une ligne, pas de label)
  infoTileCompact: {
    flexDirection: 'row',
    gap: 6,
  },
  infoTileValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  infoTileValueCompact: {
    fontSize: 12,
  },
  infoTileLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoTileLabelCompact: {
    fontSize: 8,
  },
  infoTileStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Note
  noteWrapper: {
    flexGrow: 1,
    flexShrink: 10,
    minHeight: 40,
  },
  noteCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  noteInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 14,
    paddingRight: 14,
    lineHeight: 20,
    ...(Platform.OS === 'web' ? {
      outlineStyle: 'none',
    } as any : {}),
  },

  // Payment
  remainingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  totalStrikethrough: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  remainingValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#D97706',
  },
});
