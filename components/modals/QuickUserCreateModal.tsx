import React, { useState } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, Share, Clipboard } from 'react-native';
import { Text, Button, TextInput, SelectButton } from '~/components/ui';
import { CustomModal } from '~/components/CustomModal';
import { QRCode } from '~/components/ui/QRCode';
import { UserProfile } from '~/types/user.types';
import { getUserProfileText } from '~/lib/utils';
import { UserPlus, Share2, Copy, CheckCircle2 } from 'lucide-react-native';

interface QuickUserCreateModalProps {
  isVisible: boolean;
  onClose: () => void;
  onCreateQuick: (profil: UserProfile, displayName?: string) => Promise<any>;
}

export const QuickUserCreateModal: React.FC<QuickUserCreateModalProps> = ({
  isVisible,
  onClose,
  onCreateQuick,
}) => {
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [links, setLinks] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCreate = async () => {
    if (!selectedProfile) return;

    setIsCreating(true);
    try {
      const response = await onCreateQuick(selectedProfile, displayName || undefined);
      setQrData(response.qrData);
      setLinks(response.links);
    } catch (error) {
      console.error('Error creating quick user:', error);
      // Toast géré par le parent
    } finally {
      setIsCreating(false);
    }
  };

  const handleShare = async () => {
    if (!links?.deepLink) return;

    try {
      await Share.share({
        message: `Lien de connexion Fork'it: ${links.deepLink}`,
        title: 'Connexion Fork\'it',
      });
    } catch (error) {
      console.error('Error sharing link:', error);
    }
  };

  const handleCopyLink = async () => {
    if (!links?.deepLink) return;

    if (Platform.OS === 'web') {
      await navigator.clipboard.writeText(links.deepLink);
    } else {
      Clipboard.setString(links.deepLink);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleClose = () => {
    setSelectedProfile(null);
    setDisplayName('');
    setQrData(null);
    setLinks(null);
    setCopiedLink(false);
    onClose();
  };

  return (
    <CustomModal
      isVisible={isVisible}
      onClose={handleClose}
      width={500}
      height={qrData ? 620 : 380}
      title={qrData ? "Utilisateur créé !" : "Création rapide d'utilisateur"}
    >
      {!qrData ? (
        // Formulaire de création
        <View style={styles.formContainer}>
          <View style={styles.iconContainer}>
            <UserPlus size={32} color="#4F46E5" />
          </View>

          <Text style={styles.description}>
            Créez un compte en quelques secondes. Sélectionnez le rôle et optionnellement un nom.
          </Text>

          {/* Sélection du profil */}
          <View style={styles.section}>
            <Text style={styles.label}>Rôle *</Text>
            <View style={styles.profileButtons}>
              {Object.values(UserProfile)
                .filter(profile => !['superadmin', 'admin'].includes(profile))
                .map((profile) => (
                  <SelectButton
                    key={profile}
                    label={getUserProfileText(profile)}
                    isActive={selectedProfile === profile}
                    onPress={() => setSelectedProfile(profile)}
                    variant="sub"
                  />
                ))}
            </View>
          </View>

          {/* Nom d'affichage (optionnel) */}
          <View style={styles.section}>
            <Text style={styles.label}>Nom d'affichage (optionnel)</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Ex: Jean Dupont"
              placeholderTextColor="#A0A0A0"
              style={styles.input}
              autoComplete="off"
            />
          </View>

          {/* Boutons */}
          <View style={styles.buttonContainer}>
            <Button
              onPress={handleClose}
              variant="outline"
              style={styles.cancelButton}
              disabled={isCreating}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Button>
            <Button
              onPress={handleCreate}
              style={styles.createButton}
              disabled={!selectedProfile || isCreating}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.createButtonText}>Créer</Text>
              )}
            </Button>
          </View>
        </View>
      ) : (
        // Affichage QR + Liens
        <View style={styles.resultContainer}>
          <View style={styles.successHeader}>
            <CheckCircle2 size={24} color="#10B981" />
            <Text style={styles.successText}>Utilisateur créé avec succès !</Text>
          </View>

          {/* QR Code */}
          <View style={styles.qrContainer}>
            <QRCode value={qrData.token} size={200} />
          </View>

          <Text style={styles.instructionText}>
            Scannez ce QR code ou partagez le lien ci-dessous
          </Text>

          {/* Boutons de partage */}
          <View style={styles.shareButtonsContainer}>
            <Button
              onPress={handleShare}
              variant="outline"
              style={styles.shareButton}
            >
              <Share2 size={16} color="#4F46E5" />
              <Text style={styles.shareButtonText}>Partager</Text>
            </Button>

            <Button
              onPress={handleCopyLink}
              variant="outline"
              style={[styles.shareButton, copiedLink && styles.copiedButton]}
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 size={16} color="#10B981" />
                  <Text style={styles.copiedButtonText}>Copié !</Text>
                </>
              ) : (
                <>
                  <Copy size={16} color="#4F46E5" />
                  <Text style={styles.shareButtonText}>Copier lien</Text>
                </>
              )}
            </Button>
          </View>

          {/* Lien affiché */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkLabel}>Lien de connexion:</Text>
            <Text style={styles.linkText} numberOfLines={2}>
              {links.deepLink}
            </Text>
          </View>

          {/* Bouton Terminer */}
          <Button onPress={handleClose} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Terminer</Text>
          </Button>
        </View>
      )}
    </CustomModal>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  resultContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
    marginBottom: 8,
  },
  profileButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    color: '#2A2E33',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 44,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    borderColor: '#E5E7EB',
    borderWidth: 1,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  shareButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 16,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderColor: '#E5E7EB',
    borderWidth: 1,
  },
  copiedButton: {
    borderColor: '#10B981',
  },
  shareButtonText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '500',
  },
  copiedButtonText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
  },
  linkContainer: {
    width: '100%',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  linkLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  linkText: {
    fontSize: 12,
    color: '#4F46E5',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  doneButton: {
    width: '100%',
    backgroundColor: '#2A2E33',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
