import { View, Text, StyleSheet } from 'react-native';
import { colors } from '~/theme';

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
      return { label: 'COMPLÉTÉ', backgroundColor: colors.success.bg, color: colors.success.dark };
    case 'pending':
      return { label: 'EN ATTENTE', backgroundColor: colors.warning.border, color: colors.warning.text };
    case 'failed':
      return { label: 'ÉCHOUÉ', backgroundColor: colors.error.bg, color: colors.error.text };
    case 'refunded':
      return { label: 'REMBOURSÉ', backgroundColor: colors.gray[100], color: colors.gray[700] };
    case 'paid':
      return { label: 'ENTIÈREMENT PAYÉ', backgroundColor: colors.success.bg, color: colors.success.dark };
    case 'partial':
      return { label: 'PARTIELLEMENT PAYÉ', backgroundColor: colors.warning.border, color: colors.warning.text };
    case 'unpaid':
      return { label: 'NON PAYÉ', backgroundColor: colors.error.bg, color: colors.error.text };
    case 'overpaid':
      return { label: 'SURPAYÉ', backgroundColor: colors.neutral[200], color: colors.purple.alt };
    default:
      return { label: 'INCONNU', backgroundColor: colors.gray[100], color: colors.gray[700] };
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