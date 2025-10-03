import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { X, SlidersHorizontal } from 'lucide-react-native';
import { Text } from './ui';

interface SidePanelProps {
  children: React.ReactNode;
  title: string;
  width?: number;
  collapsedWidth?: number;
  style?: object;
  onBack?: () => void;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  hideCloseButton?: boolean;
  showCloseButtonWhenTableSelected?: boolean;
}

export function SidePanel({
  style,
  children,
  title,
  width = 350,
  collapsedWidth = 50,
  onBack,
  isCollapsed: controlledIsCollapsed,
  onCollapsedChange,
  hideCloseButton = false,
  showCloseButtonWhenTableSelected = false,
}: SidePanelProps) {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);
  const isCollapsed = controlledIsCollapsed ?? internalIsCollapsed;

  const toggleCollapse = () => {
    if (hideCloseButton && !showCloseButtonWhenTableSelected) return;

    const newCollapsedState = !isCollapsed;

    if (onCollapsedChange) {
      onCollapsedChange(newCollapsedState);
    } else {
      setInternalIsCollapsed(newCollapsedState);
    }
  };

  const handleCloseAction = () => {
    if (onBack) {
      onBack();
    } else {
      toggleCollapse();
    }
  };

  const getHeaderStyle = () => {
    return {
      backgroundColor: onBack ? '#FFFFFF' : '#F1F1F1',
    };
  };

  // Détermine si le bouton de fermeture doit être affiché
  const shouldShowCloseButton = () => {
    if (hideCloseButton && !showCloseButtonWhenTableSelected) {
      return false;
    }
    if (showCloseButtonWhenTableSelected) {
      return true;
    }
    return !hideCloseButton;
  };

  return (
    <View
      style={[
        style,
        styles.container,
        { width: isCollapsed ? collapsedWidth : width },
      ]}
    >
      {/* Barre latérale collapsed - TOUJOURS AFFICHÉE */}
      <View
        style={[
          styles.collapsedBarContainer,
          {
            opacity: isCollapsed ? 1 : 0,
            zIndex: isCollapsed ? 10 : 1,
          }
        ]}
        pointerEvents={isCollapsed ? "auto" : "none"}
      >
        <Pressable onPress={toggleCollapse} style={styles.collapsedBar}>
          <View style={styles.collapsedBarContent}>
            {/* Section icône */}
            <View style={styles.fullWidthIconSection}>
              <SlidersHorizontal size={20} color="#FFFFFF" strokeWidth={2} />
            </View>

            {/* Texte vertical */}
            <View style={styles.textSection}>
              <View
                style={styles.textContainer}
                collapsable={false}
              >
                <View
                  style={{
                    transform: [{ rotate: '270deg' }],
                    width: 200,
                    height: 20,
                  }}
                  collapsable={false}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#718096',
                      letterSpacing: 1.2,
                      textAlign: 'center',
                    }}
                  >
                    AFFICHER LES FILTRES
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Pressable>
      </View>

      {/* Contenu principal - TOUJOURS AFFICHÉ */}
      <View
        style={[
          styles.content,
          {
            opacity: isCollapsed ? 0 : 1,
            zIndex: isCollapsed ? 1 : 10,
          }
        ]}
        pointerEvents={isCollapsed ? "none" : "auto"}
      >
        <View
          style={[
            styles.header,
            getHeaderStyle()
          ]}
        >
          <View style={styles.headerLeft}>
            <Text
              style={styles.title}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
            {shouldShowCloseButton() && (
              <Pressable onPress={handleCloseAction} style={styles.backButton}>
                <X size={24} color="#2A2E33" />
              </Pressable>
            )}
          </View>
        </View>
        {/* CRITIQUE: Wrapper pour isoler le contenu scrollable */}
        <View style={styles.childrenContainer}>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 0 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '1px 0 3px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  childrenContainer: {
    flex: 1,
  },
  header: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 15,
    zIndex: 1,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2E33',
    maxWidth: 280,
    textAlign: 'left',
  },
  backButton: {
    padding: 8,
    borderRadius: 6,
    marginLeft: 12,
  },
  collapsedBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  collapsedBar: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    flexDirection: 'column',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      web: {
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  collapsedBarContent: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  fullWidthIconSection: {
    width: 50,
    height: 50,
    backgroundColor: '#718096',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
    width: 50,
  },
});