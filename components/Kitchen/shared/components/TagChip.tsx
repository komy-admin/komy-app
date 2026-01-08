import React from 'react';
import { View, Text as RNText, StyleSheet } from 'react-native';
import { formatTagValue, getFieldTypeConfig, formatPrice } from '~/lib/utils';

interface TagChipProps {
  tag: {
    tagSnapshot: {
      label: string;
      fieldType: string;
    };
    priceModifier?: number;
  };
}

/**
 * Composant atomique qui affiche un tag avec sa valeur et son prix modificateur
 *
 * Utilise getFieldTypeConfig pour déterminer les couleurs selon le fieldType.
 * Affiche le label en gras, la valeur formatée, et le prix modificateur si présent.
 */
export function TagChip({ tag }: TagChipProps) {
  const config = getFieldTypeConfig(tag.tagSnapshot.fieldType);
  const formattedValue = formatTagValue(tag);

  return (
    <View style={[styles.container, { backgroundColor: config.bgColor }]}>
      <RNText style={[styles.label, { color: config.textColor }]}>
        <RNText style={styles.labelBold}>{tag.tagSnapshot.label}</RNText>: {formattedValue}
      </RNText>

      {tag.priceModifier != null && tag.priceModifier !== 0 && (
        <View style={[styles.priceContainer, { backgroundColor: config.priceBgColor }]}>
          <RNText style={[styles.priceText, { color: config.textColor }]}>
            {(tag.priceModifier > 0 ? '+' : '') + formatPrice(tag.priceModifier)}
          </RNText>
        </View>
      )}
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
  priceContainer: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  priceText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
