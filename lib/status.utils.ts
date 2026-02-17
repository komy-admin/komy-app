import { Table } from '@/types/table.types';
import { Status } from '~/types/status.enum';
import { OrderLine, OrderLineType } from '~/types/order-line.types';
import { Order } from '~/types/order.types';

// ========================================
// Calcul de statut
// ========================================

export const getMostImportantStatus = (statuses: Status[]): Status => {
  if (statuses.length === 0) return Status.DRAFT;

  const order = [
    Status.TERMINATED,
    Status.SERVED,
    Status.DRAFT,
    Status.INPROGRESS,
    Status.PENDING,
    Status.READY,
    Status.ERROR,
  ];

  return statuses.reduce((acc, status) => {
    const accIndex = order.indexOf(acc);
    const statusIndex = order.indexOf(status);
    return accIndex > statusIndex ? acc : status;
  }, statuses[0]);
};

export const hasDraftWithOtherStatus = (statuses: Status[]): boolean => {
  const uniqueStatuses = [...new Set(statuses)];
  return uniqueStatuses.includes(Status.DRAFT) && uniqueStatuses.length > 1;
};

export const hasMenuMixedStatuses = (statuses: Status[]): boolean => {
  const uniqueStatuses = [...new Set(statuses)];
  return uniqueStatuses.length > 1;
};

export const getOrderLinesGlobalStatus = (orderLines: OrderLine[]): Status => {
  const allStatuses: Status[] = [];

  orderLines.forEach(line => {
    if (line.type === OrderLineType.ITEM) {
      allStatuses.push(line.status || Status.PENDING);
    } else if (line.type === OrderLineType.MENU && line.items) {
      line.items.forEach(menuItem => {
        allStatuses.push(menuItem.status || Status.PENDING);
      });
    }
  });

  return getMostImportantStatus(allStatuses);
};

export const getOrderGlobalStatus = (order: Order): Status => {
  return getOrderLinesGlobalStatus(order.lines ?? []);
};

export const getTableStatus = (table: Table): Status | undefined => {
  if (!table.orders || table.orders.length === 0) return undefined;
  return getOrderGlobalStatus(table.orders[0]);
};

export const shouldTableHaveDottedBorder = (table: Table & { orders?: (Order & { lines?: OrderLine[] })[] }): boolean => {
  const statuses: Status[] = [];

  table.orders?.forEach(order => {
    if (order.lines) {
      order.lines.forEach(line => {
        if (line.type === OrderLineType.ITEM && line.status) {
          statuses.push(line.status);
        } else if (line.type === OrderLineType.MENU && line.items) {
          line.items.forEach(menuItem => {
            statuses.push(menuItem.status);
          });
        }
      });
    }
  });

  return hasDraftWithOtherStatus(statuses);
};

// ========================================
// Progression de statut
// ========================================

export const getNextStatus = (currentStatus: Status): Status | null => {
  const statusProgression: Partial<Record<Status, Status>> = {
    [Status.DRAFT]: Status.PENDING,
    [Status.PENDING]: Status.INPROGRESS,
    [Status.INPROGRESS]: Status.READY,
    [Status.READY]: Status.SERVED,
    [Status.SERVED]: Status.TERMINATED,
  };
  return statusProgression[currentStatus] || null;
};

export const getPreviousStatus = (currentStatus: Status): Status | null => {
  const statusRegression: Partial<Record<Status, Status>> = {
    [Status.PENDING]: Status.DRAFT,
    [Status.INPROGRESS]: Status.PENDING,
    [Status.READY]: Status.INPROGRESS,
    [Status.SERVED]: Status.READY,
    [Status.TERMINATED]: Status.SERVED,
  };
  return statusRegression[currentStatus] || null;
};

// ========================================
// Texte & couleurs de statut
// ========================================

export const getStatusText = (status: Status) => {
  const texts = {
    [Status.READY]: 'Prêt',
    [Status.PENDING]: 'En attente',
    [Status.INPROGRESS]: 'En préparation',
    [Status.ERROR]: 'Erreur',
    [Status.SERVED]: 'Servi',
    [Status.TERMINATED]: 'Terminé',
    [Status.DRAFT]: 'Brouillon',
  };
  return texts[status];
};

export const getStatusColor = (status: Status) => {
  const colors = {
    [Status.READY]: '#D7E3FC',
    [Status.PENDING]: '#F9F1C8',
    [Status.INPROGRESS]: '#FFD1AD',
    [Status.SERVED]: '#B7E1CC',
    [Status.ERROR]: '#F7BFB5',
    [Status.TERMINATED]: '#EBEBEB',
    [Status.DRAFT]: '#EBEBEB',
  };
  return colors[status] || colors[Status.ERROR];
};

export const getStatusBackgroundColor = (status: Status): string => {
  const colors = {
    [Status.READY]: '#F5F8FE',
    [Status.PENDING]: '#FEFAF1',
    [Status.INPROGRESS]: '#FFF5EE',
    [Status.SERVED]: '#F0FAF5',
    [Status.ERROR]: '#FEF5F4',
    [Status.TERMINATED]: '#FAFAFA',
    [Status.DRAFT]: '#FAFAFA',
  };
  return colors[status] || colors[Status.ERROR];
};

export const getStatusTagColor = (status: Status) => {
  const colors = {
    [Status.READY]: '#D7E3FC',
    [Status.PENDING]: '#F9F1C8',
    [Status.INPROGRESS]: '#FFD1AD',
    [Status.SERVED]: '#B7E1CC',
    [Status.ERROR]: '#F7BFB5',
    [Status.TERMINATED]: '#EBEBEB',
    [Status.DRAFT]: '#D1D5DB',
  };
  return colors[status] || colors[Status.ERROR];
};

// ========================================
// Styles de bordure
// ========================================

export const getStatusBorderStyle = (status: Status, table?: Table & { orders?: (Order & { lines?: OrderLine[] })[] }) => {
  const hasActualOrderLines = table?.orders?.some(order =>
    order.lines && order.lines.length > 0
  ) ?? false;

  const hasDraftMixed = table ? shouldTableHaveDottedBorder(table) : false;

  if ((status === Status.DRAFT && hasActualOrderLines) || hasDraftMixed) {
    return {
      borderStyle: 'dashed' as const,
      borderColor: '#2A2E33',
      borderWidth: 3,
    };
  }

  return {
    borderStyle: 'solid' as const,
    borderColor: '#AAAAAA',
    borderWidth: 2,
  };
};

export const getBorderStyle = (_statuses: Status[], baseColor: string) => ({
  borderStyle: 'solid' as const,
  borderColor: baseColor,
  borderWidth: 2,
});
