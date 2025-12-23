/**
 * UserQrModal Component
 *
 * Modal dialog for displaying and managing user QR codes for authentication.
 *
 * Features:
 * - Display QR code for user login
 * - Share QR magic link
 * - Copy magic link to clipboard
 * - Revoke QR token
 *
 * @example
 * ```tsx
 * <UserQrModal
 *   user={selectedUser}
 *   visible={isQrModalVisible}
 *   onClose={() => setIsQrModalVisible(false)}
 * />
 * ```
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CustomModal } from '~/components/CustomModal';
import { Button } from '~/components/ui';
import { QRCode } from '~/components/ui/QRCode';
import { Share2, Copy } from 'lucide-react-native';
import { useUserQrCode } from '~/hooks/useUserQrCode';
import { User } from '~/types/user.types';

export interface UserQrModalProps {
  /** User to generate QR code for */
  user: User | null;

  /** Modal visibility */
  visible: boolean;

  /** Close handler */
  onClose: () => void;
}

export const UserQrModal: React.FC<UserQrModalProps> = ({ user, visible, onClose }) => {
  const qr = useUserQrCode();

  // Generate QR code when modal opens with a user
  useEffect(() => {
    if (visible && user?.id) {
      qr.generate(user.id);
    } else if (!visible) {
      qr.reset();
    }
  }, [visible, user?.id]);

  const handleClose = () => {
    qr.reset();
    onClose();
  };

  const handleShare = async () => {
    if (user) {
      await qr.share(user);
    }
  };

  const handleRevoke = async () => {
    if (user?.id) {
      await qr.revoke(user.id);
      handleClose();
    }
  };

  return (
    <CustomModal
      isVisible={visible}
      onClose={handleClose}
      width={450}
      height={500}
      title="QR Code Utilisateur"
    >
      {user && (
        <View style={styles.modalContent}>
          {/* QR Code Display */}
          <View style={styles.qrCodeContainer}>
            {qr.loading && <Text style={styles.loadingText}>Chargement du QR code...</Text>}
            {!qr.loading && qr.token && <QRCode value={qr.token} size={220} />}
          </View>

          {/* User Name */}
          <Text style={styles.userNameText}>
            {user.firstName} {user.lastName}
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {/* Share Button */}
            <Button
              onPress={handleShare}
              style={styles.shareButton}
              variant="outline"
              disabled={!qr.token || qr.loading}
            >
              <Share2 size={16} color="#2A2E33" />
              <Text style={styles.shareButtonText}>Partager</Text>
            </Button>

            {/* Copy Button */}
            <Button
              onPress={qr.copy}
              style={[styles.shareButton, qr.copied && styles.copiedButton]}
              variant="outline"
              disabled={!qr.token || qr.loading}
            >
              <Copy size={16} color={qr.copied ? '#10B981' : '#2A2E33'} />
              <Text style={[styles.shareButtonText, qr.copied && styles.copiedButtonText]}>
                {qr.copied ? 'Copié !' : 'Copier lien'}
              </Text>
            </Button>

            {/* Revoke Button */}
            <Button
              onPress={handleRevoke}
              style={styles.revokeButton}
              variant="outline"
              disabled={!qr.token || qr.loading}
            >
              <Text style={styles.revokeButtonText}>Révoquer</Text>
            </Button>
          </View>
        </View>
      )}
    </CustomModal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qrCodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 40,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2E33',
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  shareButton: {
    flex: 1,
    paddingVertical: 12,
    borderColor: '#2A2E33',
    borderWidth: 1,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  shareButtonText: {
    color: '#2A2E33',
    fontSize: 13,
    fontWeight: '500',
  },
  copiedButton: {
    borderColor: '#10B981',
  },
  copiedButtonText: {
    color: '#10B981',
  },
  revokeButton: {
    flex: 1,
    paddingVertical: 12,
    borderColor: '#FF4444',
    borderWidth: 1,
    borderRadius: 6,
  },
  revokeButtonText: {
    color: '#FF4444',
    fontSize: 13,
    fontWeight: '500',
  },
});
