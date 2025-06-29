import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LoadingSpinner } from './LoadingSpinner';

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
        <LoadingSpinner size={40} color="#6366F1" />
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
    backgroundColor: '#FAFAFA',
    minHeight: 200,
  },
  content: {
    alignItems: 'center',
    padding: 32,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
    textAlign: 'center',
  },
});