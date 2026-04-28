import React from 'react'
import { View, StyleSheet, Text as RNText, Pressable, Keyboard, Platform } from 'react-native'
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard'
import type { Printer, PrintJobStatus } from '~/types/printer.types'

const STATUS_OPTIONS: Array<{ value: PrintJobStatus | 'all'; label: string; color: string }> = [
  { value: 'all', label: 'Tous', color: '#64748B' },
  { value: 'pending', label: 'En attente', color: '#F59E0B' },
  { value: 'sent', label: 'Envoyé', color: '#3B82F6' },
  { value: 'acked', label: 'Imprimé', color: '#10B981' },
  { value: 'failed', label: 'Échec', color: '#EF4444' },
  { value: 'dead', label: 'Abandonné', color: '#7C2D12' },
  { value: 'cancelled', label: 'Annulé', color: '#64748B' },
]

export interface PrintJobsFilterState {
  status: PrintJobStatus | 'all'
  printerId: string | 'all'
}

export const createEmptyPrintJobsFilters = (): PrintJobsFilterState => ({
  status: 'all',
  printerId: 'all',
})

interface PrintJobsFiltersProps {
  filters: PrintJobsFilterState
  printers: Printer[]
  onFiltersChange: (filters: PrintJobsFilterState) => void
  onClearFilters: () => void
}

export const PrintJobsFilters: React.FC<PrintJobsFiltersProps> = ({
  filters,
  printers,
  onFiltersChange,
  onClearFilters,
}) => {
  const hasActiveFilters = filters.status !== 'all' || filters.printerId !== 'all'

  return (
    <KeyboardAwareScrollViewWrapper
      style={styles.container}
      contentContainerStyle={styles.content}
      bottomOffset={40}
    >
      <Pressable
        style={{ flex: 1 }}
        onPress={() => {
          if (Platform.OS !== 'web') Keyboard.dismiss()
        }}
      >
        <View style={styles.group}>
          <RNText style={styles.label}>Statut</RNText>
          <View style={styles.chipRow}>
            {STATUS_OPTIONS.map((option) => {
              const active = filters.status === option.value
              return (
                <Pressable
                  key={option.value}
                  onPress={() => onFiltersChange({ ...filters, status: option.value })}
                  style={[
                    styles.chip,
                    active && {
                      backgroundColor: option.color,
                      borderColor: option.color,
                    },
                  ]}
                >
                  <RNText style={[styles.chipText, active && styles.chipTextActive]}>
                    {option.label}
                  </RNText>
                </Pressable>
              )
            })}
          </View>
        </View>

        <View style={styles.group}>
          <RNText style={styles.label}>Imprimante</RNText>
          <View style={styles.chipRow}>
            <Pressable
              onPress={() => onFiltersChange({ ...filters, printerId: 'all' })}
              style={[styles.chip, filters.printerId === 'all' && styles.chipActiveDark]}
            >
              <RNText
                style={[
                  styles.chipText,
                  filters.printerId === 'all' && styles.chipTextActive,
                ]}
              >
                Toutes
              </RNText>
            </Pressable>
            {printers.map((printer) => {
              const active = filters.printerId === printer.id
              return (
                <Pressable
                  key={printer.id}
                  onPress={() => onFiltersChange({ ...filters, printerId: printer.id })}
                  style={[styles.chip, active && styles.chipActiveDark]}
                >
                  <RNText
                    style={[styles.chipText, active && styles.chipTextActive]}
                    numberOfLines={1}
                  >
                    {printer.name}
                  </RNText>
                </Pressable>
              )
            })}
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={onClearFilters}
            disabled={!hasActiveFilters}
            style={[
              styles.clearButton,
              hasActiveFilters ? styles.clearButtonActive : styles.clearButtonInactive,
            ]}
          >
            <RNText
              style={[
                styles.clearButtonText,
                hasActiveFilters
                  ? styles.clearButtonTextActive
                  : styles.clearButtonTextInactive,
              ]}
            >
              Effacer les filtres
            </RNText>
          </Pressable>
        </View>
      </Pressable>
    </KeyboardAwareScrollViewWrapper>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 20 },
  group: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#2A2E33', marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActiveDark: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipText: { fontSize: 12, color: '#475569' },
  chipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  actions: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  clearButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonActive: {
    backgroundColor: '#2A2E33',
    borderWidth: 1,
    borderColor: '#2A2E33',
  },
  clearButtonInactive: {
    backgroundColor: Platform.select({ web: '#F3F4F6', default: 'transparent' }),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clearButtonText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
  clearButtonTextActive: { color: '#FFFFFF' },
  clearButtonTextInactive: { color: '#A0A0A0' },
})
