import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ItemTypes } from '~/types/item-type.enum';
import { UserProfile } from '~/types/user.types';

// ========================================
// Core utilities
// ========================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getContrastColor(hexColor: string): string {
  if (!hexColor || !hexColor.startsWith('#')) return '#FFFFFF';

  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export const sortActiveFirst = <T extends { isActive: boolean }>(a: T, b: T): number => {
  if (a.isActive && !b.isActive) return -1;
  if (!a.isActive && b.isActive) return 1;
  return 0;
};

// ========================================
// Enum text helpers
// ========================================

export const getItemTypeText = (itemType: ItemTypes) => {
  const texts = {
    [ItemTypes.DRINK]: 'Boissons',
    [ItemTypes.STARTER]: 'Entrées',
    [ItemTypes.MAIN]: 'Plats',
    [ItemTypes.DESSERT]: 'Desserts',
  };
  return texts[itemType] || 'Type inconnu';
};

export const getUserProfileText = (teamType: UserProfile) => {
  const texts = {
    [UserProfile.ADMIN]: 'Admin',
    [UserProfile.SUPERADMIN]: 'Super admin',
    [UserProfile.MANAGER]: 'Manager',
    [UserProfile.SERVER]: 'Service',
    [UserProfile.CHEF]: 'Cuisine',
    [UserProfile.BARMAN]: 'Bar',
  };
  return texts[teamType] || 'Type inconnu';
};

export const getEnumValue = <T extends { [key: string]: string }>(
  enumObj: T,
  enumKey: keyof T
): string => {
  return enumObj[enumKey];
};

export const getTableShortId = (tableName: string): string => {
  if (!tableName) return '';

  const match = tableName.match(/Table\s+([A-Z])(\d+)/i);
  if (match) return `T${match[1].toUpperCase()}${match[2]}`;

  const simpleMatch = tableName.match(/^([A-Z])(\d+)$/i);
  if (simpleMatch) return `T${simpleMatch[1].toUpperCase()}${simpleMatch[2]}`;

  return tableName.length > 6 ? tableName.substring(0, 6) : tableName;
};

// ========================================
// Barrel re-exports — modules spécialisés
// ========================================

export {
  getMostImportantStatus,
  hasMenuMixedStatuses,
  getOrderLinesGlobalStatus,
  getOrderGlobalStatus,
  getTableStatus,
  getNextStatus,
  getPreviousStatus,
  getStatusText,
  getStatusColor,
  getStatusBackgroundColor,
  getStatusTagColor,
  getStatusBorderStyle,
  getBorderStyle,
} from './status.utils';

export {
  calculateMenuProgress,
  hasMenuLineItemsMixedStatuses,
  getMenuLineBorderStyle,
  getOrderLineTypeText,
  calculateOrderTotalFromLines,
} from './order-line.utils';

export {
  centsToEuros,
  eurosToCents,
  formatPrice,
  formatPriceWithoutSymbol,
} from './price.utils';

export {
  DateFormat,
  formatDate,
} from './date.utils';

export {
  getTagFieldTypeConfig,
  getFieldTypeConfig,
  formatTagValue,
} from './tag.utils';
