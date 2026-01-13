import { View, Text, Pressable } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import type { Payment } from '~/api/payment.api'
import { PaymentMethodIcon } from '../shared/PaymentMethodIcon'
import { PaymentStatusBadge } from '../shared/PaymentStatusBadge'
import { formatPrice } from '~/lib/utils'

interface PaymentListCardProps {
  payment: Payment
  onPress: () => void
}

export function PaymentListCard({ payment, onPress }: PaymentListCardProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  const getPaymentMethodLabel = (method: Payment['paymentMethod']) => {
    const labels = {
      card: 'Carte Bancaire',
      cash: 'Espèces',
      check: 'Chèque',
      ticket_resto: 'Ticket Restaurant',
    }
    return labels[method]
  }

  return (
    <Pressable
      onPress={onPress}
      className="bg-white border border-gray-200 rounded-lg p-4 mb-3 active:opacity-80"
    >
      {/* Header - Méthode + Montant */}
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center gap-2">
          <PaymentMethodIcon method={payment.paymentMethod} size={24} />
          <Text className="font-semibold">{getPaymentMethodLabel(payment.paymentMethod)}</Text>
        </View>
        <Text className="text-xl font-bold">{formatPrice(payment.amount)}</Text>
      </View>

      {/* Separator */}
      <View className="h-px bg-gray-200 my-2" />

      {/* Footer - Date + User + Status */}
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center gap-3 flex-wrap">
          <Text className="text-sm text-gray-600">{formatTime(payment.createdAt)}</Text>
          <Text className="text-sm text-gray-600">•</Text>
          <Text className="text-sm text-gray-600">
            {payment.user?.firstName} {payment.user?.lastName}
          </Text>
          <Text className="text-sm text-gray-600">•</Text>
          <PaymentStatusBadge status={payment.status} size="sm" />
        </View>

        <View className="flex-row items-center gap-1">
          <Text className="text-sm text-gray-500">
            {payment.allocations?.length || 0} items
          </Text>
          <ChevronRight size={16} color="#9CA3AF" />
        </View>
      </View>
    </Pressable>
  )
}
