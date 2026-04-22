import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Pressable, Keyboard, Platform } from 'react-native';
import { X } from 'lucide-react-native';
import { User, UserProfile } from '~/types/user.types';
import { getUserProfileText } from '~/lib/utils';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';
import { SelectButton } from '~/components/ui';
import { useToast } from '~/components/ToastProvider';
import { useFormErrors } from '~/hooks/useFormErrors';
import { FormFieldError } from '~/components/ui/FormFieldError';
import { colors } from '~/theme';

// Profils affichables (exclure superadmin et admin)
const DISPLAYABLE_PROFILES = Object.values(UserProfile).filter(
  profile => !['superadmin', 'admin'].includes(profile)
);

interface QuickTeamFormPanelContentProps {
  user?: User | null;  // Utilisateur à éditer (optionnel)
  onSave: (profil: UserProfile, displayName: string, userId?: string) => Promise<void>;
  onCancel: () => void;
  activeTab?: UserProfile | 'all';
}

export const QuickTeamFormPanelContent: React.FC<QuickTeamFormPanelContentProps> = ({
  user,
  onSave,
  onCancel,
  activeTab = 'all',
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();
  const formErrors = useFormErrors();

  useEffect(() => {
    if (user) {
      // Mode édition : pré-remplir avec les données de l'utilisateur
      setSelectedProfileId(user.profil);
      setDisplayName(user.firstName || '');
    } else if (activeTab !== 'all' && !selectedProfileId) {
      // Mode création : pré-remplir avec l'onglet actif
      setSelectedProfileId(activeTab);
    }
  }, [user, activeTab]);

  const handleProfileSelect = (profile: UserProfile) => {
    setSelectedProfileId(profile);
    formErrors.clearError('profil');
  };

  const handleSave = async () => {
    if (isSaving) return;
    formErrors.clearAll();
    setIsSaving(true);
    try {
      await onSave(selectedProfileId as UserProfile, displayName.trim() || '', user?.id);
    } catch (error) {
      formErrors.handleError({ error, showToast, fallback: 'Erreur lors de la sauvegarde' });
    } finally {
      setIsSaving(false);
    }
  };

  const isEditMode = !!user;

  return (
    <View style={styles.panelContent}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{isEditMode ? 'Modification utilisateur' : 'Création utilisateur'}</Text>
        <TouchableOpacity onPress={onCancel}>
          <X size={24} color={colors.neutral[500]} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* KeyboardAwareScrollView - auto-scrolls to focused input */}
      <KeyboardAwareScrollViewWrapper
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bottomOffset={40}
        scrollEventThrottle={16}
      >
        <Pressable style={{ flex: 1, paddingTop: 20 }} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
          {/* Section Rôle */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Rôle</Text>
            <View style={[styles.profileButtons, formErrors.hasError('profil') && styles.selectorError]}>
              {DISPLAYABLE_PROFILES.map((profile) => (
                <SelectButton
                  key={profile}
                  label={getUserProfileText(profile)}
                  isActive={selectedProfileId === profile}
                  onPress={() => handleProfileSelect(profile)}
                  variant="sub"
                />
              ))}
            </View>
            <FormFieldError message={formErrors.getError('profil')} />
          </View>

          {/* Nom d'affichage */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nom d'affichage (optionnel)</Text>
            <Text style={styles.formHelpText}>
              Si non renseigné, un nom sera généré automatiquement
            </Text>
            <TextInput
              value={displayName}
              onChangeText={(text) => { setDisplayName(text); formErrors.clearError('firstName'); }}
              placeholder="Ex: Jean Dupont, Chef Principal, etc."
              placeholderTextColor={colors.neutral[400]}
              style={[styles.formInput, formErrors.hasError('firstName') && styles.formInputError]}
              autoComplete="off"
            />
            <FormFieldError message={formErrors.getError('firstName')} />
          </View>
        </Pressable>
      </KeyboardAwareScrollViewWrapper>

      <View style={styles.panelFooter}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonSaving]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Enregistrement...' : (isEditMode ? 'Modifier' : 'Créer')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  panelContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 12,
  },
  formHelpText: {
    fontSize: 12,
    color: colors.neutral[500],
    marginBottom: 8,
  },
  formInput: {
    height: 44,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: colors.neutral[800],
  },
  formInputError: {
    borderColor: colors.error.base,
    backgroundColor: colors.error.bg,
  },
  profileButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectorError: {
    borderWidth: 1,
    borderColor: colors.error.base,
    borderRadius: 10,
    backgroundColor: colors.error.bg,
    padding: 4,
  },
  panelFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  saveButton: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.brand.dark,
  },
  saveButtonSaving: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
});
