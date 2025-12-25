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
 * Check if interactive keyboard dismissal is supported
 * (Android 11+ only)
 */
export const isInteractiveDismissSupported = (): boolean => {
  return Platform.OS === 'android' && Platform.Version >= 30;
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
 * Format keyboard event data for logging
 */
export const formatKeyboardEvent = (event: any): string => {
  return `height=${event.height}px, progress=${(event.progress * 100).toFixed(1)}%, duration=${event.duration}ms`;
};

/**
 * Get keyboard type display name
 */
export const getKeyboardTypeDisplayName = (type?: string): string => {
  const typeMap: Record<string, string> = {
    'default': 'Default',
    'number-pad': 'Number Pad',
    'decimal-pad': 'Decimal Pad',
    'numeric': 'Numeric',
    'email-address': 'Email',
    'phone-pad': 'Phone',
    'url': 'URL',
    'ascii-capable': 'ASCII',
    'numbers-and-punctuation': 'Numbers & Punctuation',
    'name-phone-pad': 'Name Phone Pad',
    'twitter': 'Twitter',
    'web-search': 'Web Search',
    'visible-password': 'Visible Password',
  };

  return type ? (typeMap[type] || type) : 'Unknown';
};

/**
 * Get keyboard appearance display name
 */
export const getKeyboardAppearanceDisplayName = (appearance?: string): string => {
  const appearanceMap: Record<string, string> = {
    'default': 'Default',
    'light': 'Light',
    'dark': 'Dark',
  };

  return appearance ? (appearanceMap[appearance] || appearance) : 'Default';
};

/**
 * Log keyboard event with consistent formatting
 */
export const logKeyboardEvent = (
  level: 'info' | 'debug' | 'warn' | 'error',
  message: string,
  data?: any
) => {
  if (!__DEV__) return;

  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = `[KEYBOARD] [${level.toUpperCase()}] [${timestamp}]`;

  switch (level) {
    case 'error':
      console.error(prefix, message, data);
      break;
    case 'warn':
      console.warn(prefix, message, data);
      break;
    case 'debug':
      console.debug(prefix, message, data);
      break;
    default:
      console.log(prefix, message, data);
  }
};
