import { Stack } from 'expo-router';
import { useAppSelector } from '~/store/hooks';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

export default function AuthLayout() {
  const router = useRouter();
  const { token, accountType } = useAppSelector((state) => state.auth);

  // Redirection si déjà authentifié
  useEffect(() => {
    if (token && accountType) {
      router.replace(`/${accountType}/`);
    }
  }, [token, accountType]);

  return (
    <View className="flex-1 bg-background">
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: {
            backgroundColor: 'transparent',
          },
        }}
      >
        <Stack.Screen
          name="login"
          options={{
            title: 'Login',
          }}
        />
        {/* Si vous ajoutez d'autres écrans d'auth (register, forgot-password, etc.) */}
      </Stack>
    </View>
  );
}