import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useMemo, useEffect } from 'react';
import { RefreshCw, ArrowLeft, TrendingUp, CreditCard, Euro } from 'lucide-react-native';
import type { PaymentHistoryFilters, OrderWithPayments } from '~/types/payment-history.types';
import { PaymentPeriodSummary } from '~/components/Payment/PaymentHistoryScreen/PaymentPeriodSummary';
import { OrderWithPaymentsCard } from '~/components/Payment/PaymentHistoryScreen/OrderWithPaymentsCard';
import { usePayments } from '~/hooks/usePayments';
import { showApiError } from '~/lib/apiErrorHandler';
import { useToast } from '~/components/ToastProvider';
import * as Haptics from 'expo-haptics';
import { colors } from '~/theme';

export default function PaymentHistoryScreen() {
  const router = useRouter();
  const { getOrdersWithPayments, loading } = usePayments();
  const { showToast } = useToast();
  const [ordersWithPayments, setOrdersWithPayments] = useState<OrderWithPayments[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [filters, setFilters] = useState<PaymentHistoryFilters>({
    period: 'today',
    startDate: null,
    endDate: null,
    serverId: null,
    status: 'all',
    searchQuery: '',
  });

  const loadData = async () => {
    try {
      const data = await getOrdersWithPayments(filters);
      setOrdersWithPayments(data);
    } catch (error) {
      showApiError(error, showToast, 'Erreur lors du chargement des données');
    }
  };

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const summary = useMemo(() => {
    return {
      ordersCount: ordersWithPayments?.length || 0,
      totalAmount: ordersWithPayments?.reduce((sum, o) => sum + o.totalAmount, 0) || 0,
      paymentsCount: ordersWithPayments?.reduce((sum, o) => sum + o.paymentsCount, 0) || 0,
    };
  }, [ordersWithPayments]);

  const handleViewOrderPayments = (orderId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/payment-history/order/${orderId}`);
  };

  // Calcul des statistiques pour les cartes
  const statsData = useMemo(() => {
    const avgBasket = summary.totalAmount / (summary.ordersCount || 1);
    const trendRevenue = '+12%'; // Normalement calculé vs période précédente
    const trendTransactions = `+${Math.floor(summary.paymentsCount * 0.25)}`; // Mock
    const trendAvg = '+5%'; // Mock

    return [
      {
        id: 'revenue',
        icon: TrendingUp,
        label: 'Chiffre d\'affaires',
        value: new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 2,
        }).format(summary.totalAmount / 100),
        trend: trendRevenue,
        color: colors.success.base,
      },
      {
        id: 'transactions',
        icon: CreditCard,
        label: 'Transactions',
        value: summary.paymentsCount.toString(),
        trend: trendTransactions,
        color: colors.brand.accent,
      },
      {
        id: 'average',
        icon: Euro,
        label: 'Panier moyen',
        value: new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 2,
        }).format(avgBasket / 100),
        trend: trendAvg,
        color: colors.warning.base,
      },
    ];
  }, [summary]);

  return (
    <View style={styles.container}>
      {/* Header moderne avec stats cards */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed
            ]}
          >
            <ArrowLeft size={22} color={colors.gray[800]} strokeWidth={2.5} />
          </Pressable>

          <Text style={styles.headerTitle}>Historique des Paiements</Text>

          <Pressable
            onPress={handleRefresh}
            disabled={isRefreshing}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.buttonPressed,
              isRefreshing && styles.buttonDisabled
            ]}
          >
            <RefreshCw
              size={20}
              color={isRefreshing ? colors.gray[400] : colors.gray[800]}
              strokeWidth={2.5}
            />
          </Pressable>
        </View>

        {/* Stats cards sans scroll */}
        <View style={styles.statsContainer}>
          {statsData.map((item) => {
            const IconComponent = item.icon;
            return (
              <View key={item.id} style={[styles.statCard, { borderColor: `${item.color}30` }]}>
                <View style={styles.statHeader}>
                  <View style={[styles.statIconContainer, { backgroundColor: `${item.color}15` }]}>
                    <IconComponent size={16} color={item.color} strokeWidth={2} />
                  </View>
                  {item.trend && (
                    <View style={[styles.trendBadge, { backgroundColor: `${item.color}15` }]}>
                      <Text style={[styles.trendText, { color: item.color }]}>{item.trend}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.accent} />
          <Text style={styles.loadingText}>Chargement des paiements...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Filtres intégrés */}
          <PaymentPeriodSummary
            summary={summary}
            filters={filters}
            onFiltersChange={setFilters}
          />

          {/* Liste des commandes */}
          <View style={styles.listContainer}>
            {ordersWithPayments && ordersWithPayments.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>
                  {ordersWithPayments.length} commande{ordersWithPayments.length > 1 ? 's' : ''}
                </Text>
                {ordersWithPayments.map((order) => (
                  <OrderWithPaymentsCard
                    key={order.id}
                    order={order}
                    onPress={() => handleViewOrderPayments(order.id)}
                  />
                ))}
              </>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <CreditCard size={48} color={colors.gray[300]} strokeWidth={1.5} />
                </View>
                <Text style={styles.emptyTitle}>Aucun paiement</Text>
                <Text style={styles.emptyText}>
                  Aucune commande avec paiement trouvée pour cette période
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    backgroundColor: colors.white,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: colors.gray[200],
    transform: [{ scale: 0.95 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[800],
    letterSpacing: -0.5,
    marginHorizontal: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.gray[100],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    color: colors.gray[500],
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: colors.gray[500],
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    marginTop: 40,
    borderWidth: 2,
    borderColor: colors.gray[100],
    borderStyle: 'dashed',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[400],
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
});
