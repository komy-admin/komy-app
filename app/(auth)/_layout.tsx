import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { useDispatch, useSelector } from 'react-redux';
import { authApiService } from "~/api/auth.api";
import { setCredentials } from '~/store/auth.slice';
import type { RootState } from '~/store';

export default function AuthLayout() {
  const router = useRouter();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const accountType = '(admin)';

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userToken = await authApiService.getToken();
        if (userToken) {
          dispatch(setCredentials({
            token: userToken,
            accountType: accountType
          }));
        }
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