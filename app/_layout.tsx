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
import { setAndroidNavigationBar } from '~/lib/android-navigation-bar';
import { store } from '~/store';
import { RootState } from '~/store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from '~/src/contexts/AuthContext';

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
  const { user, loading: authLoading } = useAuth();

  React.useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    
    if (isLoading || authLoading) return;

    console.log('AuthGate', { token, accountType, user, segments, isLoading });
    
    if (!token && !user && !inAuthGroup) {
      // bug ?
      router.replace('/login');
    } else if (token && accountType && user) {
      if (inAuthGroup) {
        router.replace(`/(${accountType})/`);
      } else {
        const currentSection = segments[0];
        if (currentSection && !currentSection.includes(accountType)) {
          router.replace(`/(${accountType})/`);
        }
      }
    }
  }, [token, accountType, user, segments, isLoading, authLoading]);

  return null;
}

function RootLayoutNav() {
  const { colorScheme, setColorScheme, isDarkColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

  const [fontsLoaded] = useFonts({
    'Mona-Sans': require('../assets/images/fonts/MonaSans-VariableFont_wdth,wght.ttf'),
  })

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
      if (fontsLoaded) SplashScreen.hideAsync();
    });
  }, [fontsLoaded]);

  if (!isColorSchemeLoaded || !fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={isDarkColorScheme ? LIGHT_THEME : LIGHT_THEME}>
      <StatusBar style={isDarkColorScheme ? 'light' : 'light'} />
      <AuthenticationGate />
      <PortalHost />
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
    </ThemeProvider>
  );
}

// Root component wrapping everything with Redux Provider and AuthProvider
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}