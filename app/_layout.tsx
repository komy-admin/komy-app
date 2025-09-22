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
import { authApiService } from '~/api/auth.api';
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

type ProtectedRoutes = {
  server: string[];
  admin: string[];
  superadmin: string[];
  chef: string[];
  manager: string[];
  barman: string[];
};

const PROTECTED_ROUTES: ProtectedRoutes = {
  server: ['(server)'],
  admin: ['(admin)'],
  superadmin: ['(admin)'],
  chef: ['(cook)'],
  manager: ['(admin)'],
  barman: ['(barman)'],
};

const LOGIN_ROUTE = '/login';
const HOME_ROUTES = {
  server: '/(server)',
  admin: '/(admin)',
  superadmin: '/(admin)',
  chef: '/(cook)',
  manager: '/(admin)',
  barman: '/(barman)',
} as const;

const EXCLUDED_ROUTES = ['/(auth)/forgot-password', '/(auth)/reset-password'] as const;

const isLoginRoute = (path: string) => path === LOGIN_ROUTE || path === '/(auth)/login' || path === '/';

const getHomeRouteForRole = (role: string) => HOME_ROUTES[role as keyof typeof HOME_ROUTES];

const hasAccessToRoute = (userRole: string, currentSegment: string) =>
  PROTECTED_ROUTES[userRole as keyof ProtectedRoutes]?.includes(currentSegment);

function AuthenticationGate() {
  const router = useRouter();
  const segments = useSegments();
  const dispatch = useAppDispatch();
  const { token, user: userProfile, isLoggingIn: isLoading } = useSelector((state: RootState) => state.session);
  const authInitialized = useSelector(selectAuthInitialized);
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    console.log('🔍 [AuthGate] Effect déclenché:', {
      authInitialized,
      isInitialized,
      token: !!token,
      userProfile: !!userProfile
    });

    // Protection simple avec Redux state
    if (authInitialized) {
      console.log('🚫 [AuthGate] Initialisation bloquée - déjà fait');
      return;
    }

    const initializeAuth = async () => {
      try {
        const storedToken = await storageService.getItem('token');

        if (storedToken) {
          // Marquer comme initialisé IMMÉDIATEMENT
          dispatch(sessionActions.setAuthInitialized(true));

          console.log('🔑 [AuthGate] Initialisation auth avec token stocké...');
          // D'abord, on indique qu'on est en train de se connecter
          dispatch(sessionActions.loginStart());

          try {
            // Ensuite on charge le vrai user depuis l'API
            const user = await authApiService.getUserWithToken();
            console.log('✅ [AuthGate] Utilisateur récupéré:', user.id);

            // Maintenant on peut faire le loginSuccess avec le vrai user
            dispatch(sessionActions.loginSuccess({
              token: storedToken,
              user: user
            }));

            // On met à jour le profil dans le localStorage pour la prochaine fois
            await storageService.setItem('userProfile', user.profil);
          } catch (error) {
            console.error('❌ [AuthGate] Erreur lors de la récupération utilisateur:', error);
            dispatch(logout());
            // Reset le flag en cas d'erreur pour permettre une nouvelle tentative
            dispatch(sessionActions.setAuthInitialized(false));
          }
        } else {
          console.log('🔑 [AuthGate] Aucun token stocké, utilisateur non connecté');
        }
      } catch (error) {
        console.error('❌ [AuthGate] Erreur lors de l\'initialisation auth:', error);
      } finally {
        // Plus besoin de setLoginLoading ici car loginSuccess/logout le gère
        setIsInitialized(true);
      }
    };

    console.log('🚀 [AuthGate] Lancement initializeAuth...');
    initializeAuth();
  }, [dispatch, authInitialized]);

  React.useEffect(() => {
    if (!isInitialized || isLoading) {
      return;
    }

    const fullPath = segments.length ? `/${segments.join('/')}` : '/';
    if (EXCLUDED_ROUTES.includes(fullPath as any)) return;

    // Si pas de token, rediriger vers login
    if (!token) {
      if (isLoginRoute(fullPath)) {
        return;
      }
      router.replace(LOGIN_ROUTE);
      return;
    }

    // Si on a un token et un user complet avec profil
    if (token && userProfile && userProfile.profil) {
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
  }, [isInitialized, isLoading, token, userProfile, segments, router, dispatch]);

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
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(server)" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="(cook)" />
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