import React from 'react';
import { View, StyleSheet, Text, TextInput, Pressable, Keyboard, Platform } from 'react-native';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';

export interface TeamFilterState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
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
  
  const updateFilter = (field: keyof TeamFilterState, value: string) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = () => {
    return filters.firstName !== '' ||
           filters.lastName !== '' ||
           filters.email !== '' ||
           filters.phone !== '';
  };

  return (
    <KeyboardAwareScrollViewWrapper
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}
      bottomOffset={40}
      scrollEventThrottle={16}
    >
      <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
      {/* Prénom */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Prénom</Text>
        <TextInput
          style={styles.textInput}
          value={filters.firstName}
          onChangeText={(text) => updateFilter('firstName', text)}
          placeholder="Rechercher..."
          placeholderTextColor="#999"
        />
      </View>

      {/* Nom */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Nom</Text>
        <TextInput
          style={styles.textInput}
          value={filters.lastName}
          onChangeText={(text) => updateFilter('lastName', text)}
          placeholder="Rechercher..."
          placeholderTextColor="#999"
        />
      </View>

      {/* Email */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Email</Text>
        <TextInput
          style={styles.textInput}
          value={filters.email}
          onChangeText={(text) => updateFilter('email', text)}
          placeholder="Rechercher..."
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Téléphone */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Téléphone</Text>
        <TextInput
          style={styles.textInput}
          value={filters.phone}
          onChangeText={(text) => updateFilter('phone', text)}
          placeholder="Rechercher..."
          placeholderTextColor="#999"
          keyboardType="phone-pad"
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
    color: '#2A2E33',
    marginBottom: 2,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 15,
    minHeight: 40,
    fontSize: 14,
    color: '#2A2E33',
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
    ...Platform.select({
      web: {
        backgroundColor: '#F3F4F6', // Gris clair sur web pour éviter le noir avec opacity
      },
      default: {
        backgroundColor: 'transparent',
      }
    }),
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