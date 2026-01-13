import { View, Text } from 'react-native'
import { CheckCircle } from 'lucide-react-native'
import type { Payment, LedgerEvent } from '~/api/payment.api'
import { InfoRow } from '../shared/InfoRow'

interface TechnicalInfoProps {
  payment: Payment
  auditLogs?: LedgerEvent[]
}

export function TechnicalInfo({ payment, auditLogs }: TechnicalInfoProps) {
  return (
    <View className="bg-white p-4 border-t border-gray-200">
      <Text className="text-sm font-semibold text-gray-600 mb-3">INFORMATIONS TECHNIQUES</Text>

      <View className="space-y-2">
        {payment.transactionReference && (
          <InfoRow
            label="Référence transaction:"
            value={payment.transactionReference}
            valueStyle="font-mono text-sm"
          />
        )}
        <InfoRow
          label="ID Paiement:"
          value={payment.id}
          valueStyle="font-mono text-xs text-gray-600"
        />
        <InfoRow
          label="ID Commande:"
          value={payment.orderId}
          valueStyle="font-mono text-xs text-gray-600"
        />

        {auditLogs && auditLogs.length > 0 && (
          <>
            <View className="h-px bg-gray-200 my-2" />
            <InfoRow
              label="Audit NF525:"
              value={
                <View className="flex-row items-center gap-1">
                  <CheckCircle size={16} color="#059669" />
                  <Text className="text-green-600">Vérifié</Text>
                </View>
              }
            />
            <InfoRow label="Séquence ledger:" value={`#${auditLogs[0].seq}`} />
            <InfoRow
              label="Hash signature:"
              value={`${auditLogs[0].hash.substring(0, 8)}...${auditLogs[0].hash.substring(
                auditLogs[0].hash.length - 4
              )}`}
              valueStyle="font-mono text-xs text-gray-600"
            />
          </>
        )}
      </View>
    </View>
  )
}
