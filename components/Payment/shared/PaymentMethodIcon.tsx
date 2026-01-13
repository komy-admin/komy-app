import { View, Text } from 'react-native'

interface PaymentMethodIconProps {
  method: 'card' | 'cash' | 'check' | 'ticket_resto'
  size?: number
}

const PAYMENT_METHOD_LABELS = {
  card: 'CB',
  cash: 'ESP',
  check: 'CHQ',
  ticket_resto: 'TR',
}

export function PaymentMethodIcon({ method, size = 24 }: PaymentMethodIconProps) {
  return (
    <View className="bg-gray-200 rounded px-2 py-1">
      <Text style={{ fontSize: size * 0.6 }} className="font-bold text-gray-700">
        {PAYMENT_METHOD_LABELS[method] || 'N/A'}
      </Text>
    </View>
  )
}
