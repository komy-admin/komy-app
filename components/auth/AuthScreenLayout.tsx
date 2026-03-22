/**
 * AuthScreenLayout Component
 *
 * Unified layout wrapper for authentication screens.
 * Uses KeyboardAwareScrollView for reliable auto-scroll to focused inputs.
 *
 * Two modes:
 * - Default: standard scroll with flexGrow (login)
 * - Centered: static paddingTop based on screen height for stable centering
 *   Wraps children in a white card with border radius.
 */

import React from 'react';
import { StyleSheet, ViewStyle, View, useWindowDimensions, Platform } from 'react-native';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';

interface AuthScreenLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
  centered?: boolean;
  /** Skip the white card wrapper (e.g. for login which has its own layout) */
  noCard?: boolean;
}

export const AuthScreenLayout: React.FC<AuthScreenLayoutProps> = ({ children, style, centered, noCard }) => {
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
          {noCard ? children : (
            <View style={styles.card}>
              {children}
            </View>
          )}
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
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 36,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 32,
        elevation: 12,
      },
    }),
  },
});
