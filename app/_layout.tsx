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
};

function AuthenticationGate() {
  const router = useRouter();
  const segments = useSegments();
  const dispatch = useAppDispatch();
  const { token, user: userProfile, isLoggingIn: isLoading } = useSelector((state: RootState) => state.session);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const authInitializedRef = React.useRef(false);

  React.useEffect(() => {
    // Protection contre la double exécution (React StrictMode)
    if (authInitializedRef.current) {
      return;
    }

    const initializeAuth = async () => {
      try {
        const storedToken = await storageService.getItem('token');

        if (storedToken) {
          // Marquer comme initialisé avant les appels async
          authInitializedRef.current = true;

          // D'abord, on indique qu'on est en train de se connecter
          dispatch(sessionActions.loginStart());

          try {
            // Ensuite on charge le vrai user depuis l'API
            const user = await authApiService.getUserWithToken();

            // Maintenant on peut faire le loginSuccess avec le vrai user
            dispatch(sessionActions.loginSuccess({
              token: storedToken,
              user: user
            }));

            // On met à jour le profil dans le localStorage pour la prochaine fois
            await storageService.setItem('userProfile', user.profil);
          } catch (error) {
            dispatch(logout());
            // Reset le flag en cas d'erreur pour permettre une nouvelle tentative
            authInitializedRef.current = false;
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        // Plus besoin de setLoginLoading ici car loginSuccess/logout le gère
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [dispatch]);

  React.useEffect(() => {
    if (!isInitialized || isLoading) {
      return;
    }

    const fullPath = segments.length ? `/${segments.join('/')}` : '/';
    if (fullPath === '/(auth)/forgot-password') return
    if (fullPath === '/(auth)/reset-password') return

    // Si pas de token, rediriger vers login
    if (!token) {
      if (fullPath === LOGIN_ROUTE || fullPath === '/(auth)/login') {
        return;
      }
      router.replace(LOGIN_ROUTE);
      return;
    }

    // Si on a un token et un user complet avec profil
    if (token && userProfile && userProfile.profil) {
      // Si on est sur la page de login, rediriger vers la home du profil
      if (fullPath === LOGIN_ROUTE || fullPath === '/(auth)/login' || fullPath === '/') {
        const role = userProfile.profil as keyof typeof HOME_ROUTES;
        if (!role || !HOME_ROUTES[role]) {
          console.error(
            `Invalid or missing user profile detected. Logging out. userProfile.profil: ${userProfile.profil}, role: ${role}, HOME_ROUTES[role]: ${HOME_ROUTES[role]}, current path: ${fullPath}`
          );
          dispatch(logout());
          router.replace(LOGIN_ROUTE);
          return;
        }

        console.log('Redirection vers:', HOME_ROUTES[role]);
        router.replace(HOME_ROUTES[role] as any);
        return;
      }

      // Vérifier si l'utilisateur a accès à la route actuelle
      const firstSegment = segments[0];
      if (firstSegment && !PROTECTED_ROUTES[userProfile.profil as keyof ProtectedRoutes]?.includes(firstSegment)) {
        const role = userProfile.profil as keyof typeof HOME_ROUTES;
        console.log('Accès refusé, redirection vers:', HOME_ROUTES[role]);
        router.replace(HOME_ROUTES[role] as any);
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