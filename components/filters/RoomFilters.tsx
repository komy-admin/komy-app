import React from 'react';
import { View, StyleSheet, Text, TextInput, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Button } from '~/components/ui';
import { NumberInput } from '~/components/ui/number-input';
import { useKeyboardDismiss } from '~/hooks/useKeyboardDismiss';
import { KEYBOARD_AWARE_CONFIG_LONG } from '~/constants/keyboardConfig';

export interface RoomFilterState {
  name: string;
  minWidth: number | null;
  maxWidth: number | null;
  minHeight: number | null;
  maxHeight: number | null;
  minTables: number | null;
  maxTables: number | null;
}

interface RoomFiltersProps {
  filters: RoomFilterState;
  onFiltersChange: (filters: RoomFilterState) => void;
  onClearFilters: () => void;
}

export const RoomFilters: React.FC<RoomFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  
  const updateFilter = (field: keyof RoomFilterState, value: string | number | null) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = () => {
    return filters.name !== '' || 
           filters.minWidth !== null || 
           filters.maxWidth !== null ||
           filters.minHeight !== null || 
           filters.maxHeight !== null ||
           filters.minTables !== null || 
           filters.maxTables !== null;
  };

  const { handleScrollBeginDrag, scrollViewRef } = useKeyboardDismiss({ delayReset: 15 });

  return (
    <KeyboardAwareScrollView
      ref={scrollViewRef}
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}
      {...KEYBOARD_AWARE_CONFIG_LONG}
      onScrollBeginDrag={handleScrollBeginDrag}
    >
      {/* Nom de la salle */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Nom de la salle</Text>
        <TextInput
          style={styles.textInput}
          value={filters.name}
          onChangeText={(text) => updateFilter('name', text)}
          placeholder="Rechercher..."
          placeholderTextColor="#999"
        />
      </View>

      {/* Dimensions */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Dimensions</Text>
        <View style={styles.rangeContainer}>
          <View style={styles.dimensionGroup}>
            <Text style={styles.rangeLabel}>Largeur</Text>
            <View style={styles.rangeInputs}>
              <View style={styles.numberInputContainer}>
                <NumberInput
                  value={filters.minWidth}
                  onChangeText={(value) => updateFilter('minWidth', value)}
                  placeholder="Min"
                  placeholderTextColor="#999"
                  decimalPlaces={0}
                  min={0}
                  style={styles.numberInputStyle}
                />
              </View>
              <Text style={styles.rangeSeparator}>-</Text>
              <View style={styles.numberInputContainer}>
                <NumberInput
                  value={filters.maxWidth}
                  onChangeText={(value) => updateFilter('maxWidth', value)}
                  placeholder="Max"
                  placeholderTextColor="#999"
                  decimalPlaces={0}
                  min={0}
                  style={styles.numberInputStyle}
                />
              </View>
            </View>
          </View>
          <View style={styles.dimensionGroup}>
            <Text style={styles.rangeLabel}>Hauteur</Text>
            <View style={styles.rangeInputs}>
              <View style={styles.numberInputContainer}>
                <NumberInput
                  value={filters.minHeight}
                  onChangeText={(value) => updateFilter('minHeight', value)}
                  placeholder="Min"
                  placeholderTextColor="#999"
                  decimalPlaces={0}
                  min={0}
                  style={styles.numberInputStyle}
                />
              </View>
              <Text style={styles.rangeSeparator}>-</Text>
              <View style={styles.numberInputContainer}>
                <NumberInput
                  value={filters.maxHeight}
                  onChangeText={(value) => updateFilter('maxHeight', value)}
                  placeholder="Max"
                  placeholderTextColor="#999"
                  decimalPlaces={0}
                  min={0}
                  style={styles.numberInputStyle}
                />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Nombre de tables */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Nombre de tables</Text>
        <View style={styles.rangeInputs}>
          <View style={styles.numberInputContainer}>
            <NumberInput
              value={filters.minTables}
              onChangeText={(value) => updateFilter('minTables', value)}
              placeholder="Min"
              placeholderTextColor="#999"
              decimalPlaces={0}
              min={0}
              style={styles.numberInputStyle}
            />
          </View>
          <Text style={styles.rangeSeparator}>-</Text>
          <View style={styles.numberInputContainer}>
            <NumberInput
              value={filters.maxTables}
              onChangeText={(value) => updateFilter('maxTables', value)}
              placeholder="Max"
              placeholderTextColor="#999"
              decimalPlaces={0}
              min={0}
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
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    flex: 1,
  },
  filterContent: {
    padding: 16,
    gap: 16,
    paddingBottom: Platform.OS === 'android' ? 120 : 60,
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
  rangeContainer: {
    gap: 8,
  },
  dimensionGroup: {
    gap: 6,
  },
  rangeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
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