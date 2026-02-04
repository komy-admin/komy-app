/**
 * AuthScreenLayout Component
 *
 * Unified layout wrapper for authentication screens (login, PIN verification, etc.)
 *
 * Handles:
 * - Platform-conditional Pressable wrapper (web vs mobile/tablet)
 * - KeyboardSafeFormView with AUTH role
 * - Automatic keyboard offset calculation based on orientation
 *
 * Architecture Pattern:
 * - Web: No Pressable wrapper (inputs are directly selectable)
 * - Mobile/Tablet: Pressable wrapper allows keyboard dismiss on tap outside
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
import { Platform, Pressable, Keyboard, StyleSheet, ViewStyle } from 'react-native';
import { KeyboardSafeFormView } from '~/components/Keyboard';
import { useAuthKeyboardOffset } from '~/hooks/useAuthKeyboardOffset';

interface AuthScreenLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const AuthScreenLayout: React.FC<AuthScreenLayoutProps> = ({ children, style }) => {
  const keyboardVerticalOffset = useAuthKeyboardOffset();

  // Form content wrapped in KeyboardSafeFormView
  const formContent = (
    <KeyboardSafeFormView
      behavior="padding"
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={[styles.container, style]}
    >
      {children}
    </KeyboardSafeFormView>
  );

  // Platform-conditional rendering:
  // - Web: No Pressable (allows direct input selection)
  // - Mobile/Tablet: Pressable wrapper (enables keyboard dismiss on tap)
  return Platform.OS === 'web' ? (
    formContent
  ) : (
    <Pressable style={styles.pressableContainer} onPress={Keyboard.dismiss}>
      {formContent}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressableContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
