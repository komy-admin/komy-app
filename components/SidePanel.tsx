// components/SidePanel.tsx
import React, { useState } from 'react';
import { View, Pressable, Animated, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { Text } from './ui';

interface SidePanelProps {
  children: React.ReactNode;
  title: string;
  width?: number;
  collapsedWidth?: number;
}

export function SidePanel({
  children,
  title,
  width = 300,
  collapsedWidth = 0,
}: SidePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const animatedWidth = React.useRef(new Animated.Value(width)).current;

  // Hide content when collapsed
  const contentStyle = {
    opacity: animatedWidth.interpolate({
      inputRange: [0, 50, width],
      outputRange: [0, 0, 1],
    }),
  };

  const toggleCollapse = () => {
    const toValue = isCollapsed ? width : collapsedWidth;
    Animated.timing(animatedWidth, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsCollapsed(!isCollapsed);
  };

  return (
    <Animated.View style={[styles.container, { width: animatedWidth }]}>
      <Animated.View style={[styles.content, contentStyle]}>
        <View className='flex flex-row justify-between' style={{
          backgroundColor: "#F1F1F1",
          paddingHorizontal: 16,
          paddingVertical: 8,
        }}>
          <Text className='font-bold text-lg'>{title}</Text>
          <Pressable onPress={toggleCollapse}>
            <X size={24} color="#666" />
          </Pressable>
        </View>
        {children}
      </Animated.View>
      <Pressable onPress={toggleCollapse} style={styles.togglePressable}>
        <View style={styles.toggleButton}>
          {isCollapsed ? (
            <ChevronRight size={24} color="#666" />
          ) : (
            <ChevronLeft size={24} color="#666" />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}


const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    zIndex: 1000
  },
  content: {
    flex: 1,
    backgroundColor: '#FBFBFB',
  },
  togglePressable: {
    position: 'absolute',
    right: -54,
    top: '50%',
    transform: [{ translateY: -42 }],
    padding: 30,
  },
  toggleButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBFBFB',
    width: 24,
    height: 24,
    borderRadius: 0,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    zIndex: 1000
  },
});