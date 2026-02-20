import { Room } from '~/types/room.types';
import { Table } from '~/types/table.types';

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
