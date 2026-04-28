import React, { useState } from 'react'
import {
  View,
  Text as RNText,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native'
import { X } from 'lucide-react-native'

interface HubFormPanelProps {
  onSave: (input: { deviceName?: string; deviceFingerprint: string }) => Promise<void>
  onCancel: () => void
}

export function HubFormPanel({ onSave, onCancel }: HubFormPanelProps) {
  const [name, setName] = useState('')
  const [fingerprint, setFingerprint] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = fingerprint.trim().length > 0 && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onSave({
        deviceName: name.trim() || undefined,
        deviceFingerprint: fingerprint.trim(),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <RNText style={styles.title}>Nouveau hub d'impression</RNText>
        <Pressable onPress={onCancel} style={styles.closeButton}>
          <X size={20} color="#2A2E33" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <RNText style={styles.helper}>
          Enregistrez un Raspberry Pi ou autre device qui servira de hub
          d'impression. Le token d'appareil sera affiché une seule fois après
          création — copiez-le immédiatement.
        </RNText>

        <View style={styles.field}>
          <RNText style={styles.label}>Nom (optionnel)</RNText>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Pi comptoir"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.field}>
          <RNText style={styles.label}>
            Identifiant matériel (hostname ou fingerprint)
          </RNText>
          <TextInput
            style={styles.input}
            value={fingerprint}
            onChangeText={setFingerprint}
            placeholder="komy-hub-a3f2b1"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <RNText style={styles.hint}>
            Cet identifiant doit être unique. Il correspond généralement au
            hostname du Pi (ex: `komy-hub-bistroparis`).
          </RNText>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={onCancel} style={styles.secondaryButton}>
          <RNText style={styles.secondaryButtonText}>Annuler</RNText>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
        >
          <RNText style={styles.primaryButtonText}>
            {submitting ? 'Création…' : 'Créer le hub'}
          </RNText>
        </Pressable>
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
  content: { padding: 20, gap: 20 },
  helper: { fontSize: 13, color: '#64748B', lineHeight: 19 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  hint: { fontSize: 11, color: '#94A3B8', lineHeight: 15 },
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
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
