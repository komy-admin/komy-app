/**
 * Keyboard TypeScript Type Definitions
 *
 * Centralized types for keyboard functionality
 */

import type { ViewProps, ViewStyle } from 'react-native';
import type {
  KeyboardBehavior as _KeyboardBehavior,
  KeyboardStateType as _KeyboardStateType,
  UserRole as _UserRole,
} from '~/constants/keyboard.constants';

// Re-export types from constants
export type KeyboardBehavior = _KeyboardBehavior;
export type KeyboardStateType = _KeyboardStateType;
export type UserRole = _UserRole;

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
 * Keyboard configuration per role
 */
export interface KeyboardConfig {
  role: UserRole;
  behavior: KeyboardBehavior;
  verticalOffset: number;
  bottomOffset: number;
  enableToolbar: boolean;
  enableGestureDismiss: boolean;
  enableDebug: boolean;
}

/**
 * Keyboard handler callbacks
 */
export interface KeyboardHandlerCallbacks {
  onStart?: (event: KeyboardEventData) => void;
  onMove?: (event: KeyboardEventData) => void;
  onInteractive?: (event: KeyboardEventData) => void;
  onEnd?: (event: KeyboardEventData) => void;
}

/**
 * Focused input layout information
 */
export interface FocusedInputLayout {
  target: number;
  parentScrollViewTarget: number;
  layout: {
    x: number;
    y: number;
    width: number;
    height: number;
    absoluteX: number;
    absoluteY: number;
  };
}

/**
 * Keyboard animation values (Animated API)
 */
export interface KeyboardAnimatedValues {
  height: any; // Animated.Value
  progress: any; // Animated.Value
}

/**
 * Keyboard animation values (Reanimated API)
 */
export interface KeyboardReanimatedValues {
  height: any; // SharedValue<number>
  progress: any; // SharedValue<number>
}

/**
 * Keyboard debug information
 */
export interface KeyboardDebugInfo {
  currentState: KeyboardState;
  focusedInput: FocusedInputLayout | null;
  performance: {
    frameDrops: number;
    averageFrameTime: number;
    lastEventTimestamp: number;
  };
  config: KeyboardConfig;
  platform: {
    os: string;
    version: number | string;
    isTablet: boolean;
    supportsInteractiveDismiss: boolean;
  };
}

/**
 * Keyboard dismiss options
 */
export interface KeyboardDismissOptions {
  keepFocus?: boolean;
  animated?: boolean;
}

/**
 * Keyboard controller methods
 */
export interface KeyboardController {
  setInputMode: (mode: number) => void;
  setDefaultMode: () => void;
  preload: () => void;
  dismiss: (options?: KeyboardDismissOptions) => Promise<void>;
  isVisible: () => boolean;
  state: () => KeyboardEventData;
  setFocusTo: (direction: 'prev' | 'current' | 'next') => void;
}

/**
 * Keyboard events subscription
 */
export interface KeyboardEventSubscription {
  remove: () => void;
}

/**
 * Keyboard events module
 */
export interface KeyboardEvents {
  addListener: (
    eventName: 'keyboardWillShow' | 'keyboardWillHide' | 'keyboardDidShow' | 'keyboardDidHide',
    callback: (event: KeyboardEventData) => void
  ) => KeyboardEventSubscription;
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
 * Props for KeyboardAwareScrollView wrapper
 */
export interface KeyboardAwareScrollViewProps {
  children: React.ReactNode;
  bottomOffset?: number;
  extraKeyboardSpace?: number;
  disableScrollOnKeyboardHide?: boolean;
  enabled?: boolean;
  [key: string]: any; // Allow other ScrollView props
}

/**
 * Props for KeyboardStickyView wrapper
 */
export interface KeyboardStickyViewProps extends ViewProps {
  offset?: {
    closed?: number;
    opened?: number;
  };
  enabled?: boolean;
}

/**
 * Props for KeyboardToolbar wrapper
 */
export interface KeyboardToolbarProps extends ViewProps {
  insets?: {
    left: number;
    right: number;
  };
  opacity?: string;
  theme?: any;
  showArrows?: boolean;
  doneText?: string;
  onNextCallback?: () => void;
  onPrevCallback?: () => void;
  onDoneCallback?: () => void;
}

/**
 * Props for OverKeyboardView wrapper
 */
export interface OverKeyboardViewProps {
  children: React.ReactNode;
  visible: boolean;
}

/**
 * Props for KeyboardGestureArea wrapper
 */
export interface KeyboardGestureAreaProps {
  children: React.ReactNode;
  interpolator?: 'ios' | 'linear';
  offset?: number;
  showOnSwipeUp?: boolean;
  enableSwipeToDismiss?: boolean;
  textInputNativeID?: string;
}

/**
 * Props for KeyboardExtender wrapper
 */
export interface KeyboardExtenderProps {
  children: React.ReactNode;
  enabled: boolean;
}

/**
 * Props for custom keyboard components
 */
export interface KeyboardSafeScrollViewProps extends KeyboardAwareScrollViewProps {
  role?: UserRole;
  debugMode?: boolean;
}

export interface KeyboardSafeFormViewProps extends Omit<KeyboardAvoidingViewProps, 'role'> {
  role?: UserRole;
  showToolbar?: boolean;
  debugMode?: boolean;
}

/**
 * Props for debug overlay
 */
export interface KeyboardDebugOverlayProps {
  visible: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  compact?: boolean;
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

  // Config
  config: KeyboardConfig;

  // Debug
  debug: KeyboardDebugInfo | null;
}

/**
 * Return type for useKeyboardDebug hook
 */
export interface UseKeyboardDebugReturn {
  debugInfo: KeyboardDebugInfo;
  toggleDebugOverlay: () => void;
  clearMetrics: () => void;
  logCurrentState: () => void;
}

/**
 * Return type for useKeyboardConfig hook
 */
export interface UseKeyboardConfigReturn {
  config: KeyboardConfig;
  updateConfig: (partial: Partial<KeyboardConfig>) => void;
  resetConfig: () => void;
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

/**
 * Utility type for platform-specific implementations
 */
export type PlatformImplementation<T> = {
  ios?: T;
  android?: T;
  web?: T;
  default: T;
};

/**
 * Android soft input modes
 */
export enum AndroidSoftInputModes {
  SOFT_INPUT_ADJUST_NOTHING = 0x00000030,
  SOFT_INPUT_ADJUST_PAN = 0x00000020,
  SOFT_INPUT_ADJUST_RESIZE = 0x00000010,
  SOFT_INPUT_ADJUST_UNSPECIFIED = 0x00000000,
}
