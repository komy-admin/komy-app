import { View, Text, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';

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
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  valueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
});
