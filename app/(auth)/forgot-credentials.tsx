import { useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Text as RNText,
  TouchableOpacity,
} from 'react-native';
import { Button, TextInput } from '~/components/ui';
import { authApiService } from '~/api/auth.api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useToast } from '~/components/ToastProvider';
import { ChevronLeft, Mail } from 'lucide-react-native';
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
        // Assuming there's a forgotPassword method in authApiService
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
    // Always redirect to a specific route instead of router.back()
    // to avoid "GO_BACK" navigation errors on web
    router.replace('/login');
  };

  const handleNewRequest = () => {
    setEmail('');
    setIsSubmitted(false);
  };

  return (
    <AuthScreenLayout>
      <View style={styles.fullWrapper}>
        <View style={styles.contentContainer}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color="#1F2937" />
            <RNText style={styles.backButtonText}>Retour</RNText>
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <RNText style={styles.title}>
              {title}
            </RNText>
            <RNText style={styles.subtitle}>
              {isSubmitted
                ? `Un email de réinitialisation a été envoyé`
                : subtitle}
            </RNText>
          </View>

          {!isSubmitted ? (
            <>
              <TextInput
                id="email"
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

              <Button
                variant="default"
                onPress={handleSubmit}
                disabled={isLoading || !email}
                style={styles.submitButton}
              >
                <RNText style={styles.submitButtonText}>
                  {isLoading ? 'Envoi en cours...' : 'Envoyer le lien'}
                </RNText>
              </Button>
            </>
          ) : (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Mail size={56} color="#6366F1" strokeWidth={1.5} />
              </View>

              <View style={styles.successTextContainer}>
                <RNText style={styles.successText}>
                  Si un compte existe avec l'adresse email{' '}
                  <RNText style={styles.emailHighlight}>{email}</RNText>
                  {', '}vous recevrez un lien pour réinitialiser votre {isPin ? 'PIN' : 'mot de passe'}.
                </RNText>
              </View>

              <RNText style={styles.successHint}>
                Vérifiez votre boîte de réception et vos spams.
              </RNText>

              <View style={styles.actionButtons}>
                <Button
                  variant="default"
                  onPress={handleBack}
                  style={[styles.submitButton]}
                >
                  <RNText style={styles.submitButtonText}>
                    Retour à la connexion
                  </RNText>
                </Button>

                <Button
                  variant="outline"
                  onPress={handleNewRequest}
                  style={[styles.submitButton, styles.secondaryButton]}
                >
                  <RNText style={styles.secondaryButtonText}>
                    Nouvel envoi
                  </RNText>
                </Button>
              </View>
            </View>
          )}

          <View style={styles.infoContainer}>
            <RNText style={styles.infoText}>
              ℹ️ {isPin
                ? `Le lien de réinitialisation est valide pendant 1 heure`
                : `Le lien de réinitialisation est valide pendant 24 heures`}
            </RNText>
          </View>
        </View>
      </View>
    </AuthScreenLayout>
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
    color: '#1F2937',
    marginLeft: 4,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
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
    marginBottom: 24,
    color: '#1F2937',
  },
  submitButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#000000',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  successContainer: {
    width: '100%',
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTextContainer: {
    width: '100%',
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
    ...Platform.select({
      web: {
        lineHeight: 24,
      },
      ios: {
        lineHeight: 24,
      },
      android: {
        lineHeight: 24,
      },
    }),
  },
  emailHighlight: {
    fontWeight: '600',
    color: '#000000',
  },
  successHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    ...Platform.select({
      web: {
        lineHeight: 20,
      },
      ios: {
        lineHeight: 20,
      },
      android: {
        lineHeight: 20,
      },
    }),
  },
  actionButtons: {
    width: '100%',
    ...Platform.select({
      web: {
        gap: 12,
      },
      default: {
        // Android & iOS: use marginBottom instead of gap
      },
    }),
  },
  secondaryButton: {
    ...Platform.select({
      web: {
        marginTop: 0,
      },
      default: {
        marginTop: 12,
      },
    }),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 32,
  },
  infoText: {
    color: '#1E40AF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});