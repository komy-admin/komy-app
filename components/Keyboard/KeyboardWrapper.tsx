/**
 * Keyboard Wrapper Components
 *
 * ════════════════════════════════════════════════════════════════════════════
 * Platform-aware wrappers around react-native-keyboard-controller components
 * ════════════════════════════════════════════════════════════════════════════
 *
 * This file provides platform-aware wrappers for keyboard management components
 * with graceful fallbacks for Web and error handling.
 *
 * ════════════════════════════════════════════════════════════════════════════
 * Usage Pattern A: Short Auth Forms (Login, PIN)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Pattern A uses KeyboardAvoidingViewWrapper without ScrollView:
 *
 * @example
 *   <Pressable onPress={Keyboard.dismiss}>
 *     <KeyboardSafeFormView role="AUTH">
 *       <View style={{ flex: 1, justifyContent: 'center' }}>
 *         2-4 inputs, centered
 *       </View>
 *     </KeyboardSafeFormView>
 *   </Pressable>
 *
 * Components used:
 * - KeyboardProviderWrapper (root level)
 * - KeyboardAvoidingViewWrapper (via KeyboardSafeFormView)
 *
 * See: login.tsx, pin-verification.tsx, AuthScreenLayout.tsx
 *
 * ════════════════════════════════════════════════════════════════════════════
 * Usage Pattern B: Long Admin Forms (Team, Menu, Room)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Pattern B uses KeyboardAvoidingViewWrapper + ScrollView:
 *
 * @example
 *   <KeyboardSafeFormView role="ADMIN">
 *     <ScrollView
 *       keyboardShouldPersistTaps="handled"
 *       contentContainerStyle={{ flexGrow: 1 }}
 *     >
 *       <AdminFormView>
 *         10+ inputs, scrollable
 *       </AdminFormView>
 *     </ScrollView>
 *   </KeyboardSafeFormView>
 *
 * Components used:
 * - KeyboardProviderWrapper (root level)
 * - KeyboardAvoidingViewWrapper (via KeyboardSafeFormView)
 * - Regular ScrollView
 *
 * See: team.tsx, room.tsx, menu.tsx, AdminFormLayout.tsx
 *
 * ════════════════════════════════════════════════════════════════════════════
 * Component Reference
 * ════════════════════════════════════════════════════════════════════════════
 *
 * KeyboardProviderWrapper:
 *   - Required at root level of app
 *   - Web: pass-through, Native: initializes keyboard controller
 *
 * KeyboardAvoidingViewWrapper:
 *   - Core component for keyboard avoidance (behavior: "padding")
 *   - Web: regular View, Native: uses keyboard-controller
 *   - Used in both Pattern A and Pattern B
 *
 * ════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { View, Platform } from 'react-native';
import { isWeb, logKeyboardEvent } from '~/utils/keyboard.utils';
import type {
  KeyboardProviderProps,
  KeyboardAvoidingViewProps,
} from '~/hooks/useKeyboard/types';

/**
 * KeyboardProvider Wrapper
 *
 * On Web: Pass-through component (no provider needed)
 * On Native: Uses react-native-keyboard-controller KeyboardProvider
 */
export const KeyboardProviderWrapper: React.FC<KeyboardProviderProps> = ({
  children,
  statusBarTranslucent = true,
  navigationBarTranslucent = Platform.OS === 'android',
  preload = true,
  enabled = true,
}) => {
  if (isWeb()) {
    return <>{children}</>;
  }

  try {
    const { KeyboardProvider } = require('react-native-keyboard-controller');

    return (
      <KeyboardProvider
        statusBarTranslucent={statusBarTranslucent}
        navigationBarTranslucent={navigationBarTranslucent}
        preload={preload}
        enabled={enabled}
      >
        {children}
      </KeyboardProvider>
    );
  } catch (error) {
    logKeyboardEvent('error', 'Failed to load KeyboardProvider', error);
    return <>{children}</>;
  }
};

/**
 * KeyboardAvoidingView Wrapper
 *
 * On Web: Regular View (keyboard handled by browser)
 * On Native: Uses react-native-keyboard-controller KeyboardAvoidingView
 */
export const KeyboardAvoidingViewWrapper: React.FC<KeyboardAvoidingViewProps> = ({
  children,
  behavior = 'padding',
  keyboardVerticalOffset = 0,
  contentContainerStyle,
  enabled = true,
  style,
  ...props
}) => {
  if (isWeb() || !enabled) {
    return (
      <View style={style} {...props}>
        {children}
      </View>
    );
  }

  try {
    const { KeyboardAvoidingView } = require('react-native-keyboard-controller');

    return (
      <KeyboardAvoidingView
        behavior={behavior}
        keyboardVerticalOffset={keyboardVerticalOffset}
        contentContainerStyle={contentContainerStyle}
        enabled={enabled}
        style={style}
        {...props}
      >
        {children}
      </KeyboardAvoidingView>
    );
  } catch (error) {
    logKeyboardEvent('error', 'Failed to load KeyboardAvoidingView', error);
    return (
      <View style={style} {...props}>
        {children}
      </View>
    );
  }
};
