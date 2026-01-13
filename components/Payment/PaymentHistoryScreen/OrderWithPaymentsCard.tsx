import { View, Text, Pressable } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import type { OrderWithPayments } from '~/types/payment-history.types'
import { PaymentStatusBadge } from '../shared/PaymentStatusBadge'
import { formatPrice, formatDate } from '~/lib/utils'

interface OrderWithPaymentsCardProps {
  order: OrderWithPayments
  onPress: () => void
}

export function OrderWithPaymentsCard({ order, onPress }: OrderWithPaymentsCardProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-lg p-4 mb-3 shadow-sm active:opacity-80"
    >
      {/* Header - Table + Room + Status */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-bold">{order.table.name}</Text>
            <Text className="text-gray-500">•</Text>
            <Text className="text-gray-600">{order.table.room.name}</Text>
          </View>
        </View>
        <PaymentStatusBadge status={order.paymentStatus} />
      </View>

      {/* Date + Serveur */}
      <View className="flex-row items-center gap-2 mb-3 flex-wrap">
        <Text className="text-sm text-gray-600">
          {formatDate(order.createdAt, 'DD/MM/YYYY')}
        </Text>
        <Text className="text-gray-500">•</Text>
        <Text className="text-sm text-gray-600">{formatTime(order.createdAt)}</Text>
        {order.user && (
          <>
            <Text className="text-gray-500">•</Text>
            <Text className="text-sm text-gray-600">
              {order.user.firstName} {order.user.lastName}
            </Text>
          </>
        )}
      </View>

      {/* Montants */}
      <View className="h-px bg-gray-200 mb-3" />
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm text-gray-600">Total:</Text>
        <Text className="font-semibold">{formatPrice(order.totalAmount)}</Text>
      </View>
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm text-gray-600">Payé:</Text>
        <Text className="font-semibold text-green-600">{formatPrice(order.paidAmount)}</Text>
      </View>
      {order.remainingAmount > 0 && (
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm text-gray-600">Reste:</Text>
          <Text className="font-semibold text-orange-600">
            {formatPrice(order.remainingAmount)}
          </Text>
        </View>
      )}
      {order.refundedAmount && order.refundedAmount > 0 && (
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm text-gray-600">Remboursé:</Text>
          <Text className="font-semibold text-red-600">
            {formatPrice(order.refundedAmount)}
          </Text>
        </View>
      )}

      {/* Footer - Paiements count */}
      <View className="h-px bg-gray-200 my-2" />
      <View className="flex-row justify-between items-center">
        <Text className="text-sm text-gray-500">
          {order.paymentsCount} paiement{order.paymentsCount > 1 ? 's' : ''} enregistré
          {order.paymentsCount > 1 ? 's' : ''}
          {order.refundedAmount && order.refundedAmount > 0 && ' (avec remboursement)'}
        </Text>
        <ChevronRight size={16} color="#9CA3AF" />
      </View>
    </Pressable>
  )
}
