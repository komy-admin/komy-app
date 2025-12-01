import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Text as RNText,
  ScrollView,
} from 'react-native';
import { Button, Text, PinInput } from '~/components/ui';
import { authApiService } from '~/api/auth.api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useToast } from '~/components/ToastProvider';
import { useDispatch } from 'react-redux';
import { sessionActions } from '~/store';
import { storageService } from '~/lib/storageService';
import * as Haptics from 'expo-haptics';

export default function ResetPinScreen() {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

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
    // Reset error when user types
    if (error && ((step === 'enter' && pin.length > 0 && pin.length < 4) ||
                  (step === 'confirm' && confirmPin.length > 0 && confirmPin.length < 4))) {
      setError(false);
    }
  }, [pin, confirmPin, step, error]);

  const handlePinComplete = (pinValue: string) => {
    if (step === 'enter') {
      // Store first PIN and move to confirmation
      setStep('confirm');
      setError(false);
    } else {
      // Confirm PIN matches
      if (pinValue !== pin) {
        setError(true);
        showToast('Les codes PIN ne correspondent pas', 'error');

        // Haptic feedback
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        // Clear confirm PIN
        setTimeout(() => {
          setConfirmPin('');
        }, 300);
        return;
      }

      // Submit new PIN
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

      // Store authToken
      if (response.authToken) {
        await storageService.setItem('authToken', response.authToken);

        // Set auth state in Redux
        dispatch(sessionActions.setAuthToken({
          authToken: response.authToken,
          requirePin: response.requirePinVerification || false
        }));

        // Store user info if provided
        if (response.user) {
          dispatch(sessionActions.updateUser(response.user));
        }
      }

      // Navigate to PIN verification to verify the new PIN
      router.replace('/pin-verification');

    } catch (error: any) {
      setError(true);

      // Haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la réinitialisation';
      showToast(errorMessage, 'error');

      // If token is invalid or expired
      if (error.response?.status === 400 || error.response?.status === 404) {
        setTimeout(() => {
          router.replace('/forgot-pin');
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      // Go back to enter step
      setStep('enter');
      setConfirmPin('');
      setError(false);
    } else {
      router.replace('/login');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <RNText style={styles.title}>
              {step === 'enter' ? 'Nouveau code PIN' : 'Confirmer le code PIN'}
            </RNText>
            <Text style={styles.subtitle}>
              {step === 'enter'
                ? 'Créez un nouveau code PIN à 4 chiffres'
                : 'Entrez à nouveau votre code PIN pour confirmer'}
            </Text>
          </View>

          <View style={styles.pinContainer}>
            <PinInput
              value={step === 'enter' ? pin : confirmPin}
              onChange={step === 'enter' ? setPin : setConfirmPin}
              onComplete={handlePinComplete}
              error={error}
              disabled={isLoading}
              autoFocus
              secure={false} // Show digits for setup
            />
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                Les codes PIN ne correspondent pas. Veuillez réessayer.
              </Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              variant="outline"
              onPress={handleBack}
              disabled={isLoading}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>
                {step === 'confirm' ? 'Retour' : 'Annuler'}
              </Text>
            </Button>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              ℹ️ Mémorisez bien ce nouveau code PIN. Il remplacera votre ancien code.
            </Text>
          </View>
        </View>
      </ScrollView>
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
    paddingVertical: 60,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 48,
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
  },
  pinContainer: {
    marginBottom: 32,
    width: '100%',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    width: '100%',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 24,
  },
  cancelButton: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  infoContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 32,
    width: '100%',
  },
  infoText: {
    color: '#1E40AF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});