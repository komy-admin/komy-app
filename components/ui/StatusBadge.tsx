import React from 'react';
import { View, Text as RNText, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';
import { Status } from '~/types/status.enum';
import { getStatusText, getStatusColor, getStatusTextColor } from '~/lib/status.utils';
import { getColorWithOpacity } from '~/lib/color-utils';
import { colors } from '~/theme';

type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overpaid';

interface StatusBadgeProps {
  status: Status | string;
  showLock?: boolean;
}

interface PaymentBadgeProps {
  paymentStatus: PaymentStatus;
  showLock?: boolean;
}

/**
 * Badge de statut réutilisable — bg couleur du statut à 15%, texte couleur du statut, uppercase.
 *
 * Utilisé dans les tickets, le panel de review, l'OrdersBoard, etc.
 */
export function StatusBadge({ status, showLock }: StatusBadgeProps) {
  const s = (status || '') as Status;
  const textColor = getStatusTextColor(s);
  const bgColor = getStatusColor(s);
  const label = getStatusText(s);

  if (!label) return null;

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      {showLock && <Lock size={11} color={textColor} strokeWidth={2.5} />}
      <RNText style={[styles.text, { color: textColor }]}>{label}</RNText>
    </View>
  );
}

/**
 * Badge de paiement — Payé (success) ou Partiel (warning).
 */
export function PaymentBadge({ paymentStatus, showLock }: PaymentBadgeProps) {
  if (paymentStatus === 'unpaid') return null;

  const isPaid = paymentStatus === 'paid' || paymentStatus === 'overpaid';
  const baseColor = isPaid ? colors.success.base : colors.warning.base;
  const label = paymentStatus === 'overpaid' ? 'Trop-perçu' : isPaid ? 'Payé' : 'Partiel';

  return (
    <View style={[styles.badge, { backgroundColor: getColorWithOpacity(baseColor, 0.15) }]}>
      {showLock && <Lock size={11} color={baseColor} strokeWidth={2.5} />}
      <RNText style={[styles.text, { color: baseColor }]}>{label}</RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  text: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
