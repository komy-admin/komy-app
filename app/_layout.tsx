import '~/global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SplashScreen } from 'expo-router';
import * as React from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { PortalHost } from '@rn-primitives/portal';
import { store, RootState } from '~/store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { SocketProvider } from '~/hooks/useSocket/SockerProvider';
import { storageService } from '~/lib/storageService';
import { sessionActions, logout } from '~/store';
import { selectAuthInitialized } from '~/store/slices/session.slice';
import { useAppDispatch } from '~/store/hooks';
import { sessionService } from '~/services/SessionService';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';
import { ToastProvider } from '@/components/ToastProvider';
import { AppInitializer } from '~/components/AppInitializer';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

export { ErrorBoundary } from 'expo-router';

import { HOME_ROUTES, PROTECTED_ROUTES, LOGIN_ROUTE, getHomeRoute, ProtectedRoutes } from '~/constants/routes';
const EXCLUDED_ROUTES = [
  '/(auth)/forgot-password',
  '/(auth)/reset-password',
  '/(auth)/setup-account',
  '/(auth)/reset-pin',
  '/(auth)/forgot-credentials'
] as const;

const isLoginRoute = (path: string) => path === LOGIN_ROUTE || path === '/(auth)/login' || path === '/';

const getHomeRouteForRole = (role: string) => HOME_ROUTES[role as keyof typeof HOME_ROUTES];

const hasAccessToRoute = (userRole: string, currentSegment: string) =>
  PROTECTED_ROUTES[userRole as keyof ProtectedRoutes]?.includes(currentSegment);

function AuthenticationGate() {
  const router = useRouter();
  const segments = useSegments();
  const dispatch = useAppDispatch();
  const authInitialized = useSelector(selectAuthInitialized);
  const {
    authToken,
    sessionToken,
    user: userProfile,
    isAuthenticated,
    isLoggingIn: isLoading,
    requiresPin,
    requiresPinSetup,
    isPinVerified
  } = useSelector((state: RootState) => state.session);
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    // Protection simple avec Redux state
    if (authInitialized) {
      console.log('🚫 [AuthGate] Initialisation bloquée - déjà fait');
      return;
    }

    const initializeAuth = async () => {
      try {
        // Initialize session to check for stored authToken
        const sessionStatus = await sessionService.initialize();

        if (!sessionStatus.requireLogin) {
          // Marquer comme initialisé IMMÉDIATEMENT
          dispatch(sessionActions.setAuthInitialized(true));
        }
      } catch (error) {
        console.error('❌ [AuthGate] Erreur lors de l\'initialisation auth:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [dispatch, authInitialized]);

  React.useEffect(() => {
    if (!isInitialized || isLoading) {
      return;
    }

    const fullPath = segments.length ? `/${segments.join('/')}` : '/';
    if (EXCLUDED_ROUTES.includes(fullPath as any)) return;

    // Allow setup-account route without authentication (it has its own token validation)
    if (fullPath === '/(auth)/setup-account') {
      // If already authenticated, redirect to home
      if (sessionToken && userProfile && userProfile.profil) {
        const targetRoute = getHomeRoute(userProfile.profil);
        router.replace(targetRoute as any);
        return;
      }
      // Otherwise allow access to setup-account
      return;
    }

    // Allow PIN verification route when authToken exists but no sessionToken
    if (fullPath === '/(auth)/pin-verification') {
      if (authToken && !sessionToken) {
        return; // Allow access to PIN verification
      } else if (sessionToken && userProfile && userProfile.profil) {
        // If already authenticated, redirect to home
        const targetRoute = getHomeRoute(userProfile.profil);
        router.replace(targetRoute as any);
        return;
      } else {
        // No authToken, redirect to login
        router.replace(LOGIN_ROUTE);
        return;
      }
    }

    // If no authToken at all, redirect to login
    if (!authToken) {
      if (fullPath === LOGIN_ROUTE || fullPath === '/(auth)/login') {
        return;
      }
      router.replace(LOGIN_ROUTE);
      return;
    }

    // Check if PIN verification is required
    // User has authToken but no sessionToken
    if (authToken && !sessionToken && !isAuthenticated) {
      if (fullPath !== '/(auth)/pin-verification') {
        router.replace('/pin-verification');
        return;
      }
      return;
    }

    // If we have both tokens and user is authenticated
    if (sessionToken && userProfile && userProfile.profil && isAuthenticated) {
      // Si on est sur la page de login, rediriger vers la home du profil
      if (isLoginRoute(fullPath)) {
        const homeRoute = getHomeRouteForRole(userProfile.profil);
        if (!homeRoute) {
          console.error(
            `Invalid or missing user profile detected. Logging out. userProfile.profil: ${userProfile.profil}, current path: ${fullPath}`
          );
          dispatch(logout());
          router.replace(LOGIN_ROUTE);
          return;
        }

        console.log('🔄 [AuthGate] Redirection vers:', homeRoute);
        router.replace(homeRoute as any);
        return;
      }

      // Vérifier si l'utilisateur a accès à la route actuelle
      const firstSegment = segments[0];
      if (firstSegment && !hasAccessToRoute(userProfile.profil, firstSegment)) {
        const homeRoute = getHomeRouteForRole(userProfile.profil);
        console.log('Accès refusé, redirection vers:', homeRoute);
        router.replace(homeRoute as any);
        return;
      }
    }
  }, [isInitialized, isLoading, authToken, sessionToken, isAuthenticated, userProfile, segments, router, dispatch, requiresPin, requiresPinSetup, isPinVerified]);

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
      <AppInitializer>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(server)" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="(cook)" />
          <Stack.Screen name="(barman)" />
        </Stack>
      </AppInitializer>
      <PortalHost />
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <ToastProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <SocketProvider>
            <RootLayoutNav />
          </SocketProvider>
        </Provider>
      </GestureHandlerRootView>
    </ToastProvider>
  );
}