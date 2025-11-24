import { useRef, useState, useCallback } from 'react';
import { ScrollView, Animated, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

interface UseScrollToTopOptions {
  threshold?: number;
  animationDuration?: number;
}

export const useScrollToTop = (options: UseScrollToTopOptions = {}) => {
  const { threshold = 80, animationDuration = 200 } = options;

  const scrollViewRef = useRef<ScrollView>(null);
  const [isVisible, setIsVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const shouldShow = offsetY > threshold;

    if (shouldShow !== isVisible) {
      setIsVisible(shouldShow);
      Animated.timing(fadeAnim, {
        toValue: shouldShow ? 1 : 0,
        duration: animationDuration,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, threshold, animationDuration, fadeAnim]);

  const scrollToTop = useCallback(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  return {
    scrollViewRef,
    handleScroll,
    scrollToTop,
    isVisible,
    fadeAnim,
  };
};
