import React from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { ArrowUp } from 'lucide-react-native';

interface ScrollToTopButtonProps {
  isVisible: boolean;
  fadeAnim: Animated.Value;
  onPress: () => void;
  size?: number;
  backgroundColor?: string;
  iconColor?: string;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({
  isVisible,
  fadeAnim,
  onPress,
  size = 48,
  backgroundColor = '#6366F1',
  iconColor = '#FFFFFF',
}) => {
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      <TouchableOpacity
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <ArrowUp size={24} color={iconColor} strokeWidth={2.5} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    zIndex: 1000,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
