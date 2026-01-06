import { useState, useEffect, useMemo } from 'react';

/**
 * Hook qui calcule le temps écoulé depuis une date donnée
 *
 * Mise à jour toutes les secondes pour affichage en temps réel.
 * Retourne une chaîne formatée avec heures, minutes et secondes.
 *
 * @param lastUpdateDate - Date de dernière mise à jour
 * @param enabled - Active/désactive le timer (défaut: true)
 * @returns Chaîne formatée (ex: "2h15m30s", "45m12s", "30s")
 *
 * @example
 * const timeSinceUpdate = useOverdueTimer(
 *   itemGroup.updatedAt,
 *   itemGroup.isOverdue
 * );
 * // Retourne: "1h23m45s"
 */
export function useOverdueTimer(
  lastUpdateDate: string | Date,
  enabled: boolean = true
): string {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Mise à jour toutes les secondes

    return () => clearInterval(interval);
  }, [enabled]);

  return useMemo(() => {
    const diff = currentTime.getTime() - new Date(lastUpdateDate).getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h${minutes % 60}m${seconds % 60}s`;
    }
    if (minutes > 0) {
      return `${minutes}m${seconds % 60}s`;
    }
    return `${seconds}s`;
  }, [lastUpdateDate, currentTime]);
}
