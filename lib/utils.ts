import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { UserProfile } from '~/types/user.types';
import { colors } from '~/theme';

// ========================================
// Core utilities
// ========================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getContrastColor(hexColor: string): string {
  if (!hexColor || !hexColor.startsWith('#')) return colors.white;

  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? colors.brand.dark : colors.white;
}

export const sortActiveFirst = <T extends { isActive: boolean }>(a: T, b: T): number => {
  if (a.isActive && !b.isActive) return -1;
  if (!a.isActive && b.isActive) return 1;
  return 0;
};

// ========================================
// Enum text helpers
// ========================================

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
  getStatusText,
  getStatusColor,
  getStatusBackgroundColor,
  getStatusTextColor,
  getBorderStyle,
  getPriorityItemTypeDetailsForStatus,
} from './status.utils';

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
