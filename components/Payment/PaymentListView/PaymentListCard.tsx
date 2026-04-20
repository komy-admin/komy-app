import { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronRight, CreditCard, Banknote, FileText, Ticket, Clock } from 'lucide-react-native';
import type { Payment } from '~/types/payment.types';
import { formatPrice, DateFormat, formatDate } from '~/lib/utils';
import { colors } from '~/theme';

interface PaymentListCardProps {
  payment: Payment;
  onPress: () => void;
}

const getPaymentMethodIcon = (method: Payment['paymentMethod']) => {
  const iconProps = { size: 20, strokeWidth: 2 };
  switch (method) {
    case 'card':
      return <CreditCard {...iconProps} color={colors.brand.accent} />;
    case 'cash':
      return <Banknote {...iconProps} color={colors.success.base} />;
    case 'check':
      return <FileText {...iconProps} color={colors.warning.base} />;
    case 'ticket_resto':
      return <Ticket {...iconProps} color={colors.pink} />;
    default:
      return <CreditCard {...iconProps} color={colors.gray[400]} />;
  }
};

const getPaymentMethodLabel = (method: Payment['paymentMethod']) => {
  const labels = {
    card: 'Carte Bancaire',
    cash: 'Espèces',
    check: 'Chèque',
    ticket_resto: 'Ticket Restaurant',
  };
  return labels[method] || 'Inconnu';
};

const getPaymentStatusColor = (status: Payment['status']) => {
  switch (status) {
    case 'completed':
      return colors.success.base; // green
    case 'pending':
      return colors.warning.base; // amber
    case 'failed':
      return colors.error.base; // red
    case 'refunded':
      return colors.purple.alt; // violet
    default:
      return colors.gray[400]; // gray
  }
};

const getPaymentStatusText = (status: Payment['status']) => {
  switch (status) {
    case 'completed':
      return 'COMPLÉTÉ';
    case 'pending':
      return 'EN ATTENTE';
    case 'failed':
      return 'ÉCHOUÉ';
    case 'refunded':
      return 'REMBOURSÉ';
    default:
      return 'INCONNU';
  }
};

export const PaymentListCard = memo<PaymentListCardProps>(({ payment, onPress }) => {
  const statusColor = getPaymentStatusColor(payment.status);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { borderColor: statusColor }]}
      android_ripple={{ color: `${statusColor}40` }}
    >
      {/* Header - Method Icon + Label + Amount */}
      <View style={styles.header}>
        <View style={styles.methodContainer}>
          {getPaymentMethodIcon(payment.paymentMethod)}
          <Text style={styles.methodLabel} numberOfLines={1}>
            {getPaymentMethodLabel(payment.paymentMethod)}
          </Text>
        </View>
        <Text style={styles.amount}>{formatPrice(payment.amount)}</Text>
      </View>

      {/* Tip Amount if present */}
      {payment.tipAmount && payment.tipAmount > 0 && (
        <View style={styles.tipContainer}>
          <Text style={styles.tipLabel}>Pourboire:</Text>
          <Text style={styles.tipAmount}>{formatPrice(payment.tipAmount)}</Text>
        </View>
      )}

      <View style={styles.divider} />

      {/* Footer - Time + User + Status + Items Count */}
      <View style={styles.footer}>
        <View style={styles.metaInfo}>
          <View style={styles.timeContainer}>
            <Clock size={10} color={colors.gray[400]} strokeWidth={2} />
            <Text style={styles.metaText}>
              {formatDate(payment.createdAt, DateFormat.TIME)}
            </Text>
          </View>
          {payment.user && (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.metaText} numberOfLines={1}>
                {payment.user.firstName} {payment.user.lastName}
              </Text>
            </>
          )}
          <Text style={styles.separator}>•</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{getPaymentStatusText(payment.status)}</Text>
          </View>
        </View>

        <View style={styles.rightContainer}>
          <Text style={styles.itemsCount}>
            {payment.allocations?.length || 0} items
          </Text>
          <ChevronRight size={16} color={colors.gray[400]} strokeWidth={2} />
        </View>
      </View>
    </Pressable>
  );
});

PaymentListCard.displayName = 'PaymentListCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    shadowColor: colors.brand.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  methodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  methodLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[800],
    flexShrink: 1,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[800],
  },
  tipContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 28, // Indented to show it's related to amount
  },
  tipLabel: {
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.gray[500],
  },
  tipAmount: {
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
    color: colors.gray[500],
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.gray[500],
    fontWeight: '500',
  },
  separator: {
    fontSize: 12,
    color: colors.gray[400],
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemsCount: {
    fontSize: 12,
    color: colors.gray[400],
    fontWeight: '500',
  },
});