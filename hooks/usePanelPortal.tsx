import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';

/**
 * Context pour le système de portal de panels
 * Permet à n'importe quel composant de l'app de rendre un SlidePanel au niveau root
 */
interface PanelPortalContextType {
  renderPanel: (panel: ReactNode, onClose?: () => void) => void;
  clearPanel: () => void;
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

// Hauteur de la TopBar (doit correspondre à TopBar.tsx ligne 93)
const TOPBAR_HEIGHT = 90;

/**
 * Provider pour le système de portal
 * À placer au niveau root de l'application (_layout.tsx)
 */
export function PanelPortalProvider({ children }: { children: ReactNode }) {
  const [panel, setPanel] = useState<ReactNode>(null);
  const [panelOnClose, setPanelOnClose] = useState<(() => void) | null>(null);

  const renderPanel = useCallback((newPanel: ReactNode, onClose?: () => void) => {
    setPanel(newPanel);
    setPanelOnClose(() => onClose || null);
  }, []);

  const clearPanel = useCallback(() => {
    setPanel(null);
    setPanelOnClose(null);
  }, []);

  return (
    <PanelPortalContext.Provider value={{ renderPanel, clearPanel }}>
      {children}

      {/* Zone de rendu des panels */}
      {panel && (
        <View style={styles.portalContainer} pointerEvents="box-none">
          {/* Zone transparente en haut pour TopBar - cliquable pour fermer proprement */}
          <Pressable
            style={styles.topBarZone}
            onPress={() => {
              // Appeler le onClose du panel pour fermer proprement
              if (panelOnClose) {
                panelOnClose();
              } else {
                // Fallback si pas de onClose fourni
                clearPanel();
              }
            }}
            pointerEvents="auto" // Capture les clics
          />

          {/* Panel en dessous de la zone TopBar */}
          <View style={styles.panelZone} pointerEvents="box-none">
            {panel}
          </View>
        </View>
      )}
    </PanelPortalContext.Provider>
  );
}

const styles = StyleSheet.create({
  portalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20, // Sous TopBar (25) pour que les clics sur TopBar passent au travers
    // pointerEvents: 'box-none' permet aux events de traverser sauf sur les zones explicites
  },
  topBarZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: TOPBAR_HEIGHT,
    zIndex: 1, // Au-dessus du panel mais sous TopBar
    // backgroundColor: 'rgba(255,0,0,0.2)', // Debug: voir la zone
  },
  panelZone: {
    position: 'absolute',
    top: TOPBAR_HEIGHT,
    left: 0,
    right: 0,
    bottom: 0,
    // Panel rendu ici, commence sous la TopBar
  },
});
