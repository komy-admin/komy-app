import '~/global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SplashScreen } from 'expo-router';
import * as Linking from 'expo-linking';
import * as React from 'react';
import { Provider, useSelector } from 'react-redux';
import { PortalHost } from '@rn-primitives/portal';
import { store, RootState } from '~/store';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState, AppStateStatus, Platform, Keyboard, Dimensions, TouchableWithoutFeedback, View } from 'react-native';
import { useFonts } from 'expo-font';
import { SocketProvider } from '~/hooks/useSocket/SockerProvider';
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
import { PanelPortalProvider } from '~/hooks/usePanelPortal';
import { KeyboardProviderWrapper } from '~/components/Keyboard';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

export { ErrorBoundary } from 'expo-router';

import { HOME_ROUTES, PROTECTED_ROUTES, LOGIN_ROUTE, getHomeRoute, ProtectedRoutes } from '~/constants/routes';
const EXCLUDED_ROUTES = [
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
    // Si déjà initialisé (ex: remount après AppInitializer switch), synchroniser le state local
    if (authInitialized) {
      setIsInitialized(true);
      return;
    }

    const initializeAuth = async () => {
      try {
        await sessionService.initialize();
      } catch (error) {
        console.error('[AuthGate] Auth initialization error:', error);
      } finally {
        dispatch(sessionActions.setAuthInitialized(true));
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [dispatch, authInitialized]);

  // Handle deep links for QR login
  React.useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { hostname, path, queryParams } = Linking.parse(event.url);

      // Handle komy://auth/qr-login?token=xxx
      if (hostname === 'auth' && path === 'qr-login' && queryParams?.token) {
        const token = queryParams.token as string;
        // Navigate to QR login with token
        router.push({
          pathname: '/(auth)/login',
          params: { qrToken: token }
        });
      }
    };

    // Listen for incoming deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle initial deep link (app opened via link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  // Auto-lock on app resume — WebSocket events are lost in background, force re-init
  const wasInBackgroundRef = React.useRef(false);

  React.useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        wasInBackgroundRef.current = true;
        return;
      }

      if (nextAppState === 'active' && isAuthenticated && wasInBackgroundRef.current) {
        wasInBackgroundRef.current = false;
        // Force lock/standby to trigger full data re-init on unlock
        if (userProfile?.skipPinRequired) {
          sessionService.clearSessionStandby();
          router.replace('/standby');
        } else {
          sessionService.clearSession();
          router.replace('/pin-verification');
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, userProfile, router]);

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

    // Device verification: loginToken required (no authToken yet)
    if (fullPath === '/(auth)/device-verification') {
      return;
    }

    // PIN verification: authToken required, AppInitializer handles redirect after init
    if (fullPath === '/(auth)/pin-verification') {
      if (!authToken) {
        router.replace(LOGIN_ROUTE);
      }
      return;
    }

    // Standby screen: authToken required, no sessionToken needed
    if (fullPath === '/(auth)/standby') {
      if (!authToken) {
        router.replace(LOGIN_ROUTE);
        return;
      }
      // If not fully authenticated, stay on standby (waiting for unlock)
      if (!sessionToken || !isAuthenticated) {
        return;
      }
      // Fully authenticated → fall through to redirect to home
    }

    // If no authToken at all, redirect to login
    if (!authToken) {
      if (fullPath === LOGIN_ROUTE || fullPath === '/(auth)/login') {
        return;
      }
      router.replace(LOGIN_ROUTE);
      return;
    }

    // Check if PIN verification or standby is required
    // User has authToken but no sessionToken
    if (authToken && !sessionToken && !isAuthenticated) {
      // skipPinRequired users go to standby, others to PIN
      if (userProfile?.skipPinRequired) {
        if (fullPath !== '/(auth)/standby') {
          router.replace('/standby');
          return;
        }
        return;
      }
      if (fullPath !== '/(auth)/pin-verification') {
        router.replace('/pin-verification');
        return;
      }
      return;
    }

    // If we have both tokens and user is authenticated
    if (sessionToken && userProfile && userProfile.profil && isAuthenticated) {
      // Rediriger depuis login ou standby (après unlock) vers home
      if (isLoginRoute(fullPath) || fullPath === '/(auth)/standby') {
        const homeRoute = getHomeRouteForRole(userProfile.profil);
        if (!homeRoute) {
          console.error(
            `Invalid or missing user profile detected. Logging out. userProfile.profil: ${userProfile.profil}, current path: ${fullPath}`
          );
          dispatch(logout());
          router.replace(LOGIN_ROUTE);
          return;
        }

        router.replace(homeRoute as any);
        return;
      }

      // Vérifier si l'utilisateur a accès à la route actuelle
      const firstSegment = segments[0];
      if (firstSegment && !hasAccessToRoute(userProfile.profil, firstSegment)) {
        const homeRoute = getHomeRouteForRole(userProfile.profil);
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
    'material-community': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'),
  });
  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Fermer le clavier automatiquement lors d'un changement d'orientation
  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      // Dismiss keyboard on orientation change
      Keyboard.dismiss();
    });

    return () => subscription?.remove();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const content = (
    <View style={{ flex: 1 }}>
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
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {Platform.OS !== 'web' ? (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          {content}
        </TouchableWithoutFeedback>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProviderWrapper
            statusBarTranslucent={true}
            navigationBarTranslucent={Platform.OS === 'android'}
            preload={true}
          >
            <Provider store={store}>
              <SocketProvider>
                <PanelPortalProvider>
                  <RootLayoutNav />
                </PanelPortalProvider>
              </SocketProvider>
            </Provider>
          </KeyboardProviderWrapper>
        </GestureHandlerRootView>
        {/* ✅ PortalHost au niveau root pour que les Portals fonctionnent partout */}
        <PortalHost />
      </ToastProvider>
    </SafeAreaProvider>
  );
}