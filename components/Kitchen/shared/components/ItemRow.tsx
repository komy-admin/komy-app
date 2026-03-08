import React from 'react';
import { View, Text as RNText, StyleSheet } from 'react-native';
import { Status } from '~/types/status.enum';
import { KitchenItem } from '../types/kitchen-card.types';
import { ItemCustomization } from './ItemCustomization';

interface ItemRowProps {
  item: KitchenItem;
  isLastItem: boolean;
  showStatusBadge?: boolean;
  showBackgroundColors?: boolean;
}

/**
 * Composant qui affiche une ligne d'item dans la carte cuisine
 *
 * Affiche le nom de l'item, le badge menu si applicable, le badge de statut (optionnel),
 * et les personnalisations (notes + tags).
 * Les items en DRAFT sont grisés (opacity réduite) pour indiquer qu'ils sont en attente.
 */
export function ItemRow({ item, isLastItem, showStatusBadge = false, showBackgroundColors = false }: ItemRowProps) {
  const hasCustomization = (item.note && item.note.trim().length > 0) || (item.tags && item.tags.length > 0);
  const isDraft = item.status === Status.DRAFT;

  return (
    <View
      style={[
        styles.container,
        isLastItem && styles.containerLast,
        showBackgroundColors && item.status === Status.PENDING && styles.containerPending,
        showBackgroundColors && item.status === Status.INPROGRESS && styles.containerInProgress,
        showBackgroundColors && item.status === Status.READY && styles.containerReady,
        item.isOverdue && styles.containerOverdue,
        isDraft && styles.containerDraft, // Items DRAFT grisés
      ]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <RNText style={styles.itemName}>
              {item.itemName}
            </RNText>

            {item.type === 'MENU_ITEM' && (
              <RNText style={styles.menuBadge}>MENU</RNText>
            )}
          </View>

          {showStatusBadge && (
            <>
              {item.status === Status.PENDING && (
                <View style={styles.statusBadgePending}>
                  <RNText style={styles.statusBadgeText}>EN ATTENTE</RNText>
                </View>
              )}
              {item.status === Status.INPROGRESS && (
                <View style={styles.statusBadgeInProgress}>
                  <RNText style={styles.statusBadgeText}>EN COURS</RNText>
                </View>
              )}
              {item.status === Status.READY && (
                <View style={styles.statusBadgeReady}>
                  <RNText style={styles.statusBadgeText}>PRÊT</RNText>
                </View>
              )}
            </>
          )}
        </View>

        {hasCustomization && (
          <ItemCustomization note={item.note} tags={item.tags} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  containerLast: {
    borderBottomWidth: 0,
  },
  containerPending: {
    backgroundColor: '#FFFBEB',
  },
  containerInProgress: {
    backgroundColor: '#FFF8F0',
  },
  containerReady: {
    backgroundColor: '#DBEAFE',  // Bleu clair - cohérent avec utils.ts READY
  },
  containerOverdue: {
    backgroundColor: '#FEE2E2',
  },
  containerDraft: {
    opacity: 0.3, // Items DRAFT grisés (pas encore demandés)
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  menuBadge: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  statusBadgeInProgress: {
    backgroundColor: '#FFD1AD',
    borderWidth: 1,
    borderColor: '#FFA366',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  statusBadgeReady: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#3B82F6',  // Bleu - cohérent avec utils.ts READY
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2A2E33',
    letterSpacing: 0.5,
  },
});
