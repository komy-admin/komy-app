import React from 'react';
import { View, Text as RNText, StyleSheet } from 'react-native';
import { colors } from '~/theme';

interface NoteChipProps {
  note: string;
}

/**
 * Composant atomique qui affiche une note de commande
 *
 * Utilise un style jaune clair avec bordure pour bien se distinguer.
 * Le texte peut wraper sur plusieurs lignes si nécessaire.
 */
export function NoteChip({ note }: NoteChipProps) {
  if (!note || note.trim().length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <RNText style={styles.text}>{note}</RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.warning.bg,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.warning.border,
    maxWidth: '100%',
  },
  text: {
    fontSize: 11,
    color: colors.warning.text,
    fontWeight: '500',
    fontStyle: 'italic',
  },
});
