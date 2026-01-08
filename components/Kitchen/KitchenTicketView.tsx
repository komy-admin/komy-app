import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import KitchenCardTicket from './cards/variants/KitchenCardTicket';
import { ItemGroup } from '~/types/kitchen.types';
import { Status } from '~/types/status.enum';

interface KitchenTicketViewProps {
  itemGroups: ItemGroup[];
  onStatusChange: (itemGroup: ItemGroup, newStatus: Status) => void;
}

/**
 * KitchenTicketView - Vue horizontale type "tickets de cuisine"
 *
 * Caractéristiques:
 * - Scroll horizontal (comme des tickets alignés)
 * - Cards largeur fixe 340px
 * - Cards hauteur maximale avec scroll interne si besoin
 * - Tri par date création (plus vieilles = prioritaire)
 * - État "notified" local → card grisée + bandeau
 */
export const KitchenTicketView: React.FC<KitchenTicketViewProps> = ({
  itemGroups,
  onStatusChange,
}) => {
  // État local pour tracker les commandes notifiées (prêtes à servir)
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());

  // Mesurer la hauteur réelle disponible du ScrollView
  const [containerHeight, setContainerHeight] = useState<number>(600); // Valeur par défaut

  const handleLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    // Soustraire le padding vertical (16 top + 16 bottom)
    setContainerHeight(height - 32);
  };

  // Calculer la priorité d'un ticket selon les statuts de ses items
  const getStatusPriority = (itemGroup: ItemGroup): number => {
    const hasInProgress = itemGroup.items.some(item => item.status === Status.INPROGRESS);
    const hasPending = itemGroup.items.some(item => item.status === Status.PENDING);

    if (hasInProgress) return 3; // Priorité maximale : en cours de préparation
    if (hasPending) return 2;    // Priorité moyenne : en attente de préparation
    return 1;                     // Priorité basse : brouillon ou prêt
  };

  // Regrouper par orderId (une commande = un ticket, tous statuts ensemble)
  const groupedByOrder = useMemo(() => {
    const orderMap = new Map<string, ItemGroup>();

    itemGroups.forEach((itemGroup) => {
      const existing = orderMap.get(itemGroup.orderId);

      if (existing) {
        // Fusionner les items de même commande
        existing.items.push(...itemGroup.items);
        // Mettre à jour la date si plus récente (garde la dernière modification)
        const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
        const newTime = itemGroup.updatedAt ? new Date(itemGroup.updatedAt).getTime() : 0;
        if (newTime > existingTime) {
          existing.updatedAt = itemGroup.updatedAt;
        }
      } else {
        // Nouvelle commande
        orderMap.set(itemGroup.orderId, { ...itemGroup });
      }
    });

    // Trier par priorité de statut (décroissant), puis par date de création (croissant)
    return Array.from(orderMap.values()).sort((a, b) => {
      // D'abord par priorité de statut (EN COURS > EN ATTENTE > autres)
      const priorityDiff = getStatusPriority(b) - getStatusPriority(a);
      if (priorityDiff !== 0) return priorityDiff;

      // Ensuite par date de création (plus vieilles en premier = prioritaire)
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
      onLayout={handleLayout}
    >
      {groupedByOrder.map((itemGroup) => {
        const isNotified = notifiedIds.has(itemGroup.id);

        return (
          <View key={itemGroup.orderId} style={[styles.cardContainer, { height: containerHeight }]}>
            <KitchenCardTicket
              itemGroup={itemGroup}
              viewMode="list"
              onStatusChange={onStatusChange}
              isNotified={isNotified}
              onNotify={() => handleNotify(itemGroup.id)}
            />
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 16,
  },
  cardContainer: {
    width: 300,          // Largeur fixe type "ticket"
    position: 'relative', // Contexte de positionnement pour le wrapper absolu
    // Hauteur définie dynamiquement via inline style (availableHeight)
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
