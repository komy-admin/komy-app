import { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
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
import { ItemGroup } from '~/types/kitchen.types';
import { colors } from '~/theme';

/**
 * Composant unique pour les cartes cuisine/bar (mode ticket)
 *
 * Affiche un ticket avec header, catégories d'items et bouton d'action.
 */
export function TicketCard({
  itemGroup,
  onStatusChange,
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

  const [flashingIds, setFlashingIds] = useState<Set<string>>(new Set());

  const handleStatusChange = useCallback((filteredGroup: ItemGroup, newStatus: Status) => {
    const ids = new Set(filteredGroup.items.map(i => i.id));
    setFlashingIds(ids);
    setTimeout(() => setFlashingIds(new Set()), 2000);
    onStatusChange(filteredGroup, newStatus);
  }, [onStatusChange]);

  const categoriesContent = itemsByCategory.map(([category, items]) => (
    <View key={category}>
      <SectionDivider title={category} style={{ paddingLeft: 12 }} />
      {items.map((item, index) => (
        <ItemRow
          key={item.id}
          item={item}
          isLastItem={index === items.length - 1}
          isFlashing={flashingIds.has(item.id)}
        />
      ))}
    </View>
  ));

  return (
    <Pressable style={styles.wrapper}>
      <View style={styles.card}>
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
          onStatusChange={handleStatusChange}
        />
      </View>
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
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
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
});
