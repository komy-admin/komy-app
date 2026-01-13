import { View, Text } from 'react-native'
import type { PaymentAllocation } from '~/api/payment.api'
import { formatPrice } from '~/lib/utils'

interface AllocationsListProps {
  allocations: PaymentAllocation[]
  tipAmount?: number
}

export function AllocationsList({ allocations, tipAmount }: AllocationsListProps) {
  const subtotal = allocations.reduce((sum, a) => sum + Number(a.allocatedAmount), 0)
  const vat = Math.round(subtotal * 0.1) // 10% TVA (à adapter selon le vrai calcul)
  const totalTTC = subtotal

  return (
    <View className="bg-gray-50 p-4">
      <Text className="text-sm font-semibold text-gray-600 mb-3">ITEMS PAYÉS (Allocations)</Text>

      <View className="space-y-3">
        {allocations.map((allocation, index) => {
          const quantityFraction = Number(allocation.quantityFraction)
          const isSplit = quantityFraction < 1.0

          return (
            <View key={allocation.id}>
              <Text className="font-medium">Item #{index + 1}</Text>
              <View className="flex-row justify-between mt-1">
                <Text className="text-sm text-gray-600">
                  Quantité: {quantityFraction.toFixed(2)}
                  {isSplit && ' (split)'}
                </Text>
                <Text className="text-sm font-semibold">
                  = {formatPrice(allocation.allocatedAmount)}
                </Text>
              </View>

              {index < allocations.length - 1 && <View className="h-px bg-gray-200 mt-3" />}
            </View>
          )
        })}
      </View>

      {/* Totaux */}
      <View className="mt-4 pt-3 border-t border-gray-300">
        <View className="flex-row justify-between mb-1">
          <Text className="text-sm">Sous-total:</Text>
          <Text className="text-sm">{formatPrice(subtotal)}</Text>
        </View>
        <View className="flex-row justify-between mb-1">
          <Text className="text-sm">TVA (10%):</Text>
          <Text className="text-sm">{formatPrice(vat)}</Text>
        </View>
        <View className="h-px bg-gray-300 my-2" />
        <View className="flex-row justify-between">
          <Text className="font-semibold">Total TTC:</Text>
          <Text className="font-semibold">{formatPrice(totalTTC)}</Text>
        </View>
      </View>
    </View>
  )
}
