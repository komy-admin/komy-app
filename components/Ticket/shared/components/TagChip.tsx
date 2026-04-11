import React from 'react';
import { View, Text as RNText, StyleSheet } from 'react-native';
import { formatTagValue, getFieldTypeConfig } from '~/lib/utils';

interface TagChipProps {
  tag: {
    tagSnapshot: {
      label: string;
      fieldType: string;
    };
  };
}

/**
 * Composant atomique qui affiche un tag avec sa valeur.
 * Couleurs déterminées par le fieldType via getFieldTypeConfig.
 */
export function TagChip({ tag }: TagChipProps) {
  const config = getFieldTypeConfig(tag.tagSnapshot.fieldType);
  const formattedValue = formatTagValue(tag);

  return (
    <View style={[styles.container, { backgroundColor: config.bgColor }]}>
      <RNText style={[styles.label, { color: config.textColor }]}>
        <RNText style={styles.labelBold}>{tag.tagSnapshot.label}</RNText>: {formattedValue}
      </RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
  labelBold: {
    fontWeight: '900',
  },
});
