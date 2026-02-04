/**
 * Keyboard TypeScript Type Definitions
 *
 * Centralized types for keyboard functionality
 */

import type { ViewProps, ViewStyle } from 'react-native';
import type {
  KeyboardBehavior as _KeyboardBehavior,
  KeyboardStateType as _KeyboardStateType,
} from '~/constants/keyboard.constants';

// Re-export types from constants
export type KeyboardBehavior = _KeyboardBehavior;
export type KeyboardStateType = _KeyboardStateType;

/**
 * Keyboard event data structure
 * (matches react-native-keyboard-controller)
 */
export interface KeyboardEventData {
  height: number;
  progress: number;
  duration: number;
  timestamp: number;
  target: number;
  type: string;
  appearance: string;
}

/**
 * Extended keyboard state with computed properties
 */
export interface KeyboardState extends KeyboardEventData {
  isVisible: boolean;
  state: KeyboardStateType;
  heightPercentage: number;
}

/**
 * Keyboard animation values (Reanimated API)
 */
export interface KeyboardReanimatedValues {
  height: any; // SharedValue<number>
  progress: any; // SharedValue<number>
}

/**
 * Keyboard dismiss options
 */
export interface KeyboardDismissOptions {
  keepFocus?: boolean;
  animated?: boolean;
}

/**
 * Props for KeyboardProvider wrapper
 */
export interface KeyboardProviderProps {
  children: React.ReactNode;
  statusBarTranslucent?: boolean;
  navigationBarTranslucent?: boolean;
  preload?: boolean;
  enabled?: boolean;
}

/**
 * Props for KeyboardAvoidingView wrapper
 */
export interface KeyboardAvoidingViewProps extends ViewProps {
  behavior?: KeyboardBehavior;
  keyboardVerticalOffset?: number;
  contentContainerStyle?: ViewStyle;
  enabled?: boolean;
}

/**
 * Return type for useKeyboard hook
 */
export interface UseKeyboardReturn {
  // State
  state: KeyboardState;
  isVisible: boolean;
  height: number;
  progress: number;

  // Animation values (Reanimated)
  animated: KeyboardReanimatedValues;

  // Controller methods
  dismiss: (options?: KeyboardDismissOptions) => Promise<void>;
  setFocusTo: (direction: 'prev' | 'current' | 'next') => void;
}

/**
 * Return type for useKeyboardVisibility hook
 */
export interface UseKeyboardVisibilityReturn {
  isVisible: boolean;
  isOpening: boolean;
  isClosing: boolean;
  height: number;
  duration: number;
}
