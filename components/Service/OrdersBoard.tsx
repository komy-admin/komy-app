import { View, StyleSheet, Pressable, Platform, Text as RNText, ScrollView, LayoutChangeEvent } from 'react-native';
import { useState, useCallback, useMemo } from 'react';
import { Plus, ShoppingBag } from 'lucide-react-native';
import { Status } from '~/types/status.enum';
import { Order } from '~/types/order.types';
import { isOrderActive } from '~/utils/orderUtils';
import {
  getOrderGlobalStatus,
  getStatusColor,
  getStatusText,
  getStatusTextColor,
} from '~/lib/status.utils';
import { getColorWithOpacity } from '~/lib/color-utils';
import { formatPrice } from '~/lib/utils';
import { shadows, colors } from '~/theme';

const STATUS_PRIORITY: Record<string, number> = {
  [Status.READY]: 0,
  [Status.PENDING]: 1,
  [Status.DRAFT]: 2,
  [Status.SERVED]: 3,
  [Status.ERROR]: 4,
  [Status.TERMINATED]: 5,
};

function buildDailyOrderLabels(orders: Order[]): Map<string, string> {
  const labels = new Map<string, string>();
  const byDay = new Map<string, Order[]>();

  for (const order of orders) {
    const d = new Date(order.createdAt);
    const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    let dayOrders = byDay.get(dayKey);
    if (!dayOrders) {
      dayOrders = [];
      byDay.set(dayKey, dayOrders);
    }
    dayOrders.push(order);
  }

  for (const dayOrders of byDay.values()) {
    dayOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    dayOrders.forEach((order, i) => {
      labels.set(order.id, `C${String(i + 1).padStart(2, '0')}`);
    });
  }

  return labels;
}

interface OrdersBoardProps {
  allOrders: Order[];
  onOrderPress: (order: Order) => void;
  onCreateOrder?: () => void;
}

export default function OrdersBoard({ allOrders, onOrderPress, onCreateOrder }: OrdersBoardProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const handleContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setContainerWidth(prev => Math.abs(prev - w) < 1 ? prev : w);
  }, []);

  const activeOrders = useMemo(() => {
    return allOrders
      .filter(order => isOrderActive(order))
      .sort((a, b) => {
        const statusA = STATUS_PRIORITY[getOrderGlobalStatus(a)] ?? 9;
        const statusB = STATUS_PRIORITY[getOrderGlobalStatus(b)] ?? 9;
        if (statusA !== statusB) return statusA - statusB;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [allOrders]);

  const dailyLabels = useMemo(() => buildDailyOrderLabels(allOrders), [allOrders]);

  const GRID_PADDING = 16;
  const GRID_GAP = 12;
  const MIN_CARD_WIDTH = 220;

  const numColumns = useMemo(() => {
    if (!containerWidth) return 2;
    const availableWidth = containerWidth - (GRID_PADDING * 2);
    const cols = Math.floor((availableWidth + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP));
    return Math.max(1, Math.min(cols, 5));
  }, [containerWidth]);

  const cardWidth = useMemo(() => {
    if (!containerWidth) return MIN_CARD_WIDTH;
    const availableWidth = containerWidth - (GRID_PADDING * 2);
    const totalGap = (numColumns - 1) * GRID_GAP;
    return (availableWidth - totalGap) / numColumns;
  }, [containerWidth, numColumns]);

  return (
    <View style={styles.flex1} onLayout={handleContainerLayout}>
      {activeOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ShoppingBag size={48} color={colors.neutral[300]} strokeWidth={1.5} />
          <RNText style={styles.emptyTitle}>Aucune commande</RNText>
          <RNText style={styles.emptySubtitle}>
            {onCreateOrder ? 'Créez une nouvelle commande pour commencer' : 'Créez une commande depuis la vue salles'}
          </RNText>
          {onCreateOrder && (
            <Pressable onPress={onCreateOrder} style={styles.emptyBtn}>
              <Plus size={18} color={colors.white} strokeWidth={2.5} />
              <RNText style={styles.emptyBtnText}>Nouvelle commande</RNText>
            </Pressable>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.gridContainer, { padding: GRID_PADDING }]}>
          <View style={[styles.grid, { gap: GRID_GAP }]}>
            {activeOrders.map((order) => {
              const globalStatus = getOrderGlobalStatus(order);
              const label = order.table?.name || dailyLabels.get(order.id) || 'C??';
              const lineCount = order.lines?.length || 0;
              const time = new Date(order.createdAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const updatedAt = new Date(order.updatedAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const statusColor = getStatusColor(globalStatus);
              const borderColor = getColorWithOpacity(getStatusTextColor(globalStatus), 0.5);

              return (
                <View
                  key={order.id}
                  style={[
                    styles.card,
                    {
                      width: cardWidth,
                      borderColor: borderColor,
                      backgroundColor: statusColor,
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => onOrderPress(order)}
                    style={({ pressed }) => [
                      styles.cardPressable,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <View style={styles.cardInner}>
                      <View style={styles.cardHeader}>
                        <RNText style={styles.cardLabel}>{label}</RNText>
                        <RNText style={styles.cardTime}>{time}</RNText>
                      </View>
                      <RNText style={styles.cardArticles}>
                        {lineCount} {lineCount > 1 ? 'articles' : 'article'}
                      </RNText>
                      <View style={styles.cardBadges}>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                          <RNText style={[styles.statusBadgeText, { color: getStatusTextColor(globalStatus) }]}>
                            {getStatusText(globalStatus)}
                          </RNText>
                        </View>
                        {(order.paymentStatus === 'paid' || order.paymentStatus === 'partial') && (
                          <View style={[
                            styles.statusBadge,
                            order.paymentStatus === 'paid' ? styles.paidBadge : styles.partialBadge,
                          ]}>
                            <RNText style={[
                              styles.statusBadgeText,
                              order.paymentStatus === 'paid' ? styles.paidBadgeText : styles.partialBadgeText,
                            ]}>
                              {order.paymentStatus === 'paid' ? 'Payé' : 'Partiel'}
                            </RNText>
                          </View>
                        )}
                      </View>
                      <View style={styles.cardFooter}>
                        <RNText style={styles.cardUpdatedAt}>Dernière maj : {updatedAt}</RNText>
                        <RNText style={styles.cardPrice}>{formatPrice(order.totalAmount)}</RNText>
                      </View>
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, backgroundColor: colors.white },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[500],
    marginTop: 8,
  } as any,
  emptySubtitle: {
    fontSize: 14,
    color: colors.neutral[400],
    textAlign: 'center',
  } as any,
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brand.dark,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  } as any,
  emptyBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  } as any,

  gridContainer: {},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  card: {
    borderRadius: 12,
    borderWidth: 1.5,
    ...shadows.bottom,
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    } as any : {}),
  },
  cardPressable: {
    flex: 1,
  },
  cardInner: {
    flex: 1,
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 9,
    gap: 8,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[800],
    letterSpacing: 0.5,
  } as any,
  cardTime: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[700],
  } as any,
  cardArticles: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[700],
  } as any,
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardUpdatedAt: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.gray[400],
  } as any,
  cardPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[800],
  } as any,
  cardBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  } as any,
  paidBadge: {
    backgroundColor: '#10B98120',
  },
  paidBadgeText: {
    color: colors.success.dark,
  },
  partialBadge: {
    backgroundColor: '#F59E0B20',
  },
  partialBadgeText: {
    color: colors.warning.dark,
  },
});
