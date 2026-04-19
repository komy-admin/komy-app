export enum DateFormat {
  TIME = 'time',
  SHORT_DATE = 'shortDate',
  LONG_DATE = 'longDate',
  DATE_TIME = 'dateTime',
  MONTH_YEAR = 'monthYear'
}

export const formatDate = (date: string | Date, format: DateFormat, timezone?: string): string => {
  try {
    // Les chaînes "YYYY-MM-DD" sont interprétées comme UTC par le constructeur Date,
    // ce qui décale l'affichage d'un jour dans certaines timezones. On les ancre à midi
    // dans la timezone cible pour stabiliser le rendu.
    const isDateOnly = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);
    const dateObject = typeof date === 'string'
      ? (isDateOnly ? new Date(`${date}T12:00:00`) : new Date(date))
      : date;

    const tz = timezone || undefined;

    switch (format) {
      case DateFormat.TIME:
        return dateObject.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: tz,
        });

      case DateFormat.SHORT_DATE:
        return dateObject.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          timeZone: tz,
        });

      case DateFormat.LONG_DATE:
        return dateObject.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: tz,
        });

      case DateFormat.DATE_TIME:
        return dateObject.toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: tz,
        });

      case DateFormat.MONTH_YEAR:
        return dateObject.toLocaleDateString('fr-FR', {
          month: 'long',
          year: 'numeric',
          timeZone: tz,
        });

      default:
        return dateObject.toLocaleString('fr-FR', { timeZone: tz });
    }
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Retourne la date "aujourd'hui" dans la timezone passée, décomposée en year/month/day.
 * Utilisé pour initialiser des calendriers ou comparer "est-ce dans le passé" sans que
 * le fuseau du device ne décale la date.
 */
export function nowInTz(timezone: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = Number(parts.find((p) => p.type === 'year')!.value);
  const month = Number(parts.find((p) => p.type === 'month')!.value);
  const day = Number(parts.find((p) => p.type === 'day')!.value);
  return { year, month, day };
}

/**
 * Retourne la date "aujourd'hui" au format ISO (YYYY-MM-DD) dans la timezone passée.
 */
export function todayIsoInTz(timezone: string): string {
  const { year, month, day } = nowInTz(timezone);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Compare deux dates ISO (YYYY-MM-DD) — retourne -1, 0 ou 1.
 * Évite d'instancier des Date qui risquent d'être décalées par la timezone.
 */
export function compareIsoDates(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
