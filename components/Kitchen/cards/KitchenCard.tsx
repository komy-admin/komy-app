import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { formatDate, getTableShortId, DateFormat } from '~/lib/utils';
import { KitchenCardProps } from '../shared/types/kitchen-card.types';
import { getCardConfig } from './config/card-variants.config';
import { useItemPriorityMap } from '../shared/hooks/useItemPriorityMap';
import { useItemsByCategory } from '../shared/hooks/useItemsByCategory';
import { useOverdueTimer } from '../shared/hooks/useOverdueTimer';
import { CardHeader } from '../shared/components/CardHeader';
import { CategorySection } from '../shared/components/CategorySection';
import { ActionButtons } from '../shared/components/ActionButtons';

/**
 * Composant de base flexible pour les cartes cuisine
 *
 * Ce composant s'adapte selon le variant fourni (column, ticket, etc.).
 * Il utilise la configuration centralisée pour déterminer son apparence et son comportement.
 *
 * @example
 * <KitchenCard
 *   variant="column"
 *   itemGroup={itemGroup}
 *   status={Status.PENDING}
 *   onStatusChange={handleStatusChange}
 * />
 */
export function KitchenCard({
  variant,
  itemGroup,
  status,
  onStatusChange,
  config: customConfig,
  isNotified,
  onNotify,
}: KitchenCardProps) {
  // Merge de la configuration du variant avec les overrides
  const config = useMemo(
    () => getCardConfig(variant, customConfig),
    [variant, customConfig]
  );

  // Hooks partagés pour la logique métier
  const priorityMap = useItemPriorityMap();
  const itemsByCategory = useItemsByCategory(itemGroup.items, priorityMap);

  // Calcul de la date pour le timer basé sur le plus ancien item en retard
  const timerDate = useMemo(() => {
    const overdueItems = itemGroup.items.filter(item => item.isOverdue);

    if (overdueItems.length === 0) {
      // Pas d'items en retard, utilise la date de la commande par défaut
      return itemGroup.updatedAt || itemGroup.createdAt;
    }

    // Trouver le plus ancien item en retard (basé sur updatedAt ou createdAt)
    const oldestOverdueItem = overdueItems.reduce((oldest, item) => {
      const itemDate = new Date(item.updatedAt || item.createdAt || itemGroup.createdAt).getTime();
      const oldestDate = new Date(oldest.updatedAt || oldest.createdAt || itemGroup.createdAt).getTime();
      return itemDate < oldestDate ? item : oldest;
    });

    return oldestOverdueItem.updatedAt || oldestOverdueItem.createdAt || itemGroup.createdAt;
  }, [itemGroup]);

  const timeSinceUpdate = useOverdueTimer(
    timerDate,
    config.showTimer && itemGroup.isOverdue
  );

  // Données dérivées
  const tableShortId = getTableShortId(itemGroup.tableName).replace(/^T/, '');
  const orderTime = formatDate(itemGroup.createdAt, DateFormat.TIME);

  // Style de la carte selon le variant
  const cardStyle = [
    styles.card,
    config.scrollable && styles.cardScrollable,
    config.cardStyle === 'compact' && styles.cardCompact,
    config.cardStyle === 'wide' && styles.cardWide,
    itemGroup.isOverdue && styles.cardOverdue,
    isNotified && styles.cardNotified,
  ];

  // Conteneur pour le contenu (scrollable ou non)
  const ContentContainer = config.scrollable ? ScrollView : View;
  const contentContainerProps = config.scrollable
    ? {
        style: styles.content,
        contentContainerStyle: styles.contentInner,
        showsVerticalScrollIndicator: false,
      }
    : { style: styles.content };

  return (
    <View style={cardStyle}>
      {config.showHeader && (
        <CardHeader
          tableShortId={tableShortId}
          orderTime={orderTime}
          isOverdue={itemGroup.isOverdue}
          timeSinceUpdate={config.showTimer ? timeSinceUpdate : undefined}
          itemCount={itemGroup.items.length}
        />
      )}

      <ContentContainer {...contentContainerProps}>
        {itemsByCategory.map(([category, items], index) => (
          <CategorySection
            key={category}
            category={category}
            items={items}
            isLastSection={index === itemsByCategory.length - 1}
            showStatusBadges={config.showStatusBadges}
            showItemBackgroundColors={config.showItemBackgroundColors}
          />
        ))}
      </ContentContainer>

      {config.showButtons && (
        <ActionButtons
          mode={config.buttonMode}
          itemGroup={itemGroup}
          status={status}
          onStatusChange={onStatusChange}
          showModal={config.features.modal}
          onNotify={onNotify}
          tableShortId={tableShortId}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  cardScrollable: {
    flex: 1,
    flexDirection: 'column',
  },
  cardCompact: {
    maxHeight: 200,
  },
  cardWide: {
    maxHeight: 400,
  },
  cardOverdue: {
    borderColor: '#DC2626',
    borderWidth: 2,
    shadowColor: '#DC2626',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  cardNotified: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    paddingTop: 0,
    paddingBottom: 6,
  },
  contentInner: {
    paddingTop: 0,
    paddingBottom: 0,
    flexGrow: 1,
  },
});
