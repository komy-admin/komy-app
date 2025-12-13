/**
 * KeyboardSafeFormView Component
 *
 * Pre-configured KeyboardAvoidingView with optional toolbar
 * Ideal for forms with multiple inputs
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAvoidingViewWrapper, KeyboardToolbarWrapper } from './KeyboardWrapper';
import { useKeyboardConfig } from '~/hooks/useKeyboard';
import type { KeyboardSafeFormViewProps } from '~/hooks/useKeyboard/types';
import { KEYBOARD_TOOLBAR } from '~/constants/keyboard.constants';

/**
 * KeyboardSafeFormView
 *
 * Form container that handles keyboard avoidance and optionally
 * shows a toolbar for input navigation
 *
 * @example
 * ```tsx
 * <KeyboardSafeFormView role="ADMIN" showToolbar>
 *   <TextInput placeholder="Item name" />
 *   <TextInput placeholder="Item price" />
 *   <TextInput placeholder="Item description" />
 * </KeyboardSafeFormView>
 * ```
 */
export const KeyboardSafeFormView: React.FC<KeyboardSafeFormViewProps> = ({
  role = 'DEFAULT',
  showToolbar,
  debugMode = false,
  behavior,
  keyboardVerticalOffset,
  children,
  style,
  ...props
}) => {
  // Get role-based configuration
  const { config } = useKeyboardConfig(role);

  // Determine if toolbar should be shown
  const shouldShowToolbar = showToolbar ?? config.enableToolbar;

  // Use config values or prop overrides
  const finalBehavior = behavior ?? config.behavior;
  const finalVerticalOffset = keyboardVerticalOffset ?? config.verticalOffset;

  return (
    <>
      <KeyboardAvoidingViewWrapper
        behavior={finalBehavior}
        keyboardVerticalOffset={finalVerticalOffset}
        enabled={true}
        style={[styles.container, style]}
        {...props}
      >
        {children}
      </KeyboardAvoidingViewWrapper>

      {shouldShowToolbar && <KeyboardToolbarWrapper />}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
