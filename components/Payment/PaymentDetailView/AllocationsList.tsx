import { View, Text, StyleSheet } from 'react-native';
import type { PaymentAllocation } from '~/types/payment.types';
import { formatPrice } from '~/lib/utils';

interface AllocationsListProps {
  allocations: PaymentAllocation[];
  tipAmount?: number;
}

export function AllocationsList({ allocations, tipAmount }: AllocationsListProps) {
  const subtotal = allocations.reduce((sum, a) => sum + Number(a.allocatedAmount), 0);
  const vatRate = 0.20; // 20% TVA standard en France
  const totalHT = Math.round(subtotal / (1 + vatRate));
  const vat = subtotal - totalHT;
  const totalTTC = subtotal;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ITEMS PAYÉS (Allocations)</Text>

      <View style={styles.allocationsList}>
        {allocations.map((allocation, index) => {
          const quantityFraction = Number(allocation.quantityFraction);
          const isSplit = quantityFraction < 1.0;

          // Récupérer le nom de l'item depuis orderLine si disponible
          const itemName = allocation.orderLine?.item?.name ||
                          allocation.orderLine?.menu?.name ||
                          `Item #${index + 1}`;

          // Prix unitaire si disponible
          const unitPrice = allocation.orderLine?.unitPrice;
          const quantity = allocation.orderLine?.quantity || 1;

          return (
            <View key={allocation.id}>
              <Text style={styles.itemTitle}>{itemName}</Text>
              <View style={styles.itemRow}>
                <Text style={styles.itemQuantity}>
                  {quantity > 1 && `${quantity}x `}
                  {unitPrice && formatPrice(unitPrice)}
                  {isSplit && ` × ${(quantityFraction * 100).toFixed(0)}%`}
                </Text>
                <Text style={styles.itemAmount}>
                  = {formatPrice(allocation.allocatedAmount)}
                </Text>
              </View>

              {index < allocations.length - 1 && <View style={styles.itemDivider} />}
            </View>
          );
        })}
      </View>

      {/* Totaux */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total HT:</Text>
          <Text style={styles.totalValue}>{formatPrice(totalHT)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TVA (20%):</Text>
          <Text style={styles.totalValue}>{formatPrice(vat)}</Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalRow}>
          <Text style={styles.grandTotalLabel}>Total TTC:</Text>
          <Text style={styles.grandTotalValue}>{formatPrice(totalTTC)}</Text>
        </View>
        {tipAmount && tipAmount > 0 && (
          <>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Pourboire:</Text>
              <Text style={styles.totalValue}>{formatPrice(tipAmount)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Total avec pourboire:</Text>
              <Text style={styles.grandTotalValue}>{formatPrice(totalTTC + tipAmount)}</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  allocationsList: {
    gap: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 12,
  },
  totalsSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  totalDivider: {
    height: 1,
    backgroundColor: '#D1D5DB',
    marginVertical: 8,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
});
