import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import type { Payment, LedgerEvent } from '~/api/payment.api';
import { InfoRow } from '../shared/InfoRow';

interface TechnicalInfoProps {
  payment: Payment;
  auditLogs?: LedgerEvent[];
}

export function TechnicalInfo({ payment, auditLogs }: TechnicalInfoProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>INFORMATIONS TECHNIQUES</Text>

      <View style={styles.content}>
        {payment.transactionReference && (
          <InfoRow
            label="Référence transaction:"
            value={payment.transactionReference}
            valueStyle={styles.monoText}
          />
        )}
        <InfoRow
          label="ID Paiement:"
          value={payment.id}
          valueStyle={styles.monoTextSmall}
        />
        <InfoRow
          label="ID Commande:"
          value={payment.orderId}
          valueStyle={styles.monoTextSmall}
        />

        {auditLogs && auditLogs.length > 0 && (
          <>
            <View style={styles.divider} />
            <InfoRow
              label="Audit NF525:"
              value={
                <View style={styles.auditContainer}>
                  <CheckCircle size={16} color="#059669" />
                  <Text style={styles.auditText}>Vérifié</Text>
                </View>
              }
            />
            <InfoRow label="Séquence ledger:" value={`#${auditLogs[0].seq}`} />
            <InfoRow
              label="Hash signature:"
              value={`${auditLogs[0].hash.substring(0, 8)}...${auditLogs[0].hash.substring(
                auditLogs[0].hash.length - 4
              )}`}
              valueStyle={styles.monoTextSmall}
            />
          </>
        )}
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
  content: {
    gap: 8,
  },
  monoText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#374151',
  },
  monoTextSmall: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  auditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  auditText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
});
