import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, X, ChevronRight } from 'lucide-react-native'
import { PaymentSummary } from '~/components/Payment/PaymentListView/PaymentSummary'
import { PaymentListCard } from '~/components/Payment/PaymentListView/PaymentListCard'
import { Button } from '~/components/ui/button'
import { usePayments } from '~/hooks/usePayments'
import type { Payment } from '~/types/payment.types'

export default function PaymentListScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>()
  const router = useRouter()
  const { getPaymentsByOrder } = usePayments()
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    const loadPayments = async () => {
      if (!orderId) return
      try {
        const data = await getPaymentsByOrder(orderId as string)
        setPayments(data)
      } catch (error) {
        console.error('Erreur lors du chargement des paiements:', error)
      }
    }
    loadPayments()
  }, [orderId, getPaymentsByOrder])

  const summary = useMemo(() => {
    if (!payments || payments.length === 0) {
      return {
        totalAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        status: 'unpaid' as 'unpaid' | 'partial' | 'paid' | 'overpaid',
      }
    }

    // Calculer à partir des paiements et de l'ordre
    const paidAmount = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)

    // Récupérer le totalAmount depuis l'ordre (les paiements enrichis contiennent l'ordre)
    const firstPaymentWithOrder = payments.find(p => p.order)
    const totalAmount = firstPaymentWithOrder?.order?.totalAmount || paidAmount
    const remainingAmount = Math.max(0, totalAmount - paidAmount)

    let status: 'unpaid' | 'partial' | 'paid' | 'overpaid' = 'unpaid'
    if (paidAmount > totalAmount) {
      status = 'overpaid'
    } else if (paidAmount === totalAmount && paidAmount > 0) {
      status = 'paid'
    } else if (paidAmount > 0 && paidAmount < totalAmount) {
      status = 'partial'
    }

    return {
      totalAmount,
      paidAmount,
      remainingAmount,
      status,
    }
  }, [payments])

  const handleViewPaymentDetail = (paymentId: string) => {
    router.push(`/payment-history/payment/${paymentId}`)
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
