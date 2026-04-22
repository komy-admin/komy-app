import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Pressable, Platform, Keyboard } from 'react-native';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';
import { User, Lock, KeyRound, Eye, EyeOff, Landmark } from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '~/store';
import { sessionActions } from '~/store/slices/session.slice';
import { userApiService } from '~/api/user.api';
import { authApiService } from '~/api/auth.api';
import { useToast } from '~/components/ToastProvider';
import type { ToastType } from '~/components/ui/toast';
import { showApiError } from '~/lib/apiErrorHandler';
import { accountConfigApiService } from '~/api/account-config.api';
import { useFormErrors } from '~/hooks/useFormErrors';
import { FormFieldError } from '~/components/ui/FormFieldError';
import { getColorWithOpacity } from '~/lib/color-utils';
import { colors } from '~/theme';

type TabType = 'restaurant' | 'info' | 'password' | 'pin';

export default function ProfilePage({ isCompactSidebar }: { isCompactSidebar?: boolean | null }) {
  const [activeTab, setActiveTab] = useState<TabType>('restaurant');

  const { user } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch();
  const { showToast } = useToast();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Sidebar Navigation */}
        <View style={[styles.sidebar, isCompactSidebar !== false && styles.sidebarCompact]}>
          <TouchableOpacity
            style={[
              styles.sidebarTab,
              isCompactSidebar !== false && styles.sidebarTabCompact,
              activeTab === 'restaurant' && styles.sidebarTabActive
            ]}
            onPress={() => setActiveTab('restaurant')}
            activeOpacity={1}
          >
            <Landmark size={20} color={activeTab === 'restaurant' ? colors.brand.dark : colors.neutral[500]} strokeWidth={2} />
            {isCompactSidebar === false && (
              <Text style={[styles.sidebarTabText, activeTab === 'restaurant' && styles.sidebarTabTextActive]}>
                Restaurant
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sidebarTab,
              isCompactSidebar !== false && styles.sidebarTabCompact,
              activeTab === 'password' && styles.sidebarTabActive
            ]}
            onPress={() => setActiveTab('password')}
            activeOpacity={1}
          >
            <Lock size={20} color={activeTab === 'password' ? colors.brand.dark : colors.neutral[500]} strokeWidth={2} />
            {isCompactSidebar === false && (
              <Text style={[styles.sidebarTabText, activeTab === 'password' && styles.sidebarTabTextActive]}>
                Mot de passe
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sidebarTab,
              isCompactSidebar !== false && styles.sidebarTabCompact,
              activeTab === 'pin' && styles.sidebarTabActive
            ]}
            onPress={() => setActiveTab('pin')}
            activeOpacity={1}
          >
            <KeyRound size={20} color={activeTab === 'pin' ? colors.brand.dark : colors.neutral[500]} strokeWidth={2} />
            {isCompactSidebar === false && (
              <Text style={[styles.sidebarTabText, activeTab === 'pin' && styles.sidebarTabTextActive]}>
                Code PIN
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sidebarTab,
              isCompactSidebar !== false && styles.sidebarTabCompact,
              activeTab === 'info' && styles.sidebarTabActive
            ]}
            onPress={() => setActiveTab('info')}
            activeOpacity={1}
          >
            <User size={20} color={activeTab === 'info' ? colors.brand.dark : colors.neutral[500]} strokeWidth={2} />
            {isCompactSidebar === false && (
              <Text style={[styles.sidebarTabText, activeTab === 'info' && styles.sidebarTabTextActive]}>
                Informations
              </Text>
            )}
          </TouchableOpacity>

        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {activeTab === 'restaurant' && (
            <RestaurantTab dispatch={dispatch} showToast={showToast} />
          )}
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
// Restaurant Tab
// ====================================================================

interface RestaurantTabProps {
  dispatch: any;
  showToast: (message: string, type?: ToastType) => void;
}

const RestaurantTab: React.FC<RestaurantTabProps> = ({ dispatch, showToast }) => {
  const accountConfig = useSelector((state: RootState) => state.session.accountConfig);
  const [name, setName] = useState(accountConfig?.accountName ?? '');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const formErrors = useFormErrors();

  const trimmedName = name.trim();
  const originalName = accountConfig?.accountName ?? '';

  useEffect(() => {
    setHasChanges(trimmedName !== originalName);
  }, [trimmedName, originalName]);

  const canSave = hasChanges && trimmedName.length > 0 && !isSaving;

  const handleSave = async () => {
    formErrors.clearAll();
    setIsSaving(true);
    try {
      await accountConfigApiService.updateAccountName(trimmedName);
      dispatch(sessionActions.setAccountConfig({
        ...accountConfig!,
        accountName: trimmedName,
      }));
      showToast('Nom du restaurant mis à jour', 'success');
    } catch (error) {
      formErrors.handleError({ error, showToast, fallback: 'Impossible de mettre à jour le nom' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <View>
          <Text style={styles.tabTitle}>Restaurant</Text>
          <Text style={styles.tabSubtitle}>Informations de votre établissement</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: colors.brand.dark },
            !canSave && styles.createButtonDisabled
          ]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={styles.createButtonText}>
            {isSaving ? 'Sauvegarde...' : 'Enregistrer'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollViewWrapper
        style={styles.viewsScrollContainer}
        contentContainerStyle={styles.viewsContainer}
        showsVerticalScrollIndicator={false}
        bottomOffset={40}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.viewsCardsWrapper} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
          <View style={styles.viewCard}>
            <View style={styles.viewCardHeader}>
              <View style={[styles.viewIconWrapper, { backgroundColor: getColorWithOpacity(colors.brand.dark, 0.08) }]}>
                <Landmark size={24} color={colors.brand.dark} strokeWidth={2} />
              </View>
              <View style={styles.viewCardContent}>
                <Text style={styles.viewCardTitle}>Établissement</Text>
                <Text style={styles.viewCardDescription}>Nom affiché de votre restaurant</Text>
              </View>
            </View>

            <View style={styles.viewModeSection}>
              <View style={styles.formGroupInRow}>
                <Text style={styles.formLabel}>Nom du restaurant</Text>
                <TextInput
                  value={name}
                  onChangeText={(text) => { setName(text); formErrors.clearError('name'); }}
                  placeholder="Ex: Le Petit Bistrot"
                  placeholderTextColor={colors.gray[400]}
                  style={[styles.formInput, formErrors.hasError('name') && styles.formInputError]}
                  autoComplete="off"
                  editable={!isSaving}
                />
                <FormFieldError message={formErrors.getError('name')} />
              </View>
            </View>
          </View>
        </Pressable>
      </KeyboardAwareScrollViewWrapper>
    </View>
  );
};

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
    } catch (error) {
      showApiError(error, showToast, 'Impossible de mettre à jour les informations');
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
            { backgroundColor: colors.brand.dark },
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

      <KeyboardAwareScrollViewWrapper
        style={styles.viewsScrollContainer}
        contentContainerStyle={styles.viewsContainer}
        showsVerticalScrollIndicator={false}
        bottomOffset={40}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.viewsCardsWrapper} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
          <View style={styles.viewCard}>
            <View style={styles.viewCardHeader}>
              <View style={[styles.viewIconWrapper, { backgroundColor: getColorWithOpacity(colors.brand.dark, 0.08) }]}>
                <User size={24} color={colors.brand.dark} strokeWidth={2} />
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
                    placeholderTextColor={colors.gray[400]}
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
                    placeholderTextColor={colors.gray[400]}
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
                    placeholderTextColor={colors.gray[400]}
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
      </KeyboardAwareScrollViewWrapper>
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
    } catch (error) {
      showApiError(error, showToast, 'Impossible de modifier le mot de passe');
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
            { backgroundColor: colors.brand.dark },
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

      <KeyboardAwareScrollViewWrapper
        style={styles.viewsScrollContainer}
        contentContainerStyle={styles.viewsContainer}
        showsVerticalScrollIndicator={false}
        bottomOffset={40}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.viewsCardsWrapper} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
          {/* Mot de passe */}
          <View style={styles.viewCard}>
            <View style={styles.viewCardHeader}>
              <View style={[styles.viewIconWrapper, { backgroundColor: getColorWithOpacity(colors.brand.dark, 0.08) }]}>
                <Lock size={24} color={colors.brand.dark} strokeWidth={2} />
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
                    placeholderTextColor={colors.gray[400]}
                    secureTextEntry={!showCurrentPassword}
                    style={[styles.formInput, styles.passwordInput]}
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                    editable={!isSavingPassword}
                  />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                    {showCurrentPassword
                      ? <EyeOff size={18} color={colors.neutral[400]} />
                      : <Eye size={18} color={colors.neutral[400]} />
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
                      placeholderTextColor={colors.gray[400]}
                      secureTextEntry={!showNewPassword}
                      style={[styles.formInput, styles.passwordInput, getFieldError('newPassword') && styles.formInputError]}
                      autoComplete="new-password"
                      editable={!isSavingPassword}
                    />
                    <TouchableOpacity style={styles.eyeButton} onPress={() => setShowNewPassword(!showNewPassword)}>
                      {showNewPassword
                        ? <EyeOff size={18} color={colors.neutral[400]} />
                        : <Eye size={18} color={colors.neutral[400]} />
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
                      placeholderTextColor={colors.gray[400]}
                      secureTextEntry={!showConfirmPassword}
                      style={[styles.formInput, styles.passwordInput, getFieldError('confirmPassword') && styles.formInputError]}
                      autoComplete="new-password"
                      editable={!isSavingPassword}
                    />
                    <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword
                        ? <EyeOff size={18} color={colors.neutral[400]} />
                        : <Eye size={18} color={colors.neutral[400]} />
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
      </KeyboardAwareScrollViewWrapper>
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
    } catch (error) {
      showApiError(error, showToast, 'Impossible de modifier le code PIN');
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
            { backgroundColor: colors.brand.dark },
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

      <KeyboardAwareScrollViewWrapper
        style={styles.viewsScrollContainer}
        contentContainerStyle={styles.viewsContainer}
        showsVerticalScrollIndicator={false}
        bottomOffset={40}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.viewsCardsWrapper} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
          <View style={styles.viewCard}>
            <View style={styles.viewCardHeader}>
              <View style={[styles.viewIconWrapper, { backgroundColor: getColorWithOpacity(colors.brand.dark, 0.08) }]}>
                <KeyRound size={24} color={colors.brand.dark} strokeWidth={2} />
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
                    placeholderTextColor={colors.gray[400]}
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
                      ? <EyeOff size={18} color={colors.neutral[400]} />
                      : <Eye size={18} color={colors.neutral[400]} />
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
                      placeholderTextColor={colors.gray[400]}
                      secureTextEntry={!showNewPin}
                      keyboardType="number-pad"
                      maxLength={4}
                      style={[styles.formInput, styles.passwordInput, isSameAsOld && styles.formInputError]}
                      autoComplete="new-password"
                      editable={!isSaving}
                    />
                    <TouchableOpacity style={styles.eyeButton} onPress={() => setShowNewPin(!showNewPin)}>
                      {showNewPin
                        ? <EyeOff size={18} color={colors.neutral[400]} />
                        : <Eye size={18} color={colors.neutral[400]} />
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
                      placeholderTextColor={colors.gray[400]}
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
                        ? <EyeOff size={18} color={colors.neutral[400]} />
                        : <Eye size={18} color={colors.neutral[400]} />
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
      </KeyboardAwareScrollViewWrapper>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },

  // Sidebar
  sidebar: {
    width: 240,
    backgroundColor: colors.white,
    borderLeftWidth: 1,
    borderLeftColor: colors.neutral[200],
    borderRightWidth: 1,
    borderRightColor: colors.neutral[200],
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
    backgroundColor: colors.neutral[100],
  },
  sidebarTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[500],
  },
  sidebarTabTextActive: {
    color: colors.neutral[800],
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
    color: colors.neutral[800],
    marginBottom: 4,
  },
  tabSubtitle: {
    fontSize: 14,
    color: colors.neutral[500],
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    minHeight: 44,
  },
  createButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  createButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
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
    color: colors.neutral[800],
    marginBottom: 4,
  },
  viewCardDescription: {
    fontSize: 14,
    color: colors.neutral[500],
  },

  // Submenu section
  viewModeSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
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
    color: colors.neutral[800],
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 8,
    backgroundColor: colors.white,
    color: colors.neutral[800],
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
    color: colors.neutral[400],
  },
  passwordRuleValid: {
    color: colors.neutral[800],
    fontWeight: '600',
  },
  passwordRuleSep: {
    fontSize: 12,
    color: colors.neutral[300],
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
    borderColor: colors.error.base,
  },
  fieldErrorText: {
    fontSize: 12,
    color: colors.error.base,
    fontWeight: '500',
    marginTop: 4,
  },

});
