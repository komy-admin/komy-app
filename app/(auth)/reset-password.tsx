import { View } from 'react-native';
import { Button, Text, TextInput } from '~/components/ui';
import { useState } from 'react';
import { authApiService } from "~/api/auth.api";
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';

export default function LoginScreen() {
  const { token } = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleResetPassword = async () => {
    try {
        setError('');
        if (typeof token === 'string') {
          await authApiService.resetPassword({ token, password });
        } else {
          throw new Error('Invalid token format');
        }
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
        id="password"
        value={password}
        onChangeText={setPassword}
        placeholder="Mot de passe"
        className="mb-4 max-w-md w-full"
      />
      
      <Button 
        variant="default"
        onPress={handleResetPassword}
        className="max-w-md"
      >
        <Text className="text-primary-foreground">réinitialiser mon mot de passe</Text>
      </Button>
    </View>
  );
}