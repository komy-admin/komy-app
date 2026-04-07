import { View, StyleSheet, Modal, Image, Platform, Text as RNText, TextInput as RNTextInput, Pressable, useWindowDimensions } from 'react-native';
import { AuthBackground } from '~/components/auth/AuthBackground';
import { useState, useEffect } from 'react';
import { sessionService } from '~/services/SessionService';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { QrCode } from 'lucide-react-native';
import QrCodeScanner from '../../components/auth/QrCodeScanner';
import { useToast } from '~/components/ToastProvider';
import { AuthScreenLayout } from '~/components/auth/AuthScreenLayout';
import { useFormErrors } from '~/hooks/useFormErrors';
import { FormFieldError } from '~/components/ui/FormFieldError';

const BREAKPOINT = 768;
const APP_VERSION = 'Komy - v3.7.1';

// Inject CSS to override browser autofill styles on web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 30px #F9FAFB inset !important;
      -webkit-text-fill-color: #2A2E33 !important;
      transition: background-color 5000s ease-in-out 0s;
    }
  `;
  document.head.appendChild(style);
}

export default function LoginScreen() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const formErrors = useFormErrors();

  const isWide = width >= BREAKPOINT;

  // Gérer le QR token passé en paramètre URL
  useEffect(() => {
    if (params.qrToken && typeof params.qrToken === 'string') {
      handleQrScan(params.qrToken);
    }
  }, [params.qrToken]);

  const handleLogin = async () => {
    formErrors.clearAll();
    try {
      const response = await sessionService.login(loginId, password);

      if (response.requiresTwoFactor) {
        router.replace('/device-verification');
        return;
      }

      if (response.requirePin || response.requirePinSetup) {
        router.replace('/pin-verification');
        return;
      }

      showToast('Erreur de configuration. Contactez un administrateur.', 'error');
    } catch (error) {
      formErrors.handleError(error, showToast, 'Échec de connexion');
    }
  };

  const handleQrScan = async (data: string) => {
    setShowQrScanner(false);
    try {
      const response = await sessionService.qrLogin(data);

      if (response.skipPin) {
        return;
      }

      router.push('/pin-verification');
    } catch (error) {
      showToast('Erreur lors de la connexion QR', 'error');
    }
  };

  const formContent = (
    <View style={styles.formWrapper}>
      <View style={styles.formContent}>
        <RNText style={styles.welcomeTitle}>Bienvenue</RNText>
        <RNText style={styles.welcomeSubtitle}>Connectez-vous à votre espace</RNText>

        <View style={styles.qrButtonContainer}>
          <Pressable
            style={styles.qrButton}
            onPress={() => setShowQrScanner(true)}
          >
            <View style={styles.qrButtonContent}>
              <QrCode size={18} color="#2A2E33" strokeWidth={2} />
              <RNText style={styles.qrButtonText}>Connexion via QR code</RNText>
            </View>
          </Pressable>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <RNText style={styles.dividerText}>ou</RNText>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.fieldGroup}>
          <RNTextInput
            id="LoginId"
            value={loginId}
            onChangeText={(text) => { setLoginId(text); formErrors.clearError('loginId'); }}
            placeholder="Identifiant"
            style={[styles.input, formErrors.hasError('loginId') && styles.inputError]}
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          <FormFieldError message={formErrors.getError('loginId')} />
        </View>

        <View style={styles.fieldGroup}>
          <RNTextInput
            id="LoginPassword"
            value={password}
            onChangeText={(text) => { setPassword(text); formErrors.clearError('password'); }}
            placeholder="Mot de passe"
            secureTextEntry
            style={[styles.input, formErrors.hasError('password') && styles.inputError]}
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          <FormFieldError message={formErrors.getError('password')} />
        </View>

        <View style={styles.forgotPasswordContainer}>
          <Link href="/forgot-credentials?type=password" asChild>
            <RNText style={styles.forgotPasswordText}>
              Mot de passe oublié ?
            </RNText>
          </Link>
        </View>

        <Pressable onPress={handleLogin} style={styles.loginButton}>
          <RNText style={styles.loginButtonText}>Se connecter</RNText>
        </Pressable>
      </View>
    </View>
  );

  return (
    <>
      <View style={styles.root}>
        <AuthBackground />

        <View style={[styles.formPanel, isWide && styles.formPanelWide]}>
          <AuthScreenLayout style={{ backgroundColor: 'transparent' }} centered noCard>
            <Image
              source={require('../../assets/images/logo_komy_png/Logo_Komy_blancSF.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.formCard}>
              {formContent}
            </View>
            <RNText style={styles.versionText}>{APP_VERSION}</RNText>
          </AuthScreenLayout>
        </View>
      </View>

      <Modal
        visible={showQrScanner}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowQrScanner(false)}
      >
        <QrCodeScanner
          onScan={handleQrScan}
          onCancel={() => setShowQrScanner(false)}
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E2E8F0',
  },

  // === Form panel ===
  formPanel: {
    flex: 1,
  },
  formPanelWide: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: '43%',
    transform: [{ translateX: '-50%' }],
  },

  // === Card ===
  formCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 36,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 32,
        elevation: 12,
      },
    }),
  },

  // === Form content ===
  formWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  formContent: {
    width: '100%',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2A2E33',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 32,
  },

  // === QR Button ===
  qrButtonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  qrButton: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  qrButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2A2E33',
  },

  // === Divider ===
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    paddingHorizontal: 14,
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
  },

  // === Inputs ===
  fieldGroup: {
    width: '100%',
    marginBottom: 14,
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: '#F9FAFB',
    color: '#2A2E33',
    ...(Platform.OS === 'web' ? {
      outlineStyle: 'none',
    } as any : {
      textAlignVertical: 'center' as const,
    }),
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },

  // === Forgot password ===
  forgotPasswordContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    textDecorationLine: 'underline',
  },

  // === Login button ===
  loginButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#2A2E33',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // === Version ===
  versionText: {
    marginTop: 16,
    marginBottom: 16,
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
});
