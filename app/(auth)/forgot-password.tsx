import { View } from 'react-native';
import { Button, Text, TextInput } from '~/components/ui';
import { useState } from 'react';
import { authApiService } from "~/api/auth.api";
import { router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleForgotPassword = async () => {
    try {
        setError('');
        await authApiService.forgotPassword({ email });
        router.replace('login' as any);
    } catch (err) {
        setError('Identifiants incorrects');
        console.error(err);
    }
  };

  return (
    <View className="flex-1 items-center justify-center p-4 bg-background">
      <Text className="text-2xl font-bold text-foreground mb-8 text-center">
        Fork'it
      </Text>
      
      {error ? (
        <Text className="text-red-500 mb-4 text-sm">{error}</Text>
      ) : null}

      <TextInput
        id="email"
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        className="mb-4 max-w-md w-full"
      />
      
      <Button 
        variant="default"
        onPress={handleForgotPassword}
        className="max-w-md"
      >
        <Text className="text-primary-foreground">Envoyer un email de réinitialisation</Text>
      </Button>
    </View>
  );
}