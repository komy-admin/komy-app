/**
 * KeyboardSafeFormView Component
 *
 * Pre-configured KeyboardAvoidingView for forms with multiple inputs
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { KeyboardAvoidingViewWrapper } from './KeyboardWrapper';
import { useKeyboardConfig } from '~/hooks/useKeyboard';
import type { KeyboardSafeFormViewProps } from '~/hooks/useKeyboard/types';

/**
 * KeyboardSafeFormView
 *
 * Form container that handles keyboard avoidance
 *
 * @example
 *   <KeyboardSafeFormView role="ADMIN">
 *     <TextInput placeholder="Item name" />
 *     <TextInput placeholder="Item price" />
 *   </KeyboardSafeFormView>
 */
export const KeyboardSafeFormView: React.FC<KeyboardSafeFormViewProps> = ({
  role = 'DEFAULT',
  debugMode = false,
  behavior,
  keyboardVerticalOffset,
  children,
  style,
  ...props
}) => {
  // Get role-based configuration
  const { config } = useKeyboardConfig(role);

  // Use config values or prop overrides
  const finalBehavior = behavior ?? config.behavior;
  const finalVerticalOffset = keyboardVerticalOffset ?? config.verticalOffset;

  return (
    <KeyboardAvoidingViewWrapper
      behavior={finalBehavior}
      keyboardVerticalOffset={finalVerticalOffset}
      enabled={true}
      style={[styles.container, style]}
      {...props}
    >
      {children}
    </KeyboardAvoidingViewWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
