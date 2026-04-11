import React from 'react';
import { View, Text as RNText, StyleSheet } from 'react-native';

interface CardHeaderProps {
  tableShortId: string;
  orderTime: string;
  isOverdue: boolean;
  timeSinceUpdate?: string;
  itemCount: number;
}

/**
 * Composant Header réutilisable pour les cartes cuisine
 *
 * Affiche: numéro de table, heure, timer overdue (si applicable), et nombre d'items
 */
export function CardHeader({
  tableShortId,
  orderTime,
  isOverdue,
  timeSinceUpdate,
  itemCount,
}: CardHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerInfo}>
        <RNText style={styles.tableId}>#{tableShortId}</RNText>
        <RNText style={styles.separator}>-</RNText>
        <RNText style={styles.orderTime}>{orderTime}</RNText>
      </View>

      <View style={styles.headerRight}>
        {isOverdue && timeSinceUpdate && (
          <View style={styles.overdueTimer}>
            <RNText style={styles.overdueTimerText}>⏱ {timeSinceUpdate}</RNText>
          </View>
        )}
        <View style={styles.itemCountBadge}>
          <RNText style={styles.itemCountText}>{itemCount}</RNText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 47,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    gap: 4,
    flexShrink: 0,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2E33',
    flexShrink: 0,
    letterSpacing: 0.5,
  },
  separator: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
    flexShrink: 0,
  },
  orderTime: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    flexShrink: 0,
    letterSpacing: 0.3,
  },
  overdueTimer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#DC2626',
    flexShrink: 0,
  },
  overdueTimerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 0.3,
  },
  itemCountBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    minWidth: 22,
    alignItems: 'center',
    flexShrink: 0,
  },
  itemCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
});
