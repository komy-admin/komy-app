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
  LucideIcon,
} from 'lucide-react-native';
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
import { getColorWithOpacity } from '~/lib/color-utils';
import { colors } from '~/theme';

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
  blockInputs?: boolean;
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
          ? { backgroundColor: colors.gray[100], borderColor: colors.gray[300] }
          : { backgroundColor: bg, borderColor: border },
        pressed && !disabled && { opacity: 0.7, transform: [{ scale: 0.97 }] },
      ]}>
        <View style={[styles.glassOverlay, compact && styles.glassOverlayCompact]}>
          <Icon size={compact ? 16 : 20} color={disabled ? colors.gray[400] : color} strokeWidth={1.8} />
          <RNText style={[styles.cardLabel, compact && styles.cardLabelCompact, { color: disabled ? colors.gray[400] : color }]} numberOfLines={1}>{label}</RNText>
        </View>
        {disabled && (
          <View style={[styles.lockOverlay, compact && styles.lockOverlayCompact]}>
            <Lock size={compact ? 16 : 20} color={colors.gray[400]} strokeWidth={1.8} />
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
  blockInputs,
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

  // Measure the container (flex:1 = stable height from parent, no feedback loop)
  const [containerH, setContainerH] = useState(0);
  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerH(e.nativeEvent.layout.height);
  }, []);

  // Single compact threshold — all elements switch together
  const compact = containerH > 0 && containerH < 540;

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      {/* Actions */}
      <RNText style={styles.sectionLabel}>Actions</RNText>
      <View style={styles.row}>
        {(hasDraftItems || hasReadyItems) && (
          <ActionButton
            icon={Send}
            color={hasReadyItems ? colors.success.dark : colors.warning.dark}
            bg={hasReadyItems ? colors.success.bg : colors.warning.bg}
            border={hasReadyItems ? colors.success.border : colors.warning.base}
            label={hasReadyItems ? 'Servir' : 'Réclamer'}
            onPress={hasReadyItems ? onServe : onClaim}
            compact={compact}
          />
        )}
        <ActionButton
          icon={Plus}
          color={colors.brand.accentDark}
          bg={getColorWithOpacity(colors.brand.accentDark, 0.1)}
          border={colors.brand.accentDark}
          label="Ajouter"
          onPress={onAddItem}
          compact={compact}
        />
      </View>
      <View style={styles.row}>
        {onReassignTable && (
          <ActionButton
            icon={Repeat}
            color={colors.info.base}
            bg={colors.info.bg}
            border={colors.info.base}
            label="Changer table"
            onPress={onReassignTable}
            compact={compact}
          />
        )}
        <ActionButton
          icon={Wallet}
          color={colors.success.dark}
          bg={colors.success.bg}
          border={colors.success.border}
          label="Paiement"
          onPress={onPayment}
          disabled={order.paymentStatus === 'paid'}
          disabledReason="Commande déjà payée"
          compact={compact}
        />
      </View>

      {/* Clôture */}
      <RNText style={styles.sectionLabel}>Clôture</RNText>
      <View style={styles.row}>
        {order.status !== Status.TERMINATED && (
          <ActionButton
            icon={CircleCheck}
            color={colors.warning.dark}
            bg={colors.warning.bg}
            border={colors.warning.base}
            label="Terminer"
            onPress={onTerminate}
            disabled={order.paymentStatus !== 'paid'}
            disabledReason="Paiement requis"
            compact={compact}
          />
        )}
        <ActionButton
          icon={Trash2}
          color={colors.error.text}
          bg={colors.error.bg}
          border={colors.error.border}
          label="Supprimer"
          onPress={onDelete}
          disabled={hasPayments}
          disabledReason="Paiement enregistré"
          compact={compact}
        />
      </View>

      {/* Note */}
      <RNText style={styles.sectionLabel}>Note</RNText>
      <View style={styles.noteWrapper}>
        <View style={styles.noteCard}>
          <TextInput
            style={styles.noteInput}
            placeholder="Ajouter une note..."
            placeholderTextColor={colors.neutral[300]}
            multiline
            textAlignVertical="top"
            value={noteText}
            onChangeText={setNoteText}
            onBlur={handleNoteBlur}
            editable={!blockInputs}
          />
        </View>
      </View>

      {/* Informations */}
      <RNText style={styles.sectionLabel}>Informations</RNText>
      <View style={styles.row}>
        <View style={[styles.infoTile, compact && styles.infoTileCompact]}>
          <MapPin size={compact ? 14 : 16} color={colors.gray[400]} strokeWidth={1.8} />
          <RNText style={[styles.infoTileValue, compact && styles.infoTileValueCompact]}>{orderInfo.tableName}</RNText>
          {!compact && <RNText style={styles.infoTileLabel}>Table</RNText>}
        </View>
        <View style={[styles.infoTile, compact && styles.infoTileCompact]}>
          <ShoppingBag size={compact ? 14 : 16} color={colors.gray[400]} strokeWidth={1.8} />
          <RNText style={[styles.infoTileValue, compact && styles.infoTileValueCompact]}>{summary.totalItems}</RNText>
          {!compact && <RNText style={styles.infoTileLabel}>Article{summary.totalItems > 1 ? 's' : ''}</RNText>}
        </View>
        <View style={[styles.infoTile, compact && styles.infoTileCompact, { backgroundColor: getStatusColor(globalStatus), borderColor: darkenColor(getStatusColor(globalStatus), 0.2) }]}>
          {!compact && <View style={[styles.infoTileStatusDot, { backgroundColor: getStatusTextColor(globalStatus) }]} />}
          <RNText style={[styles.infoTileValue, compact && styles.infoTileValueCompact, { color: getStatusTextColor(globalStatus) }]}>
            {getStatusText(globalStatus)}
          </RNText>
          {!compact && <RNText style={[styles.infoTileLabel, { color: getStatusTextColor(globalStatus), opacity: 0.7 }]}>Statut</RNText>}
        </View>
      </View>

      {/* Récap */}
      <View style={styles.row}>
        <View style={[styles.infoTile, compact && styles.infoTileCompact]}>
          {!compact && <Clock size={16} color={colors.gray[400]} strokeWidth={1.8} />}
          <RNText style={[styles.infoTileValue, compact && styles.infoTileValueCompact]}>{formatDate(order.createdAt, DateFormat.TIME)}</RNText>
          <RNText style={[styles.infoTileLabel, compact && styles.infoTileLabelCompact]}>Début</RNText>
        </View>
        <View style={[styles.infoTile, compact && styles.infoTileCompact]}>
          {!compact && <Clock size={16} color={colors.gray[400]} strokeWidth={1.8} />}
          <RNText style={[styles.infoTileValue, compact && styles.infoTileValueCompact]}>{orderInfo.duration}</RNText>
          <RNText style={[styles.infoTileLabel, compact && styles.infoTileLabelCompact]}>Durée</RNText>
        </View>
        <View style={[
          styles.infoTile,
          compact && styles.infoTileCompact,
          summary.remaining > 0 && summary.paidAmount > 0 && {
            backgroundColor: colors.warning.bg,
            borderColor: colors.warning.base,
          },
          summary.remaining === 0 && summary.paidAmount > 0 && {
            backgroundColor: colors.success.bg,
            borderColor: colors.success.border,
          },
        ]}>
          {!compact && <Wallet size={16} color={summary.remaining > 0 && summary.paidAmount > 0 ? colors.warning.dark : summary.remaining === 0 && summary.paidAmount > 0 ? colors.success.dark : colors.gray[400]} strokeWidth={1.8} />}
          {summary.paidAmount > 0 && summary.remaining > 0 ? (
            <>
              <View style={styles.remainingRow}>
                <RNText style={[styles.remainingValue, compact && { fontSize: 13 }]}>{formatPrice(summary.remaining)}</RNText>
                <RNText style={styles.totalStrikethrough}>{formatPrice(summary.totalAmount)}</RNText>
              </View>
              <RNText style={[styles.infoTileLabel, compact && styles.infoTileLabelCompact, { color: colors.warning.dark }]}>À payer</RNText>
            </>
          ) : (
            <>
              <RNText style={[
                styles.infoTileValue,
                compact && styles.infoTileValueCompact,
                summary.remaining === 0 && summary.paidAmount > 0 && { color: colors.success.dark },
              ]}>
                {formatPrice(summary.totalAmount)}
              </RNText>
              <RNText style={[
                styles.infoTileLabel,
                compact && styles.infoTileLabelCompact,
                summary.remaining === 0 && summary.paidAmount > 0 && { color: colors.success.dark },
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
    backgroundColor: colors.neutral[50],
    padding: 16,
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[400],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingLeft: 2,
  },

  // Rows: fixed base height, never grow, shrink AFTER note reaches minHeight
  row: {
    flexBasis: 80,
    flexGrow: 0,
    flexShrink: 1,
    minHeight: 46,
    maxHeight: 95,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },

  // Boutons — mode normal (vertical)
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    } as any : {}),
  },
  // Glass overlay iso item cards
  glassOverlay: {
    flex: 1,
    backgroundColor: getColorWithOpacity(colors.white, 0.65),
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  glassOverlayCompact: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[700],
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
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
  },
  lockOverlayCompact: {
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 4,
  },
  lockLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[400],
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
    color: colors.brand.dark,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  disabledReasonCompact: {
    fontSize: 7,
  },

  // Info tiles — mode normal
  infoTile: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  // Info tiles — mode compact (icône + valeur sur une ligne, pas de label)
  infoTileCompact: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  infoTileValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[800],
    textAlign: 'center',
  },
  infoTileValueCompact: {
    fontSize: 12,
  },
  infoTileLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.gray[400],
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

  // Note: only element that grows, shrinks FIRST (10x faster than rows)
  noteWrapper: {
    flexGrow: 1,
    flexShrink: 10,
    flexBasis: 60,
    minHeight: 37,
  },
  noteCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    overflow: 'hidden',
  },
  noteInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[700],
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
    color: colors.gray[400],
    textDecorationLine: 'line-through',
  },
  remainingValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.warning.dark,
  },
});
