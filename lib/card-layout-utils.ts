/**
 * Utilitaires pour le calcul responsive des grilles de cartes
 */

interface CardLayoutConfig {
  containerWidth: number;
  padding?: number;
  gap?: number;
  minCardWidth?: number;
  maxCardWidth?: number;
}

/**
 * Calcule la largeur optimale des cartes pour remplir parfaitement l'espace disponible
 *
 * @param config - Configuration du layout
 * @returns Largeur calculée pour chaque carte
 *
 * @example
 * const cardWidth = calculateOptimalCardWidth({
 *   containerWidth: 1195,
 *   gap: 12,
 *   minCardWidth: 180,
 *   maxCardWidth: 240
 * });
 */
export const calculateOptimalCardWidth = ({
  containerWidth,
  padding = 0,
  gap = 12,
  minCardWidth = 180,
  maxCardWidth = 240,
}: CardLayoutConfig): number => {
  // Valeur par défaut si container pas encore mesuré
  if (containerWidth === 0) return 225;

  // Largeur disponible après padding
  const availableWidth = containerWidth - padding;

  // Trouver le nombre optimal de colonnes
  // On cherche le MAXIMUM de colonnes qui respecte MIN_CARD_WIDTH
  let bestColumns = 1;

  for (let cols = 1; cols <= 10; cols++) {
    const totalGaps = gap * (cols - 1);
    const width = (availableWidth - totalGaps) / cols;

    // Accepter si >= MIN et <= MAX
    if (width >= minCardWidth && width <= maxCardWidth) {
      bestColumns = cols;
    }
    // Si on descend sous MIN, on arrête (on a trouvé le max)
    else if (width < minCardWidth) {
      break;
    }
  }

  // Calculer la largeur exacte pour remplir l'espace
  // Note: borderWidth est inclus dans width en React Native (pas ajouté)
  const totalGaps = gap * (bestColumns - 1);
  return (availableWidth - totalGaps) / bestColumns;
};
