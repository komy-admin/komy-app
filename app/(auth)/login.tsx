import { View, StyleSheet, Platform, Modal, Image, ScrollView } from 'react-native';
import { Button, Text, TextInput } from '~/components/ui';
import { useState } from 'react';
import { sessionService } from '~/services/SessionService';
import { Link, useRouter } from 'expo-router';
import { QrCode } from 'lucide-react-native';
import QrCodeScanner from '../../components/auth/QrCodeScanner';
import { useToast } from '~/components/ToastProvider';

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

      // New dual token system: login returns authToken and requirePin or requirePinSetup
      if (response.requirePin || response.requirePinSetup) {
        // authToken is already stored by SessionService
        // Navigate to PIN screen (will handle both verification and setup)
        router.push('/pin-verification');
        return;
      }

      // This shouldn't happen according to the new spec
      // All users should have PIN requirement
      showToast('Erreur de configuration. Contactez un administrateur.', 'error');
    } catch (error: any) {
      showToast(`Échec de connexion: ${error.message || error}`, 'error');
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
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        <View style={styles.contentContainer}>
          <Image
            source={require('../../assets/images/logo_komy_png/logo_name.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.qrButtonContainer}>
            <Button
              variant="outline"
              style={styles.qrButton}
              onPress={() => setShowQrScanner(true)}
            >
              <View style={styles.qrButtonContent}>
                <QrCode size={20} color="#1F2937" strokeWidth={2} />
                <Text style={styles.qrButtonText}>Connexion via QR code</Text>
              </View>
            </Button>
          </View>

          <TextInput
            id="LoginId"
            value={loginId}
            onChangeText={setLoginId}
            placeholder="Identifiant"
            style={styles.input}
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            id="LoginPassword"
            value={password}
            onChangeText={setPassword}
            placeholder="Mot de passe"
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.forgotPasswordContainer}>
            <Link href="/forgot-credentials?type=password" asChild>
              <Text style={styles.forgotPasswordText}>
                Mot de passe oublié ?
              </Text>
            </Link>
          </View>

          <Button variant="default" onPress={handleLogin} style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </Button>
        </View>
      </ScrollView>
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 48,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 40,
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
  dividerContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginHorizontal: 16,
    fontWeight: '500',
  },
  qrResultContainer: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  qrResultLabel: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
    marginBottom: 4,
  },
  qrResultText: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
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
      web: {
        fontSize: 18,
      },
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