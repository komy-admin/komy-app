/**
 * Keyboard Wrapper Components
 *
 * Platform-aware wrappers around react-native-keyboard-controller components
 * with graceful fallbacks for Web and error handling.
 *
 * IMPORTANT: Components are imported at module level to avoid
 * dynamic require() calls inside render functions which can
 * cause React hooks dependency array issues.
 */

import React, { useEffect } from 'react';
import { View, ScrollView, Platform, Keyboard, ScrollViewProps } from 'react-native';
import { usePathname } from 'expo-router';
import { isWeb, logKeyboardEvent } from '~/utils/keyboard.utils';
import type {
  KeyboardProviderProps,
  KeyboardAvoidingViewProps,
} from '~/hooks/useKeyboard/types';

// ============================================================================
// Module-level imports for keyboard-controller components
// These are loaded once at module initialization, not on every render
// ============================================================================

let NativeKeyboardProvider: React.ComponentType<any> | null = null;
let NativeKeyboardAvoidingView: React.ComponentType<any> | null = null;
let NativeKeyboardAwareScrollView: React.ComponentType<any> | null = null;

// Only attempt to load native components on non-web platforms
if (!isWeb()) {
  try {
    const keyboardController = require('react-native-keyboard-controller');
    NativeKeyboardProvider = keyboardController.KeyboardProvider;
    NativeKeyboardAvoidingView = keyboardController.KeyboardAvoidingView;
    NativeKeyboardAwareScrollView = keyboardController.KeyboardAwareScrollView;
  } catch (error) {
    logKeyboardEvent('error', 'Failed to load react-native-keyboard-controller', error);
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for KeyboardAwareScrollView wrapper
 *
 * Extends ScrollViewProps and adds keyboard-controller specific props.
 */
export interface KeyboardAwareScrollViewWrapperProps extends Omit<ScrollViewProps, 'ref'> {
  children: React.ReactNode;
  /** Space between keyboard and focused input (default: 20) */
  bottomOffset?: number;
  /** Extra space at bottom of scroll content (default: 0) */
  extraKeyboardSpace?: number;
  /** Disable scroll when keyboard hides (default: false) */
  disableScrollOnKeyboardHide?: boolean;
  /** Enable/disable keyboard handling (default: true) */
  enabled?: boolean;
}

// ============================================================================
// KeyboardProvider Wrapper
// ============================================================================

/**
 * KeyboardProvider Wrapper
 *
 * On Web: Pass-through component (no provider needed)
 * On Native: Uses react-native-keyboard-controller KeyboardProvider
 */
/**
 * Auto-dismiss keyboard on route change.
 * Renderless component — no children, no re-render propagation.
 */
const KeyboardRouteGuard = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (!isWeb()) {
      Keyboard.dismiss();
    }
  }, [pathname]);

  return null;
};

export const KeyboardProviderWrapper: React.FC<KeyboardProviderProps> = ({
  children,
  statusBarTranslucent = true,
  navigationBarTranslucent = Platform.OS === 'android',
  preload = true,
  enabled = true,
}) => {
  // Web fallback: just render children
  if (!NativeKeyboardProvider) {
    return (
      <>
        <KeyboardRouteGuard />
        {children}
      </>
    );
  }

  return (
    <NativeKeyboardProvider
      statusBarTranslucent={statusBarTranslucent}
      navigationBarTranslucent={navigationBarTranslucent}
      preload={preload}
      enabled={enabled}
    >
      <KeyboardRouteGuard />
      {children}
    </NativeKeyboardProvider>
  );
};

// ============================================================================
// KeyboardAvoidingView Wrapper
// ============================================================================

/**
 * KeyboardAvoidingView Wrapper
 *
 * For simple forms WITHOUT ScrollView (e.g., login, PIN screens)
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
}) => {
  // Web fallback or disabled: regular View
  if (!NativeKeyboardAvoidingView || !enabled) {
    return <View style={style}>{children}</View>;
  }

  return (
    <NativeKeyboardAvoidingView
      behavior={behavior}
      keyboardVerticalOffset={keyboardVerticalOffset}
      contentContainerStyle={contentContainerStyle}
      enabled={enabled}
      style={style}
    >
      {children}
    </NativeKeyboardAvoidingView>
  );
};

// ============================================================================
// KeyboardAwareScrollView Wrapper
// ============================================================================

/**
 * KeyboardAwareScrollView Wrapper
 *
 * For forms WITH scrollable content (e.g., admin forms, filter panels)
 * Automatically scrolls to focused input with native performance
 *
 * On Web: Regular ScrollView
 * On Native: Uses react-native-keyboard-controller KeyboardAwareScrollView
 *
 * @example
 *   <KeyboardAwareScrollViewWrapper bottomOffset={20}>
 *     <TextInput placeholder="Name" />
 *     <TextInput placeholder="Email" />
 *   </KeyboardAwareScrollViewWrapper>
 */
export const KeyboardAwareScrollViewWrapper: React.FC<KeyboardAwareScrollViewWrapperProps> = ({
  children,
  bottomOffset = 20,
  extraKeyboardSpace = 0,
  disableScrollOnKeyboardHide = false,
  enabled = true,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  ...restProps
}) => {
  // Web fallback or disabled or module not loaded: regular ScrollView
  if (!NativeKeyboardAwareScrollView || !enabled) {
    return (
      <ScrollView
        style={style}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        {...restProps}
      >
        {children}
      </ScrollView>
    );
  }

  // Native implementation with keyboard-controller specific props
  return (
    <NativeKeyboardAwareScrollView
      bottomOffset={bottomOffset}
      extraKeyboardSpace={extraKeyboardSpace}
      disableScrollOnKeyboardHide={disableScrollOnKeyboardHide}
      enabled={enabled}
      style={style}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      {...restProps}
    >
      {children}
    </NativeKeyboardAwareScrollView>
  );
};
