import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Printer, Mail, Euro, FileText } from 'lucide-react-native';
import type { Payment } from '~/types/payment.types';
import { colors } from '~/theme';

interface PaymentActionsProps {
  payment: Payment;
  onReprint: () => void;
  onRefund: () => void;
  onViewAudit: () => void;
  onSendEmail: () => void;
}

export function PaymentActions({
  payment,
  onReprint,
  onRefund,
  onViewAudit,
  onSendEmail,
}: PaymentActionsProps) {
  const isRefundDisabled = payment.status !== 'completed';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ACTIONS</Text>

      <View style={styles.buttonsContainer}>
        <Pressable
          style={styles.actionButton}
          onPress={onReprint}
          android_ripple={{ color: colors.gray[200] }}
        >
          <Printer size={20} color={colors.gray[700]} strokeWidth={2} />
          <Text style={styles.buttonText}>Réimprimer</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={onSendEmail}
          android_ripple={{ color: colors.gray[200] }}
        >
          <Mail size={20} color={colors.gray[700]} strokeWidth={2} />
          <Text style={styles.buttonText}>Email</Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, isRefundDisabled && styles.disabledButton]}
          onPress={onRefund}
          disabled={isRefundDisabled}
          android_ripple={{ color: isRefundDisabled ? 'transparent' : colors.gray[200] }}
        >
          <Euro size={20} color={isRefundDisabled ? colors.gray[400] : colors.gray[700]} strokeWidth={2} />
          <Text style={[styles.buttonText, isRefundDisabled && styles.disabledText]}>
            Rembourser
          </Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={onViewAudit}
          android_ripple={{ color: colors.gray[200] }}
        >
          <FileText size={20} color={colors.gray[700]} strokeWidth={2} />
          <Text style={styles.buttonText}>Audit</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.gray[400],
  },
});
