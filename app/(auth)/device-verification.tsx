import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text as RNText,
  Pressable,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { PinInput } from '~/components/ui';
import { useSelector } from 'react-redux';
import { RootState, store } from '~/store';
import { sessionActions } from '~/store/slices/session.slice';
import { sessionService } from '~/services/SessionService';
import { authApiService } from '~/api/auth.api';
import { useRouter } from 'expo-router';
import { useToast } from '~/components/ToastProvider';
import { AuthScreenLayout } from '~/components/auth/AuthScreenLayout';

export default function DeviceVerificationScreen() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

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

  // Reset error when user types
  useEffect(() => {
    if (error && code.length > 0 && code.length < 6) {
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
    } catch (err: any) {
      if (err?.response?.status === 401) {
        showToast('Session expirée. Veuillez vous reconnecter.', 'error');
        store.dispatch(sessionActions.clearLogin2FAState());
        router.replace('/login');
        return;
      }
      showToast('Erreur lors de l\'envoi du code', 'error');
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

      if (response.requirePin || response.requirePinSetup) {
        router.replace('/pin-verification');
        return;
      }

      showToast('Erreur de configuration. Contactez un administrateur.', 'error');
    } catch (err: any) {
      if (err?.response?.status === 401 && err?.response?.data?.message?.includes('Token')) {
        showToast('Session expirée. Veuillez vous reconnecter.', 'error');
        store.dispatch(sessionActions.clearLogin2FAState());
        router.replace('/login');
        return;
      }
      hasVerified.current = false;
      setError(true);
      setCode('');
      setIsLoading(false);
      showToast(err?.response?.data?.message || 'Code invalide', 'error');
    }
  }, [isLoading, loginToken, activeMethod]);

  const handleCancel = () => {
    store.dispatch(sessionActions.clearLogin2FAState());
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
            <View style={styles.headerContainer}>
              <RNText style={styles.title}>Nouvel appareil détecté</RNText>
              <RNText style={styles.subtitle}>
                {activeMethod === 'totp'
                  ? 'Entrez le code à 6 chiffres depuis l\'application d\'authentification de l\'administrateur.'
                  : 'Demandez le code à 6 chiffres envoyé par email à l\'administrateur.'}
              </RNText>
            </View>

            {/* Method selector when both are active */}
            {hasBoth && (
              <View style={styles.methodSelector}>
                <Pressable
                  style={[styles.methodTab, activeMethod === 'totp' && styles.methodTabActive]}
                  onPress={() => { setActiveMethod('totp'); setCode(''); setError(false); }}
                >
                  <RNText style={[styles.methodTabText, activeMethod === 'totp' && styles.methodTabTextActive]}>Application</RNText>
                </Pressable>
                <Pressable
                  style={[styles.methodTab, activeMethod === 'email' && styles.methodTabActive]}
                  onPress={() => { setActiveMethod('email'); setCode(''); setError(false); }}
                >
                  <RNText style={[styles.methodTabText, activeMethod === 'email' && styles.methodTabTextActive]}>Email</RNText>
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
                variant="dark"
              />
            </View>

            {/* Error message */}
            {error && (
              <View style={styles.errorContainer}>
                <RNText style={styles.errorText}>Code invalide. Veuillez réessayer.</RNText>
              </View>
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

            {/* Cancel button */}
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
    marginBottom: 18,
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
    maxWidth: 360,
  },
  methodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 4,
    width: '100%',
    height: 48,
    marginBottom: 24,
  },
  methodTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 8,
  },
  methodTabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  methodTabText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  methodTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sendEmailButton: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  sendEmailButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  pinContainer: {
    marginBottom: 24,
    width: '100%',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  primaryButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelButton: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
