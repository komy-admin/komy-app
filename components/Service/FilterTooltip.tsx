import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Text } from '~/components/ui';
import { CheckIcon, XIcon, ArrowUpIcon, ArrowDownIcon } from 'lucide-react-native';
import { Status } from '~/types/status.enum';
import { OrderFilterState } from '~/components/filters/OrderFilters';

interface FilterTooltipProps {
  filters: OrderFilterState;
  onFiltersChange: (filters: OrderFilterState) => void;
  onClearFilters: () => void;
  onClose: () => void;
}

const AVAILABLE_STATUSES = [
  { value: Status.DRAFT, label: 'Brouillon', color: '#9CA3AF' },
  { value: Status.PENDING, label: 'En attente', color: '#F59E0B' },
  { value: Status.INPROGRESS, label: 'En préparation', color: '#FB923C' },
  { value: Status.READY, label: 'Prêt', color: '#3B82F6' },
  { value: Status.SERVED, label: 'Servi', color: '#10B981' }
];

export function FilterTooltip({ filters, onFiltersChange, onClearFilters, onClose }: FilterTooltipProps) {
  const handleStatusToggle = useCallback((status: Status) => {
    const newStatuses = filters.selectedStatuses.includes(status)
      ? filters.selectedStatuses.filter(s => s !== status)
      : [...filters.selectedStatuses, status];
    
    const newFilters = {
      ...filters,
      selectedStatuses: newStatuses
    };
    onFiltersChange(newFilters);
  }, [filters.selectedStatuses, filters.searchQuery, filters.sortBy, onFiltersChange]);

  const handleSortChange = useCallback((sortBy: OrderFilterState['sortBy']) => {
    const newFilters = {
      ...filters,
      sortBy
    };
    onFiltersChange(newFilters);
  }, [filters.selectedStatuses, filters.searchQuery, filters.sortBy, onFiltersChange]);

  const hasActiveFilters = useMemo(() => 
    filters.selectedStatuses.length > 0 || 
    filters.sortBy !== 'created_desc' || 
    filters.searchQuery.length > 0
  , [filters]);

  return (
    <View style={styles.container}>
      {/* Header compact */}
      <View style={styles.header}>
        <Text style={styles.title}>Filtres</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <XIcon size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Filtres par statut - version compacte */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: 12 }]}>Statut</Text>
        <View style={styles.statusCompactGrid}>
          {AVAILABLE_STATUSES.map((status) => (
            <TouchableOpacity
              key={status.value}
              style={[
                styles.statusCompactItem,
                filters.selectedStatuses.includes(status.value) && styles.statusCompactItemSelected
              ]}
              onPress={() => handleStatusToggle(status.value)}
              activeOpacity={0.7}
            >
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <Text style={[
                styles.statusCompactText,
                filters.selectedStatuses.includes(status.value) && styles.statusCompactTextSelected,
                { fontSize: 13 } // Force la taille directement
              ]}>
                {status.label}
              </Text>
              {filters.selectedStatuses.includes(status.value) && (
                <CheckIcon size={12} color="#2563EB" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tri - version compacte */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: 12 }]}>Tri</Text>
        <View style={styles.sortCompactOptions}>
          <TouchableOpacity
            style={[
              styles.sortCompactOption,
              filters.sortBy === 'created_desc' && styles.sortCompactOptionSelected
            ]}
            onPress={() => handleSortChange('created_desc')}
            activeOpacity={0.7}
          >
            <ArrowDownIcon size={14} color={filters.sortBy === 'created_desc' ? "#2563EB" : "#6B7280"} />
            <Text style={[
              styles.sortCompactText,
              filters.sortBy === 'created_desc' && styles.sortCompactTextSelected,
              { fontSize: 13 } // Force la taille directement
            ]}>
              Récentes
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.sortCompactOption,
              filters.sortBy === 'created_asc' && styles.sortCompactOptionSelected
            ]}
            onPress={() => handleSortChange('created_asc')}
            activeOpacity={0.7}
          >
            <ArrowUpIcon size={14} color={filters.sortBy === 'created_asc' ? "#2563EB" : "#6B7280"} />
            <Text style={[
              styles.sortCompactText,
              filters.sortBy === 'created_asc' && styles.sortCompactTextSelected,
              { fontSize: 13 } // Force la taille directement
            ]}>
              Anciennes
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bouton pour effacer les filtres */}
      {hasActiveFilters && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onClearFilters}
            activeOpacity={0.7}
          >
            <Text style={[styles.clearButtonText, { fontSize: 13 }]}>Effacer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: 280,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 2,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    ...Platform.select({
      web: { cursor: 'pointer' }
    })
  },
  section: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  statusCompactGrid: {
    gap: 6,
  },
  statusCompactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12, // Même taille sur toutes les plateformes
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 6,
    ...Platform.select({
      web: { cursor: 'pointer' }
    })
  },
  statusCompactItemSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusCompactText: {
    flex: 1,
    color: '#374151',
  },
  statusCompactTextSelected: {
    color: '#2563EB',
    fontWeight: '500',
  },
  sortCompactOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  sortCompactOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 4,
    ...Platform.select({
      web: { cursor: 'pointer' }
    })
  },
  sortCompactOptionSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  sortCompactText: {
    color: '#374151',
  },
  sortCompactTextSelected: {
    color: '#2563EB',
    fontWeight: '500',
  },
  footer: {
    padding: 12,
  },
  clearButton: {
    padding: 12, // Même taille sur toutes les plateformes
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' }
    })
  },
  clearButtonText: {
    color: '#6B7280',
    fontWeight: '500',
  },
});