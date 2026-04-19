import { View, Text, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';
import { colors } from '~/theme';

interface InfoRowProps {
  label: string;
  value: string | ReactNode;
  labelStyle?: any;
  valueStyle?: any;
}

export function InfoRow({ label, value, labelStyle, valueStyle }: InfoRowProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
      {typeof value === 'string' ? (
        <Text style={[styles.value, valueStyle]}>{value}</Text>
      ) : (
        <View style={styles.valueContainer}>{value}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 14,
    color: colors.gray[500],
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: colors.gray[800],
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  valueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
});
