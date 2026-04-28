import React, { useMemo } from 'react'
import { View, Text as RNText, StyleSheet, Platform } from 'react-native'
import { parseEscPos } from '~/lib/escposParser'

interface EscposPreviewProps {
  payloadBase64: string
}

const MONO_FONT = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
})

/**
 * Aperçu d'un ticket ESC/POS, rendu visuellement comme il sortira de
 * l'imprimante thermique :
 * - police monospace
 * - largeur fixe simulée
 * - alignement gauche/centre/droite
 * - mise en valeur bold + double-size (titres / total)
 * - séparateurs ----- en gris clair
 */
export function EscposPreview({ payloadBase64 }: EscposPreviewProps) {
  const blocks = useMemo(() => parseEscPos(payloadBase64), [payloadBase64])

  return (
    <View style={styles.paper}>
      <View style={styles.tearTop} />
      {blocks.map((block, index) => {
        if (block.isSeparator) {
          return <View key={index} style={styles.separator} />
        }
        return (
          <RNText
            key={index}
            style={[
              styles.line,
              { textAlign: block.align },
              block.bold && styles.bold,
              block.doubleSize && styles.doubleSize,
            ]}
            selectable
          >
            {block.text || ' '}
          </RNText>
        )
      })}
      <View style={styles.tearBottom} />
    </View>
  )
}

const styles = StyleSheet.create({
  paper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tearTop: {
    height: 4,
    marginHorizontal: -16,
    marginTop: -18,
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  tearBottom: {
    height: 4,
    marginHorizontal: -16,
    marginBottom: -18,
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  line: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    lineHeight: 15,
    color: '#0F172A',
  },
  bold: {
    fontWeight: '700',
  },
  doubleSize: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    marginVertical: 2,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#94A3B8',
    borderStyle: 'dashed',
    marginVertical: 4,
  },
})
