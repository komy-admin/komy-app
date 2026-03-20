/**
 * AuthScreenLayout Component
 *
 * Unified layout wrapper for authentication screens.
 * Uses KeyboardAwareScrollView for reliable auto-scroll to focused inputs.
 *
 * Two modes:
 * - Default: standard scroll with flexGrow (login)
 * - Centered: static paddingTop based on screen height for stable centering
 */

import React from 'react';
import { StyleSheet, ViewStyle, View, useWindowDimensions } from 'react-native';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';

interface AuthScreenLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
  centered?: boolean;
}

export const AuthScreenLayout: React.FC<AuthScreenLayoutProps> = ({ children, style, centered }) => {
  const { height: windowHeight } = useWindowDimensions();

  return (
    <KeyboardAwareScrollViewWrapper
      style={[styles.container, style]}
      contentContainerStyle={centered
        ? [styles.centeredScrollContent, { minHeight: windowHeight }]
        : styles.scrollContent
      }
      bottomOffset={centered ? 80 : 40}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled"
    >
      {centered ? (
        <View style={styles.centeredContent}>
          {children}
        </View>
      ) : (
        children
      )}
    </KeyboardAwareScrollViewWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  centeredScrollContent: {
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  centeredContent: {
    alignItems: 'center',
    width: '100%',
  },
});
