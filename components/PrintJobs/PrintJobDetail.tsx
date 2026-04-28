import React from 'react'
import {
  View,
  Text as RNText,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native'
import { Ban, RefreshCcw, X } from 'lucide-react-native'
import { EscposPreview } from './EscposPreview'
import type { PrintJob, PrintJobStatus } from '~/types/printer.types'

const STATUS_LABELS: Record<PrintJobStatus, string> = {
  pending: 'En attente',
  sent: 'Envoyé',
  acked: 'Imprimé',
  failed: 'Échec',
  dead: 'Abandonné',
  cancelled: 'Annulé',
}

const STATUS_COLORS: Record<PrintJobStatus, string> = {
  pending: '#F59E0B',
  sent: '#3B82F6',
  acked: '#10B981',
  failed: '#EF4444',
  dead: '#7C2D12',
  cancelled: '#64748B',
}

interface PrintJobDetailProps {
  job: PrintJob
  onClose: () => void
  onCancel: (job: PrintJob) => void
  onRetry: (job: PrintJob) => void
}

export function PrintJobDetail({ job, onClose, onCancel, onRetry }: PrintJobDetailProps) {
  const canCancel = ['pending', 'failed'].includes(job.status)
  const canRetry = ['dead', 'failed', 'cancelled'].includes(job.status)

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <RNText style={styles.title}>Détail du job</RNText>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: `${STATUS_COLORS[job.status]}1F` },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: STATUS_COLORS[job.status] }]}
            />
            <RNText style={[styles.statusText, { color: STATUS_COLORS[job.status] }]}>
              {STATUS_LABELS[job.status]}
            </RNText>
          </View>
        </View>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <X size={20} color="#2A2E33" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Informations">
          <Row label="ID" value={job.id} mono />
          <Row label="Imprimante" value={job.printer?.name ?? job.printerId} />
          <Row label="Tentatives" value={`${job.attempts} / 3`} />
          <Row label="Créé" value={formatDate(job.createdAt)} />
          {job.sentAt && <Row label="Envoyé" value={formatDate(job.sentAt)} />}
          {job.ackedAt && <Row label="Accusé" value={formatDate(job.ackedAt)} />}
          {job.nextRetryAt && (
            <Row label="Prochain essai" value={formatDate(job.nextRetryAt)} />
          )}
          {job.errorMessage && (
            <Row label="Erreur" value={job.errorMessage} color="#DC2626" />
          )}
        </Section>

        {(job.orderId || job.paymentId) && (
          <Section title="Source">
            {job.orderId && <Row label="Commande" value={job.orderId} mono />}
            {job.paymentId && <Row label="Paiement" value={job.paymentId} mono />}
          </Section>
        )}

        <Section title="Aperçu du ticket">
          <EscposPreview payloadBase64={job.payload} />
        </Section>

        {(canCancel || canRetry) && (
          <View style={styles.actions}>
            {canCancel && (
              <Pressable
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => onCancel(job)}
              >
                <Ban size={14} color="#B91C1C" />
                <RNText style={styles.cancelButtonText}>Annuler</RNText>
              </Pressable>
            )}
            {canRetry && (
              <Pressable
                style={[styles.actionButton, styles.retryButton]}
                onPress={() => onRetry(job)}
              >
                <RefreshCcw size={14} color="#FFFFFF" />
                <RNText style={styles.retryButtonText}>Rejouer</RNText>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <RNText style={styles.sectionTitle}>{title}</RNText>
      {children}
    </View>
  )
}

function Row({
  label,
  value,
  mono,
  color,
}: {
  label: string
  value: string
  mono?: boolean
  color?: string
}) {
  return (
    <View style={styles.row}>
      <RNText style={styles.rowLabel}>{label}</RNText>
      <RNText
        style={[styles.rowValue, mono && styles.rowValueMono, color ? { color } : null]}
        selectable
      >
        {value}
      </RNText>
    </View>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    timeZone: 'Europe/Paris',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: '600', color: '#2A2E33', marginBottom: 8 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  closeButton: { padding: 6 },
  content: { padding: 20, paddingBottom: 40, gap: 24 },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowLabel: { fontSize: 12, color: '#64748B', width: 110, fontWeight: '500' },
  rowValue: { flex: 1, fontSize: 13, color: '#0F172A' },
  rowValueMono: {
    fontSize: 11,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButton: { backgroundColor: '#FEE2E2' },
  cancelButtonText: { color: '#B91C1C', fontSize: 13, fontWeight: '600' },
  retryButton: { backgroundColor: '#0F172A' },
  retryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
})
