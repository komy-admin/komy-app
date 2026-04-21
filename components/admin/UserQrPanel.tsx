/**
 * UserQrPanelContent Component
 *
 * Content of the SlidePanel for displaying and managing a user QR code.
 * Meant to be rendered inside a SlidePanel via usePanelPortal.
 *
 * @example
 * ```tsx
 * renderPanel(
 *   <SlidePanel visible={true} onClose={handleClose} width={450}>
 *     <UserQrPanelContent user={user} onClose={handleClose} />
 *   </SlidePanel>
 * );
 * ```
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Platform } from 'react-native';
import { X, Share2, Copy } from 'lucide-react-native';
import { QRCode } from '~/components/ui/QRCode';
import { useUserQrCode } from '~/hooks/useUserQrCode';
import { User } from '~/types/user.types';
import { colors } from '~/theme';
import { getColorWithOpacity } from '~/lib/color-utils';

export interface UserQrPanelContentProps {
  user: User;
  onClose: () => void;
}

const QR_SIZE = 220;

export const UserQrPanelContent: React.FC<UserQrPanelContentProps> = ({ user, onClose }) => {
  const qr = useUserQrCode();

  useEffect(() => {
    if (user?.id) {
      qr.generate(user.id);
    }
    return () => {
      qr.reset();
    };
  }, [user?.id]);

  const handleClose = () => {
    qr.reset();
    onClose();
  };

  const handleShare = async () => {
    await qr.share(user);
  };

  const handleRevoke = async () => {
    if (user?.id) {
      await qr.revoke(user.id);
      handleClose();
    }
  };

  const canInteract = !!qr.token && !qr.loading;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const initial = user.firstName?.charAt(0)?.toUpperCase() || '?';

  return (
    <View style={styles.panelContent}>
      {/* Header */}
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>QR code utilisateur</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <X size={24} color={colors.neutral[500]} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Body — QR centered + identity avatar row */}
      <View style={styles.body}>
        <View style={styles.qrCodeContainer}>
          {qr.loading && <Text style={styles.loadingText}>Chargement du QR code...</Text>}
          {!qr.loading && qr.token && <QRCode value={qr.token} size={QR_SIZE} />}
        </View>

        <Text style={styles.caption}>
          Scannez pour vous authentifier en tant que{' '}
          <Text style={styles.captionName}>{fullName}</Text>
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerTopRow}>
          <Pressable
            onPress={handleShare}
            disabled={!canInteract}
            style={[styles.outlineButton, !canInteract && styles.buttonDisabled]}
          >
            <Share2 size={15} color={colors.brand.dark} strokeWidth={2} />
            <Text style={styles.outlineButtonText}>Partager</Text>
          </Pressable>

          <Pressable
            onPress={qr.copy}
            disabled={!canInteract}
            style={[
              styles.outlineButton,
              qr.copied && styles.outlineButtonSuccess,
              !canInteract && styles.buttonDisabled,
            ]}
          >
            <Copy size={15} color={qr.copied ? colors.success.base : colors.brand.dark} strokeWidth={2} />
            <Text style={[styles.outlineButtonText, qr.copied && styles.outlineButtonTextSuccess]}>
              {qr.copied ? 'Copié !' : 'Copier lien'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.separatorRow}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>ou</Text>
          <View style={styles.separatorLine} />
        </View>

        <Pressable
          onPress={handleRevoke}
          disabled={!canInteract}
          style={[styles.revokeButton, !canInteract && styles.revokeButtonDisabled]}
        >
          <Text style={styles.revokeButtonText}>Révoquer</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  panelContent: {
    flex: 1,
    backgroundColor: colors.white,
  },
  // Header
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  panelTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  closeButton: {
    padding: 4,
  },
  // Body
  body: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  qrCodeContainer: {
    width: QR_SIZE,
    height: QR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  caption: {
    maxWidth: QR_SIZE,
    fontSize: 13,
    fontWeight: '400',
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 19,
  },
  captionName: {
    color: colors.neutral[800],
    fontWeight: '600',
  },
  // Footer
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  footerTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  outlineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.brand.dark,
    backgroundColor: getColorWithOpacity(colors.brand.dark, 0.08),
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  outlineButtonSuccess: {
    borderColor: colors.success.base,
    backgroundColor: getColorWithOpacity(colors.success.base, 0.1),
  },
  outlineButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.brand.dark,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  outlineButtonTextSuccess: {
    color: colors.success.base,
  },
  buttonDisabled: {
    opacity: 0.5,
    ...(Platform.OS === 'web' ? { cursor: 'default' as any } : {}),
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 10,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  separatorText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray[400],
  },
  revokeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.error.text,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  revokeButtonDisabled: {
    backgroundColor: colors.gray[300],
    ...(Platform.OS === 'web' ? { cursor: 'default' as any } : {}),
  },
  revokeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});
