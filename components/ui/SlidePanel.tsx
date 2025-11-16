import { ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';

interface SlidePanelProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
}

/**
 * SlidePanel - Panneau coulissant depuis la droite
 * Optimisé pour Android/iOS - utilise flex au lieu d'absoluteFill
 * Fonctionne sur Web, iOS et Android
 * Supporte les largeurs en pourcentage (ex: "35%") ou en pixels
 * Utilise useWindowDimensions pour un responsive dynamique en temps réel
 */
export function SlidePanel({
  visible,
  onClose,
  children,
  width = 400,
  minWidth = 350,
  maxWidth,
}: SlidePanelProps) {
  const { width: screenWidth } = useWindowDimensions();

  if (!visible) return null;

  // Calculer la largeur finale (se recalcule automatiquement au resize)
  let computedWidth: number;

  if (typeof width === 'string' && width.endsWith('%')) {
    // Largeur en pourcentage - responsive dynamique
    const percentage = parseFloat(width) / 100;
    computedWidth = screenWidth * percentage;
  } else {
    // Largeur en pixels
    computedWidth = typeof width === 'number' ? width : 400;
  }

  // Appliquer les contraintes min/max
  if (minWidth && computedWidth < minWidth) {
    computedWidth = minWidth;
  }
  if (maxWidth && computedWidth > maxWidth) {
    computedWidth = maxWidth;
  }

  return (
    <View style={styles.container}>
      {/* Overlay backdrop */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Panel */}
      <View style={[styles.panel, { width: computedWidth }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Remplit complètement l'espace du parent (portalContainer)
    // Utilise flex au lieu d'absoluteFill pour respecter les limites du parent sur Android
    flex: 1,
    width: '100%',
  },
  overlay: {
    // Overlay qui couvre tout le conteneur
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    // Pas de zIndex élevé - le portalContainer gère déjà le stacking
  },
  panel: {
    // Panel positionné à droite du conteneur
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    // Ombres pour profondeur visuelle
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    ...Platform.select({
      web: {
        // Animation smooth sur web
        transition: 'transform 0.3s ease-out',
      },
      android: {
        elevation: 8,
      },
      ios: {
        shadowOpacity: 0.15,
      },
    }),
  },
});
