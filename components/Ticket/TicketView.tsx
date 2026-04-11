import { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { TicketCard } from './cards/TicketCard';
import { ItemGroup } from '~/types/kitchen.types';
import { Status } from '~/types/status.enum';

interface TicketViewProps {
  itemGroups: ItemGroup[];
  onStatusChange: (itemGroup: ItemGroup, newStatus: Status) => void;
}

/**
 * Vue horizontale type "tickets de cuisine"
 *
 * - Scroll horizontal (tickets alignés)
 * - Cards largeur fixe 300px, hauteur dynamique
 * - Tri par priorité statut puis date création
 * - État "notified" local → card grisée + bandeau "À SERVIR"
 */
export function TicketView({ itemGroups, onStatusChange }: TicketViewProps) {
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());
  const [containerHeight, setContainerHeight] = useState<number>(600);

  const handleLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    setContainerHeight(height - 32);
  };

  const getStatusPriority = (itemGroup: ItemGroup): number => {
    const hasPending = itemGroup.items.some(item => item.status === Status.PENDING);
    return hasPending ? 2 : 1;
  };

  // Regrouper par orderId (une commande = un ticket, tous statuts ensemble)
  const groupedByOrder = useMemo(() => {
    const orderMap = new Map<string, ItemGroup>();

    itemGroups.forEach((itemGroup) => {
      const existing = orderMap.get(itemGroup.orderId);

      if (existing) {
        existing.items.push(...itemGroup.items);
        const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
        const newTime = itemGroup.updatedAt ? new Date(itemGroup.updatedAt).getTime() : 0;
        if (newTime > existingTime) {
          existing.updatedAt = itemGroup.updatedAt;
        }
      } else {
        orderMap.set(itemGroup.orderId, { ...itemGroup });
      }
    });

    return Array.from(orderMap.values()).sort((a, b) => {
      const priorityDiff = getStatusPriority(b) - getStatusPriority(a);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [itemGroups]);

  const handleNotify = (itemGroupId: string) => {
    setNotifiedIds(prev => new Set(prev).add(itemGroupId));
  };

  if (groupedByOrder.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucune commande</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      directionalLockEnabled
      {...(Platform.OS === 'ios' ? {
        snapToInterval: 316,
        decelerationRate: 'fast',
      } : {
        overScrollMode: 'never',
        disableIntervalMomentum: true,
      })}
      onLayout={handleLayout}
    >
      <Pressable style={styles.ticketsRow}>
        {groupedByOrder.map((itemGroup) => {
          const isNotified = notifiedIds.has(itemGroup.id);
          return (
            <View key={itemGroup.orderId} style={[styles.cardContainer, { height: containerHeight }]}>
              <TicketCard
                itemGroup={itemGroup}
                onStatusChange={onStatusChange}
                isNotified={isNotified}
                onNotify={() => handleNotify(itemGroup.id)}
              />
            </View>
          );
        })}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  ticketsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  cardContainer: {
    width: 300,
    position: 'relative',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.10)',
      } as any,
    }),
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
