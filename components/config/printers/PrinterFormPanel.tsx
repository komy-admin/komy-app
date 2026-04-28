import React, { useState } from 'react'
import {
  View,
  Text as RNText,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
} from 'react-native'
import { X } from 'lucide-react-native'
import type { Printer, PrinterType, PrinterCreateInput } from '~/types/printer.types'

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

interface PrinterFormPanelProps {
  printer?: Printer | null
  onSave: (input: PrinterCreateInput) => Promise<void>
  onCancel: () => void
  onDelete?: () => Promise<void>
}

export function PrinterFormPanel({
  printer,
  onSave,
  onCancel,
  onDelete,
}: PrinterFormPanelProps) {
  const [name, setName] = useState(printer?.name ?? '')
  const [type, setType] = useState<PrinterType>(printer?.type ?? 'kitchen')
  const [zone, setZone] = useState(printer?.zone ?? '')
  const [ip, setIp] = useState(printer?.ip ?? '')
  const [port, setPort] = useState(String(printer?.port ?? 9100))
  const [width, setWidth] = useState(String(printer?.width ?? 48))
  const [isActive, setIsActive] = useState(printer?.isActive ?? true)
  const [submitting, setSubmitting] = useState(false)

  const isEditing = Boolean(printer)
  const canSubmit = name.trim().length > 0 && ip.trim().length > 0 && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onSave({
        name: name.trim(),
        type,
        zone: zone.trim() || undefined,
        ip: ip.trim(),
        port: Number(port) || 9100,
        width: Number(width) || 48,
        isActive,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setSubmitting(true)
    try {
      await onDelete()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <RNText style={styles.title}>
          {isEditing ? "Modifier l'imprimante" : 'Nouvelle imprimante'}
        </RNText>
        <Pressable onPress={onCancel} style={styles.closeButton}>
          <X size={20} color="#2A2E33" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.field}>
          <RNText style={styles.label}>Nom</RNText>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Imprimante Cuisine"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.field}>
          <RNText style={styles.label}>Type</RNText>
          <View style={styles.segmentGroup}>
            {(['kitchen', 'bar', 'cashier'] as PrinterType[]).map((t) => {
              const active = type === t
              return (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  style={[
                    styles.segment,
                    active && { backgroundColor: PRINTER_TYPE_COLORS[t] },
                  ]}
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
        </View>

        <View style={styles.field}>
          <RNText style={styles.label}>Zone (optionnel)</RNText>
          <TextInput
            style={styles.input}
            value={zone}
            onChangeText={setZone}
            placeholder="chaude, froide, terrasse…"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.row3}>
          <View style={[styles.field, { flex: 2 }]}>
            <RNText style={styles.label}>Adresse IP</RNText>
            <TextInput
              style={styles.input}
              value={ip}
              onChangeText={setIp}
              placeholder="192.168.1.50"
              placeholderTextColor="#9CA3AF"
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <RNText style={styles.label}>Port</RNText>
            <TextInput
              style={styles.input}
              value={port}
              onChangeText={setPort}
              placeholder="9100"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <RNText style={styles.label}>Colonnes</RNText>
            <TextInput
              style={styles.input}
              value={width}
              onChangeText={setWidth}
              placeholder="48"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.switchRow}>
          <RNText style={styles.label}>Active</RNText>
          <Switch value={isActive} onValueChange={setIsActive} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {isEditing && onDelete ? (
          <Pressable
            onPress={handleDelete}
            disabled={submitting}
            style={styles.deleteButton}
          >
            <RNText style={styles.deleteButtonText}>Supprimer</RNText>
          </Pressable>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <View style={styles.footerActions}>
          <Pressable onPress={onCancel} style={styles.secondaryButton}>
            <RNText style={styles.secondaryButtonText}>Annuler</RNText>
          </Pressable>
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
          >
            <RNText style={styles.primaryButtonText}>
              {submitting
                ? 'Enregistrement…'
                : isEditing
                  ? 'Enregistrer'
                  : 'Créer'}
            </RNText>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: { fontSize: 18, fontWeight: '600', color: '#2A2E33' },
  closeButton: { padding: 6 },
  content: { padding: 20, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
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
  row3: { flexDirection: 'row', gap: 8 },
  segmentGroup: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#F8FAFC',
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center',
  },
  segmentText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  segmentTextActive: { color: '#FFFFFF' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerActions: { flexDirection: 'row', gap: 8 },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  deleteButtonText: { color: '#B91C1C', fontSize: 14, fontWeight: '600' },
  secondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  secondaryButtonText: { color: '#1E293B', fontSize: 14, fontWeight: '500' },
  primaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderRadius: 8,
  },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
})
