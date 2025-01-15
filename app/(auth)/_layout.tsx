import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { authApiService } from "~/api/auth.api";

export default function AuthLayout() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const accountType = '(admin)'

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userToken = await authApiService.getToken();
        setToken(userToken);
      } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
      }
    };

    checkAuth();
  }, []);

  // Redirection si déjà authentifié
  useEffect(() => {
    if (token) {
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
      </Stack>
    </View>
  );
}