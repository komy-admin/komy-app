/**
 * KeyboardSafeScrollView Component
 *
 * Pre-configured KeyboardAwareScrollView with Fork'it defaults
 * Automatically applies role-based configuration
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { KeyboardAwareScrollViewWrapper } from './KeyboardWrapper';
import { useKeyboardConfig } from '~/hooks/useKeyboard';
import { calculateBottomOffset } from '~/utils/keyboard.utils';
import type { KeyboardSafeScrollViewProps } from '~/hooks/useKeyboard/types';

/**
 * KeyboardSafeScrollView
 *
 * Scroll view that automatically handles keyboard avoidance
 * with role-based configuration
 *
 * @example
 * ```tsx
 * <KeyboardSafeScrollView role="SERVER">
 *   <TextInput placeholder="Order notes" />
 *   <TextInput placeholder="Customer name" />
 * </KeyboardSafeScrollView>
 * ```
 */
export const KeyboardSafeScrollView: React.FC<KeyboardSafeScrollViewProps> = ({
  role = 'DEFAULT',
  debugMode = false,
  bottomOffset,
  extraKeyboardSpace,
  children,
  ...props
}) => {
  // Get role-based configuration
  const { config } = useKeyboardConfig(role);

  // Calculate offsets
  const finalBottomOffset = bottomOffset ?? calculateBottomOffset(config.bottomOffset);
  const finalExtraSpace = extraKeyboardSpace ?? 0;

  return (
    <KeyboardAwareScrollViewWrapper
      bottomOffset={finalBottomOffset}
      extraKeyboardSpace={finalExtraSpace}
      disableScrollOnKeyboardHide={false}
      enabled={true}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={true}
      {...props}
    >
      {children}
    </KeyboardAwareScrollViewWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
