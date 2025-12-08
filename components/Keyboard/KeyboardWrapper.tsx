/**
 * Keyboard Wrapper Components
 *
 * Platform-aware wrappers around react-native-keyboard-controller components
 * Provides fallbacks for Web and graceful degradation
 */

import React from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { isWeb, createKeyboardComponent, logKeyboardEvent } from '~/utils/keyboard.utils';
import type {
  KeyboardProviderProps,
  KeyboardAvoidingViewProps,
  KeyboardAwareScrollViewProps,
  KeyboardStickyViewProps,
  KeyboardToolbarProps,
  OverKeyboardViewProps,
  KeyboardGestureAreaProps,
  KeyboardExtenderProps,
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

/**
 * KeyboardAwareScrollView Wrapper
 *
 * On Web: Regular ScrollView
 * On Native: Uses react-native-keyboard-controller KeyboardAwareScrollView
 */
export const KeyboardAwareScrollViewWrapper: React.FC<KeyboardAwareScrollViewProps> = ({
  children,
  bottomOffset = 0,
  extraKeyboardSpace = 0,
  disableScrollOnKeyboardHide = false,
  enabled = true,
  ...props
}) => {
  if (isWeb() || !enabled) {
    return <ScrollView {...props}>{children}</ScrollView>;
  }

  try {
    const { KeyboardAwareScrollView } = require('react-native-keyboard-controller');

    return (
      <KeyboardAwareScrollView
        bottomOffset={bottomOffset}
        extraKeyboardSpace={extraKeyboardSpace}
        disableScrollOnKeyboardHide={disableScrollOnKeyboardHide}
        enabled={enabled}
        {...props}
      >
        {children}
      </KeyboardAwareScrollView>
    );
  } catch (error) {
    logKeyboardEvent('error', 'Failed to load KeyboardAwareScrollView', error);
    return <ScrollView {...props}>{children}</ScrollView>;
  }
};

/**
 * KeyboardStickyView Wrapper
 *
 * On Web: Regular View (no sticky behavior)
 * On Native: Uses react-native-keyboard-controller KeyboardStickyView
 */
export const KeyboardStickyViewWrapper: React.FC<KeyboardStickyViewProps> = ({
  children,
  offset = { closed: 0, opened: 0 },
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
    const { KeyboardStickyView } = require('react-native-keyboard-controller');

    return (
      <KeyboardStickyView offset={offset} enabled={enabled} style={style} {...props}>
        {children}
      </KeyboardStickyView>
    );
  } catch (error) {
    logKeyboardEvent('error', 'Failed to load KeyboardStickyView', error);
    return (
      <View style={style} {...props}>
        {children}
      </View>
    );
  }
};

/**
 * KeyboardToolbar Wrapper
 *
 * On Web: Not rendered (no toolbar needed)
 * On Native: Uses react-native-keyboard-controller KeyboardToolbar
 *
 * Note: Using legacy API for now, can be upgraded to compound API later
 */
export const KeyboardToolbarWrapper: React.FC<KeyboardToolbarProps> = ({
  insets,
  opacity = 'EE',
  theme,
  showArrows = true,
  doneText = 'Done',
  onNextCallback,
  onPrevCallback,
  onDoneCallback,
  ...props
}) => {
  if (isWeb()) {
    return null;
  }

  try {
    const { KeyboardToolbar } = require('react-native-keyboard-controller');
    const { useSafeAreaInsets } = require('react-native-safe-area-context');

    // Use provided insets or get from safe area
    const safeInsets = insets || useSafeAreaInsets();

    return (
      <KeyboardToolbar insets={safeInsets} opacity={opacity} theme={theme} {...props}>
        {showArrows && <KeyboardToolbar.Prev onPress={onPrevCallback} />}
        {showArrows && <KeyboardToolbar.Next onPress={onNextCallback} />}
        <KeyboardToolbar.Done text={doneText} onPress={onDoneCallback} />
      </KeyboardToolbar>
    );
  } catch (error) {
    logKeyboardEvent('error', 'Failed to load KeyboardToolbar', error);
    return null;
  }
};

/**
 * OverKeyboardView Wrapper
 *
 * On Web: Regular Modal/Overlay
 * On Native: Uses react-native-keyboard-controller OverKeyboardView
 */
export const OverKeyboardViewWrapper: React.FC<OverKeyboardViewProps> = ({
  children,
  visible,
}) => {
  if (isWeb()) {
    // On web, just render conditionally
    if (!visible) return null;
    return <>{children}</>;
  }

  try {
    const { OverKeyboardView } = require('react-native-keyboard-controller');

    return <OverKeyboardView visible={visible}>{children}</OverKeyboardView>;
  } catch (error) {
    logKeyboardEvent('error', 'Failed to load OverKeyboardView', error);
    if (!visible) return null;
    return <>{children}</>;
  }
};

/**
 * KeyboardGestureArea Wrapper
 *
 * On Web: Pass-through
 * On Native (Android 11+): Uses react-native-keyboard-controller KeyboardGestureArea
 * On Native (iOS/Android <11): Pass-through
 */
export const KeyboardGestureAreaWrapper: React.FC<KeyboardGestureAreaProps> = ({
  children,
  interpolator = 'ios',
  offset = 0,
  showOnSwipeUp = false,
  enableSwipeToDismiss = true,
  textInputNativeID,
}) => {
  // Only works on Android 11+
  const isSupported = Platform.OS === 'android' && Platform.Version >= 30;

  if (isWeb() || !isSupported) {
    return <>{children}</>;
  }

  try {
    const { KeyboardGestureArea } = require('react-native-keyboard-controller');

    return (
      <KeyboardGestureArea
        interpolator={interpolator}
        offset={offset}
        showOnSwipeUp={showOnSwipeUp}
        enableSwipeToDismiss={enableSwipeToDismiss}
        textInputNativeID={textInputNativeID}
      >
        {children}
      </KeyboardGestureArea>
    );
  } catch (error) {
    logKeyboardEvent('error', 'Failed to load KeyboardGestureArea', error);
    return <>{children}</>;
  }
};

/**
 * KeyboardExtender Wrapper
 *
 * On Web: Not rendered
 * On Native: Uses react-native-keyboard-controller KeyboardExtender
 */
export const KeyboardExtenderWrapper: React.FC<KeyboardExtenderProps> = ({
  children,
  enabled,
}) => {
  if (isWeb()) {
    return null;
  }

  try {
    const { KeyboardExtender } = require('react-native-keyboard-controller');

    return <KeyboardExtender enabled={enabled}>{children}</KeyboardExtender>;
  } catch (error) {
    logKeyboardEvent('error', 'Failed to load KeyboardExtender', error);
    return null;
  }
};
