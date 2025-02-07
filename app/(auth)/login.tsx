import { View } from 'react-native';
import { Button, Input, Text } from '~/components/ui';
import { useState } from 'react';
import { useAppDispatch } from '~/store/hooks';
import { setCredentials } from '~/store/auth.slice';
import { router } from 'expo-router';
import { authApiService } from "~/api/auth.api";

export default function LoginScreen() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();

  const handleLogin = async () => {
    try {
      const response = await authApiService.login({ loginId, password });
      dispatch(setCredentials({ token: response.token.token, userProfile: response.profil }));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View className="flex-1 items-center justify-center p-4 bg-background">
      <Text className="text-2xl font-bold text-foreground mb-8 text-center">
        Fork'it
      </Text>
      
      <Input
        value={loginId}
        onChangeText={setLoginId}
        placeholder="Identifiant"
        className="mb-4 max-w-md"
      />
      
      <Input
        value={password}
        onChangeText={setPassword}
        placeholder="Mot de passe"
        secureTextEntry
        className="mb-6 max-w-md"
      />
      
      <Button variant="default" onPress={handleLogin}>
        <Text className="text-primary-foreground">Se connecter</Text>
      </Button>
    </View>
  );
}