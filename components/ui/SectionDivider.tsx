import React, { memo } from 'react';
import { View, Text as RNText, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '~/theme';

interface SectionDividerProps {
  title: string;
  /** Add borderRadius (e.g. for card views). Default: 0 */
  borderRadius?: number;
  /** Override container style */
  style?: ViewStyle;
}

/**
 * Section divider bar used across lists, tables, and panels.
 * Displays an uppercase label on a light background strip.
 */
export const SectionDivider = memo<SectionDividerProps>(({ title, borderRadius = 0, style }) => (
  <View style={[styles.container, borderRadius > 0 && { borderRadius }, style]}>
    <RNText style={styles.title}>{title}</RNText>
  </View>
));

SectionDivider.displayName = 'SectionDivider';

export const SECTION_DIVIDER_HEIGHT = 38;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral[200],
    height: SECTION_DIVIDER_HEIGHT,
    justifyContent: 'center',
    paddingLeft: 20,
    paddingRight: 16,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.neutral[600],
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
