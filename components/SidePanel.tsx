import React, { useState, useEffect, useRef } from 'react';
import { View, Pressable, Animated, StyleSheet, Platform } from 'react-native';
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const isCollapsed = controlledIsCollapsed ?? internalIsCollapsed;

  // Animations refs - initialisées avec les valeurs de l'état ouvert par défaut
  const animatedWidth = useRef(new Animated.Value(width)).current;
  const collapsedOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const rotationValue = useRef(new Animated.Value(1)).current;

  // Initialisation au montage - synchroniser avec l'état collapsed si contrôlé
  useEffect(() => {
    if (controlledIsCollapsed !== undefined) {
      animatedWidth.setValue(controlledIsCollapsed ? collapsedWidth : width);
      collapsedOpacity.setValue(controlledIsCollapsed ? 1 : 0);
      contentOpacity.setValue(controlledIsCollapsed ? 0 : 1);
    }

    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, Platform.OS === 'ios' ? 0 : 10);

    return () => clearTimeout(timer);
  }, []); // Une seule fois au montage

  useEffect(() => {
    if (!isInitialized) return;

    if (isCollapsed) {
      // Fermeture optimisée : masquer contenu rapidement puis réduire largeur
      Animated.sequence([
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 80,
          useNativeDriver: false,
        }),
        Animated.parallel([
          Animated.timing(animatedWidth, {
            toValue: collapsedWidth,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(collapsedOpacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: false,
          })
        ])
      ]).start(() => {
        setIsAnimating(false);
      });
    } else {
      // Ouverture optimisée : élargir puis afficher contenu
      Animated.sequence([
        Animated.timing(collapsedOpacity, {
          toValue: 0,
          duration: 50,
          useNativeDriver: false,
        }),
        Animated.timing(animatedWidth, {
          toValue: width,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: false,
        })
      ]).start(() => {
        setIsAnimating(false);
      });
    }
  }, [isCollapsed, collapsedWidth, width, isInitialized]);

  const toggleCollapse = () => {
    if (hideCloseButton && !showCloseButtonWhenTableSelected) return;
    if (isAnimating) return;

    setIsAnimating(true);
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

  // Interpolation pour la rotation - plus robuste sur mobile
  const rotationInterpolate = rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '270deg'],
  });

  return (
    <Animated.View
      style={[
        style,
        styles.container,
        { width: animatedWidth, maxWidth: animatedWidth },
      ]}
      pointerEvents={isCollapsed ? 'auto' : 'box-none'}
    >
      {/* Barre latérale collapsed */}
      {isCollapsed && (
        <Animated.View
          style={[
            styles.collapsedBarContainer,
            { opacity: collapsedOpacity }
          ]}
          pointerEvents="auto"
        >
          <Pressable onPress={toggleCollapse} style={styles.collapsedBar}>
            <View style={styles.collapsedBarContent}>
              {/* Section icône */}
              <Animated.View
                style={[
                  styles.fullWidthIconSection,
                  { opacity: collapsedOpacity }
                ]}
              >
                <SlidersHorizontal size={20} color="#FFFFFF" strokeWidth={2} />
              </Animated.View>

              {/* Texte vertical */}
              <Animated.View
                style={[
                  styles.textSection,
                  { opacity: collapsedOpacity }
                ]}
              >
                <View style={styles.textContainer}>
                  <Animated.Text
                    style={[
                      styles.verticalText,
                      {
                        transform: [{ rotate: rotationInterpolate }],
                        opacity: isInitialized ? 1 : 0,
                      }
                    ]}
                  >
                    AFFICHER LES FILTRES
                  </Animated.Text>
                </View>
              </Animated.View>
            </View>
          </Pressable>
        </Animated.View>
      )}

      {/* Contenu principal */}
      {!isCollapsed && (
        <Animated.View
          style={[styles.content, { opacity: contentOpacity }]}
          pointerEvents="auto"
          removeClippedSubviews={false}
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
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    zIndex: 1000,
  },
  content: {
    flex: 1,
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
    flex: 1,
    width: '100%',
  },
  collapsedBar: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
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
  verticalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
    letterSpacing: 1.2,
    textAlign: 'center',
    width: 200,
  },
});