import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { User, Lock, KeyRound, Eye, EyeOff } from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '~/store';
import { sessionActions } from '~/store/slices/session.slice';
import { userApiService } from '~/api/user.api';
import { authApiService } from '~/api/auth.api';
import { useToast } from '~/components/ToastProvider';
import type { ToastType } from '~/components/ui/toast';

type TabType = 'info' | 'password' | 'pin';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [isCompactSidebar, setIsCompactSidebar] = useState(false);

  const { user } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const handleLayoutChange = useCallback((event: any) => {
    const { width } = event.nativeEvent.layout;
    setIsCompactSidebar(width < 700);
  }, []);

  return (
    <View style={styles.container} onLayout={handleLayoutChange}>
      <View style={styles.content}>
        {/* Sidebar Navigation */}
        <View style={[styles.sidebar, isCompactSidebar && styles.sidebarCompact]}>
          <TouchableOpacity
            style={[
              styles.sidebarTab,
              isCompactSidebar && styles.sidebarTabCompact,
              activeTab === 'info' && styles.sidebarTabActive
            ]}
            onPress={() => setActiveTab('info')}
            activeOpacity={1}
          >
            <User size={20} color={activeTab === 'info' ? '#10B981' : '#64748B'} strokeWidth={2} />
            {!isCompactSidebar && (
              <Text style={[styles.sidebarTabText, activeTab === 'info' && styles.sidebarTabTextActive]}>
                Informations
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sidebarTab,
              isCompactSidebar && styles.sidebarTabCompact,
              activeTab === 'password' && styles.sidebarTabActive
            ]}
            onPress={() => setActiveTab('password')}
            activeOpacity={1}
          >
            <Lock size={20} color={activeTab === 'password' ? '#F59E0B' : '#64748B'} strokeWidth={2} />
            {!isCompactSidebar && (
              <Text style={[styles.sidebarTabText, activeTab === 'password' && styles.sidebarTabTextActive]}>
                Mot de passe
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sidebarTab,
              isCompactSidebar && styles.sidebarTabCompact,
              activeTab === 'pin' && styles.sidebarTabActive
            ]}
            onPress={() => setActiveTab('pin')}
            activeOpacity={1}
          >
            <KeyRound size={20} color={activeTab === 'pin' ? '#8B5CF6' : '#64748B'} strokeWidth={2} />
            {!isCompactSidebar && (
              <Text style={[styles.sidebarTabText, activeTab === 'pin' && styles.sidebarTabTextActive]}>
                Code PIN
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {activeTab === 'info' && (
            <InfoTab user={user} dispatch={dispatch} showToast={showToast} />
          )}
          {activeTab === 'password' && (
            <SecurityTab user={user} dispatch={dispatch} showToast={showToast} />
          )}
          {activeTab === 'pin' && (
            <PinTab showToast={showToast} />
          )}
        </View>
      </View>
    </View>
  );
}

// ====================================================================
// Info Tab
// ====================================================================

interface InfoTabProps {
  user: any;
  dispatch: any;
  showToast: (message: string, type?: ToastType) => void;
}

const InfoTab: React.FC<InfoTabProps> = ({ user, dispatch, showToast }) => {
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const handlePhoneChange = (value: string) => setPhone(value.replace(/[^+\d\s]/g, ''));
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const markFieldAsTouched = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  const getFieldError = (field: string): string | null => {
    if (!touchedFields[field]) return null;
    switch (field) {
      case 'phone':
        if (phone.trim()) {
          const digits = phone.replace(/\D/g, '');
          if (digits.length < 10) return 'Le téléphone doit contenir au moins 10 chiffres';
          if (digits.length > 20) return 'Le téléphone ne peut pas dépasser 20 chiffres';
        }
        return null;
      default:
        return null;
    }
  };

  const hasValidationErrors = (): boolean => {
    if (!firstName.trim() || !lastName.trim()) return true;
    if (phone.trim()) {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 20) return true;
    }
    return false;
  };

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      setPhone(user.phone ?? '');
      setHasChanges(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const changed =
      firstName !== (user.firstName ?? '') ||
      lastName !== (user.lastName ?? '') ||
      phone !== (user.phone ?? '');
    setHasChanges(changed);
  }, [firstName, lastName, phone, user]);

  const handleSave = async () => {
    if (!user || !hasChanges) return;

    if (!firstName.trim() || !lastName.trim()) {
      showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    if (hasValidationErrors()) {
      setTouchedFields({ email: true, phone: true });
      showToast('Veuillez corriger les erreurs avant de sauvegarder', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = await userApiService.update(user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      });
      dispatch(sessionActions.updateUser(updatedUser));
      setHasChanges(false);
      showToast('Informations mises à jour avec succès', 'success');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Impossible de mettre à jour les informations';
      showToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <View>
          <Text style={styles.tabTitle}>Informations</Text>
          <Text style={styles.tabSubtitle}>Modifier vos informations de profil</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: '#10B981' },
            (!hasChanges || isSaving || hasValidationErrors()) && styles.createButtonDisabled
          ]}
          onPress={handleSave}
          disabled={!hasChanges || isSaving || hasValidationErrors()}
        >
          <Text style={styles.createButtonText}>
            {isSaving ? 'Sauvegarde...' : 'Enregistrer'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.viewsScrollContainer}
        contentContainerStyle={styles.viewsContainer}
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.viewsCardsWrapper}>
          <View style={styles.viewCard}>
            <View style={styles.viewCardHeader}>
              <View style={[styles.viewIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <User size={24} color="#10B981" strokeWidth={2} />
              </View>
              <View style={styles.viewCardContent}>
                <Text style={styles.viewCardTitle}>Identité</Text>
                <Text style={styles.viewCardDescription}>Nom, prénom et coordonnées</Text>
              </View>
            </View>

            <View style={styles.viewModeSection}>
              <View style={styles.formRow}>
                <View style={styles.formGroupInRow}>
                  <Text style={styles.formLabel}>Prénom *</Text>
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Prénom"
                    placeholderTextColor="#A0A0A0"
                    style={styles.formInput}
                    autoComplete="off"
                    editable={!isSaving}
                  />
                </View>
                <View style={styles.formGroupInRow}>
                  <Text style={styles.formLabel}>Nom *</Text>
                  <TextInput
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Nom"
                    placeholderTextColor="#A0A0A0"
                    style={styles.formInput}
                    autoComplete="off"
                    editable={!isSaving}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupInRow}>
                  <Text style={styles.formLabel}>Téléphone</Text>
                  <TextInput
                    value={phone}
                    onChangeText={handlePhoneChange}
                    onBlur={() => markFieldAsTouched('phone')}
                    placeholder="Téléphone (optionnel)"
                    placeholderTextColor="#A0A0A0"
                    keyboardType="phone-pad"
                    style={[styles.formInput, getFieldError('phone') && styles.formInputError]}
                    autoComplete="off"
                    editable={!isSaving}
                  />
                  {getFieldError('phone') && (
                    <Text style={styles.fieldErrorText}>{getFieldError('phone')}</Text>
                  )}
                </View>
              </View>

            </View>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
};

