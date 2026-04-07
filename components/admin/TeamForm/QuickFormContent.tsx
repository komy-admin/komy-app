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
      formErrors.handleError(error, showToast, 'Erreur lors de la sauvegarde');
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
          <X size={24} color="#64748B" strokeWidth={2} />
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
              placeholderTextColor="#94A3B8"
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
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#E2E8F0',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  formHelpText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  formInput: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1E293B',
  },
  formInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  profileButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectorError: {
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    padding: 4,
  },
  panelFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#2A2E33',
  },
  saveButtonSaving: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
