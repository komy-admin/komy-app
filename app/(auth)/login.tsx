import { View, StyleSheet, Modal, Image, Platform, Text as RNText, TextInput as RNTextInput, Pressable, useWindowDimensions } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useState, useEffect } from 'react';
import { sessionService } from '~/services/SessionService';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { QrCode } from 'lucide-react-native';
import QrCodeScanner from '../../components/auth/QrCodeScanner';
import { useToast } from '~/components/ToastProvider';
import { AuthScreenLayout } from '~/components/auth/AuthScreenLayout';

const BREAKPOINT = 768;
const APP_VERSION = 'v3.7.1';

// Inject CSS to override browser autofill styles on web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 30px rgba(255, 255, 255, 0.08) inset !important;
      -webkit-text-fill-color: #FFFFFF !important;
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

  const isWide = width >= BREAKPOINT;

  // Gérer le QR token passé en paramètre URL
  useEffect(() => {
    if (params.qrToken && typeof params.qrToken === 'string') {
      handleQrScan(params.qrToken);
    }
  }, [params.qrToken]);

  const handleLogin = async () => {
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
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erreur serveur, veuillez réessayer.';
      showToast(`Échec de connexion : ${message}`, 'error');
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
      console.error('QR scan error:', error);
      showToast('Erreur lors de la connexion QR', 'error');
    }
  };

  const formContent = (
    <View style={styles.formWrapper}>
      <View style={styles.formContent}>
        <Image
          source={require('../../assets/images/logo_komy_png/Logo_Komy_noirSF.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <RNText style={styles.welcomeTitle}>Bienvenue</RNText>
        <RNText style={styles.welcomeSubtitle}>Connectez-vous à votre espace</RNText>

        <View style={styles.qrButtonContainer}>
          <Pressable
            style={styles.qrButton}
            onPress={() => setShowQrScanner(true)}
          >
            <View style={styles.qrButtonContent}>
              <QrCode size={18} color="#FFFFFF" strokeWidth={2} />
              <RNText style={styles.qrButtonText}>Connexion via QR code</RNText>
            </View>
          </Pressable>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <RNText style={styles.dividerText}>ou</RNText>
          <View style={styles.dividerLine} />
        </View>

        <RNTextInput
          id="LoginId"
          value={loginId}
          onChangeText={setLoginId}
          placeholder="Identifiant"
          style={styles.input}
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
        />

        <RNTextInput
          id="LoginPassword"
          value={password}
          onChangeText={setPassword}
          placeholder="Mot de passe"
          secureTextEntry
          style={styles.input}
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

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

      <RNText style={styles.versionText}>Komy {APP_VERSION}</RNText>
    </View>
  );

  return (
    <>
      <View style={styles.root}>
        <ExpoImage
          source={require('../../assets/images/dark-texture-surface.jpg')}
          style={styles.heroImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="high"
        />
        <View style={styles.imageOverlay} />

        <View style={[styles.formPanel, isWide && styles.formPanelWide]}>
          <AuthScreenLayout style={{ backgroundColor: 'transparent' }} centered>
            {formContent}
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

  // === Form content ===
  formWrapper: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
  },
  formContent: {
    width: '100%',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 24,
    tintColor: '#FFFFFF',
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
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
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dividerText: {
    paddingHorizontal: 14,
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },

  // === Inputs ===
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
    color: '#FFFFFF',
    ...(Platform.OS === 'web' ? {
      outlineStyle: 'none',
    } as any : {
      textAlignVertical: 'center' as const,
    }),
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
    color: 'rgba(255, 255, 255, 0.6)',
    textDecorationLine: 'underline',
  },

  // === Login button ===
  loginButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },

  // === Version ===
  versionText: {
    marginTop: 32,
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.35)',
    letterSpacing: 0.5,
  },
});
