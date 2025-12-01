import { Table } from '~/types/table.types';
import { Room } from '~/types/room.types';

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

/**
 * Vérifie si une table est entièrement dans les limites de la salle
 */
export function isTableWithinRoom(table: Table, roomWidth: number, roomHeight: number): boolean {
  return (
    table.xStart >= 0 &&
    table.yStart >= 0 &&
    table.xStart + table.width <= roomWidth &&
    table.yStart + table.height <= roomHeight
  );
}

/**
 * Vérifie si deux tables entrent en collision
 */
export function hasTableCollision(table: Table, otherTable: Table): boolean {
  if (table.id === otherTable.id) return false;

  const hasHorizontalOverlap = (
    table.xStart < otherTable.xStart + otherTable.width &&
    table.xStart + table.width > otherTable.xStart
  );

  const hasVerticalOverlap = (
    table.yStart < otherTable.yStart + otherTable.height &&
    table.yStart + table.height > otherTable.yStart
  );

  return hasHorizontalOverlap && hasVerticalOverlap;
}

/**
 * Vérifie si une position de table est valide (dans les limites et sans collision)
 */
export function isTablePositionValid(
  table: Table,
  allTables: Table[],
  roomWidth: number,
  roomHeight: number
): boolean {
  // Vérifier les limites de la salle
  if (!isTableWithinRoom(table, roomWidth, roomHeight)) {
    return false;
  }

  // Vérifier les collisions avec les autres tables
  return !allTables.some(otherTable => hasTableCollision(table, otherTable));
}
