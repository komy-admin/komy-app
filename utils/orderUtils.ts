/**
 * 🚀 UTILITAIRES OPTIMISÉS POUR LES COMMANDES
 *
 * Fonctions memoizables pour éviter les recalculs coûteux O(n*m)
 */

import { Order } from '~/types/order.types';
import { OrderLine, OrderLineType } from '~/types/order-line.types';
import { Status } from '~/types/status.enum';

/**
 * Vérifie si une ligne de commande est terminée
 * @complexity O(k) où k = nombre d'items dans un menu
 */
const isOrderLineTerminated = (line: OrderLine): boolean => {
  if (line.type === OrderLineType.ITEM) {
    return line.status === Status.TERMINATED;
  }

  if (line.type === OrderLineType.MENU && line.items) {
    return line.items.every(item => item.status === Status.TERMINATED);
  }

  return false;
};

/**
 * Vérifie si une commande est entièrement terminée (toutes les lignes)
 * @complexity O(m) où m = nombre de lignes
 */
export const isOrderTerminated = (order: Order): boolean => {
  // Commande vide = non terminée (on la garde visible)
  if (!order.lines || order.lines.length === 0) {
    return false;
  }

  return order.lines.every(isOrderLineTerminated);
};

/**
 * Vérifie si une commande est active (non terminée et non brouillon)
 */
export const isOrderActive = (order: Order): boolean => {
  if (order.status === Status.TERMINATED || order.status === Status.DRAFT) {
    return false;
  }
  return !isOrderTerminated(order);
};

/**
 * Crée un index des commandes actives par tableId
 * @returns Map<tableId, Order[]> pour lookup O(1)
 */
export const createActiveOrdersByTableIndex = (orders: Order[]): Map<string, Order[]> => {
  const index = new Map<string, Order[]>();

  for (const order of orders) {
    if (order.tableId && isOrderActive(order)) {
      const existing = index.get(order.tableId);
      if (existing) {
        existing.push(order);
      } else {
        index.set(order.tableId, [order]);
      }
    }
  }

  return index;
};

/**
 * Filtre les commandes pour une room donnée (optimisé)
 * @param orders - Liste des commandes
 * @param roomId - ID de la room
 * @param tablesMap - Map des tables pour lookup O(1)
 * @param includeTerminated - Inclure les commandes terminées (défaut: false)
 */
export const filterOrdersByRoom = (
  orders: Order[],
  roomId: string,
  tablesMap: Record<string, { roomId: string }>,
  includeTerminated: boolean = false
): Order[] => {
  const result: Order[] = [];

  for (const order of orders) {
    // Vérifier si l'ordre appartient à la room
    let orderRoomId: string | undefined;

    if (order.table?.roomId) {
      orderRoomId = order.table.roomId;
    } else if (order.tableId && tablesMap[order.tableId]) {
      orderRoomId = tablesMap[order.tableId].roomId;
    }

    if (orderRoomId !== roomId) continue;

    // Exclure les terminées si demandé
    if (!includeTerminated && isOrderTerminated(order)) continue;

    result.push(order);
  }

  return result;
};
