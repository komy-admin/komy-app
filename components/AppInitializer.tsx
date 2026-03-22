import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { AuthBackground } from '~/components/auth/AuthBackground';
import { useSelector } from 'react-redux';
import { useRouter, useSegments } from 'expo-router';
import { RootState } from '~/store';
import { InitializationProgress, useAppInit } from '~/hooks/useAppInit';
import { WebSocketListener } from './WebSocketListener';
import { getHomeRoute } from '~/constants/routes';

const INIT_STEPS = [
  { key: 'accountConfig', label: 'Configuration du compte...' },
  { key: 'rooms', label: 'Chargement des salles...' },
  { key: 'tables', label: 'Chargement des tables...' },
  { key: 'itemTypes', label: 'Chargement des types d\'articles...' },
  { key: 'items', label: 'Chargement des articles...' },
  { key: 'menus', label: 'Chargement des menus...' },
  { key: 'tags', label: 'Chargement des tags...' },
  { key: 'users', label: 'Chargement des utilisateurs...' },
  { key: 'orders', label: 'Chargement des commandes...' },
  { key: 'payments', label: 'Chargement des paiements...' },
] as const;

function getCurrentStepLabel(progress: InitializationProgress): string {
  for (const step of INIT_STEPS) {
    if (!progress[step.key]) {
      return step.label;
    }
  }
  return INIT_STEPS[INIT_STEPS.length - 1].label;
}

export const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const segments = useSegments();
  const {
    sessionToken,
    user,
    isPinVerified,
    authToken,
    appInitialized,
    isAppInitializing
  } = useSelector((state: RootState) => state.session);

  const isFullyAuthenticated = !!(
    (sessionToken && user) ||
    (authToken && user && isPinVerified)
  );

  const { progress, progressPercentage, initializeApp } = useAppInit();

  const onPinRoute = segments.join('/') === '(auth)/pin-verification';
  const shouldShowLoader = isFullyAuthenticated && (!appInitialized || isAppInitializing || onPinRoute);

  // Retarder la disparition de l'overlay pour laisser la nouvelle route se peindre
  const [showLoader, setShowLoader] = useState(false);
  useEffect(() => {
    if (shouldShowLoader) {
      setShowLoader(true);
    } else {
      const timer = setTimeout(() => setShowLoader(false), 100);
      return () => clearTimeout(timer);
    }
  }, [shouldShowLoader]);

  // Lancer l'initialisation une fois l'image de fond réellement affichée
  const hasTriggeredInit = React.useRef(false);
  const fallbackTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerInit = React.useCallback(() => {
    if (!hasTriggeredInit.current && isFullyAuthenticated && !appInitialized && !isAppInitializing) {
      hasTriggeredInit.current = true;
      // Micro-delay pour laisser le frame se peindre après onLoad
      requestAnimationFrame(() => initializeApp());
    }
  }, [isFullyAuthenticated, appInitialized, isAppInitializing, initializeApp]);

  const handleBackgroundReady = React.useCallback(() => {
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    triggerInit();
  }, [triggerInit]);

  // Fallback si onLoad ne se déclenche jamais (image corrompue, erreur mémoire)
  useEffect(() => {
    if (shouldShowLoader && !hasTriggeredInit.current) {
      fallbackTimer.current = setTimeout(() => triggerInit(), 1500);
      return () => {
        if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
      };
    }
  }, [shouldShowLoader, triggerInit]);

  useEffect(() => {
    if (!showLoader) {
      hasTriggeredInit.current = false;
      if (fallbackTimer.current) {
        clearTimeout(fallbackTimer.current);
        fallbackTimer.current = null;
      }
    }
  }, [showLoader]);

  // Redirection après initialisation complète
  useEffect(() => {
    if (isFullyAuthenticated && appInitialized && !isAppInitializing && user?.profil) {
      if (onPinRoute) {
        const homeRoute = getHomeRoute(user.profil);
        router.replace(homeRoute as any);
      }
    }
  }, [isFullyAuthenticated, appInitialized, isAppInitializing, user?.profil, onPinRoute, router]);

  // Pas authentifié → passer directement au contenu (login/pin)
  if (!isFullyAuthenticated) {
    return <>{children}</>;
  }

  // Toujours rendre children (Stack) pour que Expo Router conserve la route.
  // Le loader est un overlay par-dessus.
  return (
    <WebSocketListener>
      {children}
      {showLoader && (
        <View style={styles.loaderOverlay} onLayout={handleBackgroundReady}>
          <AuthBackground />

          <View style={styles.contentContainer}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/images/logo_komy_png/Logo_Komy_blancSF.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${appInitialized ? 100 : isAppInitializing ? progressPercentage : 0}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {appInitialized
                  ? 'Finalisation...'
                  : !isAppInitializing
                    ? 'Préparation...'
                    : progressPercentage >= 90
                      ? 'Finalisation...'
                      : getCurrentStepLabel(progress)
                } ({Math.round(appInitialized ? 100 : isAppInitializing ? progressPercentage : 0)}%)
              </Text>
            </View>
          </View>
        </View>
      )}
    </WebSocketListener>
  );
};

const styles = StyleSheet.create({
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 200,
    height: 200,
  },
  progressContainer: {
    width: 320,
    maxWidth: 400,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(42, 46, 51, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2A2E33',
    borderRadius: 3,
    minWidth: 6,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: 0.3,
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }),
  },
});
