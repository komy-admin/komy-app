import React, { useState, useMemo } from 'react'
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Dimensions
} from 'react-native'
import { ForkModal } from '~/components/ui/modal'
import { Button } from '~/components/ui/button'
import { TextInput } from '~/components/ui/text-input'
import { SelectButton } from '~/components/ui/select-button'
import { Text } from '~/components/ui/text'
import { AlertCircle, Loader2, ChevronDown } from 'lucide-react-native'
import type { Payment } from '~/types/payment.types'
import { formatPrice } from '~/lib/utils'
import { Portal } from '@rn-primitives/portal'
import { extractApiError } from '~/lib/apiErrorHandler'
import { colors } from '~/theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface RefundModalProps {
  isOpen: boolean
  onClose: () => void
  payment: Payment
  onRefund: (amount: number, reason: string, method: 'original' | 'cash') => Promise<void>
}

const REFUND_REASONS = [
  { value: 'customer_request', label: 'Demande du client' },
  { value: 'quality_issue', label: 'Problème de qualité' },
  { value: 'wrong_order', label: 'Erreur de commande' },
  { value: 'long_wait', label: 'Attente trop longue' },
  { value: 'price_dispute', label: 'Contestation du prix' },
  { value: 'cancelled_order', label: 'Commande annulée' },
  { value: 'other', label: 'Autre raison' },
]

