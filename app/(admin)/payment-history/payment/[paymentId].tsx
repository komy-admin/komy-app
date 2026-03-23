import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ArrowLeft, X, ChevronRight } from 'lucide-react-native'
import { GeneralInfo } from '~/components/Payment/PaymentDetailView/GeneralInfo'
import { AllocationsList } from '~/components/Payment/PaymentDetailView/AllocationsList'
import { TechnicalInfo } from '~/components/Payment/PaymentDetailView/TechnicalInfo'
import { PaymentActions } from '~/components/Payment/PaymentDetailView/PaymentActions'
import RefundModal from '~/components/Payment/RefundModal'
import { Button } from '~/components/ui/button'
import { usePayments } from '~/hooks/usePayments'
import type { Payment } from '~/types/payment.types'
import { extractApiError } from '~/lib/apiErrorHandler'
export default function PaymentDetailScreen() {
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>()
  const router = useRouter()
  const { getPaymentById, getAuditLogs, refundPayment, loading } = usePayments()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false)

  // Charge le paiement depuis l'API
  useEffect(() => {
    const loadPayment = async () => {
      if (!paymentId) return
      try {
        const data = await getPaymentById(paymentId as string)
        setPayment(data)
      } catch (error) {
        console.error('Erreur lors du chargement du paiement:', error)
      }
    }
    loadPayment()
  }, [paymentId, getPaymentById])

  // Charge les audit logs une seule fois
  useEffect(() => {
    const loadAuditLogs = async () => {
      if (!paymentId) return
      try {
        const logs = await getAuditLogs(paymentId as string)
        setAuditLogs(logs)
      } catch (error) {
        console.error('Erreur lors du chargement des logs:', error)
      }
    }
    loadAuditLogs()
  }, [paymentId, getAuditLogs])

  const handleBack = () => {
    router.back()
  }

  const handleClose = () => {
    router.push('/payment-history')
  }

  const handleReprint = () => {
    Alert.alert('Réimprimer', 'Fonctionnalité à implémenter')
  }

  const handleRefund = () => {
    setIsRefundModalOpen(true)
  }

  const handleProcessRefund = async (amount: number, reason: string, method: 'original' | 'cash') => {
    if (!payment) return

    try {
      const result = await refundPayment(payment.id, {
        amount,
        reason,
        refundMethod: method,
      })

      // Afficher un message de succès
      Alert.alert(
        'Remboursement effectué',
        `Le remboursement de ${(amount / 100).toFixed(2)}€ a été effectué avec succès`
      )

      // Recharger le paiement pour voir les mises à jour
      const updatedPayment = await getPaymentById(payment.id)
      setPayment(updatedPayment)

      // Fermer le modal
      setIsRefundModalOpen(false)
    } catch (error) {
      const info = extractApiError(error)
      throw new Error(info.message || 'Erreur lors du remboursement')
    }
  }

  const handleViewAudit = () => {
    Alert.alert('Audit Trail', 'Fonctionnalité à implémenter')
  }

  const handleSendEmail = () => {
    Alert.alert('Envoyer par email', 'Fonctionnalité à implémenter')
  }

  if (loading || !payment) {
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
        <Button variant="ghost" onPress={handleBack}>
          <ArrowLeft size={24} color="#374151" />
        </Button>
        <Text className="text-lg font-bold">Détail Paiement</Text>
        <Button variant="ghost" onPress={handleClose}>
          <X size={24} color="#374151" />
        </Button>
      </View>

      {/* Breadcrumb */}
      <View className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <View className="flex-row items-center gap-1 flex-wrap">
          <Text className="text-sm text-gray-600">Historique</Text>
          <ChevronRight size={12} color="#9CA3AF" />
          <Text className="text-sm text-gray-600">Commandes</Text>
          <ChevronRight size={12} color="#9CA3AF" />
          <Text className="text-sm text-gray-600">Paiements</Text>
          <ChevronRight size={12} color="#9CA3AF" />
          <Text className="text-sm text-gray-900 font-medium">
            #PMT-{payment.id.substring(0, 8)}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Section 1: Informations générales */}
        <GeneralInfo payment={payment} />

        {/* Section 2: Items payés (allocations) */}
        {payment.allocations && payment.allocations.length > 0 && (
          <AllocationsList allocations={payment.allocations} tipAmount={payment.tipAmount} />
        )}

        {/* Section 3: Informations techniques */}
        <TechnicalInfo payment={payment} auditLogs={auditLogs} />

        {/* Section 4: Actions */}
        <PaymentActions
          payment={payment}
          onReprint={handleReprint}
          onRefund={handleRefund}
          onViewAudit={handleViewAudit}
          onSendEmail={handleSendEmail}
        />
      </ScrollView>

      {/* Modal de remboursement */}
      {payment && (
        <RefundModal
          isOpen={isRefundModalOpen}
          onClose={() => setIsRefundModalOpen(false)}
          payment={payment}
          onRefund={handleProcessRefund}
        />
      )}
    </View>
  )
}
