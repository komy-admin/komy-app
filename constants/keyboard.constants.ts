/**
 * Keyboard Constants
 *
 * Centralizes all keyboard-related constants for Fork'it app
 */

import { Platform } from 'react-native';

/**
 * Keyboard behavior modes for KeyboardAvoidingView
 */
export const KEYBOARD_BEHAVIOR = {
  PADDING: 'padding',
  HEIGHT: 'height',
  POSITION: 'position',
  TRANSLATE_WITH_PADDING: 'translate-with-padding',
} as const;

/**
 * Default keyboard offsets per role
 */
export const KEYBOARD_OFFSETS = {
  AUTH: {
    vertical: 20,
    bottom: 30,
  },
  SERVER: {
    vertical: 60,
    bottom: 50,
  },
  ADMIN: {
    vertical: 60,
    bottom: 50,
  },
  FILTER: {
    vertical: 200,
    bottom: 50,
  },
  COOK: {
    vertical: 20,
    bottom: 20,
  },
  BARMAN: {
    vertical: 20,
    bottom: 20,
  },
  DEFAULT: {
    vertical: 0,
    bottom: 0,
  },
} as const;

/**
 * Debug overlay configuration
 */
export const KEYBOARD_DEBUG = {
  OVERLAY_OPACITY: 0.9,
  POSITION: 'top-right' as const,
  BACKGROUND_COLOR: 'rgba(0, 0, 0, 0.8)',
  TEXT_COLOR: '#00FF00',
  UPDATE_THROTTLE: 16, // ~60fps
} as const;

/**
 * Keyboard state constants
 */
export const KEYBOARD_STATE = {
  CLOSED: 'closed',
  OPENING: 'opening',
  OPEN: 'open',
  CLOSING: 'closing',
} as const;

/**
 * Z-index layers for keyboard components
 */
export const KEYBOARD_Z_INDEX = {
  DEBUG_OVERLAY: 9999,
  OVER_KEYBOARD_VIEW: 9998,
  TOOLBAR: 100,
  STICKY_VIEW: 99,
} as const;

/**
 * Feature flags
 */
export const KEYBOARD_FEATURES = {
  ENABLE_DEBUG_OVERLAY: __DEV__,
  ENABLE_PERFORMANCE_MONITORING: __DEV__,
  ENABLE_GESTURE_DISMISS: Platform.OS === 'android' && Platform.Version >= 30, // Android 11+
  ENABLE_TOOLBAR: true,
  PRELOAD_KEYBOARD: true,
} as const;

/**
 * Threshold values
 */
export const KEYBOARD_THRESHOLDS = {
  MIN_HEIGHT: 100, // Minimum height to consider keyboard as "open"
  SCROLL_THRESHOLD: 20, // Minimum scroll distance before triggering
  ANIMATION_THRESHOLD: 0.01, // Progress threshold for animation state
} as const;

export type KeyboardBehavior = typeof KEYBOARD_BEHAVIOR[keyof typeof KEYBOARD_BEHAVIOR];
export type KeyboardStateType = typeof KEYBOARD_STATE[keyof typeof KEYBOARD_STATE];
export type UserRole = keyof typeof KEYBOARD_OFFSETS;
