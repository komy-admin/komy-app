import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { X, SlidersHorizontal } from 'lucide-react-native';
import { Text } from './ui';
import { shadows, colors } from '~/theme';

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
  hideHeader?: boolean;
}

export function SidePanel({
  style,
  children,
  title,
  width = 350,
  collapsedWidth = 60,
  onBack,
  isCollapsed: controlledIsCollapsed,
  onCollapsedChange,
  hideCloseButton = false,
  showCloseButtonWhenTableSelected = false,
  hideHeader = false,
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
      backgroundColor: onBack ? colors.white : colors.gray[100],
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
              <SlidersHorizontal size={20} color={colors.white} strokeWidth={2} />
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
                      color: colors.brand.dark,
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
        {!hideHeader && (
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
                  <X size={24} color={colors.brand.dark} />
                </Pressable>
              )}
            </View>
          </View>
        )}
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
    zIndex: 100,
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
    borderRightWidth: 0,
    ...shadows.right,
  },
  childrenContainer: {
    flex: 1,
  },
  header: {
    width: '100%',
    height: 60,
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
    fontWeight: '600',
    color: colors.brand.dark,
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
    backgroundColor: colors.white,
    borderRightWidth: 1,
    borderRightColor: colors.neutral[200],
    flexDirection: 'column',
    ...shadows.right,
  },
  collapsedBarContent: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  fullWidthIconSection: {
    width: 60,
    height: 60,
    backgroundColor: colors.brand.dark,
    borderLeftWidth: 1,
    borderLeftColor: colors.white,
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
    width: 60,
  },
});