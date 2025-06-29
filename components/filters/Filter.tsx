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
      // Gérer les différents types de valeurs de filtres
      if (filter.operator === 'between' && Array.isArray(filter.value)) {
        newValues[filter.field] = filter.value;
      } else if (filter.operator === '>=' || filter.operator === '<=') {
        // Pour les opérateurs de comparaison, créer un tableau avec la valeur à la bonne position
        if (filter.operator === '>=') {
          newValues[filter.field] = [filter.value, null];
        } else {
          newValues[filter.field] = [null, filter.value];
        }
      } else {
        newValues[filter.field] = filter.value;
      }
    });
    setLocalValues(newValues);
  }, [activeFilters]);

  // Gérer l'effacement des filtres
  const handleClearFilters = () => {
    setLocalValues({});
    onClearFilters();
  };

  // Gérer la mise à jour des filtres
  const handleUpdateFilter = (field: string, value: any, operator?: FilterOperator) => {
    setLocalValues(prev => ({
      ...prev,
      [field]: value
    }));
    onUpdateFilter(field, value, operator);
  };

  // Logique intelligente pour les filtres de prix min/max
  const handlePriceRangeUpdate = (field: string, inputType: 'min' | 'max', newValue: number | null) => {
    // Récupérer les valeurs actuelles
    const currentValues = ensureArrayFormat(localValues[field]);
    const [currentMin, currentMax] = currentValues;
    
    // Déterminer les nouvelles valeurs min et max
    const newMin = inputType === 'min' ? newValue : currentMin;
    const newMax = inputType === 'max' ? newValue : currentMax;

    // Mettre à jour les valeurs locales (toujours sous forme de tableau pour l'affichage)
    setLocalValues(prev => ({
      ...prev,
      [field]: [newMin, newMax]
    }));

    // Déterminer l'opérateur et la valeur selon les cas
    let operator: FilterOperator;
    let value: any;

    if (newMin !== null && newMax !== null) {
      // Les deux valeurs sont remplies -> between
      operator = 'between';
      value = [newMin, newMax];
    } else if (newMin !== null && newMax === null) {
      // Seulement min rempli -> supérieur ou égal
      operator = '>=';
      value = newMin;
    } else if (newMin === null && newMax !== null) {
      // Seulement max rempli -> inférieur ou égal
      operator = '<=';
      value = newMax;
    } else {
      // Aucune valeur -> effacer le filtre
      onUpdateFilter(field, null);
      return;
    }

    // Appeler la fonction de mise à jour avec l'opérateur approprié
    onUpdateFilter(field, value, operator);
  };

  // Fonction utilitaire pour s'assurer qu'on a un tableau pour les valeurs between
  const ensureArrayFormat = (value: any): [number | null, number | null] => {
    if (Array.isArray(value)) {
      return [value[0] || null, value[1] || null];
    }
    return [null, null];
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
          const [min, max] = ensureArrayFormat(localValues[filter.field]);
          
          return (
            <View style={styles.numberInputsContainer}>
              <View style={styles.numberInputWrapper}>
                <NumberInput
                  value={min}
                  onChangeText={(newMin) => handlePriceRangeUpdate(String(filter.field), 'min', newMin)}
                  decimalPlaces={0}
                  min={0}
                  max={2000}
                  currency={filter.currency || undefined}
                  placeholder={`${filter.label} min`}
                  style={styles.numberInput}
                  placeholderTextColor="#D7D7D7"
                />
              </View>
              <View style={styles.numberInputWrapper}>
                <NumberInput
                  value={max}
                  onChangeText={(newMax) => handlePriceRangeUpdate(String(filter.field), 'max', newMax)}
                  decimalPlaces={0}
                  min={0}
                  max={2000}
                  currency={filter.currency || undefined}
                  placeholder={`${filter.label} max`}
                  style={styles.numberInput}
                  placeholderTextColor="#D7D7D7"
                />
              </View>
            </View>
          );
        }
        return (
          <View style={styles.inputWrapper}>
            <NumberInput
              value={localValues[filter.field] || null}
              onChangeText={(e) => handleUpdateFilter(String(filter.field), e, operator)}
              decimalPlaces={0}
              min={0}
              currency={filter.currency || undefined}
              placeholder={`${filter.label}`}
              style={styles.numberInput}
              placeholderTextColor="#D7D7D7"
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
    minHeight: Platform.OS === 'web' ? 40 : 48,
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
    // Styles identiques aux textInput pour l'harmonisation
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