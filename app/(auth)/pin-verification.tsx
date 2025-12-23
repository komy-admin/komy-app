import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Text as RNText,
  Pressable,
} from 'react-native';
import { Button, Text, PinInput } from '~/components/ui';
import type { PinInputRef } from '~/components/ui';
import { useDispatch, useSelector } from 'react-redux';
import { sessionActions, selectRequiresPin, selectRequiresPinSetup, selectCurrentUser, selectAuthToken } from '~/store';
import { sessionService } from '~/services/SessionService';
import { useRouter, Link } from 'expo-router';
import { useToast } from '~/components/ToastProvider';
import * as Haptics from 'expo-haptics';
import { Lock } from 'lucide-react-native';
import { AuthScreenLayout } from '~/components/auth/AuthScreenLayout';

export default function PinVerificationScreen() {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  // Protection PIN states
  const [isLocked, setIsLocked] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const pinInputRef = useRef<PinInputRef>(null);

  const dispatch = useDispatch();
  const router = useRouter();
  const { showToast } = useToast();

  const currentUser = useSelector(selectCurrentUser);
  const requiresPin = useSelector(selectRequiresPin);
  const isSetupMode = useSelector(selectRequiresPinSetup);
  const authToken = useSelector(selectAuthToken); // Auth token for PIN verification

  useEffect(() => {
    // Reset error state ONLY when user starts typing a new PIN
    // Don't reset when PIN is cleared (length = 0) to keep error visible
    // Don't reset when PIN is complete (length = 4) as it will be handled by handlePinComplete
    if (error && pin.length > 0 && pin.length < 4) {
      setError(false);
    }
  }, [pin]);

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, []);

  // Start countdown timer
  const startCountdown = (seconds: number) => {
    // Clear any existing timer
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }

    let remaining = seconds;
    setCountdown(remaining);

    countdownInterval.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);

      if (remaining <= 0) {
        if (countdownInterval.current) {
          clearInterval(countdownInterval.current);
        }
        setIsLocked(false);
        setAttemptsRemaining(null);
        showToast('Vous pouvez maintenant réessayer', 'info');
      }
    }, 1000) as unknown as NodeJS.Timeout;
  };

  // Format countdown timer
  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePinComplete = async (pinValue: string) => {
    // Prevent multiple simultaneous calls or if locked
    if (isLoading || isProcessing || isLocked) return;

    // Check for required data before proceeding
    if (!authToken) {
      showToast('Erreur: Session expirée. Veuillez vous reconnecter.', 'error');
      router.replace('/login');
      return;
    }

    setIsProcessing(true);
    setIsLoading(true);
    setError(false);
    setAttemptsRemaining(null); // Reset attempts before each call

    try {
      if (isSetupMode) {
        // Setting up PIN for the first time
        await sessionService.setPin(pinValue);
        showToast('PIN configuré avec succès!', 'success');
      } else {
        // Verifying existing PIN - uses authToken to get sessionToken
        await sessionService.verifyPin(pinValue);
      }

      // Reset attempts on success
      setAttemptsRemaining(null);
      setIsLocked(false);

      // SessionService has already stored sessionToken and user in Redux
      // Let AuthenticationGate handle the navigation to allow AppInitializer to show
      // No immediate redirect - the authentication flow will handle it

    } catch (error: any) {
      setError(true);

      // Haptic feedback on error
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      // Clear PIN on error but keep attempts visible
      setTimeout(() => {
        setPin('');
        // Force focus back on the input after clearing
        pinInputRef.current?.focus();
        // Don't reset error here - let user see the attempts remaining
      }, 300);

      const { status, data } = error.response || {};

      if (status === 401) {
        // PIN incorrect - store attempts from API
        const attempts = data?.attemptsRemaining;
        if (attempts !== undefined) {
          setAttemptsRemaining(attempts);
        }

        // Show message with attempts
        let message = data?.message || 'Code PIN incorrect';
        if (attempts !== undefined && attempts >= 0) {
          message += `. ${attempts} essai${attempts > 1 ? 's' : ''} restant${attempts > 1 ? 's' : ''}`;
        }
        showToast(message, 'error');

      } else if (status === 429 || data?.code === 'ACCOUNT_LOCKED' || data?.code === 'TOO_MANY_ATTEMPTS') {
        // Account locked
        setIsLocked(true);
        setAttemptsRemaining(0);

        // Use remainingSeconds from API
        const remainingSeconds = data?.remainingSeconds;
        if (remainingSeconds) {
          startCountdown(remainingSeconds);
        }

        // Show error message from API
        showToast(data?.error || data?.message || 'Compte verrouillé', 'error');

      } else if (status === 401 && (data?.code === 'AUTH_TOKEN_INVALID' || data?.code === 'AUTH_TOKEN_MISSING')) {
        // Auth token invalid - need full re-login
        showToast('Session expirée. Veuillez vous reconnecter.', 'error');
        await sessionService.logout();
        router.replace('/login');
      } else {
        showToast(`Erreur: ${error.message || 'Une erreur est survenue'}`, 'error');
      }
    } finally {
      setIsLoading(false);
      // Reset processing flag after a delay to prevent rapid re-triggers
      setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
    }
  };

  const handleCancel = async () => {
    // Fully clear authentication state and force complete re-login
    await sessionService.logout();
    router.replace('/login');
  };

  return (
    <AuthScreenLayout>
      <View style={styles.fullWrapper}>
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <RNText style={styles.title}>
              {isSetupMode ? 'Créer votre code PIN' : 'Entrez votre code PIN'}
            </RNText>
            <Text style={styles.subtitle}>
              {isSetupMode
                ? 'Créez un code PIN à 4 chiffres pour sécuriser votre compte'
                : 'Entrez votre code PIN pour continuer'}
            </Text>
          </View>

          {/* Lock indicator when account is locked */}
          {isLocked && (
            <View style={styles.lockedContainer}>
              <Lock size={48} color="#DC2626" />
              <Text style={styles.lockedTitle}>
                Compte temporairement verrouillé
              </Text>
              <Text style={styles.lockedCountdown}>
                Réessayez dans: {formatCountdown(countdown)}
              </Text>
              <Text style={styles.lockedHint}>
                Trop de tentatives incorrectes.
                Le délai augmente après chaque série d'échecs.
              </Text>
            </View>
          )}

          <View style={styles.pinContainer}>
            <PinInput
              ref={pinInputRef}
              value={pin}
              onChange={setPin}
              onComplete={handlePinComplete}
              error={error}
              disabled={isLoading || isLocked}
              autoFocus
              secure={!isSetupMode} // Show digits when setting up, hide when verifying
            />
          </View>

          {/* Error message with attempts */}
          {error && !isLocked && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {attemptsRemaining !== null && attemptsRemaining >= 0
                  ? `Code PIN incorrect\n${attemptsRemaining} essai${attemptsRemaining > 1 ? 's' : ''} restant${attemptsRemaining > 1 ? 's' : ''}`
                  : 'Code PIN incorrect'}
              </Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              variant="outline"
              onPress={handleCancel}
              disabled={isLoading}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Button>

            {!isSetupMode && !isLocked && (
              <View style={styles.forgotPinContainer}>
                <Link href="/forgot-credentials?type=pin" asChild>
                  <Pressable>
                    <Text style={styles.forgotPinText}>
                      PIN oublié ?
                    </Text>
                  </Pressable>
                </Link>
              </View>
            )}
          </View>

          {isSetupMode && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                ℹ️ Mémorisez bien ce code PIN. Il vous sera demandé à chaque connexion.
              </Text>
            </View>
          )}
        </View>
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  fullWrapper: {
    flex: 1,
    justifyContent: 'center',
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
  forgotPinContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPinText: {
    fontSize: 14,
    color: '#1F2937',
    textDecorationLine: 'underline',
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
  // Lock screen styles
  lockedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    marginVertical: 20,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 16,
    marginBottom: 8,
  },
  lockedCountdown: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 12,
  },
  lockedHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});