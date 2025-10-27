import { Status } from "~/types/status.enum";

/**
 * Type of kitchen area for filtering items
 */
export type ItemAreaType = 'kitchen' | 'bar';

/**
 * Filters items by their area type (kitchen or bar) and allowed statuses
 *
 * @param items - Array of kitchen items to filter
 * @param areaType - Type of area ('kitchen' or 'bar')
 * @param allowedStatuses - Array of statuses to include
 * @returns Filtered array of items
 */
export function filterItemsByArea(
  items: any[],
  areaType: ItemAreaType,
  allowedStatuses: Status[]
): any[] {
  return items.filter(item => {
    return allowedStatuses.includes(item.status) && item.itemTypeType === areaType;
  });
}
