import '~/global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { SplashScreen, useRouter, useSegments } from 'expo-router';
import * as React from 'react';
import { Provider, useSelector } from 'react-redux';
import { PortalHost } from '@rn-primitives/portal';
import { store } from '~/store';
import { RootState } from '~/store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { SocketProvider } from '~/hooks/useSocket/SockerProvider';

export { ErrorBoundary } from 'expo-router';

// Composant pour gérer l'authentification
function AuthenticationGate() {
  const router = useRouter();
  const segments = useSegments();
  const { token, accountType, isLoading } = useSelector((state: RootState) => state.auth);

  React.useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    
    if (isLoading) return;

    if (!token && !inAuthGroup) {
      router.replace('/login');
    } else if (token && accountType) {
      if (inAuthGroup) {
        router.replace(`/(${accountType})/`);
      } else {
        const currentSection = segments[0];
        if (currentSection && !currentSection.includes(accountType)) {
          router.replace(`/(${accountType})/`);
        }
      }
    }
  }, [token, accountType, segments, isLoading]);

  return null;
}

function RootLayoutNav() {
  const [fontsLoaded] = useFonts({
    'Mona-Sans': require('../assets/images/fonts/MonaSans-VariableFont_wdth,wght.ttf'),
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AuthenticationGate />
      <Stack>
        <Stack.Screen
          name="(auth)/login"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(server)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(admin)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(cook)"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <PortalHost />
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <SocketProvider>
          <RootLayoutNav />
        </SocketProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}