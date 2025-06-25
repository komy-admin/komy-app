import { View, StyleSheet, Platform, Text as RNText, KeyboardAvoidingView, ScrollView } from 'react-native';
import { Button, Text, TextInput } from '~/components/ui';
import { useState } from 'react';
import { useAppDispatch } from '~/store/hooks';
import { setCredentials, setCurrentUser } from '~/store/auth.slice';
import { authApiService } from "~/api/auth.api";
import { router, Link } from 'expo-router';

export default function LoginScreen() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();

  const handleLogin = async () => {
    try {
      const { token, ...user } = await authApiService.login({ loginId, password });
      dispatch(setCredentials({ token: token.token, userProfile: user.profil }));
      dispatch(setCurrentUser(user));
      router.replace(`/${user.profil}/` as any);
    } catch (error) {
      console.error(error);
    }
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
          <RNText style={styles.title}>
            Fork'it
          </RNText>

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