import React, { useEffect } from 'react';
import { View, Text as RNText, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, interpolateColor } from 'react-native-reanimated';
import { Status } from '~/types/status.enum';
import { TicketItem } from '../types/ticket.types';
import { ItemCustomization } from './ItemCustomization';
import { colors } from '~/theme';

interface ItemRowProps {
  item: TicketItem;
  isLastItem: boolean;
  showStatusBadge?: boolean;
  isFlashing?: boolean;
}

/**
 * Ligne d'item dans la carte cuisine
 *
 * Affiche le nom, badge menu, badge statut, et personnalisations (notes + tags).
 * Items DRAFT grisés (opacity réduite).
 */
export function ItemRow({ item, isLastItem, showStatusBadge = true, isFlashing }: ItemRowProps) {
  const hasCustomization = (item.note && item.note.trim().length > 0) || (item.tags && item.tags.length > 0);
  const isDraft = item.status === Status.DRAFT;

  const flashProgress = useSharedValue(0);

  useEffect(() => {
    if (isFlashing) {
      flashProgress.value = 1;
      flashProgress.value = withDelay(200, withTiming(0, { duration: 700 }));
    }
  }, [isFlashing]);

  const flashStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      flashProgress.value,
      [0, 1],
      [colors.white, colors.success.bg],
    ),
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        isLastItem && styles.containerLast,
        item.isOverdue && styles.containerOverdue,
        isDraft && styles.containerDraft,
        flashStyle,
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    backgroundColor: colors.white,
  },
  containerLast: {
    borderBottomWidth: 0,
  },
  containerOverdue: {
    backgroundColor: colors.error.bg,
  },
  containerDraft: {
    opacity: 0.3, // Items DRAFT grisés (pas encore demandés)
  },
  statusBarPending: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: colors.warning.base,
    borderRadius: 2,
    marginRight: 10,
  },
  statusBarReady: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: colors.info.base,
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
    color: colors.gray[800],
  },
  statusBadgePending: {
    backgroundColor: colors.warning.border,
    borderWidth: 1,
    borderColor: colors.warning.base,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  statusBadgeReady: {
    backgroundColor: colors.info.bg,
    borderWidth: 1,
    borderColor: colors.info.base,  // Bleu - cohérent avec utils.ts READY
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.brand.dark,
    letterSpacing: 0.5,
  },
});
