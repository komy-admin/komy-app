import React, { useState, useEffect } from 'react';
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
import { ChevronLeft, Lock, Eye, EyeOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const router = useRouter();
  const { showToast } = useToast();
  const { token } = useLocalSearchParams<{ token: string }>();

  useEffect(() => {
    if (!token) {
      showToast('Lien invalide. Veuillez demander un nouveau lien.', 'error');
      router.replace('/login');
    }
  }, [token]);

  const validatePassword = () => {
    if (password.length < 6) {
      showToast('Le mot de passe doit contenir au moins 6 caractères', 'error');
      return false;
    }

    if (password !== confirmPassword) {
      showToast('Les mots de passe ne correspondent pas', 'error');
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return false;
    }

    return true;
  };

  const handleResetPassword = async () => {
    if (!validatePassword() || !token || isLoading) return;

    setIsLoading(true);

    try {
      await authApiService.resetPassword({
        token: token as string,
        password
      });

      setIsSuccess(true);
      showToast('Mot de passe réinitialisé avec succès!', 'success');

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.replace('/login');
      }, 2000);

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la réinitialisation';
      showToast(errorMessage, 'error');

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      // If token is invalid or expired
      if (error.response?.status === 400 || error.response?.status === 404) {
        setTimeout(() => {
          router.replace('/forgot-credentials?type=password');
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.replace('/login');
  };

  if (isSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>✅</Text>
          </View>
          <RNText style={styles.successTitle}>Mot de passe réinitialisé!</RNText>
          <Text style={styles.successText}>
            Vous allez être redirigé vers la page de connexion...
          </Text>
        </View>
      </View>
    );
  }

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
            <View style={styles.iconContainer}>
              <Lock size={48} color="#6366F1" />
            </View>
            <RNText style={styles.title}>
              Nouveau mot de passe
            </RNText>
            <Text style={styles.subtitle}>
              Créez un nouveau mot de passe sécurisé pour votre compte
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                id="password"
                value={password}
                onChangeText={setPassword}
                placeholder="Entrez votre nouveau mot de passe"
                secureTextEntry={!showPassword}
                style={styles.input}
                placeholderTextColor="#9CA3AF"
                editable={!isLoading}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Button
                variant="ghost"
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </Button>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirmer le mot de passe</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                id="confirmPassword"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirmez votre nouveau mot de passe"
                secureTextEntry={!showConfirmPassword}
                style={styles.input}
                placeholderTextColor="#9CA3AF"
                editable={!isLoading}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Button
                variant="ghost"
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </Button>
            </View>
          </View>

          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Le mot de passe doit :</Text>
            <Text style={[styles.requirement, password.length >= 6 && styles.requirementMet]}>
              • Contenir au moins 6 caractères
            </Text>
            <Text style={[styles.requirement, password === confirmPassword && password.length > 0 && styles.requirementMet]}>
              • Correspondre à la confirmation
            </Text>
          </View>

          <Button
            variant="default"
            onPress={handleResetPassword}
            disabled={isLoading || !password || !confirmPassword}
            style={styles.submitButton}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </Text>
          </Button>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              ℹ️ Après la réinitialisation, vous devrez vous connecter avec votre nouveau mot de passe.
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
  iconContainer: {
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingRight: 50,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  eyeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: 56,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requirementsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  requirement: {
    fontSize: 14,
    color: '#6B7280',
    marginVertical: 4,
  },
  requirementMet: {
    color: '#10B981',
    fontWeight: '500',
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
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIcon: {
    marginBottom: 24,
  },
  successEmoji: {
    fontSize: 72,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});