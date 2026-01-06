import { Status } from '~/types/status.enum';
import { ItemGroup } from '~/types/kitchen.types';

/**
 * Représente un item individuel dans l'affichage cuisine
 * Peut être un item simple ou un item de menu
 */
export interface KitchenItem {
  id: string;
  type: 'ITEM' | 'MENU_ITEM';
  itemName: string;
  itemType?: string;
  menuName?: string;
  menuId?: string;
  orderLineId?: string;
  status?: Status;
  isOverdue: boolean;
  note?: string;
  tags?: Array<{
    tagSnapshot: {
      label: string;
      fieldType: string;
    };
    priceModifier?: number;
  }>;
  createdAt?: string; // Date de création de l'item
  updatedAt?: string; // Date de dernière mise à jour de l'item
}

/**
 * Props de base pour tous les composants de carte cuisine
 */
export interface BaseKitchenCardProps {
  itemGroup: ItemGroup;
  onStatusChange: (itemGroup: ItemGroup, newStatus: Status) => void;
}

/**
 * Props pour le composant KitchenCardColumn (mode colonnes)
 */
export interface KitchenCardColumnProps extends BaseKitchenCardProps {
  status: Status;
}

/**
 * Props pour le composant KitchenCardTicket (mode liste)
 */
export interface KitchenCardTicketProps extends BaseKitchenCardProps {
  viewMode?: 'list' | 'columns';
  isNotified?: boolean;
  onNotify?: () => void;
}

/**
 * Type de variant de carte disponible
 */
export type CardVariant = 'column' | 'ticket';

/**
 * Configuration d'un variant de carte
 */
export interface CardVariantConfig {
  // Affichage
  showHeader: boolean;
  showTimer: boolean;
  showItemCount: boolean;
  showStatusBadges: boolean;
  showItemBackgroundColors: boolean;  // Couleur de fond sur les items selon statut

  // Comportement
  scrollable: boolean;
  clickable: boolean;

  // Boutons
  showButtons: boolean;
  buttonMode: 'single' | 'dual' | 'none';
  buttonPosition: 'bottom' | 'inline';

  // Layout
  maxHeight?: number;
  cardStyle: 'default' | 'compact' | 'wide';

  // Statuts disponibles pour ce variant
  availableStatuses: Status[];  // Liste des statuts affichables dans cette vue

  // Features
  features: {
    modal: boolean;          // Modale de confirmation
    swipe: boolean;          // Gestes swipe
    notification: boolean;   // Badge notification
    banner: boolean;         // Bandeau diagonal
  };
}

/**
 * Props pour le composant de base KitchenCard
 */
export interface KitchenCardProps {
  variant: CardVariant;
  itemGroup: ItemGroup;
  status?: Status;
  onStatusChange: (itemGroup: ItemGroup, newStatus: Status) => void;

  // Overrides optionnels
  config?: Partial<CardVariantConfig>;
  isNotified?: boolean;
  onNotify?: () => void;
}
