/**
 * Keyboard Hooks - Public API
 *
 * Exports all keyboard-related hooks
 */

export { useKeyboard } from './useKeyboard';
export { useKeyboardConfig } from './useKeyboardConfig';
export { useKeyboardDebug, togglePersistentDebugMode, isPersistentDebugMode } from './useKeyboardDebug';
export { useKeyboardVisibility } from './useKeyboardVisibility';

export type {
  // Main types
  KeyboardEventData,
  KeyboardState,
  KeyboardConfig,
  KeyboardHandlerCallbacks,
  FocusedInputLayout,
  KeyboardAnimatedValues,
  KeyboardReanimatedValues,
  KeyboardDebugInfo,
  KeyboardDismissOptions,

  // Hook return types
  UseKeyboardReturn,
  UseKeyboardConfigReturn,
  UseKeyboardDebugReturn,
  UseKeyboardVisibilityReturn,

  // Controller types
  KeyboardController,
  KeyboardEvents,
  KeyboardEventSubscription,

  // Component prop types
  KeyboardProviderProps,
  KeyboardAvoidingViewProps,
  KeyboardAwareScrollViewProps,
  KeyboardStickyViewProps,
  KeyboardToolbarProps,
  OverKeyboardViewProps,
  KeyboardGestureAreaProps,
  KeyboardExtenderProps,

  // Custom component prop types
  KeyboardSafeScrollViewProps,
  KeyboardSafeFormViewProps,
  KeyboardDebugOverlayProps,

  // Utility types
  UserRole,
  KeyboardBehavior,
  KeyboardStateType,
  PlatformImplementation,
  AndroidSoftInputModes,
} from './types';
