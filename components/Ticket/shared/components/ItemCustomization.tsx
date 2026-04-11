import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TagChip } from './TagChip';
import { NoteChip } from './NoteChip';

interface ItemCustomizationProps {
  note?: string;
  tags?: Array<{
    tagSnapshot: {
      label: string;
      fieldType: string;
    };
    priceModifier?: number;
  }>;
}

/**
 * Composant qui affiche la personnalisation d'un item (notes + tags)
 *
 * Affiche les notes et les tags dans un layout flex wrap.
 * Retourne null si aucune personnalisation n'est présente.
 */
export function ItemCustomization({ note, tags }: ItemCustomizationProps) {
  const hasNote = note && note.trim().length > 0;
  const hasTags = tags && tags.length > 0;

  if (!hasNote && !hasTags) {
    return null;
  }

  return (
    <View style={styles.container}>
      {hasNote && <NoteChip note={note} />}

      {hasTags && tags?.filter(tag => tag?.tagSnapshot).map((tag, index) => (
        <TagChip key={index} tag={tag} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
});
