import { Room } from '~/types/room.types';
import { Table } from '~/types/table.types';

/**
 * Génère une teinte claire à partir d'une couleur hex.
 * Mélange la couleur avec du blanc selon le ratio donné.
 * - mix=0.10 → background room  (#6366F1 → #EEEDF5)
 * - mix=0.04 → background table (#6366F1 → #F5F4FA)
 */
export function getRoomLightBackground(hex: string, mix: number = 0.1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r * mix + 255 * (1 - mix));
  const lg = Math.round(g * mix + 255 * (1 - mix));
  const lb = Math.round(b * mix + 255 * (1 - mix));
  return `#${lr.toString(16).padStart(2, '0').toUpperCase()}${lg.toString(16).padStart(2, '0').toUpperCase()}${lb.toString(16).padStart(2, '0').toUpperCase()}`;
}

/**
 * Génère un nom aléatoire pour une table
 * Format: Lettre majuscule (A-Z) + Nombre à 2 chiffres (00-99)
 * Exemples: A01, B23, Z99
 */
export function generateTableName(): string {
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const number = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${letter}${number}`;
}

/**
 * Trouve une position libre dans la grille pour placer une nouvelle table
 * Utilise un algorithme de grille d'occupation pour une recherche optimisée O(n*m)
 *
 * @param room - La salle dans laquelle chercher
 * @param tables - Les tables existantes dans la salle
 * @param tableSize - La taille de la table à placer (par défaut 2x2)
 * @returns Les coordonnées {x, y} de la position libre, ou null si aucun espace disponible
 */
export function findAvailablePosition(
  room: Room,
  tables: Table[],
  tableSize: number = 2
): { x: number; y: number } | null {
  // Créer une grille d'occupation pour optimiser la recherche
  const grid = Array(room.height)
    .fill(null)
    .map(() => Array(room.width).fill(false));

  // Marquer les zones occupées par les tables existantes
  tables.forEach(table => {
    for (let y = table.yStart; y < table.yStart + table.height; y++) {
      for (let x = table.xStart; x < table.xStart + table.width; x++) {
        if (grid[y]?.[x] !== undefined) {
          grid[y][x] = true;
        }
      }
    }
  });

  // Chercher une position libre en vérifiant la grille
  for (let y = 0; y <= room.height - tableSize; y++) {
    for (let x = 0; x <= room.width - tableSize; x++) {
      let canPlace = true;

      // Vérifier si la zone est libre
      for (let dy = 0; dy < tableSize && canPlace; dy++) {
        for (let dx = 0; dx < tableSize && canPlace; dx++) {
          if (grid[y + dy]?.[x + dx]) {
            canPlace = false;
          }
        }
      }

      if (canPlace) {
        return { x, y };
      }
    }
  }

  return null;
}
