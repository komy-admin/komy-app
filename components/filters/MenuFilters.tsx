import React from 'react';
import { View, StyleSheet, Text, TextInput } from 'react-native';
import { Button } from '~/components/ui';
import { NumberInput } from '~/components/ui/number-input';

export interface MenuFilterState {
  name: string;
  minPrice: number | null;
  maxPrice: number | null;
}

interface MenuFiltersProps {
  filters: MenuFilterState;
  onFiltersChange: (filters: MenuFilterState) => void;
  onClearFilters: () => void;
}

export const MenuFilters: React.FC<MenuFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  
  const updateFilter = (field: keyof MenuFilterState, value: string | number | null) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = () => {
    return filters.name !== '' || 
           filters.minPrice !== null || 
           filters.maxPrice !== null;
  };

  return (
    <View style={styles.filterContainer}>
      {/* Nom de l'article */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Nom de l'article</Text>
        <TextInput
          style={styles.textInput}
          value={filters.name}
          onChangeText={(text) => updateFilter('name', text)}
          placeholder="Rechercher..."
          placeholderTextColor="#999"
        />
      </View>

      {/* Prix */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Prix</Text>
        <View style={styles.rangeInputs}>
          <View style={styles.numberInputContainer}>
            <NumberInput
              value={filters.minPrice}
              onChangeText={(value) => updateFilter('minPrice', value)}
              placeholder="Min"
              placeholderTextColor="#999"
              decimalPlaces={2}
              min={0}
              currency="€"
              style={styles.numberInputStyle}
            />
          </View>
          <Text style={styles.rangeSeparator}>-</Text>
          <View style={styles.numberInputContainer}>
            <NumberInput
              value={filters.maxPrice}
              onChangeText={(value) => updateFilter('maxPrice', value)}
              placeholder="Max"
              placeholderTextColor="#999"
              decimalPlaces={2}
              min={0}
              currency="€"
              style={styles.numberInputStyle}
            />
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.filterActions}>
        <Button
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
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    padding: 20,
    gap: 20,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    fontSize: 14,
    color: '#2A2E33',
  },
  rangeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  numberInputContainer: {
    flex: 1,
  },
  numberInputStyle: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    fontSize: 14,
    color: '#2A2E33',
    textAlign: 'center',
    flex: 1,
    width: '100%',
  },
  rangeSeparator: {
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 4,
  },
  filterActions: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
    backgroundColor: '#2A2E33',
    borderWidth: 1,
    borderColor: '#2A2E33',
  },
  clearButtonInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  clearButtonTextActive: {
    color: '#FFFFFF',
  },
  clearButtonTextInactive: {
    color: '#A0A0A0',
  },
});