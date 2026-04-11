import React from 'react';
import { View, Text as RNText, StyleSheet } from 'react-native';
import { Status } from '~/types/status.enum';
import { TicketItem } from '../types/ticket.types';
import { ItemCustomization } from './ItemCustomization';

interface ItemRowProps {
  item: TicketItem;
  isLastItem: boolean;
  showStatusBadge?: boolean;
}

/**
 * Ligne d'item dans la carte cuisine
 *
 * Affiche le nom, badge menu, badge statut, et personnalisations (notes + tags).
 * Items DRAFT grisés (opacity réduite).
 */
export function ItemRow({ item, isLastItem, showStatusBadge = true }: ItemRowProps) {
  const hasCustomization = (item.note && item.note.trim().length > 0) || (item.tags && item.tags.length > 0);
  const isDraft = item.status === Status.DRAFT;

  return (
    <View
      style={[
        styles.container,
        isLastItem && styles.containerLast,
        item.isOverdue && styles.containerOverdue,
        isDraft && styles.containerDraft,
      ]}
    >
      {item.status === Status.PENDING && <View style={styles.statusBarPending} />}
      {item.status === Status.READY && <View style={styles.statusBarReady} />}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <RNText style={styles.itemName}>
              {item.itemName}
            </RNText>
          </View>

          {showStatusBadge && (
            <>
              {item.status === Status.PENDING && (
                <View style={styles.statusBadgePending}>
                  <RNText style={styles.statusBadgeText}>RÉCLAMÉ</RNText>
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
  containerOverdue: {
    backgroundColor: '#FEE2E2',
  },
  containerDraft: {
    opacity: 0.3, // Items DRAFT grisés (pas encore demandés)
  },
  statusBarPending: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: '#F59E0B',
    borderRadius: 2,
    marginRight: 10,
  },
  statusBarReady: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    marginRight: 10,
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
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
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
