import { Table } from '@/types/table.types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ItemTypes } from '~/types/item-type.enum';
import { Status } from '~/types/status.enum';
import { UserProfile } from '~/types/user.types';
import { OrderLine, OrderLineType } from '~/types/order-line.types';
import { Order } from '~/types/order.types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getTableStatus = (table: Table & { orders?: (Order & { lines?: OrderLine[] })[] }): Status => {
  const allStatuses: Status[] = [];
  
  table.orders?.forEach(order => {
    if (order.lines) {
      order.lines.forEach(line => {
        if (line.type === OrderLineType.ITEM && line.status) {
          allStatuses.push(line.status);
        } else if (line.type === OrderLineType.MENU && line.items) {
          line.items.forEach(menuItem => {
            allStatuses.push(menuItem.status);
          });
        }
      });
    }
  });
  
  return getMostImportantStatus(allStatuses);
}

export const getMostImportantStatus = (statuses: Status[]): Status => {
  // Si pas de statuts, retourner DRAFT par défaut
  if (statuses.length === 0) {
    return Status.DRAFT;
  }
  
  // Ordre de priorité d'affichage: ERROR > SERVED > READY > PENDING > INPROGRESS > DRAFT > TERMINATED
  // Les index plus HAUTS = plus prioritaires
  const order = [
    Status.TERMINATED, // 0 - Moins prioritaire (historique/stats, non affiché)
    Status.SERVED,     // 1 - Servi
    Status.DRAFT,      // 2
    Status.INPROGRESS, // 3
    Status.PENDING,    // 4
    Status.READY,      // 5
    Status.ERROR,      // 6 - Plus prioritaire
  ];
  
  return statuses.reduce((acc, status) => {
    const accIndex = order.indexOf(acc);
    const statusIndex = order.indexOf(status);
    return accIndex > statusIndex ? acc : status;
  }, statuses[0]);
}

export const hasDraftWithOtherStatus = (statuses: Status[]): boolean => {
  const uniqueStatuses = [...new Set(statuses)];
  return uniqueStatuses.includes(Status.DRAFT) && uniqueStatuses.length > 1;
}

// Fonction pour détecter si un menu a des items avec des statuts différents
export const hasMenuMixedStatuses = (statuses: Status[]): boolean => {
  const uniqueStatuses = [...new Set(statuses)];
  return uniqueStatuses.length > 1;
}

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
}

export const getStatusColor = (status: Status) => {
  const colors = {
    [Status.READY]: '#D7E3FC',
    [Status.PENDING]: '#F9F1C8',
    [Status.INPROGRESS]: '#FFD1AD',
    [Status.SERVED]: '#B7E1CC',
    [Status.ERROR]: '#F7BFB5',
    [Status.TERMINATED]: '#EBEBEB',
    [Status.DRAFT]: '#EBEBEB', // Gris par défaut pour les tables sans commande
  };
  return colors[status] || colors[Status.ERROR];
}

// Version spécifique pour les tags de statut dans les OrderItems (avec DRAFT plus visible)
export const getStatusTagColor = (status: Status) => {
  const colors = {
    [Status.READY]: '#D7E3FC',
    [Status.PENDING]: '#F9F1C8',
    [Status.INPROGRESS]: '#FFD1AD',
    [Status.SERVED]: '#B7E1CC',
    [Status.ERROR]: '#F7BFB5',
    [Status.TERMINATED]: '#EBEBEB',
    [Status.DRAFT]: '#D1D5DB', // Gris plus foncé pour une meilleure visibilité des tags
  };
  return colors[status] || colors[Status.ERROR];
}

export const getStatusBorderStyle = (status: Status, table?: Table & { orders?: (Order & { lines?: OrderLine[] })[] }) => {
  // Vérifier si la table a vraiment des OrderLines (pas juste vide)
  const hasActualOrderLines = table?.orders?.some(order => 
    order.lines && order.lines.length > 0
  ) ?? false;
  
  // Bordure pointillée SEULEMENT si:
  // 1. La table a des OrderLines réels ET le statut est DRAFT
  // 2. OU il y a du DRAFT mélangé avec d'autres statuts
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
}

// Style de bordure spécialisé pour les menus
export const getMenuBorderStyle = (statuses: Status[], baseColor: string) => {
  const hasMixed = hasMenuMixedStatuses(statuses);
  
  if (hasMixed) {
    return {
      borderStyle: 'solid' as const,
      borderColor: '#2A2E33', // Noir pour les bordures épaisses
      borderWidth: 2, // Bordure normale pour les statuts mixtes
    };
  }
  
  return {
    borderStyle: 'solid' as const,
    borderColor: baseColor,
    borderWidth: 2,
  };
}

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
}

