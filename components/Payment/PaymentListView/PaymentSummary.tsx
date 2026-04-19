import { View, Text, StyleSheet } from 'react-native';
import type { PaymentSummary as PaymentSummaryType } from '~/types/payment-history.types';
import { PaymentStatusBadge } from '../shared/PaymentStatusBadge';
import { formatPrice } from '~/lib/utils';
import { CheckCircle } from 'lucide-react-native';
import { colors } from '~/theme';

interface PaymentSummaryProps {
  summary: PaymentSummaryType;
}

export function PaymentSummary({ summary }: PaymentSummaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>RÉSUMÉ DE LA COMMANDE</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total de la commande:</Text>
          <Text style={styles.statValue}>{formatPrice(summary.totalAmount)}</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total payé:</Text>
          <View style={styles.paidAmountContainer}>
            <Text style={styles.paidAmount}>
              {formatPrice(summary.paidAmount)}
            </Text>
            {summary.status === 'paid' && (
              <CheckCircle size={16} color={colors.success.base} strokeWidth={2} />
            )}
          </View>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Reste à payer:</Text>
          <Text
            style={[
              styles.statValue,
              summary.remainingAmount > 0 ? styles.remainingAmount : styles.remainingAmountZero
            ]}
          >
            {formatPrice(summary.remainingAmount)}
          </Text>
        </View>
      </View>

      <View style={styles.badgeContainer}>
        <PaymentStatusBadge status={summary.status} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray[50],
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  statsContainer: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[800],
  },
  paidAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paidAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success.base,
  },
  remainingAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning.base,
  },
  remainingAmountZero: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[400],
  },
  badgeContainer: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
});