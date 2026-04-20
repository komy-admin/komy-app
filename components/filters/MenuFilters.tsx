import React from 'react';
import { View, StyleSheet, Text, TextInput, Pressable, Keyboard, Platform } from 'react-native';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';
import { NumberInput } from '~/components/ui/number-input';
import { colors } from '~/theme';

export interface MenuFilterState {
  name: string;
  minPrice: number | null;
  maxPrice: number | null;
  status: 'active' | 'inactive' | null;
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
           filters.maxPrice !== null ||
           filters.status !== null;
  };

  return (
    <KeyboardAwareScrollViewWrapper
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}
      bottomOffset={40}
      scrollEventThrottle={16}
    >
      <Pressable style={{ flex: 1 }} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
      {/* Nom de l'article */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Nom de l'article</Text>
        <TextInput
          style={styles.textInput}
          value={filters.name}
          onChangeText={(text) => updateFilter('name', text)}
          placeholder="Rechercher..."
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      {/* Statut */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Statut</Text>
        <View style={styles.statusButtons}>
          <Pressable
            style={[
              styles.statusButton,
              filters.status === 'active' && styles.statusButtonActive
            ]}
            onPress={() => updateFilter('status', filters.status === 'active' ? null : 'active')}
          >
            <Text style={[
              styles.statusButtonText,
              filters.status === 'active' && styles.statusButtonTextActive
            ]}>
              Actif
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.statusButton,
              filters.status === 'inactive' && styles.statusButtonActive
            ]}
            onPress={() => updateFilter('status', filters.status === 'inactive' ? null : 'inactive')}
          >
            <Text style={[
              styles.statusButtonText,
              filters.status === 'inactive' && styles.statusButtonTextActive
            ]}>
              Inactif
            </Text>
          </Pressable>
        </View>
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
              placeholderTextColor={colors.gray[400]}
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
              placeholderTextColor={colors.gray[400]}
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    fontSize: 14,
    color: colors.brand.dark,
    textAlign: 'center',
    flex: 1,
    width: '100%',
  },
  rangeSeparator: {
    fontSize: 14,
    color: colors.gray[500],
    paddingHorizontal: 4,
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
        backgroundColor: colors.gray[100], // Gris clair sur web pour éviter le noir avec opacity
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
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 15,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  statusButtonActive: {
    backgroundColor: colors.brand.dark,
    borderColor: colors.brand.dark,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray[500],
  },
  statusButtonTextActive: {
    color: colors.white,
  },
});