import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { authApiService } from "~/api/auth.api";
import { UserProfile } from "~/types/user.types";

export default function AuthLayout() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userToken = await authApiService.getToken();
        const userProfile = await authApiService.getUserProfile();
        setToken(userToken);
        setUserProfile(userProfile);
      } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
      }
    };

    checkAuth();
  }, []);

  // Redirection si déjà authentifié
  useEffect(() => {
    if (token) {
      router.replace(`/${userProfile}/`);
    }
  }, [token, userProfile]);

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