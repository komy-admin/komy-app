/**
 * Keyboard Hooks - Public API
 *
 * Exports all keyboard-related hooks
 */

export { useKeyboard } from './useKeyboard';
export { useKeyboardVisibility } from './useKeyboardVisibility';

export type {
  // Main types
  KeyboardEventData,
  KeyboardState,
  KeyboardReanimatedValues,
  KeyboardDismissOptions,

  // Hook return types
  UseKeyboardReturn,
  UseKeyboardVisibilityReturn,

  // Component prop types
  KeyboardProviderProps,
  KeyboardAvoidingViewProps,

  // Utility types
  KeyboardBehavior,
  KeyboardStateType,
} from './types';
