import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LoadingSpinner } from './LoadingSpinner';
import { colors } from '~/theme';

interface TableLoaderProps {
  message?: string;
  showMessage?: boolean;
}

export const TableLoader: React.FC<TableLoaderProps> = ({ 
  message = "Chargement des données...",
  showMessage = true 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <LoadingSpinner size={40} color={colors.brand.accent} />
        {showMessage && (
          <Text style={styles.message}>{message}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    minHeight: 200,
  },
  content: {
    alignItems: 'center',
    padding: 32,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray[500],
    fontWeight: '400',
    textAlign: 'center',
  },
});