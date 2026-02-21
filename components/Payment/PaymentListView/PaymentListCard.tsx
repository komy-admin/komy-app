import { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronRight, CreditCard, Banknote, FileText, Ticket, Clock } from 'lucide-react-native';
import type { Payment } from '~/types/payment.types';
import { formatPrice, DateFormat, formatDate } from '~/lib/utils';

interface PaymentListCardProps {
  payment: Payment;
  onPress: () => void;
}

const getPaymentMethodIcon = (method: Payment['paymentMethod']) => {
  const iconProps = { size: 20, strokeWidth: 2 };
  switch (method) {
    case 'card':
      return <CreditCard {...iconProps} color="#6366F1" />;
    case 'cash':
      return <Banknote {...iconProps} color="#10B981" />;
    case 'check':
      return <FileText {...iconProps} color="#F59E0B" />;
    case 'ticket_resto':
      return <Ticket {...iconProps} color="#EC4899" />;
    default:
      return <CreditCard {...iconProps} color="#9CA3AF" />;
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
      return '#10B981'; // green
    case 'pending':
      return '#F59E0B'; // amber
    case 'failed':
      return '#EF4444'; // red
    case 'refunded':
      return '#8B5CF6'; // violet
    default:
      return '#9CA3AF'; // gray
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
            <Clock size={10} color="#9CA3AF" strokeWidth={2} />
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
          <ChevronRight size={16} color="#9CA3AF" strokeWidth={2} />
        </View>
      </View>
    </Pressable>
  );
});

PaymentListCard.displayName = 'PaymentListCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    shadowColor: '#000',
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
    color: '#1F2937',
    flexShrink: 1,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
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
    color: '#6B7280',
  },
  tipAmount: {
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
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
    color: '#6B7280',
    fontWeight: '500',
  },
  separator: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
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
    color: '#9CA3AF',
    fontWeight: '500',
  },
});