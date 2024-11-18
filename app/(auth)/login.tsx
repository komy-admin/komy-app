import { View } from 'react-native';
import { Button, Input, Text } from '~/components/ui';
import { useState } from 'react';
import { useAppDispatch } from '~/store/hooks';
import { setCredentials } from '~/store/auth.slice';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();

  const handleLogin = async () => {
    try {
      // Simuler un appel API - À remplacer par votre vrai appel API
      // const response = await loginAPI({ username, password });
      const mockResponse = {
        token: 'fake-token',
        accountType: 'server' as const,
      };
      
      dispatch(setCredentials(mockResponse));
      router.replace('/(server)/');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View className="flex-1 justify-center p-4 bg-background">
      <Text className="text-2xl font-bold text-foreground mb-8 text-center">
        Restaurant App
      </Text>
      
      <Input
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
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