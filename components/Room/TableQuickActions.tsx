import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Settings, PenSquare, Trash2 } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

interface TableQuickActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

// Constantes pour les dimensions et animations
const BUTTON_SIZE = 64;
const BUTTON_SPACING = 10;
const ANIMATION_DURATION = 200;
const EXPANDED_HEIGHT = (BUTTON_SIZE * 3) + (BUTTON_SPACING * 2);

// Constantes de couleurs
const COLORS = {
  SETTINGS: '#1E293B',
  EDIT: '#6366F1',
  DELETE: '#EF4444',
  WHITE: '#FFFFFF',
  SHADOW: '#000',
} as const;

/**
 * TableQuickActions - Boutons flottants pour actions rapides sur une table
 *
 * Design: 3 boutons ronds empilés verticalement
 * - Settings (bas) : toggle open/close
 * - Delete (milieu) : rouge avec poubelle
 * - Edit (haut) : bleu avec crayon
 */
export const TableQuickActions = React.memo<TableQuickActionsProps>(({
  onEdit,
  onDelete,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const handleEdit = useCallback(() => {
    setIsMenuOpen(false);
    onEdit();
  }, [onEdit]);

  const handleDelete = useCallback(() => {
    setIsMenuOpen(false);
    onDelete();
  }, [onDelete]);

  // Animation rotation icône Settings (45°)
  const settingsIconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: withTiming(isMenuOpen ? '45deg' : '0deg', { duration: ANIMATION_DURATION }) },
    ],
  }), [isMenuOpen]);

  // Animation bouton Delete (1er au-dessus de settings)
  const deleteButtonStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: withTiming(isMenuOpen ? -(BUTTON_SIZE + BUTTON_SPACING) : 0, { duration: ANIMATION_DURATION }) },
    ],
    opacity: withTiming(isMenuOpen ? 1 : 0, { duration: ANIMATION_DURATION }),
  }), [isMenuOpen]);

  // Animation bouton Edit (2ème au-dessus de settings)
  const editButtonStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: withTiming(isMenuOpen ? -((BUTTON_SIZE + BUTTON_SPACING) * 2) : 0, { duration: ANIMATION_DURATION }) },
    ],
    opacity: withTiming(isMenuOpen ? 1 : 0, { duration: ANIMATION_DURATION }),
  }), [isMenuOpen]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Bouton Edit (bleu, crayon) - en haut */}
      {isMenuOpen && (
        <Animated.View style={[styles.actionButton, styles.editButton, editButtonStyle]}>
          <Pressable
            style={styles.buttonPressable}
            onPress={handleEdit}
            accessibilityLabel="Modifier la table"
            accessibilityRole="button"
          >
            <PenSquare size={24} color={COLORS.WHITE} strokeWidth={2} />
          </Pressable>
        </Animated.View>
      )}

      {/* Bouton Delete (rouge, poubelle) - au milieu */}
      {isMenuOpen && (
        <Animated.View style={[styles.actionButton, styles.deleteButton, deleteButtonStyle]}>
          <Pressable
            style={styles.buttonPressable}
            onPress={handleDelete}
            accessibilityLabel="Supprimer la table"
            accessibilityRole="button"
          >
            <Trash2 size={24} color={COLORS.WHITE} strokeWidth={2} />
          </Pressable>
        </Animated.View>
      )}

      {/* Bouton Settings (gris foncé) - toujours visible en bas */}
      <View style={[styles.actionButton, styles.settingsButton]}>
        <Pressable
          style={styles.buttonPressable}
          onPress={toggleMenu}
          accessibilityLabel={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          accessibilityRole="button"
          accessibilityState={{ expanded: isMenuOpen }}
        >
          <Animated.View style={settingsIconStyle}>
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
    height: EXPANDED_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  actionButton: {
    position: 'absolute',
    bottom: 0,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonPressable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BUTTON_SIZE / 2,
  },
  settingsButton: {
    backgroundColor: COLORS.SETTINGS,
    zIndex: 3,
  },
  editButton: {
    backgroundColor: COLORS.EDIT,
    zIndex: 1,
  },
  deleteButton: {
    backgroundColor: COLORS.DELETE,
    zIndex: 2,
  },
});

TableQuickActions.displayName = 'TableQuickActions';
