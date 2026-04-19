import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SelectButton } from './select-button';
import { colors } from '~/theme';

interface VatRateSelectorProps {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  error?: boolean;
  showInheritOption?: boolean;
  inheritedRate?: number;
  style?: any;
}

const VAT_RATES = [
  { value: 5.5, label: '5.5%', description: 'À emporter' },
  { value: 10, label: '10%', description: 'Sur place' },
  { value: 20, label: '20%', description: 'Alcool' },
];

/**
 * Sélecteur de taux de TVA uniforme avec les autres sélecteurs de l'application
 *
 * @param value - Taux de TVA sélectionné en pourcentage (5.5, 10, 20) ou null pour hériter
 * @param onChange - Callback appelée lors du changement de sélection
 * @param disabled - Désactive la sélection
 * @param error - Affiche une bordure d'erreur
 * @param showInheritOption - Affiche l'option d'héritage
 * @param inheritedRate - Taux hérité du parent en pourcentage
 */
export const VatRateSelector = memo<VatRateSelectorProps>(({
  value,
  onChange,
  disabled = false,
  error = false,
  showInheritOption = false,
  inheritedRate,
  style
}) => {
  // Convertir la valeur en nombre si c'est une string
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const numericInheritedRate = typeof inheritedRate === 'string' ? parseFloat(inheritedRate) : inheritedRate;

  const handleSelect = (rate: number | null) => {
    if (!disabled) {
      onChange(rate);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.buttonsContainer, error && styles.buttonsContainerError]}>
        {showInheritOption && (
          <SelectButton
            label={numericInheritedRate !== undefined
              ? `Hériter (${numericInheritedRate.toFixed(1)}%)`
              : 'Hériter du type'
            }
            isActive={numericValue === null}
            onPress={() => handleSelect(null)}
            variant="sub"
            flex
          />
        )}

        {VAT_RATES.map((rate) => (
          <SelectButton
            key={rate.value}
            label={rate.label}
            isActive={Math.abs((numericValue || 0) - rate.value) < 0.01}
            onPress={() => handleSelect(rate.value)}
            variant="sub"
            flex
          />
        ))}
      </View>
    </View>
  );
});

VatRateSelector.displayName = 'VatRateSelector';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 8,
    padding: 2,
  },
  buttonsContainerError: {
    borderWidth: 1,
    borderColor: colors.error.base,
  },
});