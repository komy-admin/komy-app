import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Text as RNText,
  Pressable,
} from 'react-native';
import { Button, Text, TextInput, PinInput } from '~/components/ui';
import { useDispatch } from 'react-redux';
import { sessionActions } from '~/store';
import { authApiService } from '~/api/auth.api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useToast } from '~/components/ToastProvider';
import { Eye, EyeOff } from 'lucide-react-native';
import { getHomeRoute } from '~/constants/routes';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';

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
        if (touched.password && pwd.length > 0 && pwd.length < 8) {
          newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
        } else {
          newErrors.password = '';
        }
        // Also validate confirmPassword if it's been touched
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

  // Validate on field change
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
    // Mark all fields as touched to show errors
    setTouched({
      password: true,
      confirmPassword: true,
      pin: true,
    });

    // Final validation with all required fields
    const finalErrors = {
      password: '',
      confirmPassword: '',
      pin: '',
      token: '',
    };

    if (!password) {
      finalErrors.password = 'Le mot de passe est requis';
    } else if (password.length < 8) {
      finalErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
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
      // Create specific error message
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

      // Update session with the new dual token system
      // The setup-account endpoint should return an authToken that needs PIN verification
      if (response.authToken) {
        dispatch(sessionActions.setAuthToken({
          authToken: response.authToken,
          requirePin: false // User just set their PIN, so go directly to session
        }));

        // Since user just created their PIN, we can directly set the session
        if (response.token?.token) {
          dispatch(sessionActions.setSessionToken({
            sessionToken: response.token.token,
            expiresIn: 14400, // 4 hours default
            user: response
          }));
        }
      }

      // Navigate to appropriate screen based on user role
      const targetRoute = getHomeRoute(response.profil);
      router.replace(targetRoute as any);

    } catch (error: any) {

      if (error.response?.status === 400) {
        if (error.response.data?.message?.includes('token')) {
          setErrors(prev => ({ ...prev, token: 'Le lien a expiré ou est invalide' }));
          showToast('Le lien a expiré. Veuillez demander un nouveau lien.', 'error');
        } else {
          showToast('Erreur de configuration. Veuillez vérifier vos informations.', 'error');
        }
      } else if (error.response?.status === 422) {
        // Validation errors
        const validationErrors = error.response.data?.errors;
        if (validationErrors) {
          if (validationErrors.password) {
            setErrors(prev => ({ ...prev, password: validationErrors.password[0] }));
          }
          if (validationErrors.pin) {
            setErrors(prev => ({ ...prev, pin: validationErrors.pin[0] }));
          }
        }
        showToast('Veuillez corriger les erreurs de validation', 'error');
      } else {
        showToast(`Erreur: ${error.message || 'Une erreur est survenue'}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollViewWrapper
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContainer}
        bottomOffset={40}
        scrollEventThrottle={16}
      >
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <RNText style={styles.title}>Configuration du compte</RNText>
            <Text style={styles.subtitle}>
              Configurez votre mot de passe et votre code PIN pour sécuriser votre compte
            </Text>
          </View>

          {errors.token && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errors.token}</Text>
            </View>
          )}

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  id="password"
                  value={password}
                  onChangeText={setPassword}
                  onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                  placeholder="Minimum 8 caractères"
                  secureTextEntry={!showPassword}
                  style={[styles.input, errors.password ? styles.inputError : null]}
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </Pressable>
              </View>
              {errors.password && (
                <Text style={styles.fieldError}>{errors.password}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                  placeholder="Confirmez votre mot de passe"
                  secureTextEntry={!showConfirmPassword}
                  style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </Pressable>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.fieldError}>{errors.confirmPassword}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Code PIN</Text>
              <Text style={styles.pinHelp}>
                Créez un code à 4 chiffres que vous utiliserez à chaque connexion
              </Text>
              <View style={styles.pinInputContainer}>
                <PinInput
                  value={pin}
                  onChange={setPin}
                  onBlur={() => setTouched(prev => ({ ...prev, pin: true }))}
                  error={!!errors.pin}
                  disabled={isLoading}
                  secure={false} // Show digits when setting up
                />
              </View>
              {errors.pin && (
                <Text style={styles.fieldError}>{errors.pin}</Text>
              )}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              variant="default"
              onPress={handleSetupAccount}
              disabled={isLoading || !password || !confirmPassword || pin.length !== 4}
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Configuration...' : 'Configurer mon compte'}
              </Text>
            </Button>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              ℹ️ Votre mot de passe et code PIN seront requis à chaque connexion pour sécuriser votre compte.
            </Text>
          </View>
        </View>
      </KeyboardAwareScrollViewWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    maxWidth: 520,
    alignSelf: 'center',
    width: '100%',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  passwordContainer: {
    position: 'relative',
  },
  input: {
    width: '100%',
    height: 52,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingRight: 48,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  eyeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: 52,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldError: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: 4,
    marginLeft: 4,
  },
  pinHelp: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  pinInputContainer: {
    marginTop: 8,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 24,
  },
  submitButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#000000',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
  infoText: {
    color: '#1E40AF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});