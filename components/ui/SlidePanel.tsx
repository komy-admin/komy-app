import { ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';

interface SlidePanelProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

/**
 * SlidePanel - Panneau coulissant depuis la droite
 * Optimisé pour Android/iOS - utilise flex au lieu d'absoluteFill
 * Fonctionne sur Web, iOS et Android
 */
export function SlidePanel({ visible, onClose, children, width = 400 }: SlidePanelProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Overlay backdrop */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Panel */}
      <View style={[styles.panel, { width }]}>
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