export const getNextStatus = (currentStatus: Status): Status | null => {
  const statusProgression: Partial<Record<Status, Status>> = {
    [Status.DRAFT]: Status.PENDING,
    [Status.PENDING]: Status.INPROGRESS,
    [Status.INPROGRESS]: Status.READY,
    [Status.READY]: Status.SERVED,
  };
  return statusProgression[currentStatus] || null;
};

export const getPreviousStatus = (currentStatus: Status): Status | null => {
  const statusRegression: Partial<Record<Status, Status>> = {
    [Status.PENDING]: Status.DRAFT,
    [Status.INPROGRESS]: Status.PENDING,
    [Status.READY]: Status.INPROGRESS,
    [Status.SERVED]: Status.READY,
  };
  return statusRegression[currentStatus] || null;
};

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
  };
  return texts[teamType] || 'Type inconnu';
};

export const getEnumValue = <T extends { [key: string]: string }>(
  enumObj: T,
  enumKey: keyof T
): string => {
  return enumObj[enumKey];
};

export enum DateFormat {
  TIME = 'time',
  SHORT_DATE = 'shortDate',
  LONG_DATE = 'longDate',
  DATE_TIME = 'dateTime',
  MONTH_YEAR = 'monthYear'
}

export const formatDate = (date: string | Date, format: DateFormat): string => {
  try {
    const dateObject = typeof date === 'string' ? new Date(date) : date;

    switch (format) {
      case DateFormat.TIME:
        return dateObject.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });

      case DateFormat.SHORT_DATE:
        return dateObject.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });

      case DateFormat.LONG_DATE:
        return dateObject.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });

      case DateFormat.DATE_TIME:
        return dateObject.toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

      case DateFormat.MONTH_YEAR:
        return dateObject.toLocaleDateString('fr-FR', {
          month: 'long',
          year: 'numeric'
        });

      default:
        return dateObject.toLocaleString('fr-FR');
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

// 🆕 Fonctions utilitaires pour OrderLines (nouvelle architecture)

/**
 * Calculer le statut global d'une commande basé sur ses OrderLines
 */
export const calculateOrderStatusFromLines = (orderLines: OrderLine[]): Status => {
  if (orderLines.length === 0) return Status.DRAFT;

  const allStatuses: Status[] = [];
  
  orderLines.forEach(line => {
    if (line.type === OrderLineType.ITEM && line.status) {
      // Items individuels: status sur OrderLine
      allStatuses.push(line.status);
    } else if (line.type === OrderLineType.MENU && line.items) {
      // Menus: collecter les status de tous les OrderLineItems
      line.items.forEach(menuItem => {
        allStatuses.push(menuItem.status);
      });
    }
  });
  
  return getMostImportantStatus(allStatuses);
};

/**
 * Calculer la progression d'un menu (OrderLine de type MENU)
 */
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


/**
 * Vérifier si un menu a des statuts mixtes (OrderLine de type MENU)
 */
export const hasMenuLineItemsMixedStatuses = (menuLine: OrderLine): boolean => {
  if (menuLine.type !== OrderLineType.MENU || !menuLine.items) {
    return false;
  }
  
  const statuses = menuLine.items.map(item => item.status);
  return hasMenuMixedStatuses(statuses);
};

/**
 * Obtenir le style de bordure pour un menu basé sur ses OrderLineItems
 */
export const getMenuLineBorderStyle = (menuLine: OrderLine, baseColor: string) => {
  const hasMixed = hasMenuLineItemsMixedStatuses(menuLine);
  
  if (hasMixed) {
    return {
      borderStyle: 'solid' as const,
      borderColor: '#2A2E33', // Noir pour les bordures épaisses
      borderWidth: 2, // Bordure normale pour les statuts mixtes
    };
  }
  
  return {
    borderStyle: 'solid' as const,
    borderColor: baseColor,
    borderWidth: 2,
  };
};

/**
 * Obtenir le texte descriptif du type d'OrderLine
 */
export const getOrderLineTypeText = (type: OrderLineType): string => {
  const texts = {
    [OrderLineType.ITEM]: 'Item individuel',
    [OrderLineType.MENU]: 'Menu',
  };
  return texts[type];
};

/**
 * Calculer le prix total d'une commande basée sur ses OrderLines
 */
export const calculateOrderTotalFromLines = (orderLines: OrderLine[]): number => {
  return orderLines.reduce((total, line) => total + line.totalPrice, 0);
};

