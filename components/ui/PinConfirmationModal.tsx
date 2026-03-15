import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Keyboard,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';
import PinInput from '~/components/ui/pin-input';
import type { PinInputRef } from '~/components/ui/pin-input';
import { authApiService } from '~/api/auth.api';
import * as Haptics from 'expo-haptics';

interface PinConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
}

export function PinConfirmationModal({
  isVisible,
  onClose,
  onConfirm,
  title = 'Confirmation requise',
}: PinConfirmationModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isPermanentlyLocked, setIsPermanentlyLocked] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const pinInputRef = useRef<PinInputRef>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isVisible) {
      Keyboard.dismiss();
      setPin('');
      setError(false);
      setErrorMessage('');
      setIsVerifying(false);
      setAttemptsRemaining(null);
      setIsLocked(false);
      setIsPermanentlyLocked(false);
      setCountdown(0);
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
    }
  }, [isVisible]);

  useEffect(() => {
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (error && pin.length === 4) {
      setError(false);
    }
  }, [pin]);

  const startCountdown = useCallback((seconds: number) => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }

    setIsLocked(true);
    let remaining = seconds;
    setCountdown(remaining);

    countdownInterval.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);

      if (remaining <= 0) {
        if (countdownInterval.current) {
          clearInterval(countdownInterval.current);
          countdownInterval.current = null;
        }
        setIsLocked(false);
        setAttemptsRemaining(null);
        setError(false);
        setErrorMessage('');
        // Focus PIN input after unlock
        setTimeout(() => {
          pinInputRef.current?.focus();
        }, 100);
      }
    }, 1000) as unknown as NodeJS.Timeout;
  }, []);

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePinComplete = useCallback(async (value: string) => {
    if (isVerifying || isLocked) return;
    setIsVerifying(true);
    setError(false);
    setErrorMessage('');

    try {
      await authApiService.confirmPin(value);
      setAttemptsRemaining(null);
      setIsLocked(false);
      onConfirm();
    } catch (err: any) {
      setError(true);

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      const { status, data } = err?.response || {};

      if (data?.code === 'PIN_PERMANENTLY_LOCKED') {
        setIsPermanentlyLocked(true);
        setIsLocked(true);
        setAttemptsRemaining(0);
        setErrorMessage('PIN verrouill\u00e9. R\u00e9initialisez par email.');
      } else if (status === 429 || data?.code === 'ACCOUNT_LOCKED' || data?.code === 'TOO_MANY_ATTEMPTS') {
        setAttemptsRemaining(0);
        const remainingSeconds = data?.remainingSeconds;
        if (remainingSeconds) {
          startCountdown(remainingSeconds);
        }
        setErrorMessage(data?.error || data?.message || 'Compte verrouill\u00e9');
      } else if (status === 401) {
        const attempts = data?.attemptsRemaining;
        if (attempts !== undefined) {
          setAttemptsRemaining(attempts);
        }
        setErrorMessage(data?.message || 'Code PIN incorrect');
      } else {
        setErrorMessage(err?.response?.data?.message || 'Code PIN incorrect');
      }

      setTimeout(() => {
        setPin('');
        if (!isLocked) {
          pinInputRef.current?.focus();
        }
      }, 300);
    } finally {
      setIsVerifying(false);
    }
  }, [isVerifying, isLocked, onConfirm, startCountdown]);

  const handleClose = useCallback(() => {
    if (!isVerifying) {
      onClose();
    }
  }, [isVerifying, onClose]);

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
      <Pressable style={styles.backdropTouch} onPress={handleClose} />

      <KeyboardAwareScrollViewWrapper
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bottomOffset={40}
      >
        <View style={styles.fullWrapper}>
          <View style={styles.contentContainer}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>{title.toUpperCase()}</Text>
              <Text style={styles.subtitle}>Entrez votre code PIN pour continuer</Text>
            </View>

            {isLocked ? (
              <View style={styles.lockedContainer}>
                {isPermanentlyLocked ? (
                  <Text style={styles.lockedTitle}>PIN verrouill{'\u00e9'} — R{'\u00e9'}initialisez par email</Text>
                ) : (
                  <>
                    <Text style={styles.lockedTitle}>Compte verrouill{'\u00e9'} —</Text>
                    <Text style={styles.lockedCountdown}>{formatCountdown(countdown)}</Text>
                  </>
                )}
              </View>
            ) : (
              <View style={styles.pinContainer}>
                <PinInput
                  ref={pinInputRef}
                  length={4}
                  value={pin}
                  onChange={setPin}
                  onComplete={handlePinComplete}
                  error={error}
                  disabled={isVerifying}
                  autoFocus
                  secure
                />
              </View>
            )}

            {error && !isLocked && (
              <Text style={styles.errorText}>
                {errorMessage}
                {attemptsRemaining !== null && attemptsRemaining >= 0 && (
                  <>
                    {' — '}
                    <Text style={styles.errorTextBold}>
                      {attemptsRemaining} essai{attemptsRemaining > 1 ? 's' : ''} restant{attemptsRemaining > 1 ? 's' : ''}
                    </Text>
                  </>
                )}
              </Text>
            )}

            <Pressable
              onPress={handleClose}
              disabled={isVerifying}
              style={[styles.cancelButton, isVerifying && { opacity: 0.4 }]}
            >
              <Text style={styles.cancelButtonText}>ANNULER</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAwareScrollViewWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    zIndex: 2000,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
      android: { elevation: 2000 },
    }),
  } as any,
  backdropTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
  },
  fullWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    paddingHorizontal: 24,
    paddingVertical: 60,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  headerContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2A2E33',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  } as any,
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
  },
  pinContainer: {
    width: 280,
  },
  lockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    width: 280,
  },
  lockedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  lockedCountdown: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
    fontVariant: ['tabular-nums'],
  } as any,
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    width: 280,
  },
  errorTextBold: {
    fontWeight: '700',
  },
  cancelButton: {
    width: 280,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2A2E33',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  } as any,
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as any,
});
