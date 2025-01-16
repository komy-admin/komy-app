import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ItemTypes } from '~/types/item-type.enum';
import { TeamTypes } from "~/types/team.enum";
import { Status } from '~/types/status.enum';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getMostImportantStatus = (statuses: Status[]) => {
  const order = [
    Status.DRAFT,
    Status.TERMINATED,
    Status.INPROGRESS,
    Status.PENDING,
    Status.READY,
    Status.ERROR,
  ];
  return statuses.reduce((acc, status) => {
    const accIndex = order.indexOf(acc);
    const statusIndex = order.indexOf(status);
    return accIndex > statusIndex ? acc : status;
  }, Status.DRAFT);
}

export const getStatusColor = (status: Status) => {
  const colors = {
    [Status.READY]: '#D7E3FC',
    [Status.PENDING]: '#F9F1C8',
    [Status.INPROGRESS]: '#B7E1CC',
    [Status.ERROR]: '#F7BFB5',
    [Status.TERMINATED]: '#EBEBEB',
    [Status.DRAFT]: '#EBEBEB',
  };
  return colors[status as keyof typeof colors] || colors.error;
}

export const getStatusText = (status: Status) => {
  const texts = {
    [Status.READY]: 'Prêt',
    [Status.PENDING]: 'En préparation',
    [Status.INPROGRESS]: 'Servi',
    [Status.ERROR]: 'Erreur',
    [Status.TERMINATED]: 'Terminé',
    [Status.DRAFT]: 'En attente',
  };
  return texts[status];
}

export const getItemTypeText = (itemType: ItemTypes) => {
  const texts = {
    [ItemTypes.DRINK]: 'Boissons',
    [ItemTypes.STARTER]: 'Entrées',
    [ItemTypes.MAIN]: 'Plats',
    [ItemTypes.DESSERT]: 'Desserts',
  };
  return texts[itemType] || 'Type inconnu'; // Valeur par défaut pour les cas non définis
};

export const getTeamTypeText = (teamType: TeamTypes) => {
  const texts = {
    [TeamTypes.ALL]: 'Tous',
    [TeamTypes.ADMIN]: 'Admin',
    [TeamTypes.SUPERADMIN]: 'Super admin',
    [TeamTypes.MANAGER]: 'Manager',
    [TeamTypes.SERVEUR]: 'Serveur',
    [TeamTypes.CUISTO]: 'Cuisinier',
  };
  return texts[teamType] || 'Type inconnu'; // Valeur par défaut pour les cas non définis
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