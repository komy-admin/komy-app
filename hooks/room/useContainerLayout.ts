import { useState, useCallback } from 'react';
import { LayoutChangeEvent } from 'react-native';

interface ContainerDimensions {
  width: number;
  height: number;
}

export const useContainerLayout = () => {
  const [dimensions, setDimensions] = useState<ContainerDimensions | undefined>(undefined);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions(prev => {
      if (prev && Math.abs(prev.width - width) < 1 && Math.abs(prev.height - height) < 1) return prev;
      return { width, height };
    });
  }, []);

  return { dimensions, onLayout };
};
