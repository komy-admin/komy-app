import { View, Text } from 'react-native'
import type { ReactNode } from 'react'

interface InfoRowProps {
  label: string
  value: string | ReactNode
  labelStyle?: string
  valueStyle?: string
}

export function InfoRow({ label, value, labelStyle, valueStyle }: InfoRowProps) {
  return (
    <View className="flex-row justify-between items-start">
      <Text className={`text-gray-600 flex-1 ${labelStyle || ''}`}>{label}</Text>
      {typeof value === 'string' ? (
        <Text className={`text-right flex-1 ${valueStyle || ''}`}>{value}</Text>
      ) : (
        <View className="flex-1 items-end">{value}</View>
      )}
    </View>
  )
}
