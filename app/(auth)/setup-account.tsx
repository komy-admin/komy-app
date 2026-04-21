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
import { PinInput } from '~/components/ui';
import { useDispatch } from 'react-redux';
import { sessionActions } from '~/store';
import { authApiService } from '~/api/auth.api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useToast } from '~/components/ToastProvider';
import { Eye, EyeOff } from 'lucide-react-native';
import { getHomeRoute } from '~/constants/routes';
import { AuthScreenLayout } from '~/components/auth/AuthScreenLayout';
import { extractApiError } from '~/lib/apiErrorHandler';
import { colors } from '~/theme';

export default function SetupAccountScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false,
    pin: false,
  });
  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
    pin: '',
    token: '',
  });

  const dispatch = useDispatch();
  const router = useRouter();
  const { showToast } = useToast();
  const { token } = useLocalSearchParams<{ token: string }>();

  useEffect(() => {
    if (!token) {
      showToast('Lien invalide. Veuillez utiliser le lien reçu par email.', 'error');
      router.replace('/login');
    }
  }, [token]);

  const validateField = (field: 'password' | 'confirmPassword' | 'pin', value?: string) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'password':
        const pwd = value !== undefined ? value : password;
        if (touched.password && pwd.length > 0) {
          if (pwd.length < 8) newErrors.password = '8 caractères minimum';
          else if (!/[A-Z]/.test(pwd)) newErrors.password = '1 majuscule requise';
          else if (!/[a-z]/.test(pwd)) newErrors.password = '1 minuscule requise';
          else if (!/\d/.test(pwd)) newErrors.password = '1 chiffre requis';
          else if (!/[^a-zA-Z0-9]/.test(pwd)) newErrors.password = '1 caractère spécial requis';
          else newErrors.password = '';
        } else {
          newErrors.password = '';
        }
        if (touched.confirmPassword && confirmPassword && pwd !== confirmPassword) {
          newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
        }
        break;

      case 'confirmPassword':
        const confirm = value !== undefined ? value : confirmPassword;
        if (touched.confirmPassword && confirm && password !== confirm) {
          newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
        } else {
          newErrors.confirmPassword = '';
        }
        break;

      case 'pin':
        const pinValue = value !== undefined ? value : pin;
        if (touched.pin && pinValue && !/^\d{4}$/.test(pinValue)) {
          newErrors.pin = 'Le code PIN doit contenir exactement 4 chiffres';
        } else {
          newErrors.pin = '';
        }
        break;
    }

    setErrors(newErrors);
    return newErrors;
  };

  useEffect(() => {
    if (touched.password) validateField('password');
  }, [password]);

  useEffect(() => {
    if (touched.confirmPassword) validateField('confirmPassword');
  }, [confirmPassword]);

  useEffect(() => {
    if (touched.pin) validateField('pin');
  }, [pin]);

  const handleSetupAccount = async () => {
    setTouched({
      password: true,
      confirmPassword: true,
      pin: true,
    });

    const finalErrors = {
      password: '',
      confirmPassword: '',
      pin: '',
      token: '',
    };

    if (!password) {
      finalErrors.password = 'Le mot de passe est requis';
    } else if (password.length < 8) {
      finalErrors.password = '8 caractères minimum';
    } else if (!/[A-Z]/.test(password)) {
      finalErrors.password = '1 majuscule requise';
    } else if (!/[a-z]/.test(password)) {
      finalErrors.password = '1 minuscule requise';
    } else if (!/\d/.test(password)) {
      finalErrors.password = '1 chiffre requis';
    } else if (!/[^a-zA-Z0-9]/.test(password)) {
      finalErrors.password = '1 caractère spécial requis';
    }

    if (!confirmPassword) {
      finalErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
    } else if (password !== confirmPassword) {
      finalErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (!pin) {
      finalErrors.pin = 'Le code PIN est requis';
    } else if (!/^\d{4}$/.test(pin)) {
      finalErrors.pin = 'Le code PIN doit contenir exactement 4 chiffres';
    }

    setErrors(finalErrors);

    if (Object.values(finalErrors).some(error => error !== '')) {
      let errorMessage = 'Erreurs détectées:\n';
      if (finalErrors.password) errorMessage += `• ${finalErrors.password}\n`;
      if (finalErrors.confirmPassword) errorMessage += `• ${finalErrors.confirmPassword}\n`;
      if (finalErrors.pin) errorMessage += `• ${finalErrors.pin}`;

      showToast(errorMessage.trim(), 'error');
      return;
    }

    if (!token) {
      setErrors(prev => ({ ...prev, token: 'Token manquant' }));
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApiService.setupAccount({
        token: token as string,
        password,
        pin,
      });

      showToast('Compte configuré avec succès!', 'success');

      if (response.authToken) {
        dispatch(sessionActions.setAuthToken({
          authToken: response.authToken,
          requirePin: false
        }));

        if (response.token?.token) {
          dispatch(sessionActions.setSessionToken({
            sessionToken: response.token.token,
            expiresIn: 14400,
            user: response
          }));
        }
      }

      const targetRoute = getHomeRoute(response.profil);
      router.replace(targetRoute as any);

    } catch (error) {
      const info = extractApiError(error);

      if (info.status === 400) {
        if (info.message?.includes('token')) {
          setErrors(prev => ({ ...prev, token: 'Le lien a expiré ou est invalide' }));
          showToast('Le lien a expiré. Veuillez demander un nouveau lien.', 'error');
        } else {
          showToast('Erreur de configuration. Veuillez vérifier vos informations.', 'error');
        }
      } else if (info.isValidation && info.details) {
        const details = info.details;
        if (Array.isArray(details)) {
          for (const d of details) {
            if (d.field === 'password') setErrors(prev => ({ ...prev, password: d.message }));
            if (d.field === 'pin') setErrors(prev => ({ ...prev, pin: d.message }));
          }
        }
        showToast('Veuillez corriger les erreurs de validation', 'error');
      } else {
        showToast(info.message || 'Une erreur est survenue', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isPasswordValid = password.length >= 8
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /\d/.test(password)
    && /[^a-zA-Z0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const isFormValid = isPasswordValid && passwordsMatch && pin.length === 4;

  return (
    <View style={styles.root}>
      <AuthBackground />

      <AuthScreenLayout style={{ backgroundColor: 'transparent' }} centered>
          <View style={styles.contentContainer}>
            <View style={styles.headerContainer}>
              <RNText style={styles.title}>Configuration du compte</RNText>
              <RNText style={styles.subtitle}>
                Configurez votre mot de passe et votre code PIN pour sécuriser votre compte
              </RNText>
            </View>

            {errors.token ? (
              <View style={styles.errorContainer}>
                <RNText style={styles.errorText}>{errors.token}</RNText>
              </View>
            ) : null}

            <View style={styles.formContainer}>
              {/* Mot de passe */}
              <View style={styles.inputGroup}>
                <RNText style={styles.label}>Mot de passe</RNText>
                <View style={styles.inputWrapper}>
                  <RNTextInput
                    value={password}
                    onChangeText={setPassword}
                    onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                    placeholder="Minimum 8 caractères"
                    secureTextEntry={!showPassword}
                    style={[styles.input, errors.password ? styles.inputError : null]}
                    placeholderTextColor={colors.gray[400]}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
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

              {/* Confirmer mot de passe */}
              <View style={styles.inputGroup}>
                <RNText style={styles.label}>Confirmer le mot de passe</RNText>
                <View style={styles.inputWrapper}>
                  <RNTextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                    placeholder="Confirmez votre mot de passe"
                    secureTextEntry={!showConfirmPassword}
                    style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
                    placeholderTextColor={colors.gray[400]}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
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

              {/* Critères mot de passe */}
              <View style={styles.passwordRulesRow}>
                <RNText style={[styles.passwordRule, password.length >= 8 ? styles.passwordRuleValid : touched.password && password.length > 0 && styles.passwordRuleError]}>8 caractères</RNText>
                <RNText style={styles.passwordRuleSep}>·</RNText>
                <RNText style={[styles.passwordRule, /[A-Z]/.test(password) ? styles.passwordRuleValid : touched.password && password.length > 0 && styles.passwordRuleError]}>1 majuscule</RNText>
                <RNText style={styles.passwordRuleSep}>·</RNText>
                <RNText style={[styles.passwordRule, /[a-z]/.test(password) ? styles.passwordRuleValid : touched.password && password.length > 0 && styles.passwordRuleError]}>1 minuscule</RNText>
                <RNText style={styles.passwordRuleSep}>·</RNText>
                <RNText style={[styles.passwordRule, /\d/.test(password) ? styles.passwordRuleValid : touched.password && password.length > 0 && styles.passwordRuleError]}>1 chiffre</RNText>
                <RNText style={styles.passwordRuleSep}>·</RNText>
                <RNText style={[styles.passwordRule, /[^a-zA-Z0-9]/.test(password) ? styles.passwordRuleValid : touched.password && password.length > 0 && styles.passwordRuleError]}>1 spécial</RNText>
              </View>

              {/* Code PIN */}
              <View style={styles.inputGroup}>
                <RNText style={styles.label}>Code PIN</RNText>
                <RNText style={styles.pinHelp}>
                  Créez un code à 4 chiffres pour vos connexions rapides
                </RNText>
                <View style={styles.pinInputContainer}>
                  <PinInput
                    value={pin}
                    onChange={setPin}
                    onBlur={() => setTouched(prev => ({ ...prev, pin: true }))}
                    error={!!errors.pin}
                    disabled={isLoading}
                    secure={false}
                    variant="light"
                  />
                </View>
              </View>
            </View>

            <Pressable
              onPress={handleSetupAccount}
              disabled={isLoading || !isFormValid}
              style={[styles.primaryButton, (isLoading || !isFormValid) && styles.primaryButtonDisabled]}
            >
              <RNText style={styles.primaryButtonText}>
                {isLoading ? 'Configuration...' : 'Configurer mon compte'}
              </RNText>
            </Pressable>

            <RNText style={styles.infoText}>
              Votre mot de passe et code PIN seront requis à chaque connexion.
            </RNText>
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
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: colors.error.bg,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: colors.error.base,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
    marginBottom: 24,
  },
  inputGroup: {
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
    backgroundColor: colors.gray[50],
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
  fieldError: {
    color: colors.error.base,
    fontSize: 13,
    marginTop: 6,
    marginLeft: 2,
  },
  passwordRulesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 20,
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
  pinHelp: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 12,
    lineHeight: 20,
  },
  pinInputContainer: {
    marginTop: 4,
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
  infoText: {
    color: colors.gray[400],
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 16,
  },
});
