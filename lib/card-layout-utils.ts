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
 * Calcule le nombre optimal de colonnes pour remplir l'espace disponible.
 * Maximise le nombre de colonnes en acceptant de réduire la largeur jusqu'à 75% du min
 * pour éviter les zones mortes.
 *
 * Utilisé avec des rows explicites (flex: 1 sur chaque carte) pour éliminer
 * les problèmes de sub-pixel rendering liés à flexWrap + largeur fixe.
 */
export const calculateOptimalColumns = ({
  containerWidth,
  padding = 0,
  gap = 12,
  minCardWidth = 180,
  maxCardWidth = 240,
}: CardLayoutConfig): number => {
  if (containerWidth === 0) return 3;

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

  return bestColumns;
};

/**
 * Découpe un tableau en sous-tableaux de taille fixe (rows de grille).
 */
export const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};
