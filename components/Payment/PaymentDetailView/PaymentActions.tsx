import { View, Text, Alert } from 'react-native'
import { Printer, Mail, DollarSign, FileText } from 'lucide-react-native'
import type { Payment } from '~/api/payment.api'
import { Button } from '~/components/ui/button'

interface PaymentActionsProps {
  payment: Payment
  onReprint: () => void
  onRefund: () => void
  onViewAudit: () => void
  onSendEmail: () => void
}

export function PaymentActions({
  payment,
  onReprint,
  onRefund,
  onViewAudit,
  onSendEmail,
}: PaymentActionsProps) {
  return (
    <View className="bg-white p-4 border-t border-gray-200">
      <Text className="text-sm font-semibold text-gray-600 mb-3">ACTIONS</Text>

      <View className="flex-row flex-wrap gap-3">
        <Button variant="outline" onPress={onReprint} className="flex-row items-center gap-2">
          <Printer size={20} color="#374151" />
          <Text>Réimprimer</Text>
        </Button>

        <Button variant="outline" onPress={onSendEmail} className="flex-row items-center gap-2">
          <Mail size={20} color="#374151" />
          <Text>Email</Text>
        </Button>

        <Button
          variant="outline"
          onPress={onRefund}
          disabled={payment.status !== 'completed'}
          className="flex-row items-center gap-2"
        >
          <DollarSign size={20} color={payment.status === 'completed' ? '#374151' : '#9CA3AF'} />
          <Text className={payment.status !== 'completed' ? 'text-gray-400' : ''}>
            Rembourser
          </Text>
        </Button>

        <Button variant="outline" onPress={onViewAudit} className="flex-row items-center gap-2">
          <FileText size={20} color="#374151" />
          <Text>Audit</Text>
        </Button>
      </View>
    </View>
  )
}
