import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Text, Button } from '~/components/ui';
import { CheckIcon, XIcon } from 'lucide-react-native';
import { Status } from '~/types/status.enum';

export interface OrderFilterState {
  searchQuery: string;
  selectedStatuses: Status[];
  sortBy: 'created_asc' | 'created_desc';
}

export const createEmptyOrderFilters = (): OrderFilterState => ({
  searchQuery: '',
  selectedStatuses: [],
  sortBy: 'created_desc'
});

interface OrderFiltersProps {
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

export function OrderFilters({ filters, onFiltersChange, onClearFilters, onClose }: OrderFiltersProps) {
  const handleStatusToggle = useCallback((status: Status) => {
    const newStatuses = filters.selectedStatuses.includes(status)
      ? filters.selectedStatuses.filter(s => s !== status)
      : [...filters.selectedStatuses, status];
    
    onFiltersChange({
      ...filters,
      selectedStatuses: newStatuses
    });
  }, [filters, onFiltersChange]);

  const handleSortChange = useCallback((sortBy: OrderFilterState['sortBy']) => {
    onFiltersChange({
      ...filters,
      sortBy
    });
  }, [filters, onFiltersChange]);

  const hasActiveFilters = useMemo(() => 
    filters.selectedStatuses.length > 0 || filters.sortBy !== 'created_desc'
  , [filters.selectedStatuses.length, filters.sortBy]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filtres</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <XIcon size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Filtre par statut */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statut des commandes</Text>
          <View style={styles.statusGrid}>
            {AVAILABLE_STATUSES.map((status) => (
              <TouchableOpacity
                key={status.value}
                style={[
                  styles.statusItem,
                  filters.selectedStatuses.includes(status.value) && styles.statusItemSelected
                ]}
                onPress={() => handleStatusToggle(status.value)}
                activeOpacity={0.7}
              >
                <View style={[styles.statusColor, { backgroundColor: status.color }]} />
                <Text style={[
                  styles.statusText,
                  filters.selectedStatuses.includes(status.value) && styles.statusTextSelected
                ]}>
                  {status.label}
                </Text>
                {filters.selectedStatuses.includes(status.value) && (
                  <CheckIcon size={14} color="#2563EB" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tri par date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ordre de tri</Text>
          <View style={styles.sortOptions}>
            <TouchableOpacity
              style={[
                styles.sortOption,
                filters.sortBy === 'created_desc' && styles.sortOptionSelected
              ]}
              onPress={() => handleSortChange('created_desc')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.sortText,
                filters.sortBy === 'created_desc' && styles.sortTextSelected
              ]}>
                Plus récentes d'abord
              </Text>
              {filters.sortBy === 'created_desc' && (
                <CheckIcon size={14} color="#2563EB" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.sortOption,
                filters.sortBy === 'created_asc' && styles.sortOptionSelected
              ]}
              onPress={() => handleSortChange('created_asc')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.sortText,
                filters.sortBy === 'created_asc' && styles.sortTextSelected
              ]}>
                Plus anciennes d'abord
              </Text>
              {filters.sortBy === 'created_asc' && (
                <CheckIcon size={14} color="#2563EB" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Bouton pour effacer les filtres */}
      {hasActiveFilters && (
        <View style={styles.footer}>
          <Button
            variant="outline"
            onPress={onClearFilters}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>Effacer les filtres</Text>
          </Button>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 280,
    maxWidth: 320,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    ...Platform.select({
      web: { cursor: 'pointer' }
    })
  },
  content: {
    padding: 16,
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  statusGrid: {
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 8,
    ...Platform.select({
      web: { cursor: 'pointer' }
    })
  },
  statusItemSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  statusColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  statusTextSelected: {
    color: '#2563EB',
    fontWeight: '500',
  },
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: { cursor: 'pointer' }
    })
  },
  sortOptionSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  sortText: {
    fontSize: 14,
    color: '#374151',
  },
  sortTextSelected: {
    color: '#2563EB',
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  clearButton: {
    borderRadius: 8,
    borderColor: '#D1D5DB',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
});