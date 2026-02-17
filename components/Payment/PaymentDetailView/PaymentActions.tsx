import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Printer, Mail, DollarSign, FileText } from 'lucide-react-native';
import type { Payment } from '~/types/payment.types';

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
          android_ripple={{ color: '#E5E7EB' }}
        >
          <Printer size={20} color="#374151" strokeWidth={2} />
          <Text style={styles.buttonText}>Réimprimer</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={onSendEmail}
          android_ripple={{ color: '#E5E7EB' }}
        >
          <Mail size={20} color="#374151" strokeWidth={2} />
          <Text style={styles.buttonText}>Email</Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, isRefundDisabled && styles.disabledButton]}
          onPress={onRefund}
          disabled={isRefundDisabled}
          android_ripple={{ color: isRefundDisabled ? 'transparent' : '#E5E7EB' }}
        >
          <DollarSign size={20} color={isRefundDisabled ? '#9CA3AF' : '#374151'} strokeWidth={2} />
          <Text style={[styles.buttonText, isRefundDisabled && styles.disabledText]}>
            Rembourser
          </Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={onViewAudit}
          android_ripple={{ color: '#E5E7EB' }}
        >
          <FileText size={20} color="#374151" strokeWidth={2} />
          <Text style={styles.buttonText}>Audit</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
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
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#9CA3AF',
  },
});
