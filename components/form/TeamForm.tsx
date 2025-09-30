import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { Text, Button, TextInput, SelectButton } from '~/components/ui';
import { User, UserProfile } from '~/types/user.types';
import { getEnumValue, getUserProfileText } from '~/lib/utils';
import { validateForm, ValidationRules } from '~/components/lib/formValidation';
import { useToast } from '~/components/ToastProvider';
import { AdminFormRef, AdminFormData } from '~/components/admin/AdminFormView';
import { SectionHeader } from '~/components/admin/SectionHeader';
import { Users } from 'lucide-react-native';

interface TeamFormProps {
  user: User | null;
  onSave?: (user: User) => void; // Optionnel car maintenant géré par AdminFormView
  onCancel?: () => void;
  activeTab: UserProfile | 'all';
}

const initialFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  loginId: '',
  password: '',
};


export const TeamForm = forwardRef<AdminFormRef<User>, TeamFormProps>(({ user, onSave, onCancel, activeTab }, ref) => {
  const [formData, setFormData] = useState(initialFormData);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [isPasswordModified, setIsPasswordModified] = useState(false);
  const { showToast } = useToast();

  const validationRules: ValidationRules = {
    profil: {
      required: true,
      message: 'Le profil est obligatoire'
    },
    firstName: {
      required: true,
      minLength: 3,
      maxLength: 50,
      message: 'Le prénom doit contenir entre 3 et 50 caractères'
    },
    lastName: {
      required: true,
      minLength: 3,
      maxLength: 50,
      message: 'Le nom de famille doit contenir entre 3 et 50 caractères'
    },
    email: {
      required: true,
      email: true,
      maxLength: 100,
      message: 'L\'adresse email n\'est pas valide'
    },
    phone: {
      required: false,
      phone: true,
      minLength: 10,
      maxLength: 20,
      message: 'Le numéro de téléphone doit contenir entre 10 et 20 caractères'
    },
    loginId: {
      required: true,
      minLength: 3,
      maxLength: 30,
      message: 'L\'identifiant doit contenir entre 3 et 30 caractères'
    },
    password: {
      required: (value, data) => !user || isPasswordModified,
      minLength: 8,
      maxLength: 100,
      message: 'Le mot de passe doit contenir entre 8 et 100 caractères'
    },
  };

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        loginId: user.loginId || '',
        password: '********',
      });
      setIsPasswordModified(false);

      setSelectedProfileId(user.profil);
    } else {
      setFormData(initialFormData);
      setIsPasswordModified(false);

      if (activeTab !== 'all') {
        setSelectedProfileId(activeTab);
      } else {
        setSelectedProfileId('');
      }
    }
  }, [user, activeTab]);

  // Gestion des profils de type callback
  const handleProfileSelect = React.useCallback((profileId: string) => {
    setSelectedProfileId(profileId);
  }, []);

  // Expose l'interface AdminFormRef
  useImperativeHandle(ref, () => ({
    getFormData: (): AdminFormData<User> => {
      const dataToValidate = {
        ...formData,
        profil: selectedProfileId
      };

      const errors = validateForm(dataToValidate, validationRules);
      const formErrors: Record<string, string> = {};

      if (errors.length > 0) {
        errors.forEach(error => {
          formErrors[error.field || 'general'] = error.message;
        });
      }

      if (!selectedProfileId) {
        formErrors.profil = 'Le rôle est obligatoire';
      }

      const isValid = Object.keys(formErrors).length === 0;
      let userData: User | null = null;

      if (isValid) {
        userData = {
          id: user?.id || '',
          accountId: user?.accountId || '',
          profil: selectedProfileId as UserProfile,
          ...formData,
          password: user && !isPasswordModified ? '' : formData.password,
        };
      }

      return {
        data: userData!,
        isValid,
        errors: formErrors
      };
    },

    resetForm: () => {
      setFormData(initialFormData);
      setIsPasswordModified(false);
      setSelectedProfileId(activeTab !== 'all' ? activeTab : '');
    },

    validateForm: () => {
      const result = (ref as any).current?.getFormData();
      if (!result.isValid && Object.keys(result.errors).length > 0) {
        showToast(Object.values(result.errors)[0] as string, 'error');
      }
      return result.isValid;
    }
  }), [formData, selectedProfileId, validationRules, user, isPasswordModified, activeTab, showToast]);

  const handlePasswordChange = (text: string) => {
    setIsPasswordModified(true);
    setFormData(prev => ({ ...prev, password: text }));
  };

  return (
    <View style={styles.container}>
      {/* Formulaire en grille compacte */}
      <View style={styles.formGrid}>
        {/* Section principale - Informations générales */}
        <View style={styles.section}>
          <SectionHeader
            icon={Users}
            title="1. Informations générales"
            subtitle="Renseignez les informations personnelles et identifiants du membre"
          />

          {/* Ligne 1: Rôle */}
          <View style={[styles.row, { marginBottom: 16 }]}>
            <View style={styles.profileSection}>
              <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Rôle *</Text>
              <View style={styles.profileButtons}>
                {Object.values(UserProfile)
                  .filter(profile => !['superadmin', 'admin'].includes(profile))
                  .map((profile) => (
                    <SelectButton
                      key={profile}
                      label={getUserProfileText(profile)}
                      isActive={selectedProfileId === profile}
                      onPress={() => handleProfileSelect(profile)}
                      variant="sub"
                    />
                  ))}
              </View>
            </View>
          </View>

          {/* Ligne 2: Prénom + Nom */}
          <View style={styles.row}>
            <View style={[styles.field, styles.fieldLarge]}>
              <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Prénom *</Text>
              <TextInput
                value={formData.firstName}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, firstName: text }))}
                placeholder="Prénom"
                placeholderTextColor="#A0A0A0"
                style={styles.input}
                autoComplete="off"
              />
            </View>
            <View style={[styles.field, styles.fieldLarge]}>
              <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Nom *</Text>
              <TextInput
                value={formData.lastName}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, lastName: text }))}
                placeholder="Nom"
                placeholderTextColor="#A0A0A0"
                style={styles.input}
                autoComplete="off"
              />
            </View>
          </View>

          {/* Ligne 3: Email + Téléphone */}
          <View style={styles.row}>
            <View style={[styles.field, styles.fieldLarge]}>
              <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Email *</Text>
              <TextInput
                value={formData.email}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder="Email"
                placeholderTextColor="#A0A0A0"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                autoComplete="off"
                {...(Platform.OS === 'web' ? {
                  autoFill: 'off',
                  'data-form-type': 'other',
                } : {})}
              />
            </View>
            <View style={[styles.field, styles.fieldLarge]}>
              <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Téléphone</Text>
              <TextInput
                value={formData.phone}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, phone: text }))}
                placeholder="Téléphone (optionnel)"
                placeholderTextColor="#A0A0A0"
                keyboardType="phone-pad"
                style={styles.input}
                autoComplete="off"
              />
            </View>
          </View>

          {/* Ligne 4: Identifiant + Mot de passe */}
          <View style={[styles.row, { marginBottom: 0 }]}>
            <View style={[styles.field, styles.fieldLarge]}>
              <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Identifiant *</Text>
              <TextInput
                value={formData.loginId}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, loginId: text }))}
                placeholder="Identifiant"
                placeholderTextColor="#A0A0A0"
                autoCapitalize="none"
                style={styles.input}
                autoComplete="off"
                {...(Platform.OS === 'web' ? {
                  autoFill: 'off',
                  'data-form-type': 'other',
                } : {})}
              />
            </View>
            <View style={[styles.field, styles.fieldLarge]}>
              <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Mot de passe {!user && '*'}</Text>
              <TextInput
                value={formData.password}
                onChangeText={handlePasswordChange}
                placeholder={user ? "Modifier le mot de passe" : "Mot de passe"}
                placeholderTextColor="#A0A0A0"
                secureTextEntry
                style={styles.input}
                autoComplete="new-password"
                {...(Platform.OS === 'web' ? {
                  autoFill: 'off',
                  'data-form-type': 'other',
                } : {})}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Structure en grille
  formGrid: {
    flex: 1,
  },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 26,
    paddingVertical: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  // Système de lignes et colonnes
  row: {
    flexDirection: 'row',
    marginBottom: 24,
    ...(Platform.OS === 'web' ? {} : { gap: 16 })
  },

  field: {
    ...(Platform.OS === 'web' && { marginRight: 16 })
  },

  fieldLarge: {
    flex: 2,
    ...(Platform.OS === 'web' && { marginRight: 16 })
  },

  // Éléments de form
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
    marginBottom: 8,
    letterSpacing: 0.5,
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif',
    })
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
      }
    }),
  },

  // Section profils (comme catégories dans MenuForm)
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

});