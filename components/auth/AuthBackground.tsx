import React, { useId } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Polygon, Defs, LinearGradient, Stop } from 'react-native-svg';

/**
 * AuthBackground - Diagonal split background for auth screens.
 *
 * #2A2E33 fills from top, with a diagonal cut from 30% height (left)
 * to 70% height (right). Below the cut is light grey (#F2F2F7).
 */
export const AuthBackground: React.FC = () => {
  const { width, height } = useWindowDimensions();

  const leftY = height * 0.30;
  const rightY = height * 0.70;

  const band = 40;
  const gradId = `bandGrad${useId().replace(/:/g, '')}`;

  const darkPoints = `0,0 ${width},0 ${width},${rightY} 0,${leftY}`;
  const redPoints = `0,${leftY - band} ${width},${rightY - band} ${width},${rightY + band} 0,${leftY + band}`;

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#2A2E33" />
            <Stop offset="1" stopColor="#E2E8F0" />
          </LinearGradient>
        </Defs>
        <Polygon points={darkPoints} fill="#2A2E33" />
        <Polygon points={redPoints} fill={`url(#${gradId})`} />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});
