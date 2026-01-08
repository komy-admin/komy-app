import { CardVariant, CardVariantConfig } from '../../shared/types/kitchen-card.types';
import { Status } from '~/types/status.enum';

/**
 * Configuration centralisée des variantes de cartes cuisine
 *
 * Chaque variante définit son apparence et son comportement via cette configuration.
 * Pour ajouter une nouvelle variante, il suffit d'ajouter une entrée ici.
 */
export const CARD_VARIANTS: Record<CardVariant, CardVariantConfig> = {
  /**
   * Mode Column - Optimisé pour vue Kanban en colonnes
   * Utilisé dans KitchenColumnView
   *
   * Les colonnes n'affichent pas DRAFT (pas de sens d'avoir une colonne de brouillons)
   */
  column: {
    showHeader: true,
    showTimer: true,
    showItemCount: true,
    showStatusBadges: false,
    showItemBackgroundColors: false,
    scrollable: false,
    clickable: false,
    showButtons: true,
    buttonMode: 'single',
    buttonPosition: 'bottom',
    cardStyle: 'default',
    availableStatuses: [Status.PENDING, Status.INPROGRESS, Status.READY],
    features: {
      modal: false,
      swipe: false,
      notification: false,
      banner: false,
    }
  },

  /**
   * Mode Ticket - Optimisé pour vue Liste horizontale
   * Utilisé dans KitchenTicketView
   *
   * La vue ticket affiche tous les statuts incluant DRAFT pour les brouillons
   */
  ticket: {
    showHeader: true,
    showTimer: true,
    showItemCount: true,
    showStatusBadges: true,
    showItemBackgroundColors: true,
    scrollable: true,
    clickable: false,
    showButtons: true,
    buttonMode: 'dual',
    buttonPosition: 'bottom',
    maxHeight: 600,
    cardStyle: 'default',
    availableStatuses: [Status.DRAFT, Status.PENDING, Status.INPROGRESS, Status.READY],
    features: {
      modal: true,
      swipe: false,
      notification: true,
      banner: true,
    }
  }
};

/**
 * Helper pour récupérer la configuration d'un variant
 * avec possibilité d'override
 */
export function getCardConfig(
  variant: CardVariant,
  overrides?: Partial<CardVariantConfig>
): CardVariantConfig {
  return {
    ...CARD_VARIANTS[variant],
    ...overrides,
    features: {
      ...CARD_VARIANTS[variant].features,
      ...(overrides?.features || {}),
    },
  };
}
