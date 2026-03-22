import { useState } from 'react';
import {
  View,
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  Pressable,
  Platform,
} from 'react-native';
import { AuthBackground } from '~/components/auth/AuthBackground';
import { authApiService } from '~/api/auth.api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useToast } from '~/components/ToastProvider';
import { ChevronLeft } from 'lucide-react-native';
import { AuthScreenLayout } from '~/components/auth/AuthScreenLayout';

type CredentialType = 'pin' | 'password';

export default function ForgotCredentialsScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const router = useRouter();
  const { showToast } = useToast();
  const { type = 'password' } = useLocalSearchParams<{ type?: CredentialType }>();

  const isPin = type === 'pin';
  const title = isPin ? 'PIN oublié' : 'Mot de passe oublié';
  const subtitle = isPin
    ? 'Entrez votre adresse email pour réinitialiser votre PIN'
    : 'Entrez votre adresse email pour réinitialiser votre mot de passe';

  const handleSubmit = async () => {
    if (!email) {
      showToast('Veuillez entrer votre email', 'error');
      return;
    }

    setIsLoading(true);

    try {
      let response;

      if (isPin) {
        response = await authApiService.forgotPin(email);
      } else {
        response = await authApiService.forgotPassword({ email });
      }

      setIsSubmitted(true);
      showToast(response.message || 'Email envoyé avec succès', 'success');
    } catch (error: any) {
      // Always show success message to prevent user enumeration
      setIsSubmitted(true);
      showToast('Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.', 'success');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.replace('/login');
  };

  const handleNewRequest = () => {
    setEmail('');
    setIsSubmitted(false);
  };

  return (
    <View style={styles.root}>
      <AuthBackground />

      <AuthScreenLayout style={{ backgroundColor: 'transparent' }} centered>
          <View style={styles.contentContainer}>
            <Pressable
              onPress={handleBack}
              style={styles.backButton}
            >
              <ChevronLeft size={24} color="#6B7280" />
              <RNText style={styles.backButtonText}>Retour</RNText>
            </Pressable>

            <View style={styles.headerContainer}>
              <RNText style={styles.title}>
                {title}
              </RNText>
              <RNText style={styles.subtitle}>
                {isSubmitted
                  ? 'Un email de réinitialisation a été envoyé'
                  : subtitle}
              </RNText>
            </View>

            {!isSubmitted ? (
              <>
                <RNTextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  placeholderTextColor="#9CA3AF"
                  editable={!isLoading}
                  autoFocus
                />

                <Pressable
                  onPress={handleSubmit}
                  disabled={isLoading || !email}
                  style={[styles.primaryButton, (isLoading || !email) && styles.primaryButtonDisabled]}
                >
                  <RNText style={styles.primaryButtonText}>
                    {isLoading ? 'Envoi en cours...' : 'Envoyer le lien'}
                  </RNText>
                </Pressable>
              </>
            ) : (
              <View style={styles.successContainer}>
                <RNText style={styles.successText}>
                  Si un compte existe avec l'adresse{' '}
                  <RNText style={styles.emailHighlight}>{email}</RNText>
                  {', '}vous recevrez un lien de réinitialisation.
                </RNText>

                <RNText style={styles.successHint}>
                  Vérifiez votre boîte de réception et vos spams.
                </RNText>

                <View style={styles.actionButtons}>
                  <Pressable
                    onPress={handleBack}
                    style={styles.primaryButton}
                  >
                    <RNText style={styles.primaryButtonText}>
                      Retour à la connexion
                    </RNText>
                  </Pressable>

                  <Pressable
                    onPress={handleNewRequest}
                    style={styles.cancelButton}
                  >
                    <RNText style={styles.cancelButtonText}>
                      Renvoyer
                    </RNText>
                  </Pressable>
                </View>
              </View>
            )}

            <RNText style={styles.infoText}>
              Le lien de réinitialisation est valide pendant 1 heure.
            </RNText>
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
  contentContainer: {
    alignItems: 'center',
    width: '100%',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 32,
    paddingVertical: 8,
    paddingRight: 16,
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
      },
    }),
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
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
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: '#F9FAFB',
    marginBottom: 24,
    color: '#2A2E33',
    ...(Platform.OS === 'web' ? {
      outlineStyle: 'none',
    } as any : {
      textAlignVertical: 'center' as const,
    }),
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
    letterSpacing: 0.3,
  },
  primaryButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  successContainer: {
    width: '100%',
    alignItems: 'center',
  },
  successText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  emailHighlight: {
    fontWeight: '600',
    color: '#2A2E33',
  },
  successHint: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  actionButtons: {
    width: '100%',
    gap: 12,
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
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2A2E33',
  },
  infoText: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 16,
  },
});
