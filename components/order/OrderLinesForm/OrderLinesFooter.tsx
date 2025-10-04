import React, { memo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text } from '~/components/ui';
import { formatPrice } from '~/lib/utils';

/**
 * Props pour le composant OrderLinesFooter
 * Composant de résumé pur - les actions sont gérées par AdminFormView
 */
export interface OrderLinesFooterProps {
  totalPrice: number;
  getTotalItemsCount: () => number;
  getTotalMenusCount: () => number;
}

/**
 * Composant footer avec récapitulatif de commande
 * Affiche uniquement le résumé (quantités + prix total)
 * Les actions sont gérées par AdminFormView
 * 
 * @param props - Props du composant
 * @returns Composant footer mémorisé
 */
// Styles web constants
const webValueStyle: any = {
  fontSize: 16,
  fontWeight: '700',
  textAlign: 'center' as const,
  fontFamily: 'system-ui, -apple-system, sans-serif'
};

const webLabelStyle: any = {
  fontSize: 10,
  fontWeight: '500',
  color: '#6B7280',
  textAlign: 'center' as const,
  marginTop: 1,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
  fontFamily: 'system-ui, -apple-system, sans-serif'
};

export const OrderLinesFooter = memo<OrderLinesFooterProps>(({
  totalPrice,
  getTotalItemsCount,
  getTotalMenusCount
}) => {

  // Calculer les totaux
  const totalItems = getTotalItemsCount();
  const totalMenus = getTotalMenusCount();

  // Helper pour render les valeurs selon la plateforme
  const renderValue = (value: string | number, label: string, color = '#2A2E33') =>
    Platform.OS === 'web' ? (
      <>
        <Text style={{ ...webValueStyle, color }}>{value}</Text>
        <Text style={webLabelStyle}>{label}</Text>
      </>
    ) : (
      <>
        <Text style={[styles.summaryValue, { color }]}>{value}</Text>
        <Text style={styles.summaryLabel}>{label}</Text>
      </>
    );

  return (
    <View style={styles.footer}>
      <View style={styles.summaryContent}>
        {/* Articles */}
        <View style={styles.summaryItem}>
          {renderValue(totalItems, 'articles')}
        </View>

        {/* Séparateur */}
        {totalMenus > 0 && <View style={styles.summaryDivider} />}

        {/* Menus - Affiché seulement s'il y en a */}
        {totalMenus > 0 && (
          <View style={styles.summaryItem}>
            {renderValue(totalMenus, 'menus', '#7C3AED')}
          </View>
        )}

        {/* Séparateur avant total */}
        <View style={styles.summaryDivider} />

        {/* Total */}
        <View style={styles.summaryItem}>
          {renderValue(formatPrice(Number(totalPrice) || 0), 'total', '#059669')}
        </View>
      </View>
    </View>
  );
});

OrderLinesFooter.displayName = 'OrderLinesFooter';

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  summaryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2E33',
    textAlign: 'center',
  },
  summaryPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 8,
  },
});