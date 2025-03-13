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

export { ErrorBoundary } from 'expo-router';

// Types pour les routes protégées
type ProtectedRoutes = {
  server: string[];
  admin: string[];
  superadmin: string[];
  chef: string[];
};

const PROTECTED_ROUTES: ProtectedRoutes = {
  server: ['(server)'],
  admin: ['(admin)'],
  superadmin: ['(admin)'],
  chef: ['(cook)'],
};

const PUBLIC_ROUTES = ['(auth)'];

function AuthenticationGate() {
  const router = useRouter();
  const segments = useSegments();
  const dispatch = useDispatch();
  const { token, userProfile, isLoading, currentUser } = useSelector((state: RootState) => state.auth);

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
          if (!currentUser) {
            const user = await authApiService.getUserWithToken();
            dispatch(setCurrentUser(user));
          }
        } else {
          dispatch(setLoading(false));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        dispatch(setLoading(false));
      }
    };
  
    initializeAuth();
  }, [dispatch]);
  
  const checkAccess = React.useCallback(() => {
    const currentSegment = segments[0];

    if (isLoading) return;
  
    if (!token) {
      if (!PUBLIC_ROUTES.includes(currentSegment)) {
        router.replace('/login');
      }
      return;
    }
    if (!userProfile) {
      router.replace('/login');
      return;
    }
    const authorizedRoutes = PROTECTED_ROUTES[userProfile as keyof ProtectedRoutes];
    
    if (PUBLIC_ROUTES.includes(currentSegment)) {
      router.replace(`/${PROTECTED_ROUTES[userProfile]}/`);
    } else if (currentSegment && !authorizedRoutes.includes(currentSegment)) {
      router.replace(`/${PROTECTED_ROUTES[userProfile]}/`);
    }
  }, [token, userProfile, segments, isLoading, router]);

  React.useEffect(() => {
    checkAccess();
  }, [checkAccess]);

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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(server)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(cook)" />
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