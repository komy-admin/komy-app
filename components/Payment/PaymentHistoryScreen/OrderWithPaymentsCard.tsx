import React, { memo, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { ChevronRight, Clock, CreditCard, Users, CheckCircle, AlertCircle, XCircle } from 'lucide-react-native';
import type { OrderWithPayments } from '~/types/payment-history.types';
import { formatPrice, DateFormat, formatDate } from '~/lib/utils';
import * as Haptics from 'expo-haptics';
import { colors } from '~/theme';

interface OrderWithPaymentsCardProps {
  order: OrderWithPayments;
  onPress: () => void;
}

export const OrderWithPaymentsCard = memo<OrderWithPaymentsCardProps>(({ order, onPress }) => {
  const getStatusInfo = useMemo(() => {
    switch (order.paymentStatus) {
      case 'paid':
        return {
          icon: CheckCircle,
          color: colors.success.base,
          bgColor: '#10B98115',
          borderColor: '#10B98130',
          label: 'Payé',
        };
      case 'partial':
        return {
          icon: AlertCircle,
          color: colors.warning.base,
          bgColor: '#F59E0B15',
          borderColor: '#F59E0B30',
          label: 'Partiel',
        };
      case 'unpaid':
        return {
          icon: XCircle,
          color: colors.error.base,
          bgColor: '#EF444415',
          borderColor: '#EF444430',
          label: 'Impayé',
        };
      case 'overpaid':
        return {
          icon: AlertCircle,
          color: colors.purple.alt,
          bgColor: '#8B5CF615',
          borderColor: '#8B5CF630',
          label: 'Surpayé',
        };
      default:
        return {
          icon: Clock,
          color: colors.gray[500],
          bgColor: '#6B728015',
          borderColor: '#6B728030',
          label: 'En cours',
        };
    }
  }, [order.paymentStatus]);

  const StatusIcon = getStatusInfo.icon;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        { borderLeftColor: getStatusInfo.borderColor },
        pressed && styles.pressed,
      ]}
    >
      {/* Status strip on the left */}
      <View style={[styles.statusStrip, { backgroundColor: getStatusInfo.color }]} />

      {/* Main content */}
      <View style={styles.content}>
        {/* Header avec statut et table */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.tableTag, { backgroundColor: colors.brand.accent }]}>
              <Text style={styles.tableTagText}>{order.table?.name || 'Sans table'}</Text>
            </View>
            <Text style={styles.orderNumber}>#{order.id.substring(0, 8).toUpperCase()}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: getStatusInfo.bgColor }]}>
            <StatusIcon size={14} color={getStatusInfo.color} strokeWidth={2.5} />
            <Text style={[styles.statusText, { color: getStatusInfo.color }]}>
              {getStatusInfo.label}
            </Text>
          </View>
        </View>

        {/* Info section */}
        <View style={styles.infoRow}>
          <View style={styles.dateTimeContainer}>
            <Clock size={14} color={colors.gray[400]} strokeWidth={2} />
            <Text style={styles.dateTimeText}>
              {formatDate(order.createdAt, DateFormat.SHORT_DATE)} à {formatDate(order.createdAt, DateFormat.TIME)}
            </Text>
          </View>

          {order.user && (
            <View style={styles.userContainer}>
              <Users size={14} color={colors.gray[400]} strokeWidth={2} />
              <Text style={styles.userText} numberOfLines={1}>
                {order.user.firstName} {order.user.lastName}
              </Text>
            </View>
          )}
        </View>

        {/* Amounts Section avec design moderne */}
        <View style={styles.amountSection}>
          <View style={styles.mainAmountContainer}>
            <Text style={styles.totalAmount}>{formatPrice(order.totalAmount)}</Text>
            <Text style={styles.amountLabel}>Total</Text>
          </View>

          <View style={styles.amountDetails}>
            <View style={styles.amountItem}>
              <View style={[styles.amountIndicator, { backgroundColor: colors.success.base }]} />
              <View>
                <Text style={styles.amountItemValue}>{formatPrice(order.paidAmount)}</Text>
                <Text style={styles.amountItemLabel}>Payé</Text>
              </View>
            </View>

            {order.remainingAmount > 0 && (
              <View style={styles.amountItem}>
                <View style={[styles.amountIndicator, { backgroundColor: colors.warning.base }]} />
                <View>
                  <Text style={[styles.amountItemValue, { color: colors.warning.base }]}>
                    {formatPrice(order.remainingAmount)}
                  </Text>
                  <Text style={styles.amountItemLabel}>Reste</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Footer avec infos paiements */}
        <View style={styles.footer}>
          <View style={styles.paymentInfo}>
            <CreditCard size={14} color={colors.gray[400]} strokeWidth={2} />
            <Text style={styles.paymentText}>
              {order.paymentsCount} transaction{order.paymentsCount > 1 ? 's' : ''}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.gray[300]} strokeWidth={2} />
        </View>
      </View>
    </Pressable>
  );
});

OrderWithPaymentsCard.displayName = 'OrderWithPaymentsCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderLeftWidth: 4,
    flexDirection: 'row',
    ...Platform.select({
      ios: {
        shadowColor: colors.brand.dark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  statusStrip: {
    width: 4,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  tableTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tableTagText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateTimeText: {
    fontSize: 13,
    color: colors.gray[500],
    fontWeight: '500',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  userText: {
    fontSize: 13,
    color: colors.gray[500],
    fontWeight: '500',
    flex: 1,
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  mainAmountContainer: {
    minWidth: 100,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[800],
    letterSpacing: -0.5,
  },
  amountLabel: {
    fontSize: 12,
    color: colors.gray[400],
    fontWeight: '500',
    marginTop: 2,
  },
  amountDetails: {
    flex: 1,
    gap: 8,
  },
  amountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountIndicator: {
    width: 3,
    height: 24,
    borderRadius: 2,
  },
  amountItemValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[800],
  },
  amountItemLabel: {
    fontSize: 11,
    color: colors.gray[400],
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentText: {
    fontSize: 13,
    color: colors.gray[500],
    fontWeight: '500',
  },
});
