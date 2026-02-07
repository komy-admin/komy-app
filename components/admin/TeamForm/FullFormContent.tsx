import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Pressable, Keyboard, Platform } from 'react-native';
import { X, Check, Users } from 'lucide-react-native';
import { User, UserProfile } from '~/types/user.types';
import { getUserProfileText } from '~/lib/utils';
import { validateForm, ValidationRules } from '~/components/lib/formValidation';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';
import { SelectButton } from '~/components/ui';

// Profils affichables (exclure superadmin et admin)
const DISPLAYABLE_PROFILES = Object.values(UserProfile).filter(
  profile => !['superadmin', 'admin'].includes(profile)
);

interface TeamFormPanelContentProps {
  user: User | null;
  onSave: (userData: Partial<User>) => void;
  onCancel: () => void;
  activeTab?: UserProfile | 'all';
}

export const TeamFormPanelContent: React.FC<TeamFormPanelContentProps> = ({
  user,
  onSave,
  onCancel,
  activeTab = 'all',
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    loginId: '',
    password: '',
  });
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [isPasswordModified, setIsPasswordModified] = useState(false);

  // Track des champs touchés pour afficher les erreurs
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Marquer un champ comme touché
  const markFieldAsTouched = (fieldName: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  // Validation individuelle des champs
  const getFieldError = (fieldName: string): string | null => {
    if (!touchedFields[fieldName]) return null;

    switch (fieldName) {
      case 'profil':
        if (!selectedProfileId) return 'Le rôle est obligatoire';
        return null;

      case 'firstName':
        if (!formData.firstName.trim()) return 'Le prénom est obligatoire';
        if (formData.firstName.trim().length < 3) return 'Le prénom doit contenir au moins 3 caractères';
        if (formData.firstName.trim().length > 50) return 'Le prénom ne peut pas dépasser 50 caractères';
        return null;

      case 'lastName':
        if (!formData.lastName.trim()) return 'Le nom est obligatoire';
        if (formData.lastName.trim().length < 3) return 'Le nom doit contenir au moins 3 caractères';
        if (formData.lastName.trim().length > 50) return 'Le nom ne peut pas dépasser 50 caractères';
        return null;

      case 'email':
        if (!formData.email.trim()) return 'L\'email est obligatoire';
        if (!formData.email.includes('@')) return 'L\'email doit être valide';
        if (formData.email.trim().length > 100) return 'L\'email ne peut pas dépasser 100 caractères';
        return null;

      case 'phone':
        // Optionnel mais si rempli, doit être valide
        if (formData.phone.trim()) {
          if (formData.phone.trim().length < 10) return 'Le téléphone doit contenir au moins 10 chiffres';
          if (formData.phone.trim().length > 20) return 'Le téléphone ne peut pas dépasser 20 caractères';
        }
        return null;

      case 'loginId':
        if (!formData.loginId.trim()) return 'L\'identifiant est obligatoire';
        if (formData.loginId.trim().length < 3) return 'L\'identifiant doit contenir au moins 3 caractères';
        if (formData.loginId.trim().length > 30) return 'L\'identifiant ne peut pas dépasser 30 caractères';
        return null;

      case 'password':
        if (!user) {
          // Création : obligatoire
          if (!formData.password.trim()) return 'Le mot de passe est obligatoire';
          if (formData.password.trim().length < 8) return 'Le mot de passe doit contenir au moins 8 caractères';
          if (formData.password.trim().length > 100) return 'Le mot de passe ne peut pas dépasser 100 caractères';
        } else if (isPasswordModified) {
          // Édition : si modifié, doit être valide
          if (formData.password.trim() && formData.password !== '********') {
            if (formData.password.trim().length < 8) return 'Le mot de passe doit contenir au moins 8 caractères';
            if (formData.password.trim().length > 100) return 'Le mot de passe ne peut pas dépasser 100 caractères';
          }
        }
        return null;

      default:
        return null;
    }
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
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        loginId: '',
        password: '',
      });
      setIsPasswordModified(false);
      if (activeTab !== 'all') {
        setSelectedProfileId(activeTab);
      } else {
        setSelectedProfileId('');
      }
    }
  }, [user, activeTab]);

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
      message: "L'adresse email n'est pas valide"
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
      message: "L'identifiant doit contenir entre 3 et 30 caractères"
    },
    password: {
      required: (value, data) => !user || isPasswordModified,
      minLength: 8,
      maxLength: 100,
      message: 'Le mot de passe doit contenir entre 8 et 100 caractères'
    },
  };

  const handleSave = () => {
    const dataToValidate = {
      ...formData,
      profil: selectedProfileId
    };

    const errors = validateForm(dataToValidate, validationRules);

    if (!selectedProfileId) {
      errors.push({ field: 'profil', message: 'Le rôle est obligatoire' });
    }

    if (errors.length > 0) {
      // Afficher la première erreur (on pourrait aussi utiliser toast)
      alert(errors[0].message);
      return;
    }

    const userData: Partial<User> = {
      profil: selectedProfileId as UserProfile,
      ...formData,
      password: user && !isPasswordModified ? '' : formData.password,
    };

    onSave(userData);
  };

  const handlePasswordChange = (text: string) => {
    setIsPasswordModified(true);
    setFormData(prev => ({ ...prev, password: text }));
  };

  // Validation pour activer/désactiver le bouton Enregistrer
  const isFormValid = () => {
    // Profil obligatoire
    if (!selectedProfileId) return false;

    // Prénom obligatoire (min 3 caractères)
    if (!formData.firstName.trim() || formData.firstName.trim().length < 3) return false;

    // Nom obligatoire (min 3 caractères)
    if (!formData.lastName.trim() || formData.lastName.trim().length < 3) return false;

    // Email obligatoire (validation basique)
    if (!formData.email.trim() || !formData.email.includes('@')) return false;

    // Identifiant obligatoire (min 3 caractères)
    if (!formData.loginId.trim() || formData.loginId.trim().length < 3) return false;

    // Mot de passe obligatoire pour création OU si modifié pour édition
    if (!user) {
      // Création : mot de passe obligatoire (min 8 caractères)
      if (!formData.password.trim() || formData.password.trim().length < 8) return false;
    } else if (isPasswordModified) {
      // Édition : si modifié, min 8 caractères
      if (!formData.password.trim() || formData.password.trim().length < 8) return false;
    }

    return true;
  };

  return (
    <View style={styles.panelContent}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>
          {user ? 'Modifier le membre' : 'Création personnalisée'}
        </Text>
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
        <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
          {/* Section Rôle */}
          <View style={styles.formGroup}>
            <View style={styles.sectionHeader}>
              <Users size={18} color="#2A2E33" strokeWidth={2} />
              <Text style={styles.sectionTitle}>Rôle</Text>
            </View>
            <View style={styles.profileButtons}>
              {DISPLAYABLE_PROFILES.map((profile) => (
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

          {/* Prénom + Nom */}
          <View style={styles.formRow}>
            <View style={styles.formGroupInRow}>
              <Text style={styles.formLabel}>Prénom *</Text>
              <TextInput
                value={formData.firstName}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, firstName: text }))}
                onBlur={() => markFieldAsTouched('firstName')}
                placeholder="Prénom"
                placeholderTextColor="#A0A0A0"
                style={[
                  styles.formInput,
                  getFieldError('firstName') && styles.formInputError
                ]}
                autoComplete="off"
              />
              {getFieldError('firstName') && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{getFieldError('firstName')}</Text>
                  <Text style={styles.exampleText}>Ex: Jean, Marie</Text>
                </View>
              )}
            </View>

            <View style={styles.formGroupInRow}>
              <Text style={styles.formLabel}>Nom *</Text>
              <TextInput
                value={formData.lastName}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, lastName: text }))}
                onBlur={() => markFieldAsTouched('lastName')}
                placeholder="Nom"
                placeholderTextColor="#A0A0A0"
                style={[
                  styles.formInput,
                  getFieldError('lastName') && styles.formInputError
                ]}
                autoComplete="off"
              />
              {getFieldError('lastName') && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{getFieldError('lastName')}</Text>
                  <Text style={styles.exampleText}>Ex: Dupont, Martin</Text>
                </View>
              )}
            </View>
          </View>

          {/* Email + Téléphone */}
          <View style={styles.formRow}>
            <View style={styles.formGroupInRow}>
              <Text style={styles.formLabel}>Email *</Text>
              <TextInput
                value={formData.email}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, email: text }))}
                onBlur={() => markFieldAsTouched('email')}
                placeholder="Email"
                placeholderTextColor="#A0A0A0"
                keyboardType="email-address"
                autoCapitalize="none"
                style={[
                  styles.formInput,
                  getFieldError('email') && styles.formInputError
                ]}
                autoComplete="off"
                {...(Platform.OS === 'web' ? {
                  autoFill: 'off',
                  'data-form-type': 'other',
                } : {})}
              />
              {getFieldError('email') && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{getFieldError('email')}</Text>
                  <Text style={styles.exampleText}>Ex: jean@restaurant.fr</Text>
                </View>
              )}
            </View>

            <View style={styles.formGroupInRow}>
              <Text style={styles.formLabel}>Téléphone</Text>
              <TextInput
                value={formData.phone}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, phone: text }))}
                onBlur={() => markFieldAsTouched('phone')}
                placeholder="Téléphone (optionnel)"
                placeholderTextColor="#A0A0A0"
                keyboardType="phone-pad"
                style={[
                  styles.formInput,
                  getFieldError('phone') && styles.formInputError
                ]}
                autoComplete="off"
              />
              {getFieldError('phone') && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{getFieldError('phone')}</Text>
                  <Text style={styles.exampleText}>Ex: 0612345678</Text>
                </View>
              )}
            </View>
          </View>

          {/* Identifiant + Mot de passe */}
          <View style={styles.formRow}>
            <View style={styles.formGroupInRow}>
              <Text style={styles.formLabel}>Identifiant *</Text>
              <TextInput
                value={formData.loginId}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, loginId: text }))}
                onBlur={() => markFieldAsTouched('loginId')}
                placeholder="Identifiant"
                placeholderTextColor="#A0A0A0"
                autoCapitalize="none"
                style={[
                  styles.formInput,
                  getFieldError('loginId') && styles.formInputError
                ]}
                autoComplete="off"
                {...(Platform.OS === 'web' ? {
                  autoFill: 'off',
                  'data-form-type': 'other',
                } : {})}
              />
              {getFieldError('loginId') && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{getFieldError('loginId')}</Text>
                  <Text style={styles.exampleText}>Ex: jdupont, chef01</Text>
                </View>
              )}
            </View>

            <View style={styles.formGroupInRow}>
              <Text style={styles.formLabel}>Mot de passe {!user && '*'}</Text>
              <TextInput
                value={formData.password}
                onChangeText={handlePasswordChange}
                onBlur={() => markFieldAsTouched('password')}
                placeholder={user ? "Modifier le mot de passe" : "Mot de passe"}
                placeholderTextColor="#A0A0A0"
                secureTextEntry
                style={[
                  styles.formInput,
                  getFieldError('password') && styles.formInputError
                ]}
                autoComplete="new-password"
                {...(Platform.OS === 'web' ? {
                  autoFill: 'off',
                  'data-form-type': 'other',
                } : {})}
              />
              {getFieldError('password') && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{getFieldError('password')}</Text>
                  <Text style={styles.exampleText}>Min 8 caractères</Text>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      </KeyboardAwareScrollViewWrapper>

      <View style={styles.panelFooter}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, !isFormValid() && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isFormValid()}
        >
          <Check size={20} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.saveButtonText}>Enregistrer</Text>
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
    paddingVertical: 20,
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
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  formGroupInRow: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
    marginBottom: 8,
  },
  formInput: {
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
  },
  formInputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
    backgroundColor: '#FEF2F2',
  },
  errorContainer: {
    marginTop: 6,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  exampleText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  profileButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#A855F7',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
