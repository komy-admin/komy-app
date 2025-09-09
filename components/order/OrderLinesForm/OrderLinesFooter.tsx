import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '~/components/ui';

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
export const OrderLinesFooter = memo<OrderLinesFooterProps>(({
  totalPrice,
  getTotalItemsCount,
  getTotalMenusCount
}) => {

  // Calculer les totaux
  const totalItems = getTotalItemsCount();
  const totalMenus = getTotalMenusCount();

  // Texte du résumé
  const getSummaryText = () => {
    const parts = [];
    if (totalItems > 0) {
      parts.push(`${totalItems} article${totalItems > 1 ? 's' : ''}`);
    }
    if (totalMenus > 0) {
      parts.push(`${totalMenus} menu${totalMenus > 1 ? 's' : ''}`);
    }

    if (parts.length === 0) {
      return "Aucun article sélectionné";
    }

    return parts.join(' • ');
  };

  return (
    <View style={styles.footer}>
      {/* Résumé de la commande */}
      <View style={styles.summary}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryText}>
            {getSummaryText()}
          </Text>
          <Text style={styles.totalPrice}>
            Total: {(Number(totalPrice) || 0).toFixed(2)}€
          </Text>
        </View>
      </View>

      {/* Pas de boutons - gérés par AdminFormView */}
    </View>
  );
});

OrderLinesFooter.displayName = 'OrderLinesFooter';

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // Pas de marginBottom car plus de boutons
  },
  summaryLeft: {
    flex: 1,
  },
  summaryText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2E33',
  },
  // Styles des boutons supprimés - actions gérées par AdminFormView
});