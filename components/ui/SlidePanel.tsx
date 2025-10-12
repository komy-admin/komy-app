import React, { ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable, Platform } from 'react-native';

interface SlidePanelProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

/**
 * SlidePanel - Panneau coulissant depuis la droite
 * Pattern inspiré de configuration.tsx (validé et fonctionnel)
 * Fonctionne sur Web, iOS et Android
 */
export function SlidePanel({ visible, onClose, children, width = 400 }: SlidePanelProps) {
  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 999,
  },
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
    ...Platform.select({
      web: {
        // Animation smooth sur web
        transition: 'transform 0.3s ease-out',
      },
    }),
  },
});
