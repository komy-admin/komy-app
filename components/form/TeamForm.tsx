import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, Button, TextInput } from '~/components/ui';
import { Select } from '~/components/ui/select';
import { User, UserProfile } from '~/types/user.types';
import { getEnumValue } from '~/lib/utils';
import { validateForm, ValidationRules } from '~/components/lib/formValidation';
import { useToast } from '~/components/ToastProvider';

interface TeamFormProps {
  user: User | null;
  onSave: (user: User) => void;
  onCancel: () => void;
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

const defaultOption = {
  value: '',
  label: 'Choisissez un rôle',
};

export function TeamForm({ user, onSave, onCancel, activeTab }: TeamFormProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [selectedOption, setSelectedOption] = useState(defaultOption);
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

      const userTypeKey = Object.keys(UserProfile).find(
        key => UserProfile[key as keyof typeof UserProfile] === user.profil
      );
      
      if (userTypeKey) {
        setSelectedOption({
          value: userTypeKey,
          label: user.profil,
        });
      }
    } else {
      setFormData(initialFormData);
      setIsPasswordModified(false);
      
      if (activeTab !== 'all') {
        const profileKey = Object.keys(UserProfile).find(
          key => UserProfile[key as keyof typeof UserProfile] === activeTab
        );
        if (profileKey) {
          setSelectedOption({
            value: profileKey,
            label: activeTab,
          });
        } else {
          setSelectedOption(defaultOption);
        }
      } else {
        setSelectedOption(defaultOption);
      }
    }
  }, [user, activeTab]);

  const handleSubmit = () => {
    const dataToValidate = {
      ...formData,
      profil: selectedOption.value
    };

    const errors = validateForm(dataToValidate, validationRules);
    
    if (errors.length > 0) {
      showToast(errors[0].message, 'error');
      return;
    }

    if (!selectedOption.value) {
      showToast('Veuillez sélectionner un rôle', 'error');
      return;
    }

    const selectedValue = getEnumValue(UserProfile, selectedOption.value as keyof typeof UserProfile);
    const submittedUser: User = {
      id: user?.id || '',
      accountId: user?.accountId || '',
      profil: selectedValue as UserProfile,
      ...formData,
      password: user && !isPasswordModified ? '' : formData.password,
    };
    
    
    onSave(submittedUser);
  };

  const handlePasswordChange = (text: string) => {
    setIsPasswordModified(true);
    setFormData(prev => ({ ...prev, password: text }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.formSection}>
        <View style={[styles.inputGroup, { zIndex: 1000 }]}>
          <Text style={styles.label}>Rôle *</Text>
          <Select
            choices={Object.entries(UserProfile)
              .filter(([_, value]) => !['superadmin', 'admin'].includes(value))
              .map(([key, label]) => ({
                value: key,
                label,
              }))}
            selectedValue={selectedOption}
            onValueChange={(value) => {
              if (value) setSelectedOption(value);
            }}
          />
        </View>

        <View style={styles.inputRows}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Prénom *</Text>
              <TextInput
                value={formData.firstName}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, firstName: text }))}
                placeholder="Prénom"
                style={styles.input}
                autoComplete="off"
              />
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Nom *</Text>
              <TextInput
                value={formData.lastName}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, lastName: text }))}
                placeholder="Nom"
                style={styles.input}
                autoComplete="off"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                value={formData.email}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder="Email"
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
            <View style={styles.column}>
              <Text style={styles.label}>Téléphone</Text>
              <TextInput
                value={formData.phone}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, phone: text }))}
                placeholder="Téléphone (optionnel)"
                keyboardType="phone-pad"
                style={styles.input}
                autoComplete="off"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Identifiant *</Text>
              <TextInput
                value={formData.loginId}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, loginId: text }))}
                placeholder="Identifiant"
                autoCapitalize="none"
                style={styles.input}
                autoComplete="off"
                {...(Platform.OS === 'web' ? {
                  autoFill: 'off',
                  'data-form-type': 'other',
                } : {})}
              />
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Mot de passe {!user && '*'}</Text>
              <TextInput
                value={formData.password}
                onChangeText={handlePasswordChange}
                placeholder={user ? "Modifier le mot de passe" : "Mot de passe"}
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

      <View style={styles.buttonSection}>
        <Button
          onPress={handleSubmit}
          variant="default"
          size={null}
          style={styles.submitButton}
        >
          <Text style={styles.submitButtonText}>
            {user ? 'Enregistrer les modifications' : 'Confirmer la création'}
          </Text>
        </Button>
        
        <Button 
          onPress={onCancel}
          variant="ghost"
          size={null}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelButtonText}>
            Annuler
          </Text>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
  },
  formSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 18,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputRows: {
    gap: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 24,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2A2E33',
    marginBottom: 8,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    color: '#2A2E33',
    padding: 16,
    fontSize: 16,
    ...(Platform.OS === 'web' && {
      cursor: 'text'
    })
  },
  buttonSection: {
    paddingHorizontal: 24,
    paddingBottom: 18,
    paddingTop: 24,
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#2A2E33',
    borderRadius: 8,
    height: 48,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer'
    })
  },
  submitButtonText: {
    color: '#FBFBFB',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    height: 48,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer'
    })
  },
  cancelButtonText: {
    color: '#2A2E33',
    fontWeight: '500',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});