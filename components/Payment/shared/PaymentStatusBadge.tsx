import { View, Text, StyleSheet } from 'react-native';

interface PaymentStatusBadgeProps {
  status:
    | 'completed'
    | 'pending'
    | 'failed'
    | 'refunded'
    | 'paid'
    | 'partial'
    | 'unpaid'
    | 'overpaid';
  size?: 'sm' | 'md' | 'lg';
}

const getStatusConfig = (status: PaymentStatusBadgeProps['status']) => {
  switch (status) {
    case 'completed':
      return { label: 'COMPLÉTÉ', backgroundColor: '#D1FAE5', color: '#065F46' };
    case 'pending':
      return { label: 'EN ATTENTE', backgroundColor: '#FEF3C7', color: '#92400E' };
    case 'failed':
      return { label: 'ÉCHOUÉ', backgroundColor: '#FEE2E2', color: '#991B1B' };
    case 'refunded':
      return { label: 'REMBOURSÉ', backgroundColor: '#F3F4F6', color: '#374151' };
    case 'paid':
      return { label: 'ENTIÈREMENT PAYÉ', backgroundColor: '#D1FAE5', color: '#065F46' };
    case 'partial':
      return { label: 'PARTIELLEMENT PAYÉ', backgroundColor: '#FED7AA', color: '#9A3412' };
    case 'unpaid':
      return { label: 'NON PAYÉ', backgroundColor: '#FEE2E2', color: '#991B1B' };
    case 'overpaid':
      return { label: 'SURPAYÉ', backgroundColor: '#E9D5FF', color: '#6B21A8' };
    default:
      return { label: 'INCONNU', backgroundColor: '#F3F4F6', color: '#374151' };
  }
};

export function PaymentStatusBadge({ status, size = 'md' }: PaymentStatusBadgeProps) {
  const config = getStatusConfig(status);

  const containerStyle = [
    styles.container,
    { backgroundColor: config.backgroundColor },
    size === 'sm' && styles.containerSmall,
    size === 'lg' && styles.containerLarge,
  ];

  const textStyle = [
    styles.text,
    { color: config.color },
    size === 'sm' && styles.textSmall,
    size === 'lg' && styles.textLarge,
  ];

  return (
    <View style={containerStyle}>
      <Text style={textStyle}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  containerSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  containerLarge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  textSmall: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 16,
  },
});