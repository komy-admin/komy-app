/**
 * Keyboard Constants
 *
 * Centralizes all keyboard-related constants for Fork'it app
 */

/**
 * Keyboard behavior modes for KeyboardAvoidingView
 */
export const KEYBOARD_BEHAVIOR = {
  PADDING: 'padding',
  HEIGHT: 'height',
  POSITION: 'position',
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
 * Threshold values
 */
export const KEYBOARD_THRESHOLDS = {
  MIN_HEIGHT: 100, // Minimum height to consider keyboard as "open"
} as const;

export type KeyboardBehavior = typeof KEYBOARD_BEHAVIOR[keyof typeof KEYBOARD_BEHAVIOR];
export type KeyboardStateType = typeof KEYBOARD_STATE[keyof typeof KEYBOARD_STATE];
