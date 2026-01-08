import React from 'react';
import { KitchenCard } from '../KitchenCard';
import { KitchenCardColumnProps } from '../../shared/types/kitchen-card.types';

/**
 * Wrapper pour le variant 'column' de KitchenCard
 *
 * Optimisé pour l'affichage en colonnes Kanban.
 * Affiche un seul bouton d'action selon le statut de la colonne.
 *
 * @example
 * <KitchenCardColumn
 *   itemGroup={itemGroup}
 *   status={Status.PENDING}
 *   onStatusChange={handleStatusChange}
 * />
 */
export default function KitchenCardColumn(props: KitchenCardColumnProps) {
  return <KitchenCard variant="column" {...props} />;
}
