import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text as RNText,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native'
import {
  Copy,
  Plus,
  Printer as PrinterIcon,
  Server,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native'
import { SlidePanel } from '~/components/ui/SlidePanel'
import { usePanelPortal } from '~/hooks/usePanelPortal'
import { usePrinters } from '~/hooks/usePrinters'
import { usePrintHubs } from '~/hooks/usePrintHubs'
import { useToast } from '~/components/ToastProvider'
import { showApiError } from '~/lib/apiErrorHandler'
import { HubFormPanel } from './HubFormPanel'
import { PrinterFormPanel } from './PrinterFormPanel'
import type { Printer, PrinterCreateInput, PrinterType } from '~/types/printer.types'

const PRINTER_TYPE_LABELS: Record<PrinterType, string> = {
  kitchen: 'Cuisine',
  bar: 'Bar',
  cashier: 'Caisse',
}

const PRINTER_TYPE_COLORS: Record<PrinterType, string> = {
  kitchen: '#F97316',
  bar: '#8B5CF6',
  cashier: '#10B981',
}

type FormPanel =
  | null
  | { type: 'hub' }
  | { type: 'printer'; printer?: Printer }

export function PrintersTab() {
  const { showToast } = useToast()
  const { renderPanel, clearPanel } = usePanelPortal()
  const { printers, loadPrinters, createPrinter, updatePrinter, deletePrinter } =
    usePrinters()
  const {
    hubs,
    loadHubs,
    createHub,
    revokeHub,
    lastRevealedToken,
    clearRevealedToken,
  } = usePrintHubs()

  const [isLoading, setIsLoading] = useState(false)
  const [formPanel, setFormPanel] = useState<FormPanel>(null)

  useEffect(() => {
    setIsLoading(true)
    Promise.all([loadPrinters(), loadHubs()])
      .catch((error) => showApiError(error, showToast, 'Erreur de chargement'))
      .finally(() => setIsLoading(false))
  }, [loadPrinters, loadHubs, showToast])

  const handleClosePanel = useCallback(() => {
    setFormPanel(null)
    clearPanel()
  }, [clearPanel])

  // Démontage du panel quand on quitte le tab
  useEffect(() => {
    return () => clearPanel()
  }, [clearPanel])

  const handleSavePrinter = useCallback(
    async (input: PrinterCreateInput) => {
      try {
        if (formPanel?.type === 'printer' && formPanel.printer) {
          await updatePrinter(formPanel.printer.id, input)
          showToast('Imprimante mise à jour', 'success')
        } else {
          await createPrinter(input)
          showToast('Imprimante créée', 'success')
        }
        handleClosePanel()
      } catch (error) {
        showApiError(error, showToast, "Échec de l'enregistrement")
      }
    },
    [formPanel, updatePrinter, createPrinter, showToast, handleClosePanel]
  )

  const handleDeletePrinter = useCallback(
    async (printer: Printer) => {
      try {
        await deletePrinter(printer.id)
        showToast('Imprimante supprimée', 'success')
      } catch (error) {
        showApiError(error, showToast, 'Échec de la suppression')
      }
    },
    [deletePrinter, showToast]
  )

  const handleSaveHub = useCallback(
    async (input: { deviceName?: string; deviceFingerprint: string }) => {
      try {
        await createHub({
          deviceFingerprint: input.deviceFingerprint,
          deviceName: input.deviceName,
          devicePlatform: 'raspberrypi',
        })
        showToast('Hub créé. Copiez le token maintenant.', 'success')
        handleClosePanel()
      } catch (error) {
        showApiError(error, showToast, 'Échec de la création du hub')
      }
    },
    [createHub, showToast, handleClosePanel]
  )

  const handleRevokeHub = useCallback(
    async (id: string) => {
      try {
        await revokeHub(id)
        showToast('Hub révoqué', 'success')
      } catch (error) {
        showApiError(error, showToast, 'Échec de la révocation')
      }
    },
    [revokeHub, showToast]
  )

  const copyTokenToClipboard = useCallback(() => {
    if (!lastRevealedToken) return
    if (
      Platform.OS === 'web' &&
      typeof navigator !== 'undefined' &&
      navigator.clipboard
    ) {
      navigator.clipboard.writeText(lastRevealedToken)
      showToast('Token copié', 'success')
    } else {
      showToast('Copie manuelle requise', 'info')
    }
  }, [lastRevealedToken, showToast])

  // Synchronise le portal global avec l'état formPanel
  useEffect(() => {
    if (!formPanel) {
      clearPanel()
      return
    }

    if (formPanel.type === 'hub') {
      renderPanel(
        <SlidePanel visible={true} onClose={handleClosePanel} width={460}>
          <HubFormPanel onSave={handleSaveHub} onCancel={handleClosePanel} />
        </SlidePanel>
      )
      return
    }

    if (formPanel.type === 'printer') {
      const editingPrinter = formPanel.printer
      renderPanel(
        <SlidePanel visible={true} onClose={handleClosePanel} width={520}>
          <PrinterFormPanel
            printer={editingPrinter}
            onSave={handleSavePrinter}
            onCancel={handleClosePanel}
            onDelete={
              editingPrinter
                ? async () => {
                    await handleDeletePrinter(editingPrinter)
                    handleClosePanel()
                  }
                : undefined
            }
          />
        </SlidePanel>
      )
    }
  }, [
    formPanel,
    handleClosePanel,
    handleSaveHub,
    handleSavePrinter,
    handleDeletePrinter,
    renderPanel,
    clearPanel,
  ])

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.tabHeader}>
        <View>
          <RNText style={styles.tabTitle}>Paramétrage</RNText>
          <RNText style={styles.tabSubtitle}>
            Hubs Raspberry Pi et imprimantes thermiques de votre établissement
          </RNText>
        </View>
      </View>

      {lastRevealedToken && (
        <View style={styles.tokenReveal}>
          <View style={styles.tokenRevealHeader}>
            <RNText style={styles.tokenRevealTitle}>
              Token d'appareil à copier maintenant
            </RNText>
            <Pressable onPress={clearRevealedToken}>
              <X size={18} color="#92400E" />
            </Pressable>
          </View>
          <RNText style={styles.tokenRevealHint}>
            Collez ce token dans /etc/komy-agent/token sur le Pi puis redémarrez
            le service. Il ne sera plus affiché après fermeture.
          </RNText>
          <View style={styles.tokenRow}>
            <RNText style={styles.tokenValue} numberOfLines={1} selectable>
              {lastRevealedToken}
            </RNText>
            <Pressable onPress={copyTokenToClipboard} style={styles.copyButton}>
              <Copy size={16} color="#FFFFFF" />
              <RNText style={styles.copyButtonText}>Copier</RNText>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Server size={18} color="#1E293B" />
            <RNText style={styles.sectionTitle}>Hubs d'impression</RNText>
          </View>
          <Pressable
            style={styles.primaryButton}
            onPress={() => setFormPanel({ type: 'hub' })}
          >
            <Plus size={14} color="#FFFFFF" />
            <RNText style={styles.primaryButtonText}>Nouveau hub</RNText>
          </Pressable>
        </View>

        {hubs.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <RNText style={styles.emptyStateText}>
              Aucun hub enregistré. Créez-en un pour associer un Raspberry Pi à
              ce compte.
            </RNText>
          </View>
        ) : (
          hubs.map((hub) => (
            <View key={hub.id} style={styles.row}>
              <View style={styles.rowIcon}>
                <Server size={18} color="#475569" />
              </View>
              <View style={styles.rowBody}>
                <View style={styles.rowTitleLine}>
                  <RNText style={styles.rowTitle}>
                    {hub.deviceName ?? hub.deviceFingerprint}
                  </RNText>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: hub.online ? '#DCFCE7' : '#FEF2F2' },
                    ]}
                  >
                    {hub.online ? (
                      <CheckCircle2 size={12} color="#16A34A" />
                    ) : (
                      <XCircle size={12} color="#DC2626" />
                    )}
                    <RNText
                      style={[
                        styles.statusPillText,
                        { color: hub.online ? '#16A34A' : '#DC2626' },
                      ]}
                    >
                      {hub.online ? 'En ligne' : 'Hors ligne'}
                    </RNText>
                  </View>
                </View>
                <RNText style={styles.rowSubtitle}>
                  {hub.deviceFingerprint}
                  {hub.lastUsedAt
                    ? ` · vu ${new Date(hub.lastUsedAt).toLocaleString('fr-FR')}`
                    : ''}
                </RNText>
              </View>
              <Pressable
                onPress={() => handleRevokeHub(hub.id)}
                style={styles.iconButton}
              >
                <Trash2 size={16} color="#DC2626" />
              </Pressable>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <PrinterIcon size={18} color="#1E293B" />
            <RNText style={styles.sectionTitle}>Imprimantes</RNText>
          </View>
          <Pressable
            style={styles.primaryButton}
            onPress={() => setFormPanel({ type: 'printer' })}
          >
            <Plus size={14} color="#FFFFFF" />
            <RNText style={styles.primaryButtonText}>Nouvelle imprimante</RNText>
          </Pressable>
        </View>

        {printers.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <RNText style={styles.emptyStateText}>
              Aucune imprimante configurée pour ce compte.
            </RNText>
          </View>
        ) : (
          printers.map((printer) => (
            <Pressable
              key={printer.id}
              style={styles.row}
              onPress={() => setFormPanel({ type: 'printer', printer })}
            >
              <View
                style={[
                  styles.rowIcon,
                  { backgroundColor: `${PRINTER_TYPE_COLORS[printer.type]}20` },
                ]}
              >
                <PrinterIcon size={18} color={PRINTER_TYPE_COLORS[printer.type]} />
              </View>
              <View style={styles.rowBody}>
                <View style={styles.rowTitleLine}>
                  <RNText style={styles.rowTitle}>{printer.name}</RNText>
                  <View
                    style={[
                      styles.typePill,
                      { backgroundColor: `${PRINTER_TYPE_COLORS[printer.type]}20` },
                    ]}
                  >
                    <RNText
                      style={[
                        styles.typePillText,
                        { color: PRINTER_TYPE_COLORS[printer.type] },
                      ]}
                    >
                      {PRINTER_TYPE_LABELS[printer.type]}
                      {printer.zone ? ` · ${printer.zone}` : ''}
                    </RNText>
                  </View>
                </View>
                <RNText style={styles.rowSubtitle}>
                  {printer.ip}:{printer.port} · {printer.width} col.
                  {!printer.isActive ? ' · Désactivée' : ''}
                </RNText>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  contentContainer: { padding: 24, paddingBottom: 80 },
  tabHeader: { marginBottom: 24 },
  tabTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  tabSubtitle: { fontSize: 14, color: '#64748B' },
  tokenReveal: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tokenRevealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tokenRevealTitle: { fontSize: 14, fontWeight: '600', color: '#92400E' },
  tokenRevealHint: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 10,
    lineHeight: 16,
  },
  tokenRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tokenValue: {
    flex: 1,
    fontSize: 12,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 6,
    color: '#111827',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#92400E',
    borderRadius: 6,
  },
  copyButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  section: { marginBottom: 32 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0F172A',
    borderRadius: 8,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  emptyState: {
    padding: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyStateText: { fontSize: 13, color: '#64748B', textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    gap: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  rowSubtitle: { fontSize: 12, color: '#64748B' },
  iconButton: { padding: 8, borderRadius: 6 },
  typePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typePillText: { fontSize: 11, fontWeight: '600' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillText: { fontSize: 11, fontWeight: '600' },
})
