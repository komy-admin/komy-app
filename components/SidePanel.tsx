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
  style?: object;
}

export function SidePanel({
  style,
  children,
  title,
  width = 350,
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

  const getHeaderStyle = () => {
    if (title === 'Filtrage') {
      return {
        backgroundColor: '#F1F1F1',
      };
    }
    return {
      backgroundColor: '#FFFFFF',
    };
  };

  return (
    <Animated.View
      style={[
        style,
        styles.container,
        { width: animatedWidth },
      ]}
    >
      {!isCollapsed && (
        <Animated.View style={[styles.content, contentStyle]}>
          <View
            className="flex flex-row justify-between"
            style={{
              width: '100%',
              height: 50,
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingLeft: 15,
              paddingRight: 15,
              ...getHeaderStyle()
            }}
          >
            <View style={{width: 300}}>
              <Text className="font-bold text-lg" style={{ width:'100%' }}>{title}</Text>
            </View>
            <Pressable onPress={toggleCollapse}>
              <X size={24} color="#2A2E33" />
            </Pressable>
          </View>
          {children}
        </Animated.View>
      )}
      <Pressable onPress={toggleCollapse} style={styles.togglePressable}>
        <View style={styles.toggleButton}>
          {isCollapsed ? (
            <ChevronRight size={24} color="#2A2E33" />
          ) : (
            <ChevronLeft size={24} color="#2A2E33" />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FBFBFB',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    zIndex: 1000
  },
  content: {
    flex: 1,
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
    width: 24,
    height: 24,
    backgroundColor: '#FBFBFB',
    borderRadius: 0,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    zIndex: 1000
  },
});