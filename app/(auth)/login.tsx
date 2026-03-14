import { View, StyleSheet, Modal, Image, Platform, Text as RNText, TextInput as RNTextInput, Pressable } from 'react-native';
import { useState } from 'react';
import { sessionService } from '~/services/SessionService';
import { Link, useRouter } from 'expo-router';
import { QrCode } from 'lucide-react-native';
import QrCodeScanner from '../../components/auth/QrCodeScanner';
import { useToast } from '~/components/ToastProvider';
import { AuthScreenLayout } from '~/components/auth/AuthScreenLayout';

export default function LoginScreen() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleLogin = async () => {
    try {
      // Use SessionService to handle login with dual token system
      const response = await sessionService.login(loginId, password);

      // If 2FA is required, navigate to device verification screen
      if (response.requiresTwoFactor) {
        router.push('/device-verification');
        return;
      }

      // New dual token system: login returns authToken and requirePin or requirePinSetup
      if (response.requirePin || response.requirePinSetup) {
        router.push('/pin-verification');
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
      // Use SessionService for QR login - handles all state management
      const response = await sessionService.qrLogin(data);

      // Check if user skips PIN (quick created users)
      if (response.skipPin) {
        // User is fully authenticated, SessionService will handle redirect
        return;
      }

      // Navigate to PIN verification/setup based on response
      router.push('/pin-verification');
    } catch (error) {
      console.error('QR scan error:', error);
      showToast('Erreur lors de la connexion QR', 'error');
    }
  };

  return (
    <>
      <AuthScreenLayout>
        <View style={styles.fullWrapper}>
          <View style={styles.contentContainer}>
            <Image
              source={require('../../assets/images/logo_komy_png/Logo_Komy_noirSF.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <View style={styles.qrButtonContainer}>
              <Pressable
                style={styles.qrButton}
                onPress={() => setShowQrScanner(true)}
              >
                <View style={styles.qrButtonContent}>
                  <QrCode size={20} color="#1F2937" strokeWidth={2} />
                  <RNText style={styles.qrButtonText}>Connexion via QR code</RNText>
                </View>
              </Pressable>
            </View>

            <RNTextInput
              id="LoginId"
              value={loginId}
              onChangeText={setLoginId}
              placeholder="Identifiant"
              style={styles.input}
              placeholderTextColor="#9CA3AF"
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
              placeholderTextColor="#9CA3AF"
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
        </View>
      </AuthScreenLayout>

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
  fullWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 24,
  },
  qrButtonContainer: {
    width: '100%',
    marginBottom: 24,
  },
  qrButton: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  qrButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  qrButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  input: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    color: '#1F2937',
    ...Platform.select({
      default: {
        textAlignVertical: 'center',
      },
    }),
  },
  forgotPasswordContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    fontSize: 16,
    color: '#1F2937',
    textDecorationLine: 'underline',
  },
  loginButton: {
    width: '100%',
    height: 56,
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
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
