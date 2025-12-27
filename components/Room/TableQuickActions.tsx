import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Settings, Edit2, Trash2 } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

interface TableQuickActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

// Constantes pour les dimensions et animations
const BUTTON_SIZE = 56;
const EXPANDED_HEIGHT = 167;
const OVERLAP_OFFSET = -55;
const ANIMATION_DURATION = 200;

// Constantes de couleurs
const COLORS = {
  DARK: '#1E293B',
  INDIGO: '#6366F1',
  WHITE: '#FFFFFF',
  DIVIDER: 'rgba(255, 255, 255, 0.3)',
  RIPPLE: 'rgba(255, 255, 255, 0.1)',
  SHADOW: '#000',
} as const;

/**
 * TableQuickActions - Bouton flottant pour actions rapides sur une table
 *
 * Affiche un bouton circulaire en bas à droite de l'écran.
 * Au clic, une barre verticale grandit vers le haut avec les actions disponibles.
 */
export const TableQuickActions = React.memo<TableQuickActionsProps>(({
  onEdit,
  onDelete,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Ref pour éviter les state updates sur composant unmounted
  const isMountedRef = useRef(true);

  // Cleanup au unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const toggleMenu = useCallback(() => {
    if (isMountedRef.current) {
      setIsMenuOpen(prev => !prev);
    }
  }, []);

  const handleEdit = useCallback(() => {
    if (isMountedRef.current) {
      setIsMenuOpen(false);
    }
    onEdit();
  }, [onEdit]);

  const handleDelete = useCallback(() => {
    if (isMountedRef.current) {
      setIsMenuOpen(false);
    }
    onDelete();
  }, [onDelete]);

  // Animation d'agrandissement vertical du bouton
  const buttonHeightStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(isMenuOpen ? EXPANDED_HEIGHT : BUTTON_SIZE, {
        duration: ANIMATION_DURATION,
      }),
    };
  }, [isMenuOpen]);

  // Animation de rotation de l'icône Settings
  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: withTiming(isMenuOpen ? '45deg' : '0deg', {
            duration: ANIMATION_DURATION,
          }),
        },
      ],
    };
  }, [isMenuOpen]);

  // Animation d'opacité de la topSection
  const topSectionOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isMenuOpen ? 1 : 0, {
        duration: ANIMATION_DURATION,
      }),
    };
  }, [isMenuOpen]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Conteneur qui s'agrandit verticalement */}
      <Animated.View style={[styles.expandingContainer, buttonHeightStyle]}>
        {/* Partie haute - Icônes Modifier/Supprimer */}
        <Animated.View
          style={[styles.topSection, topSectionOpacityStyle]}
          pointerEvents={isMenuOpen ? 'auto' : 'none'}
        >
          <Pressable
            style={styles.actionButton}
            onPress={handleEdit}
            android_ripple={{ color: COLORS.RIPPLE }}
            accessible={true}
            accessibilityLabel="Modifier la table"
            accessibilityRole="button"
            accessibilityHint="Ouvre le formulaire d'édition de la table"
          >
            <Edit2 size={22} color={COLORS.WHITE} strokeWidth={2} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={styles.actionButton}
            onPress={handleDelete}
            android_ripple={{ color: COLORS.RIPPLE }}
            accessible={true}
            accessibilityLabel="Supprimer la table"
            accessibilityRole="button"
            accessibilityHint="Attention : cette action nécessitera une confirmation"
          >
            <Trash2 size={22} color={COLORS.WHITE} strokeWidth={2} />
          </Pressable>
        </Animated.View>
      </Animated.View>

      {/* Partie basse - Cercle sombre HORS du container pour être AU-DESSUS */}
      <View style={styles.bottomSection}>
        <Pressable
          onPress={toggleMenu}
          style={styles.bottomSectionPressable}
          accessible={true}
          accessibilityLabel={isMenuOpen ? "Fermer le menu d'actions" : "Ouvrir le menu d'actions"}
          accessibilityRole="button"
          accessibilityState={{ expanded: isMenuOpen }}
        >
          <Animated.View style={iconAnimatedStyle}>
            <Settings size={24} color={COLORS.WHITE} strokeWidth={2} />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.select({ web: 30, default: 10 }),
    right: Platform.select({ web: 30, default: 25 }),
    width: BUTTON_SIZE,
    zIndex: 1000,
  },
  expandingContainer: {
    width: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    overflow: 'hidden',
    flexDirection: 'column',
    backgroundColor: COLORS.DARK,
    zIndex: 1,
  },
  topSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: BUTTON_SIZE + OVERLAP_OFFSET,
    backgroundColor: COLORS.INDIGO,
    borderBottomLeftRadius: BUTTON_SIZE / 2,
    borderBottomRightRadius: BUTTON_SIZE / 2,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 12,
    gap: 8,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    backgroundColor: COLORS.DARK,
    borderRadius: BUTTON_SIZE / 2,
    zIndex: 999,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  bottomSectionPressable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    width: '100%',
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    width: '60%',
    backgroundColor: COLORS.DIVIDER,
    marginVertical: 3,
  },
});

// Display name pour React DevTools
TableQuickActions.displayName = 'TableQuickActions';
