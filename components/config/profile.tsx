import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { User, Lock, Save, Eye, EyeOff } from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '~/store';
import { sessionActions } from '~/store/slices/session.slice';
import { userApiService } from '~/api/user.api';
import { authApiService } from '~/api/auth.api';
import { useToast } from '~/components/ToastProvider';

export default function ProfilePage() {
  const { user } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch();
  const { showToast } = useToast();

  // Informations personnelles
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [loginId, setLoginId] = useState(user?.loginId ?? '');
  const [hasInfoChanges, setHasInfoChanges] = useState(false);
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  // Mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Sync avec le store
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      setEmail(user.email ?? '');
      setPhone(user.phone ?? '');
      setLoginId(user.loginId ?? '');
      setHasInfoChanges(false);
    }
  }, [user]);

  // Détection des changements
  useEffect(() => {
    if (!user) return;
    const changed =
      firstName !== (user.firstName ?? '') ||
      lastName !== (user.lastName ?? '') ||
      email !== (user.email ?? '') ||
      phone !== (user.phone ?? '') ||
      loginId !== (user.loginId ?? '');
    setHasInfoChanges(changed);
  }, [firstName, lastName, email, phone, loginId, user]);

  const handleSaveInfo = async () => {
    if (!user || !hasInfoChanges) return;

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    setIsSavingInfo(true);
    try {
      const updatedUser = await userApiService.update(user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        loginId: loginId.trim() || undefined,
      });
      dispatch(sessionActions.updateUser(updatedUser));
      setHasInfoChanges(false);
      showToast('Informations mises à jour avec succès', 'success');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Impossible de mettre à jour les informations';
      showToast(message, 'error');
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleSavePassword = async () => {
    if (!user) return;
    setPasswordError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Veuillez remplir tous les champs');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsSavingPassword(true);
    try {
      await authApiService.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Mot de passe modifié avec succès', 'success');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Impossible de modifier le mot de passe';
      setPasswordError(message);
      showToast(message, 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const hasPasswordInput = currentPassword && newPassword && confirmPassword;

  return (
    <View style={styles.container}>
      <View style={styles.blurOverlay}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.row}>
            <View style={styles.activeCard}>
              {/* Informations personnelles */}
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <User size={20} color="#10B981" strokeWidth={1.5} />
                </View>
                <View style={styles.headerContent}>
                  <Text style={styles.cardTitle}>Informations personnelles</Text>
                  <Text style={styles.cardSubtitle}>Modifier vos informations</Text>
                </View>
              </View>

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
                    editable={!isSavingInfo}
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
                    editable={!isSavingInfo}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupInRow}>
                  <Text style={styles.formLabel}>Email *</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    placeholderTextColor="#A0A0A0"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.formInput}
                    autoComplete="off"
                    editable={!isSavingInfo}
                  />
                </View>

                <View style={styles.formGroupInRow}>
                  <Text style={styles.formLabel}>Téléphone</Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Téléphone (optionnel)"
                    placeholderTextColor="#A0A0A0"
                    keyboardType="phone-pad"
                    style={styles.formInput}
                    autoComplete="off"
                    editable={!isSavingInfo}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupInRow}>
                  <Text style={styles.formLabel}>Identifiant</Text>
                  <TextInput
                    value={loginId}
                    onChangeText={setLoginId}
                    placeholder="Identifiant"
                    placeholderTextColor="#A0A0A0"
                    autoCapitalize="none"
                    style={styles.formInput}
                    autoComplete="off"
                    editable={!isSavingInfo}
                  />
                </View>
                <View style={styles.formGroupInRow} />
              </View>

              {hasInfoChanges && (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveInfo}
                  disabled={isSavingInfo}
                >
                  <Save size={16} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.saveButtonText}>
                    {isSavingInfo ? 'Sauvegarde...' : 'Enregistrer'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Séparateur */}
              <View style={styles.separator} />

              {/* Mot de passe */}
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                  <Lock size={20} color="#F59E0B" strokeWidth={1.5} />
                </View>
                <View style={styles.headerContent}>
                  <Text style={styles.cardTitle}>Mot de passe</Text>
                  <Text style={styles.cardSubtitle}>Modifier votre mot de passe</Text>
                </View>
              </View>

              <View style={styles.formRow}>
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
                      autoComplete="off"
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
                <View style={styles.formGroupInRow} />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupInRow}>
                  <Text style={styles.formLabel}>Nouveau mot de passe</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      value={newPassword}
                      onChangeText={(v) => { setNewPassword(v); setPasswordError(null); }}
                      placeholder="Nouveau mot de passe"
                      placeholderTextColor="#A0A0A0"
                      secureTextEntry={!showNewPassword}
                      style={[styles.formInput, styles.passwordInput]}
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
                </View>

                <View style={styles.formGroupInRow}>
                  <Text style={styles.formLabel}>Confirmer le mot de passe</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      value={confirmPassword}
                      onChangeText={(v) => { setConfirmPassword(v); setPasswordError(null); }}
                      placeholder="Confirmer le mot de passe"
                      placeholderTextColor="#A0A0A0"
                      secureTextEntry={!showConfirmPassword}
                      style={[styles.formInput, styles.passwordInput]}
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

              {passwordError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{passwordError}</Text>
                </View>
              )}

              {hasPasswordInput && (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSavePassword}
                  disabled={isSavingPassword}
                >
                  <Save size={16} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.saveButtonText}>
                    {isSavingPassword ? 'Sauvegarde...' : 'Modifier le mot de passe'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  blurOverlay: {
    flex: 1,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      },
    }),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gap: 20,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  activeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formGroupInRow: {
    flex: 1,
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
  separator: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 20,
  },
});
