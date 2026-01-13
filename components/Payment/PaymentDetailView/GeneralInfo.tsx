import { View, Text } from 'react-native'
import type { Payment } from '~/api/payment.api'
import { InfoRow } from '../shared/InfoRow'
import { PaymentMethodIcon } from '../shared/PaymentMethodIcon'
import { PaymentStatusBadge } from '../shared/PaymentStatusBadge'
import { formatPrice } from '~/lib/utils'

interface GeneralInfoProps {
  payment: Payment
}

export function GeneralInfo({ payment }: GeneralInfoProps) {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPaymentMethodLabel = (method: Payment['paymentMethod']) => {
    const labels = {
      card: 'Carte Bancaire',
      cash: 'Espèces',
      check: 'Chèque',
      ticket_resto: 'Ticket Restaurant',
    }
    return labels[method]
  }

  return (
    <View className="bg-white p-4 border-b border-gray-200">
      <Text className="text-sm font-semibold text-gray-600 mb-3">INFORMATIONS GÉNÉRALES</Text>

      <View className="space-y-3">
        <InfoRow
          label="Numéro de paiement:"
          value={`#PMT-${payment.id.substring(0, 8).toUpperCase()}`}
        />
        <InfoRow label="Date et heure:" value={formatDateTime(payment.createdAt)} />
        <InfoRow
          label="Encaissé par:"
          value={`${payment.user?.firstName} ${payment.user?.lastName} (${payment.user?.role})`}
        />
        <InfoRow
          label="Méthode de paiement:"
          value={
            <View className="flex-row items-center gap-2">
              <PaymentMethodIcon method={payment.paymentMethod} size={20} />
              <Text>{getPaymentMethodLabel(payment.paymentMethod)}</Text>
            </View>
          }
        />
        <InfoRow label="Status:" value={<PaymentStatusBadge status={payment.status} />} />

        <View className="h-px bg-gray-200 my-2" />

        <InfoRow
          label="Montant payé:"
          value={formatPrice(payment.amount)}
          valueStyle="font-bold"
        />
        {payment.tipAmount && payment.tipAmount > 0 && (
          <InfoRow label="Pourboire:" value={formatPrice(payment.tipAmount)} />
        )}
        <View className="h-px bg-gray-300 my-1" />
        <InfoRow
          label="Total:"
          value={formatPrice(payment.amount + (payment.tipAmount || 0))}
          valueStyle="text-lg font-bold"
        />
      </View>
    </View>
  )
}