// ====================================================================
// Security Tab (Connexion)
// ====================================================================

interface SecurityTabProps {
  user: any;
  dispatch: any;
  showToast: (message: string, type?: ToastType) => void;
}

const SecurityTab: React.FC<SecurityTabProps> = ({ user, dispatch, showToast }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const markFieldAsTouched = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  const getPasswordError = (password: string): string | null => {
    if (!password) return null;
    if (password.length < 8) return '8 caractères minimum';
    if (!/[a-z]/.test(password)) return '1 minuscule requise';
    if (!/[A-Z]/.test(password)) return '1 majuscule requise';
    if (!/\d/.test(password)) return '1 chiffre requis';
    if (!/[^a-zA-Z0-9]/.test(password)) return '1 caractère spécial requis';
    return null;
  };

  const getFieldError = (field: string): string | null => {
    if (!touchedFields[field]) return null;
    switch (field) {
      case 'confirmPassword':
        if (confirmPassword && newPassword && confirmPassword !== newPassword)
          return 'Les mots de passe ne correspondent pas';
        return null;
      case 'newPassword':
        return getPasswordError(newPassword);
      default:
        return null;
    }
  };

  const hasFormContent =
    currentPassword.length > 0 ||
    newPassword.length > 0 ||
    confirmPassword.length > 0;

  const isPasswordFormValid =
    currentPassword.length > 0 &&
    !getPasswordError(newPassword) &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  const handleSavePassword = async () => {
    setIsSavingPassword(true);
    try {
      await authApiService.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTouchedFields({});
      showToast('Mot de passe modifié avec succès', 'success');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Impossible de modifier le mot de passe';
      showToast(message, 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <View>
          <Text style={styles.tabTitle}>Mot de passe</Text>
          <Text style={styles.tabSubtitle}>Modifier votre mot de passe</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: '#F59E0B' },
            (!isPasswordFormValid || isSavingPassword) && styles.createButtonDisabled
          ]}
          onPress={handleSavePassword}
          disabled={!isPasswordFormValid || isSavingPassword}
        >
          <Text style={styles.createButtonText}>
            {isSavingPassword ? 'Sauvegarde...' : 'Enregistrer'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.viewsScrollContainer}
        contentContainerStyle={styles.viewsContainer}
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.viewsCardsWrapper}>
          {/* Mot de passe */}
          <View style={styles.viewCard}>
            <View style={styles.viewCardHeader}>
              <View style={[styles.viewIconWrapper, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Lock size={24} color="#F59E0B" strokeWidth={2} />
              </View>
              <View style={styles.viewCardContent}>
                <Text style={styles.viewCardTitle}>Mot de passe</Text>
                <Text style={styles.viewCardDescription}>Modifier votre mot de passe</Text>
              </View>
            </View>

            <View style={styles.viewModeSection}>
              <View style={styles.formGroupInRow}>
                <Text style={styles.formLabel}>Mot de passe actuel</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Mot de passe actuel"
                    placeholderTextColor="#A0A0A0"
                    secureTextEntry={!showCurrentPassword}
                    style={[styles.formInput, styles.passwordInput]}
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                    editable={!isSavingPassword}
                  />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                    {showCurrentPassword
                      ? <EyeOff size={18} color="#94A3B8" />
                      : <Eye size={18} color="#94A3B8" />
                    }
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.formRow, { marginTop: 12 }]}>
                <View style={styles.formGroupInRow}>
                  <Text style={styles.formLabel}>Nouveau mot de passe</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      onBlur={() => markFieldAsTouched('newPassword')}
                      placeholder="Nouveau mot de passe"
                      placeholderTextColor="#A0A0A0"
                      secureTextEntry={!showNewPassword}
                      style={[styles.formInput, styles.passwordInput, getFieldError('newPassword') && styles.formInputError]}
                      autoComplete="new-password"
                      editable={!isSavingPassword}
                    />
                    <TouchableOpacity style={styles.eyeButton} onPress={() => setShowNewPassword(!showNewPassword)}>
                      {showNewPassword
                        ? <EyeOff size={18} color="#94A3B8" />
                        : <Eye size={18} color="#94A3B8" />
                      }
                    </TouchableOpacity>
                  </View>
                  {getFieldError('confirmPassword') && (
                    <Text style={styles.fieldErrorText}>{getFieldError('confirmPassword')}</Text>
                  )}
                </View>

                <View style={styles.formGroupInRow}>
                  <Text style={styles.formLabel}>Confirmer le mot de passe</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      onBlur={() => markFieldAsTouched('confirmPassword')}
                      placeholder="Confirmer le mot de passe"
                      placeholderTextColor="#A0A0A0"
                      secureTextEntry={!showConfirmPassword}
                      style={[styles.formInput, styles.passwordInput, getFieldError('confirmPassword') && styles.formInputError]}
                      autoComplete="new-password"
                      editable={!isSavingPassword}
                    />
                    <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword
                        ? <EyeOff size={18} color="#94A3B8" />
                        : <Eye size={18} color="#94A3B8" />
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.passwordRulesRow}>
                <Text style={[styles.passwordRule, newPassword.length >= 8 && styles.passwordRuleValid]}>8 caractères</Text>
                <Text style={styles.passwordRuleSep}>·</Text>
                <Text style={[styles.passwordRule, /[A-Z]/.test(newPassword) && styles.passwordRuleValid]}>1 majuscule</Text>
                <Text style={styles.passwordRuleSep}>·</Text>
                <Text style={[styles.passwordRule, /[a-z]/.test(newPassword) && styles.passwordRuleValid]}>1 minuscule</Text>
                <Text style={styles.passwordRuleSep}>·</Text>
                <Text style={[styles.passwordRule, /\d/.test(newPassword) && styles.passwordRuleValid]}>1 chiffre</Text>
                <Text style={styles.passwordRuleSep}>·</Text>
                <Text style={[styles.passwordRule, /[^a-zA-Z0-9]/.test(newPassword) && styles.passwordRuleValid]}>1 spécial</Text>
              </View>
            </View>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
};

