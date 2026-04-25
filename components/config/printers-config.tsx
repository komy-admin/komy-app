import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text as RNText,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Platform,
} from 'react-native'
import { Copy, Plus, Printer as PrinterIcon, Server, Trash2, X, CheckCircle2, XCircle } from 'lucide-react-native'
import { useRouter, type Href } from 'expo-router'
import { usePrinters } from '~/hooks/usePrinters'
import { usePrintHubs } from '~/hooks/usePrintHubs'
import { useToast } from '~/components/ToastProvider'
import { showApiError } from '~/lib/apiErrorHandler'
import type { Printer, PrinterType } from '~/types/printer.types'

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

type PrinterFormState = {
  id: string | null
  name: string
  type: PrinterType
  zone: string
  ip: string
  port: string
  width: string
  isActive: boolean
}

const EMPTY_PRINTER_FORM: PrinterFormState = {
  id: null,
  name: '',
  type: 'kitchen',
  zone: '',
  ip: '',
  port: '9100',
  width: '48',
  isActive: true,
}

export default function PrintersConfigPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { printers, loadPrinters, createPrinter, updatePrinter, deletePrinter } = usePrinters()
  const {
    hubs,
    loadHubs,
    createHub,
    revokeHub,
    lastRevealedToken,
    clearRevealedToken,
  } = usePrintHubs()

  const [isLoading, setIsLoading] = useState(false)
  const [printerForm, setPrinterForm] = useState<PrinterFormState>(EMPTY_PRINTER_FORM)
  const [isPrinterFormOpen, setIsPrinterFormOpen] = useState(false)
  const [isHubFormOpen, setIsHubFormOpen] = useState(false)
  const [hubFormName, setHubFormName] = useState('')
  const [hubFormFingerprint, setHubFormFingerprint] = useState('')

  useEffect(() => {
    setIsLoading(true)
    Promise.all([loadPrinters(), loadHubs()])
      .catch((error) => showApiError(error, showToast, 'Erreur de chargement'))
      .finally(() => setIsLoading(false))
  }, [loadPrinters, loadHubs, showToast])

  const openCreatePrinter = () => {
    setPrinterForm(EMPTY_PRINTER_FORM)
    setIsPrinterFormOpen(true)
  }

  const openEditPrinter = (printer: Printer) => {
    setPrinterForm({
      id: printer.id,
      name: printer.name,
      type: printer.type,
      zone: printer.zone ?? '',
      ip: printer.ip,
      port: String(printer.port),
      width: String(printer.width),
      isActive: printer.isActive,
    })
    setIsPrinterFormOpen(true)
  }

  const submitPrinter = async () => {
    try {
      const payload = {
        name: printerForm.name.trim(),
        type: printerForm.type,
        zone: printerForm.zone.trim() || undefined,
        ip: printerForm.ip.trim(),
        port: Number(printerForm.port) || 9100,
        width: Number(printerForm.width) || 48,
        isActive: printerForm.isActive,
      }
      if (printerForm.id) {
        await updatePrinter(printerForm.id, payload)
        showToast('Imprimante mise à jour', 'success')
      } else {
        await createPrinter(payload)
        showToast('Imprimante créée', 'success')
      }
      setIsPrinterFormOpen(false)
    } catch (error) {
      showApiError(error, showToast, "Échec de l'enregistrement")
    }
  }

  const handleDeletePrinter = async (printer: Printer) => {
    try {
      await deletePrinter(printer.id)
      showToast('Imprimante supprimée', 'success')
    } catch (error) {
      showApiError(error, showToast, 'Échec de la suppression')
    }
  }

  const submitHub = async () => {
    if (!hubFormFingerprint.trim()) {
      showToast('Identifiant device requis', 'warning')
      return
    }
    try {
      await createHub({
        deviceFingerprint: hubFormFingerprint.trim(),
        deviceName: hubFormName.trim() || undefined,
        devicePlatform: 'raspberrypi',
      })
      showToast('Hub créé. Copiez le token maintenant.', 'success')
      setHubFormName('')
      setHubFormFingerprint('')
      setIsHubFormOpen(false)
    } catch (error) {
      showApiError(error, showToast, 'Échec de la création du hub')
    }
  }

  const handleRevokeHub = async (id: string) => {
    try {
      await revokeHub(id)
      showToast('Hub révoqué', 'success')
    } catch (error) {
      showApiError(error, showToast, 'Échec de la révocation')
    }
  }

  const copyTokenToClipboard = useCallback(() => {
    if (!lastRevealedToken) return
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(lastRevealedToken)
      showToast('Token copié', 'success')
    } else {
      showToast('Copie manuelle requise', 'info')
    }
  }, [lastRevealedToken, showToast])

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <RNText style={styles.title}>Impression</RNText>
        <RNText style={styles.subtitle}>
          Configurez vos hubs Raspberry Pi et vos imprimantes thermiques.
        </RNText>
      </View>

      <Pressable
        style={[styles.linkCard]}
        onPress={() => router.push('/(admin)/print-jobs' as Href)}
      >
        <RNText style={styles.linkCardTitle}>Monitoring des jobs d'impression</RNText>
        <RNText style={styles.linkCardSubtitle}>
          Voir les tickets imprimés, en cours ou en erreur
        </RNText>
      </Pressable>

      {lastRevealedToken && (
        <View style={styles.tokenReveal}>
          <View style={styles.tokenRevealHeader}>
            <RNText style={styles.tokenRevealTitle}>Token d'appareil à copier maintenant</RNText>
            <Pressable onPress={clearRevealedToken}>
              <X size={18} color="#92400E" />
            </Pressable>
          </View>
          <RNText style={styles.tokenRevealHint}>
            Collez ce token dans /etc/komy-agent/token sur le Pi puis redémarrez le service.
            Il ne sera plus affiché après fermeture.
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
            onPress={() => setIsHubFormOpen(true)}
          >
            <Plus size={14} color="#FFFFFF" />
            <RNText style={styles.primaryButtonText}>Nouveau hub</RNText>
          </Pressable>
        </View>

        {isHubFormOpen && (
          <View style={styles.inlineForm}>
            <RNText style={styles.inlineFormTitle}>Enregistrer un Raspberry Pi</RNText>
            <RNText style={styles.label}>Nom (optionnel)</RNText>
            <TextInput
              style={styles.input}
              value={hubFormName}
              onChangeText={setHubFormName}
              placeholder="Pi comptoir"
              placeholderTextColor="#9CA3AF"
            />
            <RNText style={styles.label}>Identifiant matériel du Pi (hostname ou fingerprint)</RNText>
            <TextInput
              style={styles.input}
              value={hubFormFingerprint}
              onChangeText={setHubFormFingerprint}
              placeholder="komy-hub-a3f2b1"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
            />
            <View style={styles.formActions}>
              <Pressable
                style={[styles.secondaryButton]}
                onPress={() => {
                  setIsHubFormOpen(false)
                  setHubFormName('')
                  setHubFormFingerprint('')
                }}
              >
                <RNText style={styles.secondaryButtonText}>Annuler</RNText>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={submitHub}>
                <RNText style={styles.primaryButtonText}>Créer</RNText>
              </Pressable>
            </View>
          </View>
        )}

        {hubs.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <RNText style={styles.emptyStateText}>
              Aucun hub enregistré. Créez-en un pour associer un Raspberry Pi à ce compte.
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
                  {hub.lastUsedAt ? ` · vu ${new Date(hub.lastUsedAt).toLocaleString('fr-FR')}` : ''}
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
          <Pressable style={styles.primaryButton} onPress={openCreatePrinter}>
            <Plus size={14} color="#FFFFFF" />
            <RNText style={styles.primaryButtonText}>Nouvelle imprimante</RNText>
          </Pressable>
        </View>

        {isPrinterFormOpen && (
          <View style={styles.inlineForm}>
            <RNText style={styles.inlineFormTitle}>
              {printerForm.id ? 'Modifier l\'imprimante' : 'Nouvelle imprimante'}
            </RNText>

            <RNText style={styles.label}>Nom</RNText>
            <TextInput
              style={styles.input}
              value={printerForm.name}
              onChangeText={(v) => setPrinterForm({ ...printerForm, name: v })}
              placeholder="Imprimante Cuisine"
              placeholderTextColor="#9CA3AF"
            />

            <RNText style={styles.label}>Type</RNText>
            <View style={styles.segmentGroup}>
              {(['kitchen', 'bar', 'cashier'] as PrinterType[]).map((t) => {
                const active = printerForm.type === t
                return (
                  <Pressable
                    key={t}
                    style={[
                      styles.segment,
                      active && { backgroundColor: PRINTER_TYPE_COLORS[t] },
                    ]}
                    onPress={() => setPrinterForm({ ...printerForm, type: t })}
                  >
                    <RNText
                      style={[
                        styles.segmentText,
                        active && styles.segmentTextActive,
                      ]}
                    >
                      {PRINTER_TYPE_LABELS[t]}
                    </RNText>
                  </Pressable>
                )
              })}
            </View>

            <RNText style={styles.label}>Zone (optionnel)</RNText>
            <TextInput
              style={styles.input}
              value={printerForm.zone}
              onChangeText={(v) => setPrinterForm({ ...printerForm, zone: v })}
              placeholder="chaude, froide, terrasse…"
              placeholderTextColor="#9CA3AF"
            />

            <View style={styles.row2}>
              <View style={{ flex: 2 }}>
                <RNText style={styles.label}>Adresse IP</RNText>
                <TextInput
                  style={styles.input}
                  value={printerForm.ip}
                  onChangeText={(v) => setPrinterForm({ ...printerForm, ip: v })}
                  placeholder="192.168.1.50"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numbers-and-punctuation"
                  autoCapitalize="none"
                />
              </View>
              <View style={{ flex: 1 }}>
                <RNText style={styles.label}>Port</RNText>
                <TextInput
                  style={styles.input}
                  value={printerForm.port}
                  onChangeText={(v) => setPrinterForm({ ...printerForm, port: v })}
                  placeholder="9100"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <RNText style={styles.label}>Colonnes</RNText>
                <TextInput
                  style={styles.input}
                  value={printerForm.width}
                  onChangeText={(v) => setPrinterForm({ ...printerForm, width: v })}
                  placeholder="48"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.switchRow}>
              <RNText style={styles.label}>Active</RNText>
              <Switch
                value={printerForm.isActive}
                onValueChange={(v) => setPrinterForm({ ...printerForm, isActive: v })}
              />
            </View>

            <View style={styles.formActions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setIsPrinterFormOpen(false)}
              >
                <RNText style={styles.secondaryButtonText}>Annuler</RNText>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={submitPrinter}>
                <RNText style={styles.primaryButtonText}>
                  {printerForm.id ? 'Enregistrer' : 'Créer'}
                </RNText>
              </Pressable>
            </View>
          </View>
        )}

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
              onPress={() => openEditPrinter(printer)}
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
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.()
                  handleDeletePrinter(printer)
                }}
                style={styles.iconButton}
              >
                <Trash2 size={16} color="#DC2626" />
              </Pressable>
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
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748B' },
  linkCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  linkCardTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B', marginBottom: 2 },
  linkCardSubtitle: { fontSize: 13, color: '#64748B' },
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
  tokenRevealHint: { fontSize: 12, color: '#92400E', marginBottom: 10, lineHeight: 16 },
  tokenRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tokenValue: {
    flex: 1,
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
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
  secondaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  secondaryButtonText: { color: '#1E293B', fontSize: 13, fontWeight: '500' },
  inlineForm: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inlineFormTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 12 },
  label: { fontSize: 12, color: '#475569', marginBottom: 4, marginTop: 8, fontWeight: '500' },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  row2: { flexDirection: 'row', gap: 8 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  segmentGroup: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  segmentText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  segmentTextActive: { color: '#FFFFFF' },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
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
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
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
