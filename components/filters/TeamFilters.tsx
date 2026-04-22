import React from 'react';
import { View, StyleSheet, Text, TextInput, Pressable, Keyboard, Platform } from 'react-native';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';
import { colors } from '~/theme';

export interface TeamFilterState {
  name: string;
}

interface TeamFiltersProps {
  filters: TeamFilterState;
  onFiltersChange: (filters: TeamFilterState) => void;
  onClearFilters: () => void;
}

export const TeamFilters: React.FC<TeamFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {

  const hasActiveFilters = () => filters.name !== '';

  return (
    <KeyboardAwareScrollViewWrapper
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}
      bottomOffset={40}
      scrollEventThrottle={16}
    >
      <Pressable style={{ flex: 1 }} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
      {/* Nom */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Nom</Text>
        <TextInput
          style={styles.textInput}
          value={filters.name}
          onChangeText={(text) => onFiltersChange({ ...filters, name: text })}
          placeholder="Rechercher..."
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      {/* Actions */}
      <View style={styles.filterActions}>
        <Pressable
          onPress={onClearFilters}
          disabled={!hasActiveFilters()}
          style={[
            styles.clearButton,
            hasActiveFilters() ? styles.clearButtonActive : styles.clearButtonInactive
          ]}
        >
          <Text style={[
            styles.clearButtonText,
            hasActiveFilters() ? styles.clearButtonTextActive : styles.clearButtonTextInactive
          ]}>
            Effacer les filtres
          </Text>
        </Pressable>
      </View>
      </Pressable>
    </KeyboardAwareScrollViewWrapper>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    flex: 1,
  },
  filterContent: {
    padding: 16,
    gap: 16,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.brand.dark,
    marginBottom: 2,
  },
  textInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 15,
    minHeight: 40,
    fontSize: 14,
    color: colors.brand.dark,
  },
  filterActions: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  clearButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonActive: {
    backgroundColor: colors.brand.dark,
    borderWidth: 1,
    borderColor: colors.brand.dark,
  },
  clearButtonInactive: {
    ...Platform.select({
      web: {
        backgroundColor: colors.gray[100],
      },
      default: {
        backgroundColor: 'transparent',
      }
    }),
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  clearButtonTextActive: {
    color: colors.white,
  },
  clearButtonTextInactive: {
    color: colors.gray[400],
  },
});