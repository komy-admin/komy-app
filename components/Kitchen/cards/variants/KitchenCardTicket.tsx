import { useMemo } from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';
import { KitchenCard } from '../KitchenCard';
import { KitchenCardTicketProps } from '../../shared/types/kitchen-card.types';
import { Status } from '~/types/status.enum';

/**
 * Wrapper pour le variant 'ticket' de KitchenCard
 *
 * Optimisé pour l'affichage en liste horizontale (tickets).
 * Peut afficher deux boutons simultanément (mode dual).
 * Supporte les notifications et le bandeau diagonal.
 * Affiche un bandeau "BROUILLON" quand tous les items sont en DRAFT.
 *
 * @example
 * <KitchenCardTicket
 *   itemGroup={itemGroup}
 *   onStatusChange={handleStatusChange}
 *   isNotified={false}
 *   onNotify={() => console.log('notified')}
 * />
 */
export default function KitchenCardTicket({
  itemGroup,
  isNotified,
  onNotify,
  ...props
}: KitchenCardTicketProps) {
  // Déterminer si tous les items sont en DRAFT (état BROUILLON)
  const isDraft = useMemo(() => {
    return itemGroup.items.every(item => item.status === Status.DRAFT);
  }, [itemGroup.items]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.cardContainer}>
        <KitchenCard
          variant="ticket"
          itemGroup={itemGroup}
          isNotified={isNotified}
          onNotify={onNotify}
          {...props}
        />
      </View>

      {/* Bandeau diagonal "BROUILLON" */}
      {isDraft && (
        <View style={styles.draftBanner}>
          <RNText style={styles.draftBannerText}>BROUILLON</RNText>
        </View>
      )}

      {/* Bandeau diagonal "À SERVIR" */}
      {isNotified && !isDraft && (
        <View style={styles.notifiedBanner}>
          <RNText style={styles.notifiedBannerText}>À SERVIR</RNText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden', // Coupe les bandeaux pour effet ruban
    borderRadius: 12, // Arrondi pour matcher la card
  },
  cardContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  draftBanner: {
    position: 'absolute',
    top: 18,
    right: -38,
    backgroundColor: '#F59E0B', // Orange pour BROUILLON
    paddingVertical: 6,
    paddingHorizontal: 45,
    transform: [{ rotate: '45deg' }],
    zIndex: 101,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftBannerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  notifiedBanner: {
    position: 'absolute',
    top: 18,
    right: -38,
    backgroundColor: '#3B82F6', // Bleu pour À SERVIR (cohérent avec utils.ts READY)
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
