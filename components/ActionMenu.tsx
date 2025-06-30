import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Platform, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Menu as MenuIcon } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type ActionItem = {
  label?: string;
  content?: React.ReactNode;
  onPress: () => void;
  icon?: React.ReactNode;
  type?: 'default' | 'destructive';
};

type ActionMenuProps = {
  actions: ActionItem[];
  width?: number;
  withSeparator?: boolean;
  fullWidth?: boolean;
};

export function ActionMenu({ actions, width = 180, withSeparator = false, fullWidth = false }: ActionMenuProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<View>(null);


  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const translateY = useSharedValue(-10);

  const handlePress = () => {
    if (buttonRef.current) {
      buttonRef.current.measure((_x, _y, buttonWidth, height, pageX, pageY) => {
        const menuWidth = fullWidth ? SCREEN_WIDTH - 20 : width;
        const menuHeight = actions.length * 48 + 16;

        let finalTop = pageY + height + 8;
        let finalRight = fullWidth ? 10 : SCREEN_WIDTH - pageX - buttonWidth;

        if (finalTop + menuHeight > SCREEN_HEIGHT - 50) {
          finalTop = pageY - menuHeight - 8;
        }
        if (!fullWidth && finalRight + menuWidth > SCREEN_WIDTH - 20) {
          finalRight = 20;
        }

        setPosition({
          top: finalTop,
          right: fullWidth ? 10 : Math.max(finalRight, 20)
        });

        setVisible(true);

        opacity.value = withTiming(1, { duration: 200 });
        scale.value = withSpring(1, {
          damping: 20,
          stiffness: 300,
        });
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
      });
    }
  };

  const hideMenu = () => {
    opacity.value = withTiming(0, { duration: 150 });
    scale.value = withTiming(0.8, { duration: 150 });
    translateY.value = withTiming(-10, { duration: 150 }, () => {
      runOnJS(setVisible)(false);
    });
  };

  useEffect(() => {
    if (visible && Platform.OS === 'web') {
      const hideOnBackgroundPress = () => hideMenu();
      window.addEventListener('click', hideOnBackgroundPress);
      return () => window.removeEventListener('click', hideOnBackgroundPress);
    }
  }, [visible]);

  const menuAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { translateY: translateY.value }
      ],
    };
  });

  const backdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: `rgba(0, 0, 0, ${interpolate(opacity.value, [0, 1], [0, 0.2])})`,
    };
  });

  return (
    <View style={styles.menuButtonContainer}>
      <Pressable
        ref={buttonRef}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.menuButton,
          Platform.OS !== 'web' && pressed && styles.menuButtonPressed
        ]}
        android_ripple={{
          color: 'rgba(42, 46, 51, 0.1)',
          borderless: true,
          radius: 32,
        }}
        hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
      >
        <View style={[
          styles.menuButtonInner,
          Platform.OS !== 'web' && {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }
        ]}>
          <MenuIcon size={18} color="#2A2E33" strokeWidth={2.5} />
        </View>
      </Pressable>

      <Modal
        visible={visible}
        transparent={true}
        animationType="none"
        onRequestClose={hideMenu}
        statusBarTranslucent={true}
      >
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={hideMenu}
          >
            <Animated.View
              style={[
                styles.menuContainer,
                menuAnimatedStyle,
                {
                  top: position.top,
                  right: position.right,
                  width: fullWidth ? SCREEN_WIDTH - 20 : width,
                  maxHeight: SCREEN_HEIGHT * 0.6, // Limite la hauteur du menu
                }
              ]}
            >
              {actions.map((action, index) => (
                <React.Fragment key={index}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.menuItem,
                      Platform.OS !== 'web' && pressed && styles.menuItemPressed
                    ]}
                    onPress={() => {
                      hideMenu();
                      // Délai pour permettre à l'animation de se terminer
                      setTimeout(() => action.onPress(), 100);
                    }}
                    android_ripple={{
                      color: action.type === 'destructive'
                        ? 'rgba(239, 68, 68, 0.1)'
                        : 'rgba(42, 46, 51, 0.05)',
                    }}
                  >
                    <View style={styles.menuItemContent}>
                      {action.icon && (
                        <View style={styles.iconContainer}>
                          {action.icon}
                        </View>
                      )}
                      {action.content ? (
                        <View style={styles.customContent}>
                          {action.content}
                        </View>
                      ) : (
                        <Text
                          style={[
                            styles.menuItemText,
                            action.type === 'destructive' && styles.destructiveText
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {action.label}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                  {withSeparator && index < actions.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </React.Fragment>
              ))}
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  menuButtonContainer: {
    paddingHorizontal: 4,
    paddingLeft: 8,
  },
  menuButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 28,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  menuButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  menuButtonInner: {
    borderColor: '#D7D7D7',
    borderWidth: 1,
    borderRadius: 20,
    padding: 8,
    backgroundColor: '#FFFFFF',
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 25px -8px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  menuItem: {
    minHeight: 48,
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        ':hover': {
          backgroundColor: 'rgba(248, 250, 252, 0.8)',
        },
      },
    }),
  },
  menuItemPressed: {
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemWithSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  iconContainer: {
    marginRight: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2A2E33',
    flex: 1,
    letterSpacing: -0.1,
  },
  destructiveText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  customContent: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 0,
  },
});