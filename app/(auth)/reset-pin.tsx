import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Text as RNText,
  Pressable,
} from 'react-native';
import { AuthBackground } from '~/components/auth/AuthBackground';
import { PinInput } from '~/components/ui';
import type { PinInputRef } from '~/components/ui';
import { authApiService } from '~/api/auth.api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useToast } from '~/components/ToastProvider';
import { useDispatch } from 'react-redux';
import { sessionActions } from '~/store';
import { storageService } from '~/lib/storageService';
import * as Haptics from 'expo-haptics';
import { AuthScreenLayout } from '~/components/auth/AuthScreenLayout';

export default function ResetPinScreen() {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [pinTouched, setPinTouched] = useState(false);
  const pinInputRef = useRef<PinInputRef>(null);

  const router = useRouter();
  const { showToast } = useToast();
  const dispatch = useDispatch();
  const { token } = useLocalSearchParams<{ token: string }>();

  useEffect(() => {
    if (!token) {
      showToast('Lien invalide. Veuillez demander un nouveau lien.', 'error');
      router.replace('/login');
    }
  }, [token]);

  useEffect(() => {
    if (error && ((step === 'enter' && pin.length > 0 && pin.length < 4) ||
                  (step === 'confirm' && confirmPin.length > 0 && confirmPin.length < 4))) {
      setError(false);
    }
  }, [pin, confirmPin, step, error]);

  const handlePinComplete = (pinValue: string) => {
    if (step === 'enter') {
      setStep('confirm');
      setError(false);
      setPinTouched(false);
    } else {
      if (pinValue !== pin) {
        setError(true);
        showToast('Les codes PIN ne correspondent pas', 'error');

        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        setTimeout(() => {
          setConfirmPin('');
          pinInputRef.current?.focus();
        }, 300);
        return;
      }

      handleSubmit(pinValue);
    }
  };

  const handleSubmit = async (pinValue: string) => {
    if (!token || isLoading) return;

    setIsLoading(true);
    setError(false);

    try {
      const response = await authApiService.resetPin(token as string, pinValue);

      showToast(response.message || 'PIN réinitialisé avec succès!', 'success');

      if (response.authToken) {
        await storageService.setItem('authToken', response.authToken);

        dispatch(sessionActions.setAuthToken({
          authToken: response.authToken,
          requirePin: response.requirePinVerification || false
        }));

        if (response.user) {
          dispatch(sessionActions.updateUser(response.user));
        }
      }

      router.replace('/pin-verification');

    } catch (error: any) {
      setError(true);

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la réinitialisation';
      showToast(errorMessage, 'error');

      if (error.response?.status === 400 || error.response?.status === 404) {
        setTimeout(() => {
          router.replace('/forgot-credentials?type=pin');
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('enter');
      setPin('');
      setConfirmPin('');
      setError(false);
      setPinTouched(false);
    } else {
      router.replace('/login');
    }
  };

  return (
    <View style={styles.root}>
      <AuthBackground />

      <AuthScreenLayout style={{ backgroundColor: 'transparent' }} centered>
          <View style={styles.contentContainer}>
            <View style={styles.headerContainer}>
              <RNText style={styles.title}>
                {step === 'enter' ? 'Nouveau code PIN' : 'Confirmer le code PIN'}
              </RNText>
              <RNText style={styles.subtitle}>
                {step === 'enter'
                  ? 'Créez un nouveau code PIN à 4 chiffres'
                  : 'Entrez à nouveau votre code PIN pour confirmer'}
              </RNText>
            </View>

            <View style={styles.pinContainer}>
              <PinInput
                ref={pinInputRef}
                value={step === 'enter' ? pin : confirmPin}
                onChange={step === 'enter' ? setPin : setConfirmPin}
                onComplete={handlePinComplete}
                onBlur={() => setPinTouched(true)}
                error={error || (pinTouched && (step === 'enter' ? pin : confirmPin).length < 4)}
                disabled={isLoading}
                autoFocus
                secure={false}
                variant="light"
              />
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <RNText style={styles.errorText}>
                  Les codes PIN ne correspondent pas. Veuillez réessayer.
                </RNText>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Pressable
                onPress={handleBack}
                disabled={isLoading}
                style={[styles.cancelButton, isLoading && { opacity: 0.5 }]}
              >
                <RNText style={styles.cancelButtonText}>
                  {step === 'confirm' ? 'Retour' : 'Annuler'}
                </RNText>
              </Pressable>
            </View>

            <View style={styles.infoContainer}>
              <RNText style={styles.infoText}>
                Mémorisez bien ce nouveau code PIN. Il remplacera votre ancien code.
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
    backgroundColor: '#E2E8F0',
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
    color: '#2A2E33',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  pinContainer: {
    marginBottom: 28,
    width: '100%',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 12,
  },
  cancelButton: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2A2E33',
  },
  infoContainer: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 32,
    width: '100%',
  },
  infoText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
