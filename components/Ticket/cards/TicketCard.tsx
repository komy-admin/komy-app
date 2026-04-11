import { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Platform, Text as RNText } from 'react-native';
import { formatDate, getTableShortId, DateFormat } from '~/lib/utils';
import { TicketCardProps } from '../shared/types/ticket.types';
import { useItemPriorityMap } from '../shared/hooks/useItemPriorityMap';
import { useItemsByCategory } from '../shared/hooks/useItemsByCategory';
import { useOverdueTimer } from '../shared/hooks/useOverdueTimer';
import { CardHeader } from '../shared/components/CardHeader';
import { ItemRow } from '../shared/components/ItemRow';
import { ActionButtons } from '../shared/components/ActionButtons';
import { SectionDivider } from '~/components/ui';
import { Status } from '~/types/status.enum';

/**
 * Composant unique pour les cartes cuisine/bar (mode ticket)
 *
 * Affiche un ticket avec header, catégories d'items, bouton d'action,
 * et bandeau "À SERVIR" quand la commande est notifiée.
 */
export function TicketCard({
  itemGroup,
  onStatusChange,
  isNotified,
  onNotify,
}: TicketCardProps) {
  const priorityMap = useItemPriorityMap();
  const itemsByCategory = useItemsByCategory(itemGroup.items, priorityMap);

  // Timer basé sur le plus ancien item en retard
  const timerDate = useMemo(() => {
    const overdueItems = itemGroup.items.filter(item => item.isOverdue);
    if (overdueItems.length === 0) {
      return itemGroup.updatedAt || itemGroup.createdAt;
    }
    const oldestOverdueItem = overdueItems.reduce((oldest, item) => {
      const itemDate = new Date(item.updatedAt || item.createdAt || itemGroup.createdAt).getTime();
      const oldestDate = new Date(oldest.updatedAt || oldest.createdAt || itemGroup.createdAt).getTime();
      return itemDate < oldestDate ? item : oldest;
    });
    return oldestOverdueItem.updatedAt || oldestOverdueItem.createdAt || itemGroup.createdAt;
  }, [itemGroup]);

  const timeSinceUpdate = useOverdueTimer(timerDate, itemGroup.isOverdue);

  const tableShortId = getTableShortId(itemGroup.tableName).replace(/^T/, '');
  const orderTime = formatDate(itemGroup.createdAt, DateFormat.TIME);

  const isDraft = useMemo(() => {
    return itemGroup.items.every(item => item.status === Status.DRAFT);
  }, [itemGroup.items]);

  const categoriesContent = itemsByCategory.map(([category, items]) => (
    <View key={category}>
      <SectionDivider title={category} style={{ paddingLeft: 12 }} />
      {items.map((item, index) => (
        <ItemRow
          key={item.id}
          item={item}
          isLastItem={index === items.length - 1}
        />
      ))}
    </View>
  ));

  return (
    <Pressable style={styles.wrapper}>
      <View style={[
        styles.card,
        itemGroup.isOverdue && styles.cardOverdue,
        isNotified && styles.cardNotified,
      ]}>
        <CardHeader
          tableShortId={tableShortId}
          orderTime={orderTime}
          isOverdue={itemGroup.isOverdue}
          timeSinceUpdate={itemGroup.isOverdue ? timeSinceUpdate : undefined}
          itemCount={itemGroup.items.length}
        />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          directionalLockEnabled
          {...(Platform.OS === 'android' && { overScrollMode: 'never' })}
        >
          <Pressable style={Platform.OS === 'ios' ? styles.contentPressable : undefined}>
            {categoriesContent}
          </Pressable>
        </ScrollView>

        <ActionButtons
          mode="dual"
          itemGroup={itemGroup}
          onStatusChange={onStatusChange}
          showModal
          onNotify={onNotify}
          tableShortId={tableShortId}
        />
      </View>

      {isNotified && !isDraft && (
        <View style={styles.notifiedBanner}>
          <RNText style={styles.notifiedBannerText}>À SERVIR</RNText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderRadius: 12,
  },
  card: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
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
  contentPressable: {
    flex: 1,
  },
  notifiedBanner: {
    position: 'absolute',
    top: 18,
    right: -38,
    backgroundColor: '#3B82F6',
    paddingVertical: 6,
    paddingHorizontal: 45,
    transform: [{ rotate: '45deg' }],
    zIndex: 101,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifiedBannerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
