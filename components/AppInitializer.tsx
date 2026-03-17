import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { useSelector } from 'react-redux';
import { useRouter, useSegments } from 'expo-router';
import { RootState } from '~/store';
import { InitializationProgress, useAppInit } from '~/hooks/useAppInit';
import { useAlertMonitor } from '~/hooks/useAlertMonitor';
import { WebSocketListener } from './WebSocketListener';
import { getHomeRoute } from '~/constants/routes';

interface AppInitializerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AppInitializer: React.FC<AppInitializerProps> = ({
  children,
  fallback
}) => {
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

  // Check if user is properly authenticated
  const isFullyAuthenticated = !!(
    (sessionToken && user) ||
    (authToken && user && isPinVerified)
  );

  // Le hook useAlertMonitor gère automatiquement l'initialisation et les conditions
  useAlertMonitor();

  // Hook simplifié uniquement pour charger les données
  const { progress, progressPercentage } = useAppInit();


  // Redirection après initialisation complète
  useEffect(() => {
    if (isFullyAuthenticated && appInitialized && !isAppInitializing && user?.profil) {
      const fullPath = segments.length ? `/${segments.join('/')}` : '/';

      // Si on est encore sur PIN verification après initialisation complète, rediriger
      if (fullPath === '/(auth)/pin-verification') {
        const homeRoute = getHomeRoute(user.profil);
        router.replace(homeRoute as any);
      }
    }
  }, [isFullyAuthenticated, appInitialized, isAppInitializing, user?.profil, segments, router]);

  // Si pas authentifié, passer directement au contenu (pages de login/pin)
  if (!isFullyAuthenticated) {
    return <>{children}</>;
  }

  const showLoader = !appInitialized || isAppInitializing;

  // Toujours rendre les children (Stack) pour que Expo Router conserve la route.
  // Le loader est affiché en overlay par-dessus quand l'init est en cours.
  return (
    <WebSocketListener>
      {children}
      {showLoader && (
        fallback || (
          <View style={styles.loaderOverlay}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/images/logo_komy_png/Logo_Komy_noirSF.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {progressPercentage >= 90 ? 'Finalisation...' : getCurrentStepLabel(progress)} ({Math.round(progressPercentage)}%)
              </Text>
            </View>
          </View>
        )
      )}
    </WebSocketListener>
  );
};

function getCurrentStepLabel(progress: InitializationProgress): string {
  const steps = [
    { key: 'accountConfig', label: 'Configuration du compte...' },
    { key: 'rooms', label: 'Chargement des salles...' },
    { key: 'tables', label: 'Chargement des tables...' },
    { key: 'itemTypes', label: 'Chargement des types d\'articles...' },
    { key: 'items', label: 'Chargement des articles...' },
    { key: 'menus', label: 'Chargement des menus...' },
    { key: 'tags', label: 'Chargement des tags...' },
    { key: 'users', label: 'Chargement des utilisateurs...' },
    { key: 'orders', label: 'Chargement des commandes...' },
    { key: 'payments', label: 'Chargement des paiements...' }
  ];

  // Trouver la première étape non complétée
  for (const step of steps) {
    if (!progress[step.key]) {
      return step.label;
    }
  }

  // Si toutes les étapes sont complétées, afficher la dernière
  return steps[steps.length - 1].label;
}

const styles = StyleSheet.create({
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
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
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
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
    color: 'rgba(0, 0, 0, 0.7)',
    textAlign: 'center',
    letterSpacing: 0.3,
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }),
  },
  errorContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '80%',
    maxWidth: 400,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#EF4444',
    textAlign: 'center',
    lineHeight: 20,
  },
});
