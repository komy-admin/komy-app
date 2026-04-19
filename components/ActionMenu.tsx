import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Platform, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { LucideIcon, Menu as MenuIcon } from 'lucide-react-native';
import { shadows } from '~/theme';

export type ActionItem = {
  label?: string;
  content?: React.ReactNode;
  onPress: () => void;
  icon?: React.ReactNode | LucideIcon;
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

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  const handlePress = (event: any) => {
    // Recalcul dynamique des dimensions pour gérer l'orientation
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const { pageX, pageY } = event.nativeEvent || { pageX: 0, pageY: 0 };

    const menuWidth = fullWidth ? screenWidth - 20 : width;
    const menuHeight = actions.length * 48 + 16;

    // Position optimisée : très proche du bouton
    let finalTop = pageY; // Marge minimale de 12px
    let finalRight = fullWidth ? 10 : Math.max(screenWidth - pageX - menuWidth, 20);

    // Ajustements écran avec marges symétriques
    if (finalTop + menuHeight > screenHeight - 50) {
      finalTop = pageY - menuHeight - 12; // Même marge au-dessus
    }
    if (finalRight + menuWidth > screenWidth - 20) {
      finalRight = 20;
    }

    setPosition({
      top: Math.max(50, finalTop),
      right: Math.max(10, finalRight)
    });

    setVisible(true);
    opacity.value = withTiming(1, { duration: 150 });
    scale.value = withTiming(1, { duration: 150 });
  };

  const hideMenu = () => {
    opacity.value = withTiming(0, { duration: 100 });
    scale.value = withTiming(0.95, { duration: 100 }, (finished) => {
      'worklet';
      if (finished) {
        runOnJS(setVisible)(false);
      }
    });
  };

  useEffect(() => {
    if (visible && Platform.OS === 'web') {
      const hideOnBackgroundPress = () => hideMenu();
      window.addEventListener('click', hideOnBackgroundPress);
      return () => window.removeEventListener('click', hideOnBackgroundPress);
    }
  }, [visible]);

  const menuAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0, 0, 0, ${interpolate(opacity.value, [0, 1], [0, 0.2])})`,
  }));

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress} style={styles.button}>
        <View style={styles.buttonInner}>
          <MenuIcon size={18} color="#2A2E33" strokeWidth={2.5} />
        </View>
      </Pressable>

      <Modal visible={visible} transparent animationType="none" onRequestClose={hideMenu}>
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={hideMenu} />

          <Animated.View
            style={[
              styles.menu,
              menuAnimatedStyle,
              {
                top: position.top,
                right: position.right,
                width: fullWidth ? Dimensions.get('window').width - 20 : width,
                maxHeight: Dimensions.get('window').height * 0.6,
              }
            ]}
          >
            {actions.map((action, index) => (
              <React.Fragment key={index}>
                <Pressable
                  style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                  onPress={() => {
                    hideMenu();
                    setTimeout(() => action.onPress(), 50);
                  }}
                >
                  <View style={styles.itemContent}>
                    {action.icon && (
                      <View style={styles.icon}>
                        {typeof action.icon === 'function' ? (
                          <action.icon size={20} color="#2A2E33" strokeWidth={1.5} />
                        ) : (
                          action.icon
                        )}
                      </View>
                    )}
                    {action.content || (
                      <Text style={[styles.text, action.type === 'destructive' && styles.destructiveText]}>
                        {action.label}
                      </Text>
                    )}
                  </View>
                </Pressable>
                {withSeparator && index < actions.length - 1 && <View style={styles.separator} />}
              </React.Fragment>
            ))}
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    padding: 8,
    borderRadius: 22,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  buttonInner: {
    borderColor: '#D7D7D7',
    borderWidth: 1,
    borderRadius: 20,
    padding: 8,
    backgroundColor: '#FFFFFF',
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.bottom,
  },
  backdrop: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    overflow: 'hidden',
    ...shadows.bottom,
  },
  item: {
    minHeight: 48,
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        ':hover': { backgroundColor: 'rgba(248, 250, 252, 0.8)' },
      },
    }),
  },
  itemPressed: {
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  icon: {
    marginRight: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
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
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
});