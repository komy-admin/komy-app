import { ToastType } from '~/components/ui/toast';

/**
 * Shared error handling utilities for order status updates
 */

/**
 * Handles errors from order status update API calls
 * Displays appropriate toast messages based on error status codes
 *
 * @param error - The error object from the API call
 * @param showToast - Function to display toast notifications
 */
export function handleOrderStatusError(error: any, showToast: (message: string, type?: ToastType) => void) {
  console.error('Error updating status:', error);

  if (error.response?.status === 500) {
    showToast('Erreur serveur temporaire, l\'API est en cours de correction', 'error');
  } else if (error.response?.status === 404) {
    showToast('Commande introuvable', 'error');
  } else if (error.response?.status === 403) {
    showToast('Vous n\'avez pas les droits pour cette action', 'error');
  } else {
    showToast('Impossible de mettre à jour le statut, veuillez réessayer', 'error');
  }
}
