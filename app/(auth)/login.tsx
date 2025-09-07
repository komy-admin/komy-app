import { View, StyleSheet, Platform, Text as RNText, KeyboardAvoidingView, ScrollView, Modal } from 'react-native';
import { Button, Text, TextInput } from '~/components/ui';
import { useState } from 'react';
import { useAppDispatch } from '~/store/hooks';
import { setCredentials, setCurrentUser } from '~/store/auth.slice';
import { authApiService } from "~/api/auth.api";
import { Link } from 'expo-router';
import { QrCode } from 'lucide-react-native';
import QrCodeScanner from '../../components/auth/QrCodeScanner'; // chemin relatif à ajuster si besoin
import { useToast } from '~/components/ToastProvider';

export default function LoginScreen() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [qrResult, setQrResult] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const handleLogin = async () => {
    try {
      const { token, ...user } = await authApiService.login({ loginId, password });
      showToast('Login successful!', 'success');
      dispatch(setCredentials({ token: token.token, userProfile: user.profil }));
      dispatch(setCurrentUser(user));

      // Laisser _layout.tsx gérer la redirection automatiquement
      // router.replace(`/${user.profil}/` as any);
    } catch (error) {
      console.error(error);
      showToast(`Login failed: ${error}`, 'error');
    }
  };

  const handleQrScan = async (data: string) => {
    setQrResult(data);
    setShowQrScanner(false);
    const qrLogin = await authApiService.qrLogin(data);
    if (!qrLogin.token.token) {
      console.error('Token non trouvé');
      return;
    }
    const currentUser = await authApiService.getUserWithToken();
    console.log('QR login response:', qrLogin);
    dispatch(setCredentials({ token: qrLogin.token.token, userProfile: currentUser.profil }));
    dispatch(setCurrentUser(currentUser));

    // Laisser _layout.tsx gérer la redirection automatiquement
    // router.replace(`/${currentUser.profil}/` as any);
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentContainer}>
            <RNText style={styles.title}>
              Fork'it
            </RNText>

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

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {qrResult && (
              <View style={styles.qrResultContainer}>
                <Text style={styles.qrResultLabel}>QR scanné :</Text>
                <Text style={styles.qrResultText} selectable>{qrResult}</Text>
              </View>
            )}

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
              <Link href="/forgot-password" asChild>
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
      </KeyboardAvoidingView>
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