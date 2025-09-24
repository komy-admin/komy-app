import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Image, Animated } from 'react-native';
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

// Composant d'animation ripple synchronisé avec le logo
const RippleWave: React.FC = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createRipple = () => {
      // Démarrer l'onde
      opacityAnim.setValue(0.3);
      scaleAnim.setValue(1);

      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    };

    // Première onde après 2000ms (après le premier cycle complet du logo)
    setTimeout(createRipple, 2000);

    // Ensuite, créer une onde toutes les 2000ms (synchronisé avec chaque diminution)
    const interval = setInterval(() => {
      createRipple();
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.rippleWave,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    />
  );
};

// Composant d'animation du logo
const LogoPulse: React.FC = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(animate); // Répéter l'animation
    };

    animate();
  }, []);

  return (
    <Animated.View style={[styles.logoAnimated, { transform: [{ scale: scaleAnim }] }]}>
      <Image
        source={require('~/assets/images/icone_fork_it.png')}
        style={styles.logoImage}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

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
  const { progress, progressPercentage, isFinalizingStage } = useAppInit();


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

  // Si pas authentifié, passer directement au contenu (pages de login)
  if (!isFullyAuthenticated) {
    return <>{children}</>;
  }

  // Si authentifié mais app pas encore initialisée ou en cours d'initialisation → afficher loader
  if (!appInitialized || isAppInitializing) {
    return fallback || (
      <View style={styles.container}>
        {/* Logo avec effet d'onde ripple */}
        <View style={styles.logoContainer}>
          {/* Logo avec pulsation */}
          <LogoPulse />

          {/* Onde ripple synchronisée */}
          <RippleWave />
        </View>

        {/* Barre de progression */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {isFinalizingStage ? 'Finalisation...' : getCurrentStepLabel(progress)} ({Math.round(progressPercentage)}%)
          </Text>
        </View>

      </View>
    );
  }

  // App initialisée, afficher le contenu principal avec les listeners WebSocket
  return (
    <WebSocketListener>
      {children}
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
    { key: 'users', label: 'Chargement des utilisateurs...' },
    { key: 'orders', label: 'Chargement des commandes...' }
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  rippleWave: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  logoAnimated: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  logoImage: {
    width: 140,
    height: 140,
    tintColor: undefined,
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
