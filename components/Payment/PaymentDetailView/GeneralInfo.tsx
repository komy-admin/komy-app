import { View, Text, StyleSheet } from 'react-native';
import type { Payment } from '~/api/payment.api';
import { InfoRow } from '../shared/InfoRow';
import { PaymentMethodIcon } from '../shared/PaymentMethodIcon';
import { PaymentStatusBadge } from '../shared/PaymentStatusBadge';
import { formatPrice } from '~/lib/utils';

interface GeneralInfoProps {
  payment: Payment;
}

export function GeneralInfo({ payment }: GeneralInfoProps) {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentMethodLabel = (method: Payment['paymentMethod']) => {
    const labels = {
      card: 'Carte Bancaire',
      cash: 'Espèces',
      check: 'Chèque',
      ticket_resto: 'Ticket Restaurant',
    };
    return labels[method];
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>INFORMATIONS GÉNÉRALES</Text>

      <View style={styles.content}>
        <InfoRow
          label="Numéro de paiement:"
          value={`#PMT-${payment.id.substring(0, 8).toUpperCase()}`}
        />
        <InfoRow label="Date et heure:" value={formatDateTime(payment.createdAt)} />
        <InfoRow
          label="Encaissé par:"
          value={`${payment.user?.firstName} ${payment.user?.lastName} (${payment.user?.role})`}
        />
        <InfoRow
          label="Méthode de paiement:"
          value={
            <View style={styles.paymentMethodContainer}>
              <PaymentMethodIcon method={payment.paymentMethod} size={20} />
              <Text style={styles.paymentMethodText}>
                {getPaymentMethodLabel(payment.paymentMethod)}
              </Text>
            </View>
          }
        />
        <InfoRow label="Status:" value={<PaymentStatusBadge status={payment.status} />} />

        <View style={styles.divider} />

        <InfoRow
          label="Montant payé:"
          value={formatPrice(payment.amount)}
          valueStyle={styles.amountValue}
        />
        {payment.tipAmount && payment.tipAmount > 0 && (
          <InfoRow label="Pourboire:" value={formatPrice(payment.tipAmount)} />
        )}
        <View style={styles.thickDivider} />
        <InfoRow
          label="Total:"
          value={formatPrice(payment.amount + (payment.tipAmount || 0))}
          valueStyle={styles.totalValue}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  content: {
    gap: 12,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  thickDivider: {
    height: 1,
    backgroundColor: '#D1D5DB',
    marginVertical: 4,
  },
  amountValue: {
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
});
