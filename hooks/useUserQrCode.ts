/**
 * useUserQrCode Hook
 *
 * Manages QR code generation, sharing, and revocation for user authentication.
 *
 * Features:
 * - Generate/retrieve QR token for a user
 * - Share QR magic link via native share dialog
 * - Copy QR magic link to clipboard
 * - Revoke QR token
 *
 * @example
 * ```tsx
 * const { token, magicLink, loading, copied, generate, share, copy, revoke } = useUserQrCode();
 *
 * // Generate QR for a user
 * await generate(userId);
 *
 * // Share QR link
 * await share(user);
 *
 * // Copy to clipboard
 * await copy();
 *
 * // Revoke QR
 * await revoke(userId);
 * ```
 */

import { useState } from 'react';
import { Share, Clipboard, Platform } from 'react-native';
import { useUsers } from './useRestaurant';
import { useToast } from '~/components/ToastProvider';
import { User } from '~/types/user.types';

interface UseUserQrCodeReturn {
  /** QR token string */
  token: string | null;

  /** Magic link for deep linking */
  magicLink: string | null;

  /** Loading state */
  loading: boolean;

  /** Copied to clipboard state */
  copied: boolean;

  /** Generate or retrieve QR token for a user */
  generate: (userId: string) => Promise<void>;

  /** Share magic link via native share dialog */
  share: (user: User) => Promise<void>;

  /** Copy magic link to clipboard */
  copy: () => Promise<void>;

  /** Revoke QR token for a user */
  revoke: (userId: string) => Promise<void>;

  /** Reset all state */
  reset: () => void;
}

export const useUserQrCode = (): UseUserQrCodeReturn => {
  const [token, setToken] = useState<string | null>(null);
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const { getOrGenerateQrToken, revokeQrToken } = useUsers();
  const { showToast } = useToast();

  /**
   * Generate or retrieve QR token for a user
   */
  const generate = async (userId: string): Promise<void> => {
    setLoading(true);
    setCopied(false);

    try {
      const res = await getOrGenerateQrToken(userId);
      const qrToken = res.qrData.token;

      setToken(qrToken);
      // Utiliser le webLink retourné par le backend (landing page) au lieu du deepLink
      // Si les links ne sont pas disponibles, fallback sur l'ancienne méthode
      if ((res as any).links?.webLink) {
        setMagicLink((res as any).links.webLink);
      } else {
        // Fallback pour compatibilité
        setMagicLink(`komy://auth/qr-login?token=${qrToken}`);
      }
    } catch (error) {
      showToast('Erreur lors de la récupération du QR code', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Share magic link via native share dialog
   */
  const share = async (user: User): Promise<void> => {
    if (!magicLink) {
      showToast('Aucun lien à partager', 'error');
      return;
    }

    try {
      await Share.share({
        message: `Lien de connexion Komy pour ${user.firstName} ${user.lastName}: ${magicLink}`,
        title: "Connexion Komy",
      });
    } catch (error) {
      showToast('Erreur lors du partage', 'error');
    }
  };

  /**
   * Copy magic link to clipboard
   */
  const copy = async (): Promise<void> => {
    if (!magicLink) {
      showToast('Aucun lien à copier', 'error');
      return;
    }

    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(magicLink);
      } else {
        Clipboard.setString(magicLink);
      }

      setCopied(true);
      showToast('Lien copié !', 'success');

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showToast('Erreur lors de la copie', 'error');
    }
  };

  /**
   * Revoke QR token for a user
   */
  const revoke = async (userId: string): Promise<void> => {
    setLoading(true);
    setCopied(false);

    try {
      await revokeQrToken(userId);
      setToken(null);
      setMagicLink(null);
      showToast('QR code révoqué avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de la révocation du QR code', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset all state
   */
  const reset = (): void => {
    setToken(null);
    setMagicLink(null);
    setLoading(false);
    setCopied(false);
  };

  return {
    token,
    magicLink,
    loading,
    copied,
    generate,
    share,
    copy,
    revoke,
    reset,
  };
};
