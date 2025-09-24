import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Text as RNText,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Button, Text, TextInput } from '~/components/ui';
import { authApiService } from '~/api/auth.api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useToast } from '~/components/ToastProvider';
import { ChevronLeft } from 'lucide-react-native';

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
    if (isPin) {
      router.back();
    } else {
      router.replace('/login');
    }
  };

  const handleNewRequest = () => {
    setEmail('');
    setIsSubmitted(false);
  };

  return (
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
          <Button
            variant="ghost"
            onPress={handleBack}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color="#1F2937" />
            <Text style={styles.backButtonText}>Retour</Text>
          </Button>

          <View style={styles.headerContainer}>
            <RNText style={styles.title}>
              {title}
            </RNText>
            <Text style={styles.subtitle}>
              {isSubmitted
                ? `Un email de réinitialisation a été envoyé`
                : subtitle}
            </Text>
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
                <Text style={styles.submitButtonText}>
                  {isLoading ? 'Envoi en cours...' : 'Envoyer le lien'}
                </Text>
              </Button>
            </>
          ) : (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Text style={styles.successEmoji}>✉️</Text>
              </View>

              <Text style={styles.successText}>
                Si un compte existe avec l'adresse email <Text style={styles.emailHighlight}>{email}</Text>,
                vous recevrez un lien pour réinitialiser votre {isPin ? 'PIN' : 'mot de passe'}.
              </Text>

              <Text style={styles.successHint}>
                Vérifiez votre boîte de réception et vos spams.
              </Text>

              <View style={styles.actionButtons}>
                <Button
                  variant="default"
                  onPress={handleBack}
                  style={[styles.submitButton]}
                >
                  <Text style={styles.submitButtonText}>
                    Retour à la connexion
                  </Text>
                </Button>

                <Button
                  variant="outline"
                  onPress={handleNewRequest}
                  style={[styles.submitButton, styles.secondaryButton]}
                >
                  <Text style={styles.secondaryButtonText}>
                    Nouvel envoi
                  </Text>
                </Button>
              </View>
            </View>
          )}

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              ℹ️ {isPin
                ? `Le lien de réinitialisation est valide pendant 1 heure`
                : `Le lien de réinitialisation est valide pendant 24 heures`}
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
    paddingVertical: 60,
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
  },
  backButtonText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 4,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 48,
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  successContainer: {
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 24,
  },
  successEmoji: {
    fontSize: 48,
  },
  successText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  emailHighlight: {
    fontWeight: '600',
    color: '#000000',
  },
  successHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  actionButtons: {
    width: '100%',
    gap: 12,
  },
  secondaryButton: {
    marginTop: 12,
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