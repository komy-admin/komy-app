import { View, Text } from 'react-native'

interface PaymentStatusBadgeProps {
  status:
    | 'completed'
    | 'pending'
    | 'failed'
    | 'refunded'
    | 'fully_paid'
    | 'partially_paid'
    | 'unpaid'
  size?: 'sm' | 'md' | 'lg'
}

const STATUS_CONFIG = {
  completed: { label: 'COMPLETÉ', color: 'bg-green-100', textColor: 'text-green-800' },
  pending: { label: 'EN ATTENTE', color: 'bg-yellow-100', textColor: 'text-yellow-800' },
  failed: { label: 'ÉCHOUÉ', color: 'bg-red-100', textColor: 'text-red-800' },
  refunded: { label: 'REMBOURSÉ', color: 'bg-gray-100', textColor: 'text-gray-800' },
  fully_paid: {
    label: 'ENTIEREMENT PAYE',
    color: 'bg-green-100',
    textColor: 'text-green-800',
  },
  partially_paid: {
    label: 'PARTIELLEMENT PAYE',
    color: 'bg-orange-100',
    textColor: 'text-orange-800',
  },
  unpaid: { label: 'NON PAYE', color: 'bg-red-100', textColor: 'text-red-800' },
}

export function PaymentStatusBadge({ status, size = 'md' }: PaymentStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <View className={`${config.color} ${sizeClass} rounded-full`}>
      <Text className={`font-semibold ${config.textColor}`}>{config.label}</Text>
    </View>
  )
}
