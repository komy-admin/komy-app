import React from 'react';
import { View, Text as RNText, StyleSheet } from 'react-native';
import { formatTagValue, formatPrice } from '~/lib/utils';
import { colors } from '~/theme';

interface TagBadgeProps {
  tag: {
    tagSnapshot: {
      label: string;
      fieldType: string;
    };
    value?: any;
    priceModifier?: number | null;
  };
  showPrice?: boolean;
}

/**
 * Ligne tag réutilisable — dot + label : valeur (prix).
 *
 * Utilisé dans les tickets cuisine/bar, le panel de review, etc.
 * Pour le priceModifier, passer showPrice={true}.
 */
export function TagBadge({ tag, showPrice }: TagBadgeProps) {
  const formattedValue = formatTagValue(tag);
  const hasPrice = showPrice && tag.priceModifier != null && tag.priceModifier !== 0;

  return (
    <View style={styles.container}>
      <View style={styles.dot} />
      <RNText style={styles.text}>
        <RNText style={styles.label}>{tag.tagSnapshot.label.toUpperCase()}</RNText>
        {' : '}{formattedValue.toUpperCase()}
        {hasPrice && (
          <RNText style={styles.price}>
            {' '}({tag.priceModifier! > 0 ? '+' : ''}{formatPrice(tag.priceModifier!)})
          </RNText>
        )}
      </RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.brand.dark,
  },
  text: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.brand.dark,
  },
  label: {
    fontWeight: '800',
  },
  price: {
    fontWeight: '700',
  },
});
