import { View, Text } from 'react-native'
import type { PaymentSummary as PaymentSummaryType } from '~/types/payment-history.types'
import { PaymentStatusBadge } from '../shared/PaymentStatusBadge'
import { formatPrice } from '~/lib/utils'

interface PaymentSummaryProps {
  summary: PaymentSummaryType
}

export function PaymentSummary({ summary }: PaymentSummaryProps) {
  return (
    <View className="bg-gray-50 p-4 rounded-lg">
      <Text className="text-sm font-semibold text-gray-600 mb-3">RÉSUMÉ DE LA COMMANDE</Text>

      <View className="space-y-2">
        <View className="flex-row justify-between">
          <Text>Total de la commande:</Text>
          <Text className="font-semibold">{formatPrice(summary.totalAmount)}</Text>
        </View>

        <View className="flex-row justify-between">
          <Text>Total payé:</Text>
          <Text className="font-semibold text-green-600">
            {formatPrice(summary.paidAmount)}
            {summary.status === 'fully_paid' && ' ✓'}
          </Text>
        </View>

        <View className="flex-row justify-between">
          <Text>Reste à payer:</Text>
          <Text
            className={`font-semibold ${
              summary.remainingAmount > 0 ? 'text-orange-600' : 'text-gray-400'
            }`}
          >
            {formatPrice(summary.remainingAmount)}
          </Text>
        </View>
      </View>

      <View className="mt-3">
        <PaymentStatusBadge status={summary.status} />
      </View>
    </View>
  )
}
