/**
 * Keyboard Utilities
 *
 * Platform-aware utilities and helpers for keyboard management
 */

import { Platform } from 'react-native';

/**
 * Check if we're on web (no keyboard controller needed)
 */
export const isWeb = (): boolean => {
  return Platform.OS === 'web';
};

/**
 * Get safe keyboard controller module (returns null on web)
 */
export const getKeyboardController = () => {
  if (isWeb()) {
    return null;
  }

  try {
    return require('react-native-keyboard-controller');
  } catch (error) {
    console.warn('[KEYBOARD] Failed to load react-native-keyboard-controller:', error);
    return null;
  }
};

/**
 * Log keyboard event with consistent formatting (DEV only)
 */
export const logKeyboardEvent = (
  level: 'info' | 'debug' | 'warn' | 'error',
  message: string,
  data?: any
) => {
  if (!__DEV__) return;

  const prefix = `[KEYBOARD]`;

  switch (level) {
    case 'error':
      console.error(prefix, message, data);
      break;
    case 'warn':
      console.warn(prefix, message, data);
      break;
    case 'debug':
      // Only log debug in verbose mode
      break;
    default:
      console.log(prefix, message, data);
  }
};
