import React, { useState, useEffect } from "react";
import { NumberInput, Text, Button, TextInput } from "~/components/ui";
import { View, StyleSheet, Platform } from 'react-native';
import { FilterConfig, FilterOperator, FilterValue } from "~/hooks/useFilter/types";

interface FilterBarProps<T> {
  config: FilterConfig<T>[];
  onUpdateFilter: (field: string, value: any, operator?: FilterOperator) => void;
  onClearFilters: () => void;
  activeFilters: FilterValue[];
}

export function FilterBar<T>({
  config,
  onUpdateFilter,
  onClearFilters,
  activeFilters
}: FilterBarProps<T>) {
  // État local pour gérer les valeurs des champs
  const [localValues, setLocalValues] = useState<Record<string, any>>({});

  // Mettre à jour les valeurs locales quand les filtres actifs changent
  useEffect(() => {
    const newValues: Record<string, any> = {};
    activeFilters.forEach(filter => {
      newValues[filter.field] = filter.value;
    });
    setLocalValues(newValues);
  }, [activeFilters]);

  // Gérer l'effacement des filtres
  const handleClearFilters = () => {
    setLocalValues({}); // Réinitialiser les valeurs locales
    onClearFilters(); // Appeler la fonction parent
  };

  // Gérer la mise à jour des filtres
  const handleUpdateFilter = (field: string, value: any, operator?: FilterOperator) => {
    setLocalValues(prev => ({
      ...prev,
      [field]: value
    }));
    onUpdateFilter(field, value, operator);
  };

  const renderFilterInput = (filter: FilterConfig<T>) => {
    const operator = filter.operator;

    switch (filter.type) {
      case 'text':
        return (
          <View style={styles.inputWrapper}>
            <TextInput
              value={localValues[filter.field] || ''}
              onChangeText={(text: string) => handleUpdateFilter(String(filter.field), text, operator)}
              placeholder={`${filter.label}`}
              style={styles.textInput}
              placeholderTextColor="#D7D7D7"
            />
          </View>
        );

      case 'number':
        if (operator === 'between') {
          const [min, max] = localValues[filter.field] || [null, null];
          return (
            <View style={styles.numberInputsContainer}>
              <View style={styles.numberInputWrapper}>
                <NumberInput
                  value={min}
                  onChangeText={(e) => handleUpdateFilter(String(filter.field), [e, max], operator)}
                  decimalPlaces={2}
                  min={0}
                  max={2000}
                  currency={filter.currency || undefined}
                  placeholder={`${filter.label} min`}
                  style={styles.numberInput}
                />
              </View>
              <View style={styles.numberInputWrapper}>
                <NumberInput
                  value={max}
                  onChangeText={(e) => handleUpdateFilter(String(filter.field), [min, e], operator)}
                  decimalPlaces={2}
                  min={0}
                  max={2000}
                  currency={filter.currency || undefined}
                  placeholder={`${filter.label} max`}
                  style={styles.numberInput}
                />
              </View>
            </View>
          );
        }
        return (
          <View style={styles.inputWrapper}>
            <NumberInput
              value={localValues[filter.field] || 0}
              onChangeText={(e) => handleUpdateFilter(String(filter.field), e, operator)}
              decimalPlaces={2}
              min={0}
              max={1000}
              currency="€"
              placeholder="Prix"
              style={styles.numberInput}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {config.filter(c => c.show).map((filter) => (
        <View key={String(filter.field)} style={styles.filterItem}>
          {renderFilterInput(filter)}
        </View>
      ))}
      {activeFilters.length > 0 && (
        <View style={styles.clearButtonContainer}>
          <Button
            onPress={handleClearFilters}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>
              Effacer les filtres
            </Text>
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 1,
  },
  filterItem: {
    marginVertical: 4.5,
    width: '100%',
    zIndex: 5,
  },
  inputWrapper: {
    width: '100%',
    minHeight: Platform.OS === 'web' ? 38 : 46,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    padding: 10,
    color: '#2A2E33',
    width: '100%',
    fontSize: Platform.OS !== 'web' ? 16 : 14,
    minHeight: Platform.OS === 'web' ? 38 : 46,
  },
  numberInputsContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
    zIndex: 10,
  },
  numberInputWrapper: {
    width: '100%',
    zIndex: 10,
  },
  numberInput: {
    minHeight: Platform.OS === 'web' ? 38 : 46,
    width: '100%',
    fontSize: Platform.OS !== 'web' ? 16 : 14,
  },
  clearButtonContainer: {
    marginTop: 4,
    width: '100%',
    zIndex: 1,
  },
  clearButton: {
    backgroundColor: '#2A2E33',
    borderRadius: 5,
    height: Platform.OS === 'web' ? 40 : 46,
    borderColor: '#FFFFFF',
    borderWidth: 1,
    opacity: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontWeight: '400',
    fontSize: Platform.OS !== 'web' ? 16 : 14,
  }
});