/**
 * Keyboard Hooks - Public API
 *
 * Exports all keyboard-related hooks
 */

export { useKeyboard } from './useKeyboard';
export { useKeyboardConfig } from './useKeyboardConfig';
export { useKeyboardDebug, togglePersistentDebugMode, isPersistentDebugMode } from './useKeyboardDebug';

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

  // Controller types
  KeyboardController,
  KeyboardEvents,
  KeyboardEventSubscription,

  // Component prop types
  KeyboardProviderProps,
  KeyboardAvoidingViewProps,
  KeyboardSafeFormViewProps,
  KeyboardDebugOverlayProps,

  // Utility types
  UserRole,
  KeyboardBehavior,
  KeyboardStateType,
  PlatformImplementation,
  AndroidSoftInputModes,
} from './types';
