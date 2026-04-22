import { Status } from '~/types/status.enum';
import { ItemGroup } from '~/types/kitchen.types';

/**
 * Représente un item individuel dans un ticket cuisine/bar
 */
export interface TicketItem {
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
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Props pour le composant TicketCard
 */
export interface TicketCardProps {
  itemGroup: ItemGroup;
  onStatusChange: (itemGroup: ItemGroup, newStatus: Status) => void;
}