// ====================================================================
// PIN Tab
// ====================================================================

interface PinTabProps {
  showToast: (message: string, type?: ToastType) => void;
}

const PinTab: React.FC<PinTabProps> = ({ showToast }) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const sanitizePin = useCallback((value: string) => value.replace(/\D/g, '').slice(0, 4), []);
  const handleCurrentPinChange = useCallback((v: string) => setCurrentPin(sanitizePin(v)), [sanitizePin]);
  const handleNewPinChange = useCallback((v: string) => setNewPin(sanitizePin(v)), [sanitizePin]);
  const handleConfirmPinChange = useCallback((v: string) => setConfirmPin(sanitizePin(v)), [sanitizePin]);

  const isSameAsOld = currentPin.length === 4 && newPin.length === 4 && newPin === currentPin;
  const isConfirmMismatch = confirmPin.length === 4 && newPin.length === 4 && confirmPin !== newPin;

  const isPinFormValid =
    currentPin.length === 4 &&
    newPin.length === 4 &&
    confirmPin.length === 4 &&
    newPin === confirmPin &&
    newPin !== currentPin;

  const handleSavePin = async () => {
    setIsSaving(true);
    try {
      await authApiService.changePin(currentPin, newPin);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      showToast('Code PIN modifié avec succès', 'success');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Impossible de modifier le code PIN';
      showToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <View>
          <Text style={styles.tabTitle}>Code PIN</Text>
          <Text style={styles.tabSubtitle}>Modifier votre code PIN</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: '#8B5CF6' },
            (!isPinFormValid || isSaving) && styles.createButtonDisabled
          ]}
          onPress={handleSavePin}
          disabled={!isPinFormValid || isSaving}
        >
          <Text style={styles.createButtonText}>
            {isSaving ? 'Sauvegarde...' : 'Enregistrer'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.viewsScrollContainer}
        contentContainerStyle={styles.viewsContainer}
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.viewsCardsWrapper}>
          <View style={styles.viewCard}>
            <View style={styles.viewCardHeader}>
              <View style={[styles.viewIconWrapper, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <KeyRound size={24} color="#8B5CF6" strokeWidth={2} />
              </View>
              <View style={styles.viewCardContent}>
                <Text style={styles.viewCardTitle}>Code PIN</Text>
                <Text style={styles.viewCardDescription}>Code à 4 chiffres utilisé pour la connexion rapide</Text>
              </View>
            </View>

            <View style={styles.viewModeSection}>
              <View style={styles.formGroupInRow}>
                <Text style={styles.formLabel}>PIN actuel</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    value={currentPin}
                    onChangeText={handleCurrentPinChange}
                    placeholder="4 chiffres"
                    placeholderTextColor="#A0A0A0"
                    secureTextEntry={!showCurrentPin}
                    keyboardType="number-pad"
                    maxLength={4}
                    style={[styles.formInput, styles.passwordInput]}
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                    editable={!isSaving}
                  />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowCurrentPin(!showCurrentPin)}>
                    {showCurrentPin
                      ? <EyeOff size={18} color="#94A3B8" />
                      : <Eye size={18} color="#94A3B8" />
                    }
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.formRow, { marginTop: 12 }]}>
                <View style={styles.formGroupInRow}>
                  <Text style={styles.formLabel}>Nouveau PIN</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      value={newPin}
                      onChangeText={handleNewPinChange}
                      placeholder="4 chiffres"
                      placeholderTextColor="#A0A0A0"
                      secureTextEntry={!showNewPin}
                      keyboardType="number-pad"
                      maxLength={4}
                      style={[styles.formInput, styles.passwordInput, isSameAsOld && styles.formInputError]}
                      autoComplete="new-password"
                      editable={!isSaving}
                    />
                    <TouchableOpacity style={styles.eyeButton} onPress={() => setShowNewPin(!showNewPin)}>
                      {showNewPin
                        ? <EyeOff size={18} color="#94A3B8" />
                        : <Eye size={18} color="#94A3B8" />
                      }
                    </TouchableOpacity>
                  </View>
                  {isSameAsOld && (
                    <Text style={styles.fieldErrorText}>Le nouveau PIN doit être différent de l'ancien</Text>
                  )}
                </View>

                <View style={styles.formGroupInRow}>
                  <Text style={styles.formLabel}>Confirmer le PIN</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      value={confirmPin}
                      onChangeText={handleConfirmPinChange}
                      placeholder="4 chiffres"
                      placeholderTextColor="#A0A0A0"
                      secureTextEntry={!showConfirmPin}
                      keyboardType="number-pad"
                      maxLength={4}
                      style={[
                        styles.formInput,
                        styles.passwordInput,
                        isConfirmMismatch && styles.formInputError
                      ]}
                      autoComplete="new-password"
                      editable={!isSaving}
                    />
                    <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPin(!showConfirmPin)}>
                      {showConfirmPin
                        ? <EyeOff size={18} color="#94A3B8" />
                        : <Eye size={18} color="#94A3B8" />
                      }
                    </TouchableOpacity>
                  </View>
                  {isConfirmMismatch && (
                    <Text style={styles.fieldErrorText}>Les codes PIN ne correspondent pas</Text>
                  )}
                </View>
              </View>

              <View style={styles.passwordRulesRow}>
                <Text style={[styles.passwordRule, newPin.length === 4 && styles.passwordRuleValid]}>4 chiffres</Text>
                <Text style={styles.passwordRuleSep}>·</Text>
                <Text style={[styles.passwordRule, newPin.length === 4 && confirmPin === newPin && styles.passwordRuleValid]}>Confirmation identique</Text>
              </View>
            </View>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },

  // Sidebar
  sidebar: {
    width: 240,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    padding: 16,
    gap: 8,
  },
  sidebarCompact: {
    width: 72,
    padding: 8,
  },
  sidebarTab: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  sidebarTabCompact: {
    justifyContent: 'center',
    padding: 14,
    gap: 0,
  },
  sidebarTabActive: {
    backgroundColor: '#F1F5F9',
  },
  sidebarTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  sidebarTabTextActive: {
    color: '#1E293B',
    fontWeight: '600',
  },

  // Main content
  mainContent: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 24,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  tabSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  createButtonDisabled: {
    opacity: 0.4,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ScrollView
  viewsScrollContainer: {
    flex: 1,
  },
  viewsContainer: {
    paddingBottom: 24,
  },
  viewsCardsWrapper: {
    gap: 16,
  },

  // Cards
  viewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  viewIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewCardContent: {
    flex: 1,
  },
  viewCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  viewCardDescription: {
    fontSize: 14,
    color: '#64748B',
  },

  // Submenu section
  viewModeSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 4,
  },

  // Form
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formGroupInRow: {
    flex: 1,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 44,
  },
  passwordRulesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  passwordRule: {
    fontSize: 12,
    color: '#94A3B8',
  },
  passwordRuleValid: {
    color: '#1E293B',
    fontWeight: '600',
  },
  passwordRuleSep: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  passwordWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },


  // Field validation
  formInputError: {
    borderColor: '#EF4444',
  },
  fieldErrorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
    marginTop: 4,
  },

});
