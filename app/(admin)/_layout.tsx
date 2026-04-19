import { Slot } from 'expo-router';
import { View, Text, Dimensions, StyleSheet, Pressable } from 'react-native';
import { AdminSidebar } from '~/components/admin/Sidebar';
import { Topbar } from '~/components/TopBar';
import { Monitor, Smartphone } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { logout } from '~/store';
import { useAppDispatch } from '~/store/hooks';
import { shadows } from '~/theme';


// Composant pour la vérification de l'écran admin
function AdminScreenSizeGate({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [isInitialized, setIsInitialized] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
  };

  useEffect(() => {
    // Délai pour éviter les faux positifs lors du rafraîchissement
    const initTimer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
      // Si les dimensions changent après l'initialisation, on peut immédiatement réagir
      if (isInitialized) {
        setIsInitialized(true);
      }
    });

    return () => {
      clearTimeout(initTimer);
      subscription?.remove();
    };
  }, [isInitialized]);

  // Vérifier si l'écran est trop petit (largeur < 850px ou hauteur < 500px)
  const isWidthTooSmall = dimensions.width < 850;
  const isHeightTooSmall = dimensions.height < 700;
  const isScreenTooSmall = isWidthTooSmall || isHeightTooSmall;

  // Ne pas afficher la modale si on n'est pas encore initialisé
  // Cela évite les faux positifs lors du rafraîchissement
  if (!isInitialized) {
    return <>{children}</>;
  }

  // Si l'écran est trop petit, afficher le message de blocage
  if (isScreenTooSmall) {
    return (
      <View style={styles.blockedContainer}>
        <View style={styles.blockedContent}>
          {/* Icône principale */}
          <View style={styles.blockedIconContainer}>
            <Monitor size={64} color="#6366F1" strokeWidth={1.5} />
          </View>

          {/* Titre */}
          <Text style={styles.blockedTitle}>
            Interface d'administration
          </Text>

          {/* Message */}
          <Text style={styles.blockedMessage}>
            L'interface d'administration nécessite un écran d'au moins 850px de largeur et 500px de hauteur pour fonctionner correctement.
          </Text>

          {/* Informations techniques */}
          <View style={styles.dimensionsInfo}>
            <Text style={[styles.dimensionsText, isWidthTooSmall && styles.dimensionsTextError]}>
              Largeur actuelle : {Math.round(dimensions.width)}px (min. 850px)
            </Text>
            <Text style={[styles.dimensionsText, isHeightTooSmall && styles.dimensionsTextError]}>
              Hauteur actuelle : {Math.round(dimensions.height)}px (min. 700)
            </Text>
          </View>

          {/* Suggestions */}
          <View style={styles.suggestionsContainer}>
            <View style={styles.suggestionItem}>
              <Monitor size={20} color="#10B981" />
              <Text style={styles.suggestionText}>
                Utilisez un écran plus large ou un ordinateur
              </Text>
            </View>
            <View style={styles.suggestionItem}>
              <Smartphone size={20} color="#F59E0B" />
              <Text style={styles.suggestionText}>
                Interface mobile en développement
              </Text>
            </View>
          </View>

          {/* Bouton de déconnexion */}
          <Pressable
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Se déconnecter</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Afficher le contenu normal si l'écran est assez grand
  return <>{children}</>;
}

export default function AdminLayout() {
  return (
    <AdminScreenSizeGate>
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <Topbar />
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <AdminSidebar />
          <View style={{ flex: 1 }}>
            <Slot />
          </View>
        </View>
      </View>
    </AdminScreenSizeGate>
  );
}

const styles = StyleSheet.create({
  // Styles pour l'écran de blocage admin
  blockedContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  blockedContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    maxWidth: 500,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    ...shadows.bottom,
  },
  blockedIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  blockedTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  blockedMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    maxWidth: 400,
  },
  dimensionsInfo: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    width: '100%',
    alignItems: 'center',
  },
  dimensionsText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 4,
  },
  dimensionsTextError: {
    color: '#DC2626',
    fontWeight: '700',
  },
  suggestionsContainer: {
    width: '100%',
    gap: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  logoutButton: {
    marginTop: 24,
    width: '100%',
    height: 56,
    backgroundColor: '#000000',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    ...shadows.bottom,
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
  },
});