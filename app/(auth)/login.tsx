import { View } from 'react-native';
import { Button, Text, TextInput } from '~/components/ui';
import { useState } from 'react';
import { useAppDispatch } from '~/store/hooks';
import { setCredentials, setCurrentUser } from '~/store/auth.slice';
import { authApiService } from "~/api/auth.api";
import { router } from 'expo-router';

export default function LoginScreen() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();

  const handleLogin = async () => {
    try {
      const { token, ...user } = await authApiService.login({ loginId, password });
      dispatch(setCredentials({ token: token.token, userProfile: user.profil }));
      dispatch(setCurrentUser(user));
      router.replace(`/${user.profil}/`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View className="flex-1 items-center justify-center p-4 bg-background">
      <Text className="text-2xl font-bold text-foreground mb-8 text-center">
        Fork'it
      </Text>
      
      <TextInput
        id="LoginId"
        value={loginId}
        onChangeText={setLoginId}
        placeholder="Identifiant"
        className="mb-4 max-w-md"
      />
      
      <TextInput
        id="LoginPassword"
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