import { forwardRef, useImperativeHandle, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, TextInput, SelectButton } from '~/components/ui';
import { UserProfile } from '~/types/user.types';
import { getUserProfileText } from '~/lib/utils';
import { validateForm, ValidationRules } from '~/components/lib/formValidation';
import { useToast } from '~/components/ToastProvider';
import { AdminFormRef, AdminFormData } from '~/components/admin/AdminFormView';
import { SectionHeader } from '~/components/admin/SectionHeader';
import { Users } from 'lucide-react-native';

interface QuickTeamFormProps {
  activeTab: UserProfile | 'all';
  onQuickCreate: (profil: UserProfile, displayName?: string) => Promise<any>;
}

const initialFormData = {
  displayName: '',
};

export const QuickTeamForm = forwardRef<AdminFormRef<any>, QuickTeamFormProps>(
  ({ activeTab, onQuickCreate }, ref) => {
    const [formData, setFormData] = useState(initialFormData);
    const [selectedProfileId, setSelectedProfileId] = useState<string>(
      activeTab !== 'all' ? activeTab : ''
    );
    const { showToast } = useToast();

    const validationRules: ValidationRules = {
      profil: {
        required: true,
        message: 'Le profil est obligatoire',
      },
      displayName: {
        required: false,
        minLength: 2,
        maxLength: 50,
        message: 'Le nom doit contenir entre 2 et 50 caractères',
      },
    };

    // Expose l'interface AdminFormRef
    useImperativeHandle(
      ref,
      () => ({
        getFormData: (): AdminFormData<any> => {
          const dataToValidate = {
            profil: selectedProfileId,
            displayName: formData.displayName,
          };

          const errors = validateForm(dataToValidate, validationRules);
          const formErrors: Record<string, string> = {};

          if (errors.length > 0) {
            errors.forEach((error) => {
              formErrors[error.field || 'general'] = error.message;
            });
          }

          if (!selectedProfileId) {
            formErrors.profil = 'Le rôle est obligatoire';
          }

          const isValid = Object.keys(formErrors).length === 0;

          return {
            data: isValid
              ? {
                  profil: selectedProfileId,
                  displayName: formData.displayName || undefined,
                }
              : null,
            isValid,
            errors: formErrors,
          };
        },

        resetForm: () => {
          setFormData(initialFormData);
          setSelectedProfileId(activeTab !== 'all' ? activeTab : '');
        },

        validateForm: () => {
          const result = (ref as any).current?.getFormData();
          if (!result.isValid && Object.keys(result.errors).length > 0) {
            showToast(Object.values(result.errors)[0] as string, 'error');
          }
          return result.isValid;
        },
      }),
      [formData, selectedProfileId, validationRules, activeTab, showToast]
    );

    return (
      <View style={styles.container}>
        <View style={styles.formGrid}>
          {/* Section principale */}
          <View style={styles.section}>
            <SectionHeader
              icon={Users}
              title="1. Création rapide d'utilisateur"
              subtitle="Sélectionnez le rôle et optionnellement un nom. Les identifiants seront générés automatiquement."
            />

            {/* Ligne 1: Rôle */}
            <View style={[styles.row, { marginBottom: 16 }]}>
              <View style={styles.profileSection}>
                <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>
                  Rôle *
                </Text>
                <View style={styles.profileButtons}>
                  {Object.values(UserProfile)
                    .filter((profile) => !['superadmin', 'admin'].includes(profile))
                    .map((profile) => (
                      <SelectButton
                        key={profile}
                        label={getUserProfileText(profile)}
                        isActive={selectedProfileId === profile}
                        onPress={() => setSelectedProfileId(profile)}
                        variant="sub"
                      />
                    ))}
                </View>
              </View>
            </View>

            {/* Ligne 2: Nom d'affichage */}
            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>
                  Nom d'affichage (optionnel)
                </Text>
                <TextInput
                  value={formData.displayName}
                  onChangeText={(text: string) =>
                    setFormData((prev) => ({ ...prev, displayName: text }))
                  }
                  placeholder="Ex: Jean Dupont"
                  placeholderTextColor="#A0A0A0"
                  style={styles.input}
                  autoComplete="off"
                />
                <Text style={styles.helpText}>
                  Si non renseigné, un nom généré automatiquement sera utilisé
                </Text>
              </View>
            </View>

            {/* Info section */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>ℹ️ Informations générées automatiquement :</Text>
              <Text style={styles.infoText}>• Identifiant unique</Text>
              <Text style={styles.infoText}>• Email interne</Text>
              <Text style={styles.infoText}>• Mot de passe sécurisé</Text>
              <Text style={styles.infoText}>• QR Code de connexion</Text>
              <Text style={styles.infoText}>• Lien de connexion partageable</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  formGrid: {
    flex: 1,
  },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    ...Platform.select({
      ios: { elevation: 2 },
      android: { elevation: 0.5 },
      web: { elevation: 2 },
    }),
  },

  row: {
    flexDirection: 'row',
    marginBottom: 15,
    ...(Platform.OS === 'web' ? {} : { gap: 16 }),
  },

  field: {
    flex: 1,
    ...(Platform.OS === 'web' && { marginRight: 16 }),
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
    marginBottom: 8,
    letterSpacing: 0.5,
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }),
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
    fontWeight: '500',
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    ...(Platform.OS === 'web' && {
      cursor: 'text',
      transition: 'all 0.2s ease',
      ':focus': {
        borderColor: '#2A2E33',
        shadowOpacity: 0.1,
      },
    }),
  },

  helpText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    fontStyle: 'italic',
  },

  profileSection: {
    flex: 1,
    width: '100%',
  },

  profileButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },

  infoBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4338CA',
    marginBottom: 8,
  },

  infoText: {
    fontSize: 13,
    color: '#4F46E5',
    marginBottom: 4,
    lineHeight: 20,
  },
});
