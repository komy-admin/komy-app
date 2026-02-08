/**
 * AuthScreenLayout Component
 *
 * Unified layout wrapper for authentication screens (login, PIN verification, etc.)
 *
 * Handles:
 * - KeyboardAwareScrollViewWrapper for auto-scroll to focused input
 * - Consistent behavior across iOS and Android (no platform-specific offset needed)
 *
 * Architecture Pattern:
 * - Uses KeyboardAwareScrollViewWrapper instead of KeyboardAvoidingView
 * - Auto-scrolls to the focused input with a consistent bottomOffset gap
 * - Keyboard dismiss is handled by keyboardShouldPersistTaps="handled" (default in wrapper):
 *   → Tap on TextInput: keyboard stays, input gets focus
 *   → Tap on empty area: keyboard dismisses
 * - No Pressable wrapper needed (it blocks PinInput re-focus on iOS)
 *
 * @example
 * ```tsx
 * <AuthScreenLayout>
 *   <View style={styles.contentContainer}>
 *     <TextInput ... />
 *     <Button ... />
 *   </View>
 * </AuthScreenLayout>
 * ```
 */

import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';

interface AuthScreenLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const AuthScreenLayout: React.FC<AuthScreenLayoutProps> = ({ children, style }) => {
  return (
    <KeyboardAwareScrollViewWrapper
      style={[styles.container, style]}
      contentContainerStyle={styles.scrollContent}
      bottomOffset={40}
      scrollEventThrottle={16}
    >
      {children}
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
});
