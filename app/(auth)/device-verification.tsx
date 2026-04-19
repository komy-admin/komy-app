import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text as RNText,
  Pressable,
} from 'react-native';
import { Lock } from 'lucide-react-native';
import { AuthBackground } from '~/components/auth/AuthBackground';
import { PinInput } from '~/components/ui';
import { useSelector } from 'react-redux';
import { RootState, store } from '~/store';
import { sessionActions } from '~/store/slices/session.slice';
import { sessionService } from '~/services/SessionService';
import { authApiService } from '~/api/auth.api';
import { useRouter } from 'expo-router';
import { useToast } from '~/components/ToastProvider';
import { AuthScreenLayout } from '~/components/auth/AuthScreenLayout';
import { extractApiError, showApiError } from '~/lib/apiErrorHandler';
import { SessionExpiredError } from '~/api/base.api';

export default function DeviceVerificationScreen() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isPermanentlyLocked, setIsPermanentlyLocked] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  const router = useRouter();
  const { showToast } = useToast();

  const { loginToken, login2FAMethods } = useSelector(
    (state: RootState) => state.session
  );

  // Snapshot 2FA methods at mount so Redux clearing doesn't cause re-renders
  const methodsRef = React.useRef(login2FAMethods);
  const totp = methodsRef.current?.totp ?? false;
  const email = methodsRef.current?.email ?? false;
  const hasBoth = totp && email;

  const [activeMethod, setActiveMethod] = useState<'totp' | 'email'>(totp ? 'totp' : 'email');

  // Track verification success to prevent redirect to login when Redux state clears
  const hasVerified = React.useRef(false);
  useEffect(() => {
    if (!loginToken && !hasVerified.current) {
      router.replace('/login');
    }
  }, [loginToken]);

  // Cleanup countdown interval
  useEffect(() => {
    return () => {
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, []);

  const startCountdown = (seconds: number) => {
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    let remaining = seconds;
    setCountdown(remaining);
    countdownInterval.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        if (countdownInterval.current) clearInterval(countdownInterval.current);
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

  // Email cooldown timer
  useEffect(() => {
    if (emailCooldown <= 0) return;
    const timer = setTimeout(() => setEmailCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [emailCooldown]);

  // Auto-send email when switching to or landing on email method
  useEffect(() => {
    if (activeMethod === 'email' && emailCooldown <= 0 && !isSendingEmail && loginToken) {
      handleSendEmailCode();
    }
  }, [activeMethod]);

  // Reset error only when code is fully re-entered
  useEffect(() => {
    if (error && code.length === 6) {
      setError(false);
    }
  }, [code]);

  const handleSendEmailCode = useCallback(async () => {
    if (!loginToken) return;
    setIsSendingEmail(true);
    try {
      await authApiService.sendLogin2FAEmail(loginToken);
      setEmailCooldown(60);
      showToast('Code envoyé par email', 'success');
    } catch (err) {
      if (err instanceof SessionExpiredError) return;

      const info = extractApiError(err);
      if (info.status === 401) {
        showApiError(err, showToast, 'Session expirée');
        store.dispatch(sessionActions.clearLogin2FAState());
        router.replace('/login');
        return;
      }
      showApiError(err, showToast, 'Erreur lors de l\'envoi du code');
    } finally {
      setIsSendingEmail(false);
    }
  }, [loginToken]);

  const handleVerify = useCallback(async (codeValue: string) => {
    if (isLoading || !loginToken) return;

    setIsLoading(true);
    setError(false);

    try {
      hasVerified.current = true;
      const response = await sessionService.verifyLogin2FA(codeValue, activeMethod);

      // skipPinRequired users are fully authenticated after 2FA
      if (response.skipPin) {
        return; // AppInitializer handles navigation
      }

      if (response.requirePin || response.requirePinSetup) {
        router.replace('/pin-verification');
        return;
      }

      showToast('Erreur de configuration. Contactez un administrateur.', 'error');
    } catch (err) {
      if (err instanceof SessionExpiredError) return;

      const info = extractApiError(err);

      if (info.status === 401 && info.code !== 'INVALID_2FA_CODE') {
        showApiError(err, showToast, 'Session expirée');
        store.dispatch(sessionActions.clearLogin2FAState());
        router.replace('/login');
        return;
      }

      hasVerified.current = false;
      setCode('');
      setIsLoading(false);

      if (info.code === 'RATE_LIMIT_2FA_PERMANENT') {
        setIsPermanentlyLocked(true);
        setIsLocked(true);
        setAttemptsRemaining(0);
      } else if (info.code === 'RATE_LIMIT_2FA') {
        setIsLocked(true);
        setAttemptsRemaining(0);
        if (info.details?.remainingSeconds) {
          startCountdown(info.details.remainingSeconds);
        }
      } else {
        setError(true);
        if (info.details?.attemptsRemaining !== undefined) {
          setAttemptsRemaining(info.details.attemptsRemaining);
        }
        if (info.details?.remainingSeconds) {
          setIsLocked(true);
          setAttemptsRemaining(0);
          startCountdown(info.details.remainingSeconds);
        }
      }
      showApiError(err, showToast, 'Code invalide');
    }
  }, [isLoading, loginToken, activeMethod]);

  const handleCancel = () => {
    store.dispatch(sessionActions.clearLogin2FAState());
    router.replace('/login');
  };

  return (
    <View style={styles.root}>
      <AuthBackground />

      <AuthScreenLayout style={{ backgroundColor: 'transparent' }} centered>
          <View style={styles.contentContainer}>
            {isLocked ? (
              <View style={styles.lockedContainer}>
                <RNText style={[styles.title, { color: '#EF4444' }]}>
                  {isPermanentlyLocked
                    ? 'Vérification bloquée'
                    : '2FA temporairement verrouillé'}
                </RNText>

                <View style={styles.lockedIconCircle}>
                  <Lock size={32} color="#EF4444" strokeWidth={2} />
                </View>

                {isPermanentlyLocked ? (
                  <RNText style={styles.lockedHint}>
                    Trop de tentatives incorrectes.{'\n'}
                    Contactez votre administrateur pour débloquer.
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
              <>
                <View style={styles.headerContainer}>
                  <RNText style={styles.title}>Nouvel appareil détecté</RNText>
                  <RNText style={styles.subtitle}>
                    {activeMethod === 'totp'
                      ? 'Entrez le code à 6 chiffres depuis l\'application d\'authentification de l\'administrateur.'
                      : 'Demandez le code à 6 chiffres envoyé par email à l\'administrateur.'}
                  </RNText>
                </View>

                {/* Method selector */}
                {hasBoth && (
                  <View style={styles.switchContainer}>
                    <Pressable
                      style={[styles.switchOption, activeMethod === 'totp' && styles.switchOptionActive]}
                      onPress={() => { setActiveMethod('totp'); setCode(''); setError(false); }}
                    >
                      <RNText style={[styles.switchName, activeMethod === 'totp' && styles.switchNameActive]}>Application</RNText>
                      <RNText style={[styles.switchSub, activeMethod === 'totp' && styles.switchSubActive]}>Authenticator</RNText>
                    </Pressable>
                    <Pressable
                      style={[styles.switchOption, activeMethod === 'email' && styles.switchOptionActive]}
                      onPress={() => { setActiveMethod('email'); setCode(''); setError(false); }}
                    >
                      <RNText style={[styles.switchName, activeMethod === 'email' && styles.switchNameActive]}>Email</RNText>
                      <RNText style={[styles.switchSub, activeMethod === 'email' && styles.switchSubActive]}>Code par email</RNText>
                    </Pressable>
                  </View>
                )}

                {/* Send email button */}
                {activeMethod === 'email' && (
                  <Pressable
                    style={[styles.sendEmailButton, (emailCooldown > 0 || isSendingEmail) && styles.buttonDisabled]}
                    onPress={handleSendEmailCode}
                    disabled={emailCooldown > 0 || isSendingEmail}
                  >
                    <RNText style={styles.sendEmailButtonText}>
                      {isSendingEmail ? 'Envoi...' : emailCooldown > 0 ? `Renvoyer (${emailCooldown}s)` : 'Envoyer le code'}
                    </RNText>
                  </Pressable>
                )}

                {/* PIN Input */}
                <View style={styles.pinContainer}>
                  <PinInput
                    length={6}
                    value={code}
                    onChange={setCode}
                    onComplete={handleVerify}
                    secure={false}
                    autoFocus
                    error={error}
                    variant="light"
                    cellWidth={48}
                    cellHeight={56}
                  />
                </View>

                {error && (
                  <RNText style={styles.errorText}>
                    Code invalide
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

                {/* Verify button */}
                <Pressable
                  style={[styles.primaryButton, (code.length !== 6 || isLoading) && styles.primaryButtonDisabled]}
                  onPress={() => handleVerify(code)}
                  disabled={code.length !== 6 || isLoading}
                >
                  <RNText style={styles.primaryButtonText}>
                    {isLoading ? 'Vérification...' : 'Confirmer'}
                  </RNText>
                </Pressable>
              </>
            )}

            {/* Cancel button — always visible */}
            <Pressable
              style={[styles.cancelButton, isLoading && styles.buttonDisabled]}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <RNText style={styles.cancelButtonText}>Annuler</RNText>
            </Pressable>
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
  switchContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
    width: '100%',
    marginBottom: 24,
  },
  switchOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  switchOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  switchName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  switchNameActive: {
    color: '#2A2E33',
    fontWeight: '600',
  },
  switchSub: {
    fontSize: 11,
    fontWeight: '400',
    color: '#C4C9D1',
    marginTop: 1,
  },
  switchSubActive: {
    color: '#9CA3AF',
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 18,
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
  sendEmailButton: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  sendEmailButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2A2E33',
  },
  pinContainer: {
    marginBottom: 24,
    width: '100%',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 12,
    width: '100%',
  },
  errorTextBold: {
    fontWeight: '700',
  },
  primaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#2A2E33',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  primaryButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  buttonDisabled: {
    opacity: 0.5,
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
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedCountdown: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
  },
  lockedHint: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
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
    marginTop: 12,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2A2E33',
  },
});
