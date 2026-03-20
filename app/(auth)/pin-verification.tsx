import { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Text as RNText,
  Pressable,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { PinInput } from '~/components/ui';
import type { PinInputRef } from '~/components/ui';
import { useSelector } from 'react-redux';
import { selectRequiresPinSetup, selectAuthToken, RootState } from '~/store';
import { sessionService } from '~/services/SessionService';
import { useRouter, Link } from 'expo-router';
import { useToast } from '~/components/ToastProvider';
import * as Haptics from 'expo-haptics';
import { Lock } from 'lucide-react-native';
import { AuthScreenLayout } from '~/components/auth/AuthScreenLayout';

export default function PinVerificationScreen() {
  const { isInAppLock, isPinVerified: isPinAlreadyVerified } = useSelector((state: RootState) => state.session);
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isPermanentlyLocked, setIsPermanentlyLocked] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const pinInputRef = useRef<PinInputRef>(null);

  const router = useRouter();
  const { showToast } = useToast();
  const isSetupMode = useSelector(selectRequiresPinSetup);
  const authToken = useSelector(selectAuthToken);

  useEffect(() => {
    if (error && pin.length === 4) {
      setError(false);
    }
  }, [pin]);

  useEffect(() => {
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, []);

  const startCountdown = (seconds: number) => {
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

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePinComplete = async (pinValue: string) => {
    if (isLoading || isLocked) return;

    if (!authToken) {
      showToast('Erreur: Session expirée. Veuillez vous reconnecter.', 'error');
      router.replace('/login');
      return;
    }

    setIsLoading(true);
    setError(false);
    setAttemptsRemaining(null);

    try {
      if (isSetupMode) {
        await sessionService.setPin(pinValue);
        showToast('PIN configuré avec succès!', 'success');
      } else {
        await sessionService.verifyPin(pinValue);
      }

      setAttemptsRemaining(null);
      setIsLocked(false);
    } catch (err: any) {
      setError(true);

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      setTimeout(() => {
        setPin('');
        pinInputRef.current?.focus();
      }, 300);

      const { status, data } = err.response || {};

      if (data?.code === 'PIN_PERMANENTLY_LOCKED') {
        setIsPermanentlyLocked(true);
        setIsLocked(true);
        setAttemptsRemaining(0);
        showToast('PIN verrouillé. Réinitialisez votre PIN par email.', 'error');
      } else if (status === 429 || data?.code === 'ACCOUNT_LOCKED' || data?.code === 'TOO_MANY_ATTEMPTS') {
        setIsLocked(true);
        setAttemptsRemaining(0);
        if (data?.remainingSeconds) {
          startCountdown(data.remainingSeconds);
        }
        showToast(data?.error || data?.message || 'Compte verrouillé', 'error');
      } else if (status === 401 && (data?.code === 'AUTH_TOKEN_INVALID' || data?.code === 'AUTH_TOKEN_MISSING')) {
        showToast('Session expirée. Veuillez vous reconnecter.', 'error');
        await sessionService.logout();
        router.replace('/login');
      } else if (status === 401) {
        const attempts = data?.attemptsRemaining;
        if (attempts !== undefined) {
          setAttemptsRemaining(attempts);
        }
        showToast(data?.message || 'Code PIN incorrect', 'error');
      } else {
        showToast(`Erreur: ${err.message || 'Une erreur est survenue'}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    await sessionService.logout();
    router.replace('/login');
  };

  return (
    <View style={styles.root}>
      <ExpoImage
        source={require('../../assets/images/dark-texture-surface.jpg')}
        style={styles.heroImage}
        contentFit="cover"
        cachePolicy="memory-disk"
        priority="high"
      />
      <View style={styles.imageOverlay} />

      <AuthScreenLayout style={{ backgroundColor: 'transparent' }} centered>
          <View style={styles.contentContainer}>
            {isLocked ? (
              <View style={styles.lockedContainer}>
                <RNText style={[styles.title, { color: '#FF6B6B' }]}>
                  {isPermanentlyLocked
                    ? 'PIN verrouillé'
                    : 'Compte temporairement verrouillé'}
                </RNText>

                <View style={styles.lockedIconCircle}>
                  <Lock size={32} color="#FFFFFF" strokeWidth={2} />
                </View>

                {isPermanentlyLocked ? (
                  <RNText style={styles.lockedHint}>
                    Trop de tentatives incorrectes.{'\n'}
                    Réinitialisez votre PIN par email pour continuer.
                  </RNText>
                ) : (
                  <>
                    <RNText style={styles.lockedCountdown}>
                      Réessayez dans : {formatCountdown(countdown)}
                    </RNText>
                    <RNText style={styles.lockedHint}>
                      Trop de tentatives incorrectes.{'\n'}
                      Le délai augmente après chaque série d'échecs.
                    </RNText>
                  </>
                )}
              </View>
            ) : (
              <View style={styles.headerContainer}>
                <RNText style={styles.title}>
                  {isSetupMode ? 'Créer votre code PIN' : 'Entrez votre code PIN'}
                </RNText>
                <RNText style={styles.subtitle}>
                  {isSetupMode
                    ? 'Créez un code PIN à 4 chiffres pour sécuriser votre compte'
                    : 'Entrez votre code PIN pour continuer'}
                </RNText>
              </View>
            )}

            {isPermanentlyLocked ? (
              <View style={styles.resetLinkContainer}>
                <Link href="/forgot-credentials?type=pin" asChild>
                  <Pressable style={styles.resetButton}>
                    <RNText style={styles.resetButtonText}>Réinitialiser par email</RNText>
                  </Pressable>
                </Link>
              </View>
            ) : !isLocked ? (
              <>
                <View style={styles.pinContainer}>
                  <PinInput
                    ref={pinInputRef}
                    value={pin}
                    onChange={setPin}
                    onComplete={handlePinComplete}
                    error={error}
                    disabled={isLoading}
                    autoFocus={!isInAppLock && !isPinAlreadyVerified}
                    secure={!isSetupMode}
                    variant="dark"
                  />
                </View>

                {error && (
                  <RNText style={styles.errorText}>
                    Code PIN incorrect
                    {attemptsRemaining !== null && attemptsRemaining >= 0 && (
                      <>
                        {' — '}
                        <RNText style={styles.errorTextBold}>
                          {attemptsRemaining} essai{attemptsRemaining > 1 ? 's' : ''} restant{attemptsRemaining > 1 ? 's' : ''}
                        </RNText>
                      </>
                    )}
                  </RNText>
                )}
              </>
            ) : null}

            <View style={styles.buttonContainer}>
              <Pressable
                onPress={handleCancel}
                disabled={isLoading}
                style={[styles.cancelButton, isLoading && { opacity: 0.5 }]}
              >
                <RNText style={styles.cancelButtonText}>Annuler</RNText>
              </Pressable>

              {!isSetupMode && !isPermanentlyLocked && (
                <View style={styles.forgotPinContainer}>
                  <Link href="/forgot-credentials?type=pin" asChild>
                    <Pressable>
                      <RNText style={styles.forgotPinText}>
                        PIN oublié ?
                      </RNText>
                    </Pressable>
                  </Link>
                </View>
              )}
            </View>

            {isSetupMode && (
              <View style={styles.infoContainer}>
                <RNText style={styles.infoText}>
                  Mémorisez bien ce code PIN. Il vous sera demandé à chaque connexion.
                </RNText>
              </View>
            )}
          </View>
      </AuthScreenLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 24,
  },
  pinContainer: {
    marginBottom: 28,
    width: '100%',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 12,
    width: '100%',
  },
  errorTextBold: {
    fontWeight: '700',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 12,
  },
  cancelButton: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  forgotPinContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 28,
  },
  forgotPinText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textDecorationLine: 'underline',
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 32,
    width: '100%',
  },
  infoText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  resetLinkContainer: {
    width: '100%',
    marginBottom: 12,
  },
  resetButton: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  lockedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  lockedIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedCountdown: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  lockedHint: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});
