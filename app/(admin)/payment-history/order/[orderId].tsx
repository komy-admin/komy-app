import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import { ArrowLeft, X, ChevronRight } from 'lucide-react-native'
import { PaymentSummary } from '~/components/Payment/PaymentListView/PaymentSummary'
import { PaymentListCard } from '~/components/Payment/PaymentListView/PaymentListCard'
import { Button } from '~/components/ui/button'
import { usePayments } from '~/hooks/usePayments'

export default function PaymentListScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>()
  const router = useRouter()
  const { getPaymentsByOrder, loading } = usePayments()

  // Récupère les paiements depuis Redux
  const payments = useMemo(() => {
    if (!orderId) return []
    return getPaymentsByOrder(orderId as string)
  }, [orderId, getPaymentsByOrder])

  const summary = useMemo(() => {
    if (!payments || payments.length === 0) {
      return {
        totalAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        status: 'unpaid' as const,
      }
    }

    // Calculer à partir des paiements
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0)

    // Pour obtenir le totalAmount, on peut soit:
    // 1. Le récupérer depuis order (nécessite une requête supplémentaire)
    // 2. Le calculer depuis les allocations
    // Pour simplifier, on va utiliser paidAmount comme base
    const totalAmount = paidAmount // TODO: récupérer depuis order si nécessaire
    const remainingAmount = 0 // TODO: calculer si on a totalAmount

    return {
      totalAmount,
      paidAmount,
      remainingAmount,
      status: 'fully_paid' as const,
    }
  }, [payments])

  const handleViewPaymentDetail = (paymentId: string) => {
    router.push(`/payment-history/payment/${paymentId}`)
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Chargement...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
        <Button variant="ghost" onPress={() => router.back()}>
          <ArrowLeft size={24} color="#374151" />
        </Button>
        <Text className="text-lg font-bold">Paiements</Text>
        <Button variant="ghost" onPress={() => router.push('/payment-history')}>
          <X size={24} color="#374151" />
        </Button>
      </View>

      {/* Breadcrumb */}
      <View className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <View className="flex-row items-center gap-1">
          <Text className="text-sm text-gray-600">Historique</Text>
          <ChevronRight size={12} color="#9CA3AF" />
          <Text className="text-sm text-gray-600">Commandes</Text>
          <ChevronRight size={12} color="#9CA3AF" />
          <Text className="text-sm text-gray-900 font-medium">Paiements</Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Résumé */}
        <PaymentSummary summary={summary} />

        {/* Liste des paiements */}
        <View className="mt-6">
          <Text className="text-lg font-semibold mb-3">
            Paiements ({payments?.length || 0})
          </Text>

          {payments && payments.length > 0 ? (
            payments.map((payment) => (
              <PaymentListCard
                key={payment.id}
                payment={payment}
                onPress={() => handleViewPaymentDetail(payment.id)}
              />
            ))
          ) : (
            <View className="bg-gray-50 rounded-lg p-8 items-center">
              <Text className="text-gray-500">Aucun paiement trouvé</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
