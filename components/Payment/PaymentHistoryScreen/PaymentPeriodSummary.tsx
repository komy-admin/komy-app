import { View, Text, ScrollView } from 'react-native'
import type { PeriodSummary, PaymentHistoryFilters } from '~/types/payment-history.types'
import { formatPrice } from '~/lib/utils'
import { SelectButton } from '~/components/ui/select-button'

interface PaymentPeriodSummaryProps {
  summary: PeriodSummary
  filters: PaymentHistoryFilters
  onFiltersChange: (filters: PaymentHistoryFilters) => void
}

const PERIOD_OPTIONS = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'yesterday', label: 'Hier' },
  { value: 'this_week', label: 'Cette semaine' },
  { value: 'this_month', label: 'Ce mois' },
] as const

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'fully_paid', label: 'Payé' },
  { value: 'partially_paid', label: 'Partiel' },
  { value: 'unpaid', label: 'Impayé' },
  { value: 'refunded', label: 'Remboursé' },
] as const

export function PaymentPeriodSummary({
  summary,
  filters,
  onFiltersChange,
}: PaymentPeriodSummaryProps) {
  return (
    <View className="bg-white m-4 p-4 rounded-lg shadow-sm">
      <Text className="text-sm font-semibold text-gray-600 mb-3">RÉSUMÉ DE LA PÉRIODE</Text>

      {/* Statistiques */}
      <View className="space-y-2 mb-4">
        <View className="flex-row justify-between">
          <Text className="text-gray-600">Commandes avec paiements:</Text>
          <Text className="font-bold">{summary.ordersCount}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-gray-600">Total encaissé:</Text>
          <Text className="font-bold text-green-600">{formatPrice(summary.totalAmount)}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-gray-600">Paiements enregistrés:</Text>
          <Text className="font-bold">{summary.paymentsCount}</Text>
        </View>
      </View>

      {/* Filtre Période */}
      <View className="mb-3">
        <Text className="text-sm font-medium text-gray-700 mb-2">Période</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {PERIOD_OPTIONS.map((option) => (
              <SelectButton
                key={option.value}
                label={option.label}
                isActive={filters.period === option.value}
                onPress={() =>
                  onFiltersChange({
                    ...filters,
                    period: option.value,
                  })
                }
                variant="pill"
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Filtre Status */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">Statut</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {STATUS_OPTIONS.map((option) => (
              <SelectButton
                key={option.value}
                label={option.label}
                isActive={filters.status === option.value}
                onPress={() =>
                  onFiltersChange({
                    ...filters,
                    status: option.value,
                  })
                }
                variant="pill"
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  )
}
