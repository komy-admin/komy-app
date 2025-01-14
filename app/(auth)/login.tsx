import { View } from 'react-native';
import { Button, Input, Text } from '~/components/ui';
import { useState } from 'react';
import { useAppDispatch } from '~/store/hooks';
import { setCredentials, setLoading } from '~/store/auth.slice';
import { router } from 'expo-router';
import { authApiService } from "~/api/auth.api";

export default function LoginScreen() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();

  const handleLogin = async () => {
    try {
      dispatch(setLoading(true));
      const response = await authApiService.login({ loginId, password });
      
      dispatch(setCredentials({
        token: response.token.token,
        accountType: 'admin'
      }));
      
      router.replace('/(admin)/');
    } catch (error) {
      console.error(error);
      // Gérer l'erreur ici
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <View className="flex-1 justify-center p-4 bg-background">
      <Text className="text-2xl font-bold text-foreground mb-8 text-center">
        Restaurant App
      </Text>
      
      <Input
        value={loginId}
        onChangeText={setLoginId}
        placeholder="login"
        className="mb-4"
      />
      
      <Input
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        className="mb-6"
      />
      
      <Button variant="default" onPress={handleLogin}>
        <Text className="text-primary-foreground">Login</Text>
      </Button>
    </View>
  );
}