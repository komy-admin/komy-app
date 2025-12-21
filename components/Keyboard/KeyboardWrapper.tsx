/**
 * Keyboard Wrapper Components
 *
 * Platform-aware wrappers around react-native-keyboard-controller components
 * Provides fallbacks for Web and graceful degradation
 */

import React from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isWeb, logKeyboardEvent } from '~/utils/keyboard.utils';
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
 * KeyboardAwareScrollView Wrapper - Native Version
 *
 * ⚠️ WARNING: KeyboardAwareScrollView has known Reanimated issues on Android
 * Prefer using KeyboardAvoidingView + ScrollView for stable behavior
 * See KEYBOARD_SOLUTION.md for recommended approach
 *
 * Accepts animatedRef created by parent (KeyboardSafeScrollView)
 * and passes it to react-native-keyboard-controller's KeyboardAwareScrollView
 */
const KeyboardAwareScrollViewNative = React.forwardRef<any, KeyboardAwareScrollViewProps>(
  (
    {
      children,
      bottomOffset = 0,
      extraKeyboardSpace = 0,
      disableScrollOnKeyboardHide = false,
      enabled = true,
      ...props
    },
    ref
  ) => {
    try {
      const { KeyboardAwareScrollView } = require('react-native-keyboard-controller');

      if (__DEV__) {
        logKeyboardEvent('debug', '[KeyboardWrapper] Native: rendering KeyboardAwareScrollView', {
          bottomOffset,
          extraKeyboardSpace,
          enabled,
          hasRef: !!ref,
        });
      }

      return (
        <KeyboardAwareScrollView
          ref={ref} // ✅ Pass the animatedRef from parent
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
      logKeyboardEvent('error', '[KeyboardWrapper] Failed to load native keyboard components', error);
      // Fallback to regular ScrollView
      return <ScrollView {...props}>{children}</ScrollView>;
    }
  }
);

KeyboardAwareScrollViewNative.displayName = 'KeyboardAwareScrollViewNative';

/**
 * KeyboardAwareScrollView Wrapper - Web Version
 *
 * Simple ScrollView with forwardRef support
 */
const KeyboardAwareScrollViewWeb = React.forwardRef<ScrollView, KeyboardAwareScrollViewProps>(
  ({ children, bottomOffset, extraKeyboardSpace, disableScrollOnKeyboardHide, enabled = true, ...props }, ref) => {
    if (!enabled) {
      return <View {...props}>{children}</View>;
    }

    if (__DEV__) {
      logKeyboardEvent('debug', '[KeyboardWrapper] Web: using regular ScrollView', { enabled });
    }

    return <ScrollView ref={ref} {...props}>{children}</ScrollView>;
  }
);

KeyboardAwareScrollViewWeb.displayName = 'KeyboardAwareScrollViewWeb';

/**
 * KeyboardAwareScrollView Wrapper - Main Export
 *
 * Conditionally exports Native or Web version
 */
export const KeyboardAwareScrollViewWrapper = isWeb()
  ? KeyboardAwareScrollViewWeb
  : KeyboardAwareScrollViewNative;

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
 * Internal KeyboardToolbar component that uses hooks properly
 */
const KeyboardToolbarInternal: React.FC<KeyboardToolbarProps> = ({
  insets: providedInsets,
  opacity = 'EE',
  theme,
  showArrows = true,
  doneText = 'Done',
  onNextCallback,
  onPrevCallback,
  onDoneCallback,
  ...props
}) => {
  // Always call hook unconditionally (required by React rules)
  const safeAreaInsets = useSafeAreaInsets();

  // Use provided insets or fallback to safe area insets
  const insets = providedInsets || safeAreaInsets;

  try {
    const { KeyboardToolbar } = require('react-native-keyboard-controller');

    return (
      <KeyboardToolbar
        insets={insets}
        opacity={opacity}
        theme={theme}
        showArrows={showArrows}
        doneText={doneText}
        onNextCallback={onNextCallback}
        onPrevCallback={onPrevCallback}
        onDoneCallback={onDoneCallback}
        {...props}
      />
    );
  } catch (error) {
    logKeyboardEvent('error', 'Failed to load KeyboardToolbar', error);
    return null;
  }
};

/**
 * KeyboardToolbar Wrapper
 *
 * On Web: Not rendered (no toolbar needed)
 * On Native: Uses react-native-keyboard-controller KeyboardToolbar
 */
export const KeyboardToolbarWrapper: React.FC<KeyboardToolbarProps> = (props) => {
  if (isWeb()) {
    return null;
  }

  return <KeyboardToolbarInternal {...props} />;
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
