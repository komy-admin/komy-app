import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';

// Largeur minimale en dessous de laquelle le panel se ferme automatiquement
const PANEL_MIN_WIDTH = 850;

/**
 * Context pour le système de portal de panels
 * Permet à n'importe quel composant de l'app de rendre un SlidePanel au niveau root
 */
interface PanelPortalContextType {
  renderPanel: (panel: ReactNode) => void;
  clearPanel: () => void;
  setTopBarHeight: (height: number) => void;
  topOffset: number;
}

const PanelPortalContext = createContext<PanelPortalContextType | null>(null);

/**
 * Hook pour accéder au portal de panels
 * Permet de rendre un SlidePanel par-dessus tout le reste de l'app
 *
 * @example
 * const { renderPanel, clearPanel } = usePanelPortal();
 *
 * // Rendre un panel
 * renderPanel(
 *   <SlidePanel visible={true} onClose={clearPanel}>
 *     <MyPanelContent />
 *   </SlidePanel>
 * );
 *
 * // Fermer le panel
 * clearPanel();
 */
export function usePanelPortal() {
  const context = useContext(PanelPortalContext);
  if (!context) {
    throw new Error('usePanelPortal must be used within a PanelPortalProvider');
  }
  return context;
}

/**
 * Provider pour le système de portal
 * À placer au niveau root de l'application (_layout.tsx)
 */
export function PanelPortalProvider({ children }: { children: ReactNode }) {
  const [panel, setPanel] = useState<ReactNode>(null);
  // Hauteur dynamique de la TopBar (mesurée via onLayout)
  const [topBarHeight, setTopBarHeight] = useState<number>(90); // Valeur par défaut de 90

  // Safe area insets pour Android/iOS
  const insets = useSafeAreaInsets();

  // Ref pour accéder à l'état actuel du panel sans re-créer la subscription
  const panelRef = useRef(panel);

  useEffect(() => {
    panelRef.current = panel;
  }, [panel]);

  const renderPanel = useCallback((newPanel: ReactNode) => {
    setPanel(newPanel);
  }, []);

  const clearPanel = useCallback(() => {
    setPanel(null);
  }, []);

  const handleSetTopBarHeight = useCallback((height: number) => {
    setTopBarHeight(height);
  }, []);

  // Position totale = insets.top (safe area) + topBarHeight (hauteur de la TopBar)
  const totalTopOffset = insets.top + topBarHeight;

  // Fermer automatiquement le panel si l'écran devient trop petit
  // Utilise un ref pour éviter de re-créer la subscription à chaque changement de panel
  useEffect(() => {
    const handleDimensionChange = ({ window }: { window: { width: number; height: number } }) => {
      if (panelRef.current && window.width < PANEL_MIN_WIDTH) {
        clearPanel();
      }
    };

    const subscription = Dimensions.addEventListener('change', handleDimensionChange);

    return () => {
      subscription?.remove();
    };
  }, [clearPanel]); // Stable car clearPanel est useCallback sans deps

  // SÉCURITÉ : Fermer automatiquement le panel lors de la navigation
  // Cela évite qu'un panel reste bloqué ouvert si l'utilisateur navigue vers une autre page
  const segments = useSegments();
  const previousSegmentsRef = useRef<string[]>([]);

  useEffect(() => {
    const currentPath = segments.join('/');
    const previousPath = previousSegmentsRef.current.join('/');

    // Si la route a changé et qu'un panel est ouvert, le fermer
    if (currentPath !== previousPath && panelRef.current) {
      clearPanel();
    }

    previousSegmentsRef.current = segments;
  }, [segments, clearPanel]);

  return (
    <PanelPortalContext.Provider value={{ renderPanel, clearPanel, setTopBarHeight: handleSetTopBarHeight, topOffset: totalTopOffset }}>
      {children}

      {/* Zone de rendu des panels - COMMENCE SOUS LA TOPBAR + SAFE AREA */}
      {panel && (
        <View style={[styles.portalContainer, { top: totalTopOffset }]}>
          {panel}
        </View>
      )}
    </PanelPortalContext.Provider>
  );
}

const styles = StyleSheet.create({
  portalContainer: {
    // Conteneur qui couvre UNIQUEMENT la zone SOUS la TopBar
    position: 'absolute',
    // top est défini dynamiquement via inline style (topBarHeight)
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 150, // Au-dessus du Sidebar (100) mais sous TopBar (1001 max)
    ...Platform.select({
      android: {
        elevation: 30, // Au-dessus du Sidebar (elevation: 20)
      },
    }),
  },
});
