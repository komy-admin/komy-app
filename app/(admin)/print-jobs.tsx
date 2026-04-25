import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text as RNText,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  RefreshCcw,
  ChevronRight,
  Filter,
  Printer as PrinterIcon,
} from 'lucide-react-native'
import { usePrinters } from '~/hooks/usePrinters'
import { usePrintJobs } from '~/hooks/usePrintJobs'
import { usePrintHubs } from '~/hooks/usePrintHubs'
import { useToast } from '~/components/ToastProvider'
import { showApiError } from '~/lib/apiErrorHandler'
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

const STATUS_FILTERS: Array<PrintJobStatus | 'all'> = [
  'all',
  'pending',
  'sent',
  'acked',
  'failed',
  'dead',
  'cancelled',
]

const decodePayloadPreview = (payloadBase64: string): string => {
  try {
    if (typeof atob === 'function') {
      return atob(payloadBase64).replace(/[^\x20-\x7E\n]/g, '·')
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(payloadBase64, 'base64')
        .toString('utf-8')
        .replace(/[^\x20-\x7E\n]/g, '·')
    }
  } catch {
    return '[contenu binaire non décodable]'
  }
  return '[contenu binaire]'
}

export default function PrintJobsScreen() {
  const router = useRouter()
  const { showToast } = useToast()
  const { printers, loadPrinters } = usePrinters()
  const { isHubOnline, loadHubs } = usePrintHubs()
  const { jobs, counts, loadJobs, cancelJob, retryJob } = usePrintJobs()

  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<PrintJobStatus | 'all'>('all')
  const [printerFilter, setPrinterFilter] = useState<string | 'all'>('all')
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  const refresh = async () => {
    setIsLoading(true)
    try {
      const filters =
        statusFilter !== 'all'
          ? { status: statusFilter }
          : printerFilter !== 'all'
            ? { printerId: printerFilter }
            : {}
      await Promise.all([loadJobs(filters), loadPrinters(), loadHubs()])
    } catch (error) {
      showApiError(error, showToast, 'Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, printerFilter])

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (statusFilter !== 'all' && job.status !== statusFilter) return false
      if (printerFilter !== 'all' && job.printerId !== printerFilter) return false
      return true
    })
  }, [jobs, statusFilter, printerFilter])

  const selectedJob = selectedJobId ? jobs.find((j) => j.id === selectedJobId) : null

  const handleCancel = async (job: PrintJob) => {
    try {
      await cancelJob(job.id)
      showToast('Job annulé', 'success')
    } catch (error) {
      showApiError(error, showToast, "Impossible d'annuler")
    }
  }

  const handleRetry = async (job: PrintJob) => {
    try {
      await retryJob(job.id)
      showToast('Job relancé', 'success')
    } catch (error) {
      showApiError(error, showToast, 'Impossible de relancer')
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color="#0F172A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <RNText style={styles.title}>Monitoring d'impression</RNText>
          <RNText style={styles.subtitle}>
            Jobs récents sur les imprimantes du compte
          </RNText>
        </View>
        <Pressable onPress={refresh} style={styles.refreshButton}>
          <RefreshCcw size={16} color="#1E293B" />
          <RNText style={styles.refreshButtonText}>Rafraîchir</RNText>
        </Pressable>
      </View>

      {!isHubOnline && (
        <View style={styles.hubAlert}>
          <AlertTriangle size={16} color="#B91C1C" />
          <RNText style={styles.hubAlertText}>
            Aucun hub d'impression n'est actuellement en ligne. Les jobs resteront en attente.
          </RNText>
        </View>
      )}

      <View style={styles.countersRow}>
        {(Object.keys(counts) as PrintJobStatus[]).map((status) => (
          <View key={status} style={styles.counter}>
            <View
              style={[
                styles.counterDot,
                { backgroundColor: STATUS_COLORS[status] },
              ]}
            />
            <View>
              <RNText style={styles.counterValue}>{counts[status]}</RNText>
              <RNText style={styles.counterLabel}>{STATUS_LABELS[status]}</RNText>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.filterBar}>
        <Filter size={14} color="#64748B" />
        <View style={styles.chipRow}>
          {STATUS_FILTERS.map((s) => (
            <Pressable
              key={s}
              onPress={() => setStatusFilter(s)}
              style={[
                styles.chip,
                statusFilter === s && styles.chipActive,
              ]}
            >
              <RNText
                style={[
                  styles.chipText,
                  statusFilter === s && styles.chipTextActive,
                ]}
              >
                {s === 'all' ? 'Tous' : STATUS_LABELS[s]}
              </RNText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.filterBar}>
        <PrinterIcon size={14} color="#64748B" />
        <View style={styles.chipRow}>
          <Pressable
            onPress={() => setPrinterFilter('all')}
            style={[styles.chip, printerFilter === 'all' && styles.chipActive]}
          >
            <RNText
              style={[
                styles.chipText,
                printerFilter === 'all' && styles.chipTextActive,
              ]}
            >
              Toutes
            </RNText>
          </Pressable>
          {printers.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => setPrinterFilter(p.id)}
              style={[styles.chip, printerFilter === p.id && styles.chipActive]}
            >
              <RNText
                style={[
                  styles.chipText,
                  printerFilter === p.id && styles.chipTextActive,
                ]}
              >
                {p.name}
              </RNText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.content}>
        <ScrollView
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {isLoading && jobs.length === 0 ? (
            <View style={styles.emptyState}>
              <ActivityIndicator />
            </View>
          ) : filteredJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <RNText style={styles.emptyText}>
                Aucun job ne correspond aux filtres sélectionnés.
              </RNText>
            </View>
          ) : (
            filteredJobs.map((job) => (
              <Pressable
                key={job.id}
                style={[
                  styles.jobRow,
                  selectedJobId === job.id && styles.jobRowSelected,
                ]}
                onPress={() => setSelectedJobId(job.id)}
              >
                <View
                  style={[
                    styles.statusBar,
                    { backgroundColor: STATUS_COLORS[job.status] },
                  ]}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.jobHeader}>
                    <RNText style={styles.jobTitle} numberOfLines={1}>
                      {job.printer?.name ?? 'Imprimante inconnue'}
                    </RNText>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: `${STATUS_COLORS[job.status]}20` },
                      ]}
                    >
                      <RNText
                        style={[
                          styles.statusPillText,
                          { color: STATUS_COLORS[job.status] },
                        ]}
                      >
                        {STATUS_LABELS[job.status]}
                      </RNText>
                    </View>
                  </View>
                  <RNText style={styles.jobMeta} numberOfLines={1}>
                    {new Date(job.createdAt).toLocaleString('fr-FR')} ·
                    Tentatives {job.attempts}/3
                    {job.orderId ? ` · Commande ${job.orderId.slice(0, 8)}` : ''}
                    {job.paymentId ? ` · Paiement ${job.paymentId.slice(0, 8)}` : ''}
                  </RNText>
                  {job.errorMessage && (
                    <RNText style={styles.jobError} numberOfLines={1}>
                      {job.errorMessage}
                    </RNText>
                  )}
                </View>
                <ChevronRight size={16} color="#94A3B8" />
              </Pressable>
            ))
          )}
        </ScrollView>

        {selectedJob && (
          <View style={styles.detail}>
            <View style={styles.detailHeader}>
              <RNText style={styles.detailTitle}>Détails du job</RNText>
              <Pressable onPress={() => setSelectedJobId(null)}>
                <RNText style={styles.detailClose}>Fermer</RNText>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              <DetailRow label="ID" value={selectedJob.id} mono />
              <DetailRow
                label="Statut"
                value={STATUS_LABELS[selectedJob.status]}
                color={STATUS_COLORS[selectedJob.status]}
              />
              <DetailRow
                label="Imprimante"
                value={selectedJob.printer?.name ?? selectedJob.printerId}
              />
              <DetailRow
                label="Tentatives"
                value={`${selectedJob.attempts} / 3`}
              />
              <DetailRow
                label="Créé"
                value={new Date(selectedJob.createdAt).toLocaleString('fr-FR')}
              />
              {selectedJob.sentAt && (
                <DetailRow
                  label="Envoyé"
                  value={new Date(selectedJob.sentAt).toLocaleString('fr-FR')}
                />
              )}
              {selectedJob.ackedAt && (
                <DetailRow
                  label="Accusé"
                  value={new Date(selectedJob.ackedAt).toLocaleString('fr-FR')}
                />
              )}
              {selectedJob.nextRetryAt && (
                <DetailRow
                  label="Prochain essai"
                  value={new Date(selectedJob.nextRetryAt).toLocaleString('fr-FR')}
                />
              )}
              {selectedJob.errorMessage && (
                <DetailRow
                  label="Erreur"
                  value={selectedJob.errorMessage}
                  color="#DC2626"
                />
              )}
              {selectedJob.orderId && (
                <DetailRow label="Commande" value={selectedJob.orderId} mono />
              )}
              {selectedJob.paymentId && (
                <DetailRow label="Paiement" value={selectedJob.paymentId} mono />
              )}

              <RNText style={styles.payloadLabel}>Aperçu du ticket</RNText>
              <View style={styles.payloadBox}>
                <RNText style={styles.payloadText} selectable>
                  {decodePayloadPreview(selectedJob.payload)}
                </RNText>
              </View>

              <View style={styles.detailActions}>
                {['pending', 'failed'].includes(selectedJob.status) && (
                  <Pressable
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => handleCancel(selectedJob)}
                  >
                    <Ban size={14} color="#B91C1C" />
                    <RNText style={styles.cancelButtonText}>Annuler</RNText>
                  </Pressable>
                )}
                {['dead', 'failed', 'cancelled'].includes(selectedJob.status) && (
                  <Pressable
                    style={[styles.actionButton, styles.retryButton]}
                    onPress={() => handleRetry(selectedJob)}
                  >
                    <RefreshCcw size={14} color="#FFFFFF" />
                    <RNText style={styles.retryButtonText}>Rejouer</RNText>
                  </Pressable>
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  )
}

function DetailRow({
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
    <View style={styles.detailRow}>
      <RNText style={styles.detailLabel}>{label}</RNText>
      <RNText
        style={[
          styles.detailValue,
          mono && styles.detailValueMono,
          color ? { color } : null,
        ]}
        selectable
      >
        {value}
      </RNText>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: { padding: 6 },
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B' },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  refreshButtonText: { fontSize: 13, color: '#1E293B', fontWeight: '500' },
  hubAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FEE2E2',
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  hubAlertText: { color: '#B91C1C', fontSize: 13, flex: 1 },
  countersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    minWidth: 110,
  },
  counterDot: { width: 10, height: 10, borderRadius: 5 },
  counterValue: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  counterLabel: { fontSize: 11, color: '#64748B' },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  chipActive: { backgroundColor: '#0F172A' },
  chipText: { fontSize: 12, color: '#475569' },
  chipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  content: { flex: 1, flexDirection: 'row' },
  list: { flex: 1, padding: 16 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#64748B', fontSize: 13, textAlign: 'center' },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    overflow: 'hidden',
  },
  jobRowSelected: {
    borderColor: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  statusBar: { width: 3, alignSelf: 'stretch', borderRadius: 2, marginRight: 2 },
  jobHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  jobTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A', flex: 1 },
  jobMeta: { fontSize: 12, color: '#64748B' },
  jobError: { fontSize: 12, color: '#DC2626' },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillText: { fontSize: 11, fontWeight: '600' },
  detail: {
    width: 360,
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    padding: 16,
    backgroundColor: '#FAFBFC',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  detailClose: { fontSize: 13, color: '#3B82F6' },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    width: 100,
    fontWeight: '500',
  },
  detailValue: { fontSize: 13, color: '#0F172A', flex: 1 },
  detailValueMono: {
    fontSize: 11,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  payloadLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 16,
    marginBottom: 6,
    fontWeight: '500',
  },
  payloadBox: {
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
    maxHeight: 160,
  },
  payloadText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  detailActions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButton: { backgroundColor: '#FEE2E2' },
  cancelButtonText: { color: '#B91C1C', fontSize: 13, fontWeight: '600' },
  retryButton: { backgroundColor: '#0F172A' },
  retryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
})
