import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Text as RNText,
  TextInput as RNTextInput,
  Pressable,
} from 'react-native';
import { AuthBackground } from '~/components/auth/AuthBackground';
import { authApiService } from '~/api/auth.api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useToast } from '~/components/ToastProvider';
import { extractApiError } from '~/lib/apiErrorHandler';
import { ChevronLeft, Eye, EyeOff, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { AuthScreenLayout } from '~/components/auth/AuthScreenLayout';
import { colors } from '~/theme';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const router = useRouter();
  const { showToast } = useToast();
  const { token } = useLocalSearchParams<{ token: string }>();

  useEffect(() => {
    if (!token) {
      showToast('Lien invalide. Veuillez demander un nouveau lien.', 'error');
      router.replace('/login');
    }
  }, [token, router, showToast]);

  const getPasswordError = (): string | null => {
    if (!password) return 'Le mot de passe est requis';
    if (password.length < 8) return '8 caractères minimum';
    if (!/[A-Z]/.test(password)) return '1 majuscule requise';
    if (!/[a-z]/.test(password)) return '1 minuscule requise';
    if (!/\d/.test(password)) return '1 chiffre requis';
    if (!/[^a-zA-Z0-9]/.test(password)) return '1 caractère spécial requis';
    return null;
  };

  const validatePassword = () => {
    const error = getPasswordError();
    if (error) {
      showToast(error, 'error');
      return false;
    }

    if (password !== confirmPassword) {
      showToast('Les mots de passe ne correspondent pas', 'error');
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return false;
    }

    return true;
  };

  const handleResetPassword = async () => {
    if (!validatePassword() || !token || isLoading) return;

    setIsLoading(true);

    try {
      await authApiService.resetPassword({
        token: token as string,
        password
      });

      setIsSuccess(true);
      showToast('Mot de passe réinitialisé avec succès!', 'success');

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setTimeout(() => {
        router.replace('/login');
      }, 2000);

    } catch (error) {
      const info = extractApiError(error);
      showToast(info.message || 'Erreur lors de la réinitialisation', 'error');

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      if (info.status === 400 || info.status === 404) {
        setTimeout(() => {
          router.replace('/forgot-credentials?type=password');
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.replace('/login');
  };

  const isPasswordValid = password.length >= 8
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /\d/.test(password)
    && /[^a-zA-Z0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  if (isSuccess) {
    return (
      <View style={styles.root}>
        <AuthBackground />
        <View style={styles.successOverlay}>
          <View style={styles.successIconCircle}>
            <Check size={40} color={colors.success.base} strokeWidth={2.5} />
          </View>
          <RNText style={styles.successTitle}>Mot de passe réinitialisé!</RNText>
          <RNText style={styles.successText}>
            Vous allez être redirigé vers la page de connexion...
          </RNText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AuthBackground />

      <AuthScreenLayout style={{ backgroundColor: 'transparent' }} centered>
          <View style={styles.contentContainer}>
            <Pressable
              onPress={handleBack}
              style={styles.backButton}
            >
              <ChevronLeft size={24} color={colors.gray[500]} />
              <RNText style={styles.backButtonText}>Retour</RNText>
            </Pressable>

            <View style={styles.headerContainer}>
              <RNText style={styles.title}>
                Nouveau mot de passe
              </RNText>
              <RNText style={styles.subtitle}>
                Créez un nouveau mot de passe sécurisé pour votre compte
              </RNText>
            </View>

            <View style={styles.inputContainer}>
              <RNText style={styles.label}>Mot de passe</RNText>
              <View style={styles.inputWrapper}>
                <RNTextInput
                  value={password}
                  onChangeText={setPassword}
                  onBlur={() => setPasswordTouched(true)}
                  placeholder="Entrez votre nouveau mot de passe"
                  secureTextEntry={!showPassword}
                  style={[styles.input, passwordTouched && !isPasswordValid && password.length > 0 ? styles.inputError : null]}
                  placeholderTextColor={colors.gray[400]}
                  editable={!isLoading}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.gray[400]} />
                  ) : (
                    <Eye size={20} color={colors.gray[400]} />
                  )}
                </Pressable>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <RNText style={styles.label}>Confirmer le mot de passe</RNText>
              <View style={styles.inputWrapper}>
                <RNTextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirmez votre nouveau mot de passe"
                  secureTextEntry={!showConfirmPassword}
                  style={[styles.input, confirmPassword.length > 0 && password !== confirmPassword ? styles.inputError : null]}
                  placeholderTextColor={colors.gray[400]}
                  editable={!isLoading}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={colors.gray[400]} />
                  ) : (
                    <Eye size={20} color={colors.gray[400]} />
                  )}
                </Pressable>
              </View>
            </View>

            <View style={styles.passwordRulesRow}>
              <RNText style={[styles.passwordRule, password.length >= 8 ? styles.passwordRuleValid : passwordTouched && password.length > 0 && styles.passwordRuleError]}>8 caractères</RNText>
              <RNText style={styles.passwordRuleSep}>·</RNText>
              <RNText style={[styles.passwordRule, /[A-Z]/.test(password) ? styles.passwordRuleValid : passwordTouched && password.length > 0 && styles.passwordRuleError]}>1 majuscule</RNText>
              <RNText style={styles.passwordRuleSep}>·</RNText>
              <RNText style={[styles.passwordRule, /[a-z]/.test(password) ? styles.passwordRuleValid : passwordTouched && password.length > 0 && styles.passwordRuleError]}>1 minuscule</RNText>
              <RNText style={styles.passwordRuleSep}>·</RNText>
              <RNText style={[styles.passwordRule, /\d/.test(password) ? styles.passwordRuleValid : passwordTouched && password.length > 0 && styles.passwordRuleError]}>1 chiffre</RNText>
              <RNText style={styles.passwordRuleSep}>·</RNText>
              <RNText style={[styles.passwordRule, /[^a-zA-Z0-9]/.test(password) ? styles.passwordRuleValid : passwordTouched && password.length > 0 && styles.passwordRuleError]}>1 spécial</RNText>
            </View>

            <Pressable
              onPress={handleResetPassword}
              disabled={isLoading || !isPasswordValid || !passwordsMatch}
              style={[styles.primaryButton, (isLoading || !isPasswordValid || !passwordsMatch) && styles.primaryButtonDisabled]}
            >
              <RNText style={styles.primaryButtonText}>
                {isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
              </RNText>
            </Pressable>

            <View style={styles.infoContainer}>
              <RNText style={styles.infoText}>
                Après la réinitialisation, vous devrez vous connecter avec votre nouveau mot de passe.
              </RNText>
            </View>
          </View>
      </AuthScreenLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.neutral[200],
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 32,
    paddingVertical: 8,
    paddingRight: 16,
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
      },
    }),
  },
  backButtonText: {
    fontSize: 16,
    color: colors.gray[500],
    marginLeft: 4,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.brand.dark,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[600],
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingRight: 48,
    fontSize: 15,
    backgroundColor: colors.surface.muted,
    color: colors.brand.dark,
    ...(Platform.OS === 'web' ? {
      outlineStyle: 'none',
    } as any : {
      textAlignVertical: 'center' as const,
    }),
  },
  inputError: {
    borderColor: colors.error.base,
  },
  eyeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: 48,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordRulesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 24,
    gap: 4,
  },
  passwordRule: {
    fontSize: 12,
    color: colors.gray[400],
  },
  passwordRuleValid: {
    color: colors.brand.dark,
    fontWeight: '600',
  },
  passwordRuleError: {
    color: colors.error.base,
    fontWeight: '500',
  },
  passwordRuleSep: {
    fontSize: 12,
    color: colors.gray[300],
  },
  primaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: colors.brand.dark,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  primaryButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  infoContainer: {
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 32,
    width: '100%',
  },
  infoText: {
    color: colors.gray[500],
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    padding: 24,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.brand.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: colors.gray[500],
    textAlign: 'center',
  },
});