export default function RefundModal({ isOpen, onClose, payment, onRefund }: RefundModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full')
  const [partialAmount, setPartialAmount] = useState('')
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [refundMethod, setRefundMethod] = useState<'original' | 'cash'>('original')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showReasonPicker, setShowReasonPicker] = useState(false)

  // Calculate refund amount
  const refundAmount = useMemo(() => {
    if (refundType === 'full') {
      return payment.amount
    }
    const amount = parseFloat(partialAmount) * 100 // Convert to cents
    return isNaN(amount) ? 0 : Math.round(amount)
  }, [refundType, partialAmount, payment.amount])

  // Get the final reason text
  const finalReason = useMemo(() => {
    if (selectedReason === 'other') {
      return customReason
    }
    const reason = REFUND_REASONS.find(r => r.value === selectedReason)
    return reason ? reason.label : ''
  }, [selectedReason, customReason])

  const selectedReasonLabel = useMemo(() => {
    const reason = REFUND_REASONS.find(r => r.value === selectedReason)
    return reason ? reason.label : 'Sélectionner une raison'
  }, [selectedReason])

  const handleSubmit = async () => {
    // Validation
    if (!selectedReason) {
      setError('Veuillez sélectionner une raison')
      return
    }

    if (selectedReason === 'other' && !customReason.trim()) {
      setError('Veuillez préciser la raison')
      return
    }

    if (refundType === 'partial') {
      if (refundAmount <= 0) {
        setError('Le montant doit être supérieur à 0')
        return
      }
      if (refundAmount > payment.amount) {
        setError('Le montant ne peut pas dépasser le montant original')
        return
      }
      if (refundAmount < 100) {
        setError('Le montant minimum de remboursement est de 1€')
        return
      }
    }

    // Show confirmation for first time
    if (!showConfirmation) {
      setShowConfirmation(true)
      return
    }

    // Process refund
    setIsLoading(true)
    setError(null)

    try {
      await onRefund(refundAmount, finalReason, refundMethod)
      handleClose()
    } catch (err) {
      const info = extractApiError(err)
      setError(info.message || 'Erreur lors du remboursement')
      setShowConfirmation(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setRefundType('full')
      setPartialAmount('')
      setSelectedReason('')
      setCustomReason('')
      setRefundMethod('original')
      setShowConfirmation(false)
      setError(null)
      setShowReasonPicker(false)
      onClose()
    }
  }

  const modalWidth = Math.min(SCREEN_WIDTH * 0.9, 500)

  return (
    <Portal name="refund-modal">
      <ForkModal
        visible={isOpen}
        onClose={handleClose}
        title="Remboursement du paiement"
        maxWidth={modalWidth}
      >
        <View style={styles.container}>
          {/* Payment info */}
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentInfoText}>
              Paiement de {formatPrice(payment.amount)}
            </Text>
            <Text style={styles.paymentMethod}>
              {payment.paymentMethod === 'card' ? 'Carte' :
               payment.paymentMethod === 'cash' ? 'Espèces' :
               payment.paymentMethod === 'ticket_resto' ? 'Ticket Restaurant' :
               payment.paymentMethod === 'check' ? 'Chèque' : payment.paymentMethod}
            </Text>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Confirmation message */}
              {showConfirmation && (
                <View style={styles.alertWarning}>
                  <AlertCircle size={16} color={colors.warning.dark} />
                  <Text style={styles.alertWarningText}>
                    Confirmer le remboursement de {formatPrice(refundAmount)} ?
                    Cette action est irréversible.
                  </Text>
                </View>
              )}

              {/* Error message */}
              {error && (
                <View style={styles.alertError}>
                  <AlertCircle size={16} color={colors.error.text} />
                  <Text style={styles.alertErrorText}>{error}</Text>
                </View>
              )}

              {/* Refund type */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Type de remboursement</Text>
                <View style={styles.buttonRow}>
                  <SelectButton
                    label={`Total (${formatPrice(payment.amount)})`}
                    isActive={refundType === 'full'}
                    onPress={() => setRefundType('full')}
                    variant="main"
                    activeColor={colors.info.base}
                    flex
                  />
                  <View style={{ width: 12 }} />
                  <SelectButton
                    label="Partiel"
                    isActive={refundType === 'partial'}
                    onPress={() => setRefundType('partial')}
                    variant="main"
                    activeColor={colors.info.base}
                    flex
                  />
                </View>
              </View>

              {/* Partial amount input */}
              {refundType === 'partial' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Montant à rembourser (€)</Text>
                  <TextInput
                    value={partialAmount}
                    onChangeText={setPartialAmount}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    editable={!isLoading}
                    style={styles.input}
                  />
                  {partialAmount && (
                    <Text style={styles.helperText}>
                      Montant: {formatPrice(refundAmount)}
                    </Text>
                  )}
                </View>
              )}

              {/* Refund reason */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Raison du remboursement *</Text>
                <Pressable
                  style={styles.selectButton}
                  onPress={() => setShowReasonPicker(true)}
                  disabled={isLoading}
                >
                  <Text style={[
                    styles.selectButtonText,
                    selectedReason && styles.selectButtonTextActive
                  ]}>
                    {selectedReasonLabel}
                  </Text>
                  <ChevronDown size={20} color={colors.gray[500]} />
                </Pressable>
              </View>

              {/* Custom reason input */}
              {selectedReason === 'other' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Préciser la raison *</Text>
                  <TextInput
                    value={customReason}
                    onChangeText={setCustomReason}
                    placeholder="Entrer la raison..."
                    multiline
                    numberOfLines={3}
                    editable={!isLoading}
                    style={[styles.input, styles.textArea]}
                  />
                </View>
              )}

              {/* Refund method */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Méthode de remboursement</Text>
                <View style={styles.buttonRow}>
                  <SelectButton
                    label="Méthode originale"
                    isActive={refundMethod === 'original'}
                    onPress={() => setRefundMethod('original')}
                    variant="sub"
                    activeColor={colors.info.base}
                    flex
                  />
                  <View style={{ width: 12 }} />
                  <SelectButton
                    label="Espèces"
                    isActive={refundMethod === 'cash'}
                    onPress={() => setRefundMethod('cash')}
                    variant="sub"
                    activeColor={colors.info.base}
                    flex
                  />
                </View>
                <Text style={styles.helperText}>
                  {refundMethod === 'original'
                    ? `Remboursement sur ${payment.paymentMethod}`
                    : 'Remboursement en espèces'}
                </Text>
              </View>

              {/* Summary */}
              <View style={styles.summary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Montant:</Text>
                  <Text style={styles.summaryValue}>{formatPrice(refundAmount)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Raison:</Text>
                  <Text style={styles.summaryValue}>{finalReason || '-'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Méthode:</Text>
                  <Text style={styles.summaryValue}>
                    {refundMethod === 'original' ? payment.paymentMethod : 'Espèces'}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              variant="outline"
              onPress={handleClose}
              disabled={isLoading}
              style={{ flex: 1 }}
            >
              <Text>Annuler</Text>
            </Button>
            <View style={{ width: 12 }} />
            <Button
              variant={showConfirmation ? 'destructive' : 'default'}
              onPress={handleSubmit}
              disabled={
                isLoading ||
                !selectedReason ||
                (selectedReason === 'other' && !customReason.trim())
              }
              style={{ flex: 1 }}
            >
              {isLoading ? (
                <Loader2 size={20} color={colors.white} />
              ) : (
                <Text style={{ color: colors.white }}>
                  {showConfirmation ? 'Confirmer' : 'Rembourser'}
                </Text>
              )}
            </Button>
          </View>
        </View>
      </ForkModal>

      {/* Reason Picker Modal */}
      <ForkModal
        visible={showReasonPicker}
        onClose={() => setShowReasonPicker(false)}
        title="Sélectionner une raison"
        maxWidth={modalWidth * 0.9}
      >
        <ScrollView style={styles.pickerScroll}>
          {REFUND_REASONS.map((reason) => (
            <Pressable
              key={reason.value}
              style={styles.pickerItem}
              onPress={() => {
                setSelectedReason(reason.value)
                setShowReasonPicker(false)
              }}
            >
              <Text style={[
                styles.pickerItemText,
                selectedReason === reason.value && styles.pickerItemTextActive
              ]}>
                {reason.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </ForkModal>
    </Portal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 16,
  },
  paymentInfo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    marginBottom: 16,
    marginHorizontal: 4,
  },
  paymentInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 14,
    color: colors.gray[500],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 4,
    paddingBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.gray[800],
    backgroundColor: colors.white,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  selectButtonText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  selectButtonTextActive: {
    color: colors.gray[800],
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 6,
  },
  alertWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: colors.warning.border,
    borderWidth: 1,
    borderColor: colors.warning.border,
    gap: 8,
  },
  alertWarningText: {
    flex: 1,
    fontSize: 14,
    color: colors.warning.text,
    lineHeight: 20,
  },
  alertError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: colors.error.bg,
    borderWidth: 1,
    borderColor: colors.error.border,
    gap: 8,
  },
  alertErrorText: {
    flex: 1,
    fontSize: 14,
    color: colors.error.text,
    lineHeight: 20,
  },
  summary: {
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.gray[500],
  },
  summaryValue: {
    fontSize: 14,
    color: colors.gray[800],
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  pickerScroll: {
    maxHeight: 400,
  },
  pickerItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  pickerItemText: {
    fontSize: 15,
    color: colors.gray[500],
  },
  pickerItemTextActive: {
    color: colors.info.base,
    fontWeight: '600',
  },
})