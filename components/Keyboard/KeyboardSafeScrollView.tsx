/**
 * KeyboardSafeScrollView Component
 *
 * ⚠️ WARNING: This component uses KeyboardAwareScrollView which has known issues
 * with Reanimated Shared Values on Android causing "useEffect dependencies changed size" errors
 * and blocking scroll functionality.
 *
 * ✅ RECOMMENDED: Use KeyboardSafeFormView instead for stable keyboard management
 * See KEYBOARD_SOLUTION.md for working implementation
 *
 * Pre-configured KeyboardAwareScrollView with Fork'it defaults
 * Automatically applies role-based configuration
 */

import React from 'react';
import { ScrollView, Platform } from 'react-native';
import { useKeyboardConfig } from '~/hooks/useKeyboard';
import { calculateBottomOffset, logKeyboardEvent, isWeb } from '~/utils/keyboard.utils';
import type { KeyboardSafeScrollViewProps } from '~/hooks/useKeyboard/types';

/**
 * KeyboardSafeScrollView - Native Version
 *
 * ⚠️ WARNING: Known to cause Reanimated errors on Android
 * Prefer KeyboardSafeFormView + ScrollView for stable behavior
 *
 * Uses react-native-keyboard-controller's KeyboardAwareScrollView
 * Note: KeyboardAwareScrollView manages its own internal ref
 */
const KeyboardSafeScrollViewNative: React.FC<KeyboardSafeScrollViewProps> = ({
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

  // Import KeyboardAwareScrollView
  const { KeyboardAwareScrollView } = require('react-native-keyboard-controller');

  // Debug logging
  React.useEffect(() => {
    if (__DEV__) {
      logKeyboardEvent('info', '[KeyboardSafeScrollView] Native Mounted', {
        role,
        platform: Platform.OS,
        finalBottomOffset,
        finalExtraSpace,
        debugMode,
      });
    }
  }, [role, finalBottomOffset, finalExtraSpace, debugMode]);

  if (__DEV__ && debugMode) {
    console.log('[KeyboardSafeScrollView] Native Render:', {
      role,
      finalBottomOffset,
      finalExtraSpace,
    });
  }

  // KeyboardAwareScrollView manages its own ref internally
  return (
    <KeyboardAwareScrollView
      bottomOffset={finalBottomOffset}
      extraKeyboardSpace={finalExtraSpace}
      disableScrollOnKeyboardHide={false}
      enabled={true}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={true}
      {...props}
    >
      {children}
    </KeyboardAwareScrollView>
  );
};

/**
 * KeyboardSafeScrollView - Web Version
 *
 * Uses standard ScrollView with forwardRef
 */
const KeyboardSafeScrollViewWeb = React.forwardRef<ScrollView, KeyboardSafeScrollViewProps>(
  ({ role = 'DEFAULT', debugMode = false, bottomOffset, extraKeyboardSpace, children, ...props }, ref) => {
    // Get role-based configuration
    const { config } = useKeyboardConfig(role);

    // Calculate offsets
    const finalBottomOffset = bottomOffset ?? calculateBottomOffset(config.bottomOffset);
    const finalExtraSpace = extraKeyboardSpace ?? 0;

    // Debug logging
    React.useEffect(() => {
      if (__DEV__) {
        logKeyboardEvent('info', '[KeyboardSafeScrollView] Web Mounted', {
          role,
          platform: Platform.OS,
          finalBottomOffset,
          finalExtraSpace,
          hasRef: !!ref,
          debugMode,
        });
      }
    }, [role, finalBottomOffset, finalExtraSpace, ref, debugMode]);

    if (__DEV__ && debugMode) {
      console.log('[KeyboardSafeScrollView] Web Render:', {
        role,
        finalBottomOffset,
        finalExtraSpace,
        refType: ref ? typeof ref : 'undefined',
      });
    }

    return (
      <ScrollView
        ref={ref}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        {...props}
      >
        {children}
      </ScrollView>
    );
  }
);

KeyboardSafeScrollViewWeb.displayName = 'KeyboardSafeScrollViewWeb';

/**
 * KeyboardSafeScrollView - Main Export
 *
 * Conditionally exports Native or Web version
 */
export const KeyboardSafeScrollView = isWeb()
  ? KeyboardSafeScrollViewWeb
  : KeyboardSafeScrollViewNative;
