import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text as RNText,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  RefreshCcw,
  SlidersHorizontal,
} from 'lucide-react-native'
import { SlidePanel } from '~/components/ui/SlidePanel'
import { usePanelPortal } from '~/hooks/usePanelPortal'
import { usePrinters } from '~/hooks/usePrinters'
import { usePrintJobs } from '~/hooks/usePrintJobs'
import { usePrintHubs } from '~/hooks/usePrintHubs'
import { useToast } from '~/components/ToastProvider'
import { showApiError } from '~/lib/apiErrorHandler'
import { PrintJobDetail } from '~/components/PrintJobs/PrintJobDetail'
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

const COUNTER_ORDER: PrintJobStatus[] = [
  'pending',
  'sent',
  'acked',
  'failed',
  'dead',
  'cancelled',
]

const STATUS_FILTER_OPTIONS: Array<PrintJobStatus | 'all'> = [
  'all',
  ...COUNTER_ORDER,
]

export function PrintJobsTab() {
  const { showToast } = useToast()
  const { renderPanel, clearPanel } = usePanelPortal()

  const { printers, loadPrinters } = usePrinters()
  const { isHubOnline, loadHubs } = usePrintHubs()
  const { jobs, counts, loadJobs, cancelJob, retryJob } = usePrintJobs()

  const [statusFilter, setStatusFilter] = useState<PrintJobStatus | 'all'>('all')
  const [printerFilter, setPrinterFilter] = useState<string | 'all'>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const apiFilters: Parameters<typeof loadJobs>[0] = {}
      if (statusFilter !== 'all') apiFilters.status = statusFilter
      if (printerFilter !== 'all') apiFilters.printerId = printerFilter
      await Promise.all([loadJobs(apiFilters), loadPrinters(), loadHubs()])
    } catch (error) {
      showApiError(error, showToast, 'Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, printerFilter, loadJobs, loadPrinters, loadHubs, showToast])

  useEffect(() => {
    refresh()
  }, [refresh])

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (statusFilter !== 'all' && job.status !== statusFilter) return false
      if (printerFilter !== 'all' && job.printerId !== printerFilter) return false
      return true
    })
  }, [jobs, statusFilter, printerFilter])

  const selectedJob = selectedJobId
    ? jobs.find((j) => j.id === selectedJobId)
    : null

  const handleClosePanel = useCallback(() => {
    setSelectedJobId(null)
    clearPanel()
  }, [clearPanel])

  const handleCancel = useCallback(
    async (job: PrintJob) => {
      try {
        await cancelJob(job.id)
        showToast('Job annulé', 'success')
      } catch (error) {
        showApiError(error, showToast, "Impossible d'annuler")
      }
    },
    [cancelJob, showToast]
  )

  const handleRetry = useCallback(
    async (job: PrintJob) => {
      try {
        await retryJob(job.id)
        showToast('Job relancé', 'success')
      } catch (error) {
        showApiError(error, showToast, 'Impossible de relancer')
      }
    },
    [retryJob, showToast]
  )

  const clearFilters = () => {
    setStatusFilter('all')
    setPrinterFilter('all')
  }

  const hasActiveFilters = statusFilter !== 'all' || printerFilter !== 'all'

  // SlidePanel détail via portal — démontage automatique au unmount du tab
  useEffect(() => {
    if (!selectedJob) {
      clearPanel()
      return
    }
    renderPanel(
      <SlidePanel visible={true} onClose={handleClosePanel} width={460}>
        <PrintJobDetail
          job={selectedJob}
          onClose={handleClosePanel}
          onCancel={handleCancel}
          onRetry={handleRetry}
        />
      </SlidePanel>
    )
  }, [selectedJob, handleClosePanel, handleCancel, handleRetry, renderPanel, clearPanel])

  useEffect(() => {
    return () => clearPanel()
  }, [clearPanel])

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tabHeader}>
        <View>
          <RNText style={styles.tabTitle}>Monitoring</RNText>
          <RNText style={styles.tabSubtitle}>
            Suivi des impressions en temps réel et historique des jobs
          </RNText>
        </View>
      </View>

      {!isHubOnline && (
        <View style={styles.hubAlert}>
          <AlertTriangle size={16} color="#B91C1C" />
          <RNText style={styles.hubAlertText}>
            Aucun hub d'impression n'est en ligne. Les jobs resteront en attente.
          </RNText>
        </View>
      )}

      <View style={styles.toolbar}>
        <View style={styles.countersWrapper}>
          {COUNTER_ORDER.map((status) => (
            <View key={status} style={styles.counter}>
              <View
                style={[
                  styles.counterDot,
                  { backgroundColor: STATUS_COLORS[status] },
                ]}
              />
              <View>
                <RNText style={styles.counterValue}>{counts[status]}</RNText>
                <RNText style={styles.counterLabel}>
                  {STATUS_LABELS[status]}
                </RNText>
              </View>
            </View>
          ))}
        </View>
        <View style={styles.toolbarActions}>
          <Pressable
            style={[
              styles.toolbarButton,
              filtersOpen && styles.toolbarButtonActive,
            ]}
            onPress={() => setFiltersOpen((v) => !v)}
          >
            <SlidersHorizontal
              size={14}
              color={filtersOpen ? '#FFFFFF' : '#0F172A'}
            />
            <RNText
              style={[
                styles.toolbarButtonText,
                filtersOpen && styles.toolbarButtonTextActive,
              ]}
            >
              Filtres
              {hasActiveFilters ? ' (actifs)' : ''}
            </RNText>
            {filtersOpen ? (
              <ChevronUp
                size={14}
                color={filtersOpen ? '#FFFFFF' : '#0F172A'}
              />
            ) : (
              <ChevronDown size={14} color="#0F172A" />
            )}
          </Pressable>
          <Pressable style={styles.refreshButton} onPress={refresh}>
            <RefreshCcw size={14} color="#0F172A" />
            <RNText style={styles.toolbarButtonText}>Rafraîchir</RNText>
          </Pressable>
        </View>
      </View>

      {filtersOpen && (
        <View style={styles.filtersPanel}>
          <View style={styles.filterGroup}>
            <RNText style={styles.filterLabel}>Statut</RNText>
            <View style={styles.chipRow}>
              {STATUS_FILTER_OPTIONS.map((status) => {
                const active = statusFilter === status
                const color =
                  status === 'all' ? '#0F172A' : STATUS_COLORS[status]
                return (
                  <Pressable
                    key={status}
                    onPress={() => setStatusFilter(status)}
                    style={[
                      styles.chip,
                      active && {
                        backgroundColor: color,
                        borderColor: color,
                      },
                    ]}
                  >
                    <RNText
                      style={[
                        styles.chipText,
                        active && styles.chipTextActive,
                      ]}
                    >
                      {status === 'all' ? 'Tous' : STATUS_LABELS[status]}
                    </RNText>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <View style={styles.filterGroup}>
            <RNText style={styles.filterLabel}>Imprimante</RNText>
            <View style={styles.chipRow}>
              <Pressable
                onPress={() => setPrinterFilter('all')}
                style={[
                  styles.chip,
                  printerFilter === 'all' && styles.chipActiveDark,
                ]}
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
              {printers.map((printer) => {
                const active = printerFilter === printer.id
                return (
                  <Pressable
                    key={printer.id}
                    onPress={() => setPrinterFilter(printer.id)}
                    style={[styles.chip, active && styles.chipActiveDark]}
                  >
                    <RNText
                      style={[
                        styles.chipText,
                        active && styles.chipTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {printer.name}
                    </RNText>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {hasActiveFilters && (
            <Pressable onPress={clearFilters} style={styles.clearButton}>
              <RNText style={styles.clearButtonText}>Effacer les filtres</RNText>
            </Pressable>
          )}
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
      >
        {isLoading && jobs.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIndicator />
          </View>
        ) : filteredJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <RefreshCcw size={20} color="#94A3B8" />
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
                      { backgroundColor: `${STATUS_COLORS[job.status]}1F` },
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
                  {formatDateTime(job.createdAt)} · Tentatives {job.attempts}/3
                  {job.orderId
                    ? ` · Commande ${job.orderId.slice(0, 8)}`
                    : ''}
                  {job.paymentId
                    ? ` · Paiement ${job.paymentId.slice(0, 8)}`
                    : ''}
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
    </View>
  )
}

function formatDateTime(iso: string): string {
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
  tabHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  tabSubtitle: { fontSize: 14, color: '#64748B' },
  hubAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#FEE2E2',
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  hubAlertText: { color: '#B91C1C', fontSize: 13, flex: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexWrap: 'wrap',
  },
  countersWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counterDot: { width: 8, height: 8, borderRadius: 4 },
  counterValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  counterLabel: { fontSize: 11, color: '#64748B', lineHeight: 14 },
  toolbarActions: { flexDirection: 'row', gap: 8 },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toolbarButtonActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  toolbarButtonText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '500',
  },
  toolbarButtonTextActive: {
    color: '#FFFFFF',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filtersPanel: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 16,
  },
  filterGroup: { gap: 8 },
  filterLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActiveDark: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipText: { fontSize: 12, color: '#475569' },
  chipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  clearButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
  },
  clearButtonText: { fontSize: 13, color: '#0F172A', fontWeight: '500' },
  listContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  emptyState: { padding: 60, alignItems: 'center', gap: 12 },
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
  statusBar: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginRight: 2,
  },
  jobHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  jobTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  jobMeta: { fontSize: 12, color: '#64748B' },
  jobError: { fontSize: 12, color: '#DC2626' },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillText: { fontSize: 11, fontWeight: '600' },
})
