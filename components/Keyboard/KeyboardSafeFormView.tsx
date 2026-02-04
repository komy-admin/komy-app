/**
 * KeyboardSafeFormView Component
 *
 * Pre-configured KeyboardAvoidingView for forms with multiple inputs
 */

import React from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { KeyboardAvoidingViewWrapper } from './KeyboardWrapper';
import type { KeyboardBehavior } from '~/hooks/useKeyboard/types';

interface KeyboardSafeFormViewProps {
  /** Behavior of KeyboardAvoidingView (default: 'padding') */
  behavior?: KeyboardBehavior;
  /** Vertical offset for keyboard (default: 0) */
  keyboardVerticalOffset?: number;
  /** Content container style */
  contentContainerStyle?: ViewStyle;
  /** Enable/disable keyboard avoidance (default: true) */
  enabled?: boolean;
  /** Style for the container */
  style?: StyleProp<ViewStyle>;
  /** Children components */
  children: React.ReactNode;
}

/**
 * KeyboardSafeFormView
 *
 * Form container that handles keyboard avoidance
 *
 * @example
 *   <KeyboardSafeFormView keyboardVerticalOffset={150}>
 *     <TextInput placeholder="Item name" />
 *     <TextInput placeholder="Item price" />
 *   </KeyboardSafeFormView>
 */
export const KeyboardSafeFormView: React.FC<KeyboardSafeFormViewProps> = ({
  behavior = 'padding',
  keyboardVerticalOffset = 0,
  contentContainerStyle,
  enabled = true,
  children,
  style,
  ...props
}) => {
  return (
    <KeyboardAvoidingViewWrapper
      behavior={behavior}
      keyboardVerticalOffset={keyboardVerticalOffset}
      contentContainerStyle={contentContainerStyle}
      enabled={enabled}
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
