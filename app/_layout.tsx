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
import { setCredentials, setCurrentUser, setLoading } from '~/store/auth.slice';
import { UserProfile } from '~/types/user.types';
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
};

const PROTECTED_ROUTES: ProtectedRoutes = {
  server: ['(server)'],
  admin: ['(admin)'],
  superadmin: ['(admin)'],
  chef: ['(cook)'],
  manager: ['(admin)'],
};

const LOGIN_ROUTE = '/login';
const HOME_ROUTES = {
  server: '/(server)',
  admin: '/(admin)',
  superadmin: '/(admin)',
  chef: '/(cook)',
  manager: '/(admin)',
};

function AuthenticationGate() {
  const router = useRouter();
  const segments = useSegments();
  const dispatch = useDispatch();
  const { token, userProfile, isLoading } = useSelector((state: RootState) => state.auth);
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await storageService.getItem('token');
        const storedUserProfile = await storageService.getItem('userProfile');

        if (storedToken && storedUserProfile) {
          dispatch(setCredentials({
            token: storedToken,
            userProfile: storedUserProfile as UserProfile
          }));

          try {
            const user = await authApiService.getUserWithToken();
            dispatch(setCurrentUser(user));
          } catch (error) {
            await storageService.removeItem('token');
            await storageService.removeItem('userProfile');
            dispatch(setCredentials({ token: null, userProfile: null }));
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        dispatch(setLoading(false));
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
    if (!token) {
      if (fullPath === LOGIN_ROUTE || fullPath === '/(auth)/login') {
        return;
      }

      router.replace(LOGIN_ROUTE);
      return;
    }

    if (token && userProfile) {
      if (fullPath === LOGIN_ROUTE || fullPath === '/(auth)/login') {
        const role = userProfile as keyof typeof HOME_ROUTES;
        if (!role || !HOME_ROUTES[role]) {
          dispatch(setCredentials({ token: null, userProfile: null }));
          router.replace(LOGIN_ROUTE);
          return;
        }

        router.replace(HOME_ROUTES[role] as any);
        return;
      }

      const firstSegment = segments[0];
      if (firstSegment && !PROTECTED_ROUTES[userProfile as keyof ProtectedRoutes]?.includes(firstSegment)) {
        const role = userProfile as keyof typeof HOME_ROUTES;
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