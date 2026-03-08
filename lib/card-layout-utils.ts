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
 * Calcule la largeur optimale des cartes pour remplir parfaitement l'espace disponible.
 * Maximise le nombre de colonnes en acceptant de réduire la largeur jusqu'à 75% du min
 * pour éviter les zones mortes (1 card trop large avec espace vide à droite).
 *
 * @param config - Configuration du layout
 * @returns Largeur calculée pour chaque carte (arrondie au pixel inférieur)
 */
export const calculateOptimalCardWidth = ({
  containerWidth,
  padding = 0,
  gap = 12,
  minCardWidth = 180,
  maxCardWidth = 240,
}: CardLayoutConfig): number => {
  if (containerWidth === 0) return 225;

  const availableWidth = containerWidth - padding;
  const absoluteMin = minCardWidth * 0.75;

  // Phase 1 : trouver le max de colonnes qui respecte le minimum absolu
  let maxColumns = 1;
  for (let cols = 1; cols <= 10; cols++) {
    const width = (availableWidth - gap * (cols - 1)) / cols;
    if (width >= absoluteMin) {
      maxColumns = cols;
    } else {
      break;
    }
  }

  // Phase 2 : parmi [1..maxColumns], préférer celui dans [minCardWidth, maxCardWidth]
  // en partant du plus grand nombre de colonnes (meilleur remplissage)
  let bestColumns = maxColumns;
  for (let cols = maxColumns; cols >= 1; cols--) {
    const width = (availableWidth - gap * (cols - 1)) / cols;
    if (width >= minCardWidth && width <= maxCardWidth) {
      bestColumns = cols;
      break;
    }
  }

  const totalGaps = gap * (bestColumns - 1);
  return Math.floor((availableWidth - totalGaps) / bestColumns);
};
