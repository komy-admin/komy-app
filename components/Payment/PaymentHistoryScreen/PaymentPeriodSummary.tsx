import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { PeriodSummary, PaymentHistoryFilters } from '~/types/payment-history.types';
import { formatPrice } from '~/lib/utils';
import { SelectButton } from '~/components/ui/select-button';

interface PaymentPeriodSummaryProps {
  summary: PeriodSummary;
  filters: PaymentHistoryFilters;
  onFiltersChange: (filters: PaymentHistoryFilters) => void;
}

const PERIOD_OPTIONS = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'yesterday', label: 'Hier' },
  { value: 'this_week', label: 'Cette semaine' },
  { value: 'this_month', label: 'Ce mois' },
] as const;

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'paid', label: 'Payé' },
  { value: 'partial', label: 'Partiel' },
  { value: 'unpaid', label: 'Impayé' },
  { value: 'overpaid', label: 'Surpayé' },
] as const;

export function PaymentPeriodSummary({
  summary,
  filters,
  onFiltersChange,
}: PaymentPeriodSummaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>RÉSUMÉ DE LA PÉRIODE</Text>

      {/* Statistiques */}
      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Commandes avec paiements:</Text>
          <Text style={styles.statValue}>{summary.ordersCount}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total encaissé:</Text>
          <Text style={styles.totalAmount}>{formatPrice(summary.totalAmount)}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Paiements enregistrés:</Text>
          <Text style={styles.statValue}>{summary.paymentsCount}</Text>
        </View>
      </View>

      {/* Filtre Période */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Période</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterButtons}>
            {PERIOD_OPTIONS.map((option) => (
              <SelectButton
                key={option.value}
                label={option.label}
                isActive={filters.period === option.value}
                onPress={() =>
                  onFiltersChange({
                    ...filters,
                    period: option.value,
                  })
                }
                variant="pill"
                activeColor="#6366F1"
                activeBgColor="#EEF2FF"
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Filtre Status */}
      <View>
        <Text style={styles.filterLabel}>Statut</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterButtons}>
            {STATUS_OPTIONS.map((option) => (
              <SelectButton
                key={option.value}
                label={option.label}
                isActive={filters.status === option.value}
                onPress={() =>
                  onFiltersChange({
                    ...filters,
                    status: option.value,
                  })
                }
                variant="pill"
                activeColor="#6366F1"
                activeBgColor="#EEF2FF"
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  statsContainer: {
    marginBottom: 16,
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
});