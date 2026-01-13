import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useState, useMemo, useEffect } from 'react'
import { RefreshCw, Filter as FilterIcon, ArrowLeft } from 'lucide-react-native'
import type { PaymentHistoryFilters, OrderWithPayments } from '~/types/payment-history.types'
import { PaymentPeriodSummary } from '~/components/Payment/PaymentHistoryScreen/PaymentPeriodSummary'
import { OrderWithPaymentsCard } from '~/components/Payment/PaymentHistoryScreen/OrderWithPaymentsCard'
import { Button } from '~/components/ui/button'
import { usePayments } from '~/hooks/usePayments'

export default function PaymentHistoryScreen() {
  const router = useRouter()
  const { getOrdersWithPayments, loading } = usePayments()
  const [ordersWithPayments, setOrdersWithPayments] = useState<OrderWithPayments[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [filters, setFilters] = useState<PaymentHistoryFilters>({
    period: 'today',
    startDate: null,
    endDate: null,
    serverId: null,
    status: 'all',
    searchQuery: '',
  })

  const loadData = async () => {
    try {
      const data = await getOrdersWithPayments(filters)
      setOrdersWithPayments(data)
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadData()
    setIsRefreshing(false)
  }

  useEffect(() => {
    loadData()
  }, [filters])

  const summary = useMemo(() => {
    return {
      ordersCount: ordersWithPayments?.length || 0,
      totalAmount: ordersWithPayments?.reduce((sum, o) => sum + o.totalAmount, 0) || 0,
      paymentsCount: ordersWithPayments?.reduce((sum, o) => sum + o.paymentsCount, 0) || 0,
    }
  }, [ordersWithPayments])

  const handleViewOrderPayments = (orderId: string) => {
    router.push(`/payment-history/order/${orderId}`)
  }

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-3">
            <Button variant="ghost" onPress={() => router.back()}>
              <ArrowLeft size={24} color="#374151" />
            </Button>
            <Text className="text-xl font-bold">Historique des Paiements</Text>
          </View>
          <View className="flex-row gap-2">
            <Button
              variant="ghost"
              onPress={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw size={20} color={isRefreshing ? '#9CA3AF' : '#374151'} />
            </Button>
          </View>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Chargement...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1">
          {/* Résumé de période */}
          <PaymentPeriodSummary
            summary={summary}
            filters={filters}
            onFiltersChange={setFilters}
          />

          {/* Liste des commandes */}
          <View className="px-4 pb-4">
            {ordersWithPayments && ordersWithPayments.length > 0 ? (
              ordersWithPayments.map((order) => (
                <OrderWithPaymentsCard
                  key={order.id}
                  order={order}
                  onPress={() => handleViewOrderPayments(order.id)}
                />
              ))
            ) : (
              <View className="bg-white rounded-lg p-8 items-center">
                <Text className="text-gray-500 text-center">
                  Aucune commande avec paiement trouvée pour cette période
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  )
}
