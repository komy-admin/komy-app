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
    return 'Invalid date';
  }
};
