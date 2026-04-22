import { Table } from "@/types/table.types";
import { Status } from "~/types/status.enum";
import { OrderLine, OrderLineType } from "~/types/order-line.types";
import { Order } from "~/types/order.types";
import { colors } from "~/theme";

// ========================================
// Calcul de statut
// ========================================

export const getMostImportantStatus = (statuses: Status[]): Status => {
  if (statuses.length === 0) return Status.DRAFT;

  const order = [
    Status.TERMINATED,
    Status.SERVED,
    Status.DRAFT,
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

export const hasMenuMixedStatuses = (statuses: Status[]): boolean => {
  const uniqueStatuses = [...new Set(statuses)];
  return uniqueStatuses.length > 1;
};

export const getOrderLineStatus = (line: OrderLine): Status => {
  if (line.type === OrderLineType.ITEM) {
    return line.status || Status.PENDING;
  } else if (line.type === OrderLineType.MENU && line.items) {
    const itemStatuses = line.items.map(
      (item) => item.status || Status.PENDING,
    );
    return getMostImportantStatus(itemStatuses);
  }
  return Status.PENDING;
};

export const getOrderLinesGlobalStatus = (orderLines: OrderLine[]): Status => {
  const allStatuses: Status[] = [];

  orderLines.forEach((line) => {
    const lineStatus = getOrderLineStatus(line);
    allStatuses.push(lineStatus);
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

// ========================================
// Progression de statut
// ========================================

export const getNextStatus = (currentStatus: Status): Status | null => {
  const statusProgression: Partial<Record<Status, Status>> = {
    [Status.DRAFT]: Status.PENDING,
    [Status.PENDING]: Status.READY,
    [Status.READY]: Status.SERVED,
    [Status.SERVED]: Status.TERMINATED,
  };
  return statusProgression[currentStatus] || null;
};

// ========================================
// Texte & couleurs de statut
// ========================================

export const getStatusText = (status: Status) => {
  const texts = {
    [Status.READY]: "Prêt",
    [Status.PENDING]: "Réclamé",
    [Status.ERROR]: "Erreur",
    [Status.SERVED]: "Servi",
    [Status.TERMINATED]: "Terminé",
    [Status.DRAFT]: "En attente",
  };
  return texts[status];
};

const STATUS_TOKEN_KEY = {
  [Status.READY]: 'ready',
  [Status.PENDING]: 'pending',
  [Status.SERVED]: 'served',
  [Status.ERROR]: 'error',
  [Status.TERMINATED]: 'terminated',
  [Status.DRAFT]: 'draft',
} as const;

export const getStatusColor = (status: Status): string => {
  const key = STATUS_TOKEN_KEY[status] ?? STATUS_TOKEN_KEY[Status.ERROR];
  return colors.status[key].badge;
};

export const getStatusBackgroundColor = (status: Status): string => {
  const key = STATUS_TOKEN_KEY[status] ?? STATUS_TOKEN_KEY[Status.ERROR];
  return colors.status[key].bg;
};

export const getStatusTextColor = (status: Status): string => {
  const key = STATUS_TOKEN_KEY[status] ?? STATUS_TOKEN_KEY[Status.ERROR];
  return colors.status[key].text;
};

// ========================================
// Styles de bordure
// ========================================

export const getBorderStyle = (_statuses: Status[], baseColor: string) => ({
  borderStyle: "solid" as const,
  borderColor: baseColor,
  borderWidth: 2,
});

// ========================================
// Item type prioritaire par statut
// ========================================

/**
 * Retourne le nom ET l'icône de l'itemType prioritaire.
 */
export const getPriorityItemTypeDetailsForStatus = (
  orderLines: OrderLine[],
  targetStatus: Status,
): { id: string; name: string; icon: string } => {
  const findMinPriority = (
    filterByStatus?: Status,
  ): { id: string; name: string; icon: string } => {
    let result = { id: "", name: "", icon: "" };
    let minPriority = Number.MAX_SAFE_INTEGER;

    for (const line of orderLines) {
      if (line.type === OrderLineType.ITEM) {
        const lineStatus = line.status ?? Status.PENDING;
        if (!filterByStatus || lineStatus === filterByStatus) {
          const itemType = line.item?.itemType;
          if (!itemType?.name) continue;
          const priority = itemType.priorityOrder ?? 0;
          if (priority < minPriority) {
            minPriority = priority;
            result = {
              id: itemType.id || "",
              name: itemType.name,
              icon: itemType.icon || "",
            };
          }
        }
      } else if (line.type === OrderLineType.MENU && line.items) {
        for (const menuItem of line.items) {
          if (!filterByStatus || menuItem.status === filterByStatus) {
            const itemType = menuItem.item?.itemType;
            if (!itemType?.name) continue;
            const priority = itemType.priorityOrder ?? 0;
            if (priority < minPriority) {
              minPriority = priority;
              result = {
                id: itemType.id || "",
                name: itemType.name,
                icon: itemType.icon || "",
              };
            }
          }
        }
      }
    }

    return result;
  };

  const byStatus = findMinPriority(targetStatus);
  return byStatus.name ? byStatus : findMinPriority();
};
