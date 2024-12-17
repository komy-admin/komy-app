import '~/global.css';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeProvider } from '@react-navigation/native';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform } from 'react-native';
import { Provider, useSelector } from 'react-redux';
import { NAV_THEME } from '~/lib/constants';
import { useColorScheme } from '~/lib/useColorScheme';
import { PortalHost } from '@rn-primitives/portal';
import { ThemeToggle } from '~/components/ThemeToggle';
import { setAndroidNavigationBar } from '~/lib/android-navigation-bar';
import { store } from '~/store'; // Nous allons créer ce fichier
import { RootState } from '~/store';
import { SafeAreaView } from 'react-native-safe-area-context';

const LIGHT_THEME: Theme = {
  dark: false,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  dark: true,
  colors: NAV_THEME.dark,
};

export { ErrorBoundary } from 'expo-router';

// Composant pour gérer l'authentification
function AuthenticationGate() {
  const router = useRouter();
  const segments = useSegments();
  const { token, accountType, isLoading } = useSelector((state: RootState) => state.auth);

  React.useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    
    if (isLoading) return;

    console.log('AuthGate', { token, accountType, segments, isLoading });
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
  const { colorScheme, setColorScheme, isDarkColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const theme = await AsyncStorage.getItem('theme');
      if (Platform.OS === 'web') {
        document.documentElement.classList.add('bg-background');
      }
      if (!theme) {
        AsyncStorage.setItem('theme', colorScheme);
        setIsColorSchemeLoaded(true);
        return;
      }
      const colorTheme = theme === 'dark' ? 'light' : 'light';
      if (colorTheme !== colorScheme) {
        setColorScheme(colorTheme);
        setAndroidNavigationBar(colorTheme);
        setIsColorSchemeLoaded(true);
        return;
      }
      setAndroidNavigationBar(colorTheme);
      setIsColorSchemeLoaded(true);
    })().finally(() => {
      SplashScreen.hideAsync();
    });
  }, []);

  if (!isColorSchemeLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={isDarkColorScheme ? LIGHT_THEME : LIGHT_THEME}>
      <StatusBar style={isDarkColorScheme ? 'light' : 'light'} />
      <AuthenticationGate />
      <SafeAreaView className="flex-1 bg-background">
        <Stack>
          <Stack.Screen
            name="(auth)/login"
            options={{
              title: 'Login',
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
      </SafeAreaView>
      <PortalHost />
    </ThemeProvider>
  );
}

// Root component wrapping everything with Redux Provider
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <RootLayoutNav />
      </Provider>
    </GestureHandlerRootView>
  );
}