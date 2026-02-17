import { Status } from '~/types/status.enum';
import { OrderLine, OrderLineType } from '~/types/order-line.types';
import { getMostImportantStatus, hasMenuMixedStatuses, getOrderLinesGlobalStatus } from './status.utils';

/** @deprecated Use getOrderLinesGlobalStatus instead */
export const calculateOrderStatusFromLines = getOrderLinesGlobalStatus;

export const calculateMenuProgress = (menuLine: OrderLine) => {
  if (menuLine.type !== OrderLineType.MENU || !menuLine.items) {
    return { completed: 0, total: 0, percentage: 0, hasErrors: false };
  }

  const items = menuLine.items;
  const completedCount = items.filter(item =>
    [Status.READY, Status.SERVED, Status.TERMINATED].includes(item.status)
  ).length;

  return {
    completed: completedCount,
    total: items.length,
    percentage: Math.round((completedCount / items.length) * 100),
    hasErrors: items.some(item => item.status === Status.ERROR)
  };
};

export const hasMenuLineItemsMixedStatuses = (menuLine: OrderLine): boolean => {
  if (menuLine.type !== OrderLineType.MENU || !menuLine.items) return false;
  const statuses = menuLine.items.map(item => item.status);
  return hasMenuMixedStatuses(statuses);
};

export const getMenuLineBorderStyle = (menuLine: OrderLine, baseColor: string) => {
  const hasMixed = hasMenuLineItemsMixedStatuses(menuLine);

  if (hasMixed) {
    return {
      borderStyle: 'solid' as const,
      borderColor: '#2A2E33',
      borderWidth: 2,
    };
  }

  return {
    borderStyle: 'solid' as const,
    borderColor: baseColor,
    borderWidth: 2,
  };
};

export const getOrderLineTypeText = (type: OrderLineType): string => {
  const texts = {
    [OrderLineType.ITEM]: 'Item individuel',
    [OrderLineType.MENU]: 'Menu',
  };
  return texts[type];
};

export const calculateOrderTotalFromLines = (orderLines: OrderLine[]): number => {
  return orderLines.reduce((total, line) => total + line.totalPrice, 0);
};
