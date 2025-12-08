/**
 * Keyboard Utilities
 *
 * Platform-aware utilities and helpers for keyboard management
 */

import { Platform, Dimensions } from 'react-native';

/**
 * Check if we're on a platform that supports keyboard controller
 */
export const isKeyboardControllerSupported = (): boolean => {
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

/**
 * Check if we're on web (no keyboard controller needed)
 */
export const isWeb = (): boolean => {
  return Platform.OS === 'web';
};

/**
 * Check if we're on a tablet (iPad or Android tablet)
 */
export const isTablet = (): boolean => {
  const { width, height } = Dimensions.get('window');

  // iPad Pro or large Android tablets
  if (Platform.OS === 'ios') {
    return Platform.isPad;
  }

  // Android: screen diagonal > 7 inches (approximation)
  const pixelDensity = Dimensions.get('screen').scale;
  const widthInches = width / (pixelDensity * 160);
  const heightInches = height / (pixelDensity * 160);
  const diagonalInches = Math.sqrt(widthInches ** 2 + heightInches ** 2);

  return diagonalInches >= 7;
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
 * Lazy load keyboard components (returns React.Fragment on web)
 */
export const createKeyboardComponent = <P extends object>(
  componentName: string,
  fallbackComponent?: React.ComponentType<P>
) => {
  if (isWeb()) {
    // Return a simple pass-through component on web
    return fallbackComponent || (({ children }: any) => children);
  }

  try {
    const module = require('react-native-keyboard-controller');
    return module[componentName] as React.ComponentType<P>;
  } catch (error) {
    console.warn(`[KEYBOARD] Failed to load ${componentName}:`, error);
    return fallbackComponent || (({ children }: any) => children);
  }
};

/**
 * Calculate keyboard height percentage of screen
 */
export const getKeyboardHeightPercentage = (keyboardHeight: number): number => {
  const { height } = Dimensions.get('window');
  return (keyboardHeight / height) * 100;
};

/**
 * Determine if keyboard is "substantially" open
 * (helps avoid false positives with autocomplete bars)
 */
export const isKeyboardSubstantiallyOpen = (keyboardHeight: number): boolean => {
  const MIN_SUBSTANTIAL_HEIGHT = 100; // px
  return keyboardHeight >= MIN_SUBSTANTIAL_HEIGHT;
};

/**
 * Calculate appropriate bottomOffset based on screen size
 */
export const calculateBottomOffset = (baseOffset: number): number => {
  if (isTablet()) {
    // Tablets typically need more offset due to larger screens
    return baseOffset * 1.2;
  }
  return baseOffset;
};

/**
 * Get default behavior based on platform and screen type
 */
export const getDefaultBehavior = (): 'padding' | 'height' | 'position' => {
  if (Platform.OS === 'ios') {
    return 'padding';
  }

  // Android tablets might benefit from different behavior
  if (isTablet()) {
    return 'padding';
  }

  return 'padding';
};

/**
 * Format keyboard event data for logging
 */
export const formatKeyboardEvent = (event: any): string => {
  return `height=${event.height}px, progress=${(event.progress * 100).toFixed(1)}%, duration=${event.duration}ms`;
};

/**
 * Throttle function for high-frequency keyboard events
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastRan = 0;

  return function executedFunction(...args: Parameters<T>) {
    const now = Date.now();

    if (!lastRan) {
      func(...args);
      lastRan = now;
    } else {
      if (timeout) clearTimeout(timeout);

      timeout = setTimeout(() => {
        if (now - lastRan >= wait) {
          func(...args);
          lastRan = now;
        }
      }, wait - (now - lastRan));
    }
  };
};

/**
 * Debounce function for keyboard state changes
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

/**
 * Check if two keyboard states are effectively the same
 */
export const areKeyboardStatesEqual = (
  state1: { height: number; progress: number },
  state2: { height: number; progress: number },
  threshold = 0.01
): boolean => {
  return (
    Math.abs(state1.height - state2.height) < 1 &&
    Math.abs(state1.progress - state2.progress) < threshold
  );
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

/**
 * Performance monitoring helper
 */
export const measureKeyboardPerformance = (operationName: string) => {
  if (!__DEV__) {
    return {
      end: () => {},
    };
  }

  const startTime = performance.now();

  return {
    end: () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (duration > 16) {
        // Longer than one frame at 60fps
        logKeyboardEvent('warn', `Slow keyboard operation: ${operationName}`, {
          duration: `${duration.toFixed(2)}ms`,
        });
      } else {
        logKeyboardEvent('debug', `Keyboard operation: ${operationName}`, {
          duration: `${duration.toFixed(2)}ms`,
        });
      }
    },
  };
};

/**
 * Safely execute keyboard-related code with error handling
 */
export const safeKeyboardExec = <T>(
  operation: () => T,
  fallback: T,
  operationName = 'keyboard operation'
): T => {
  try {
    return operation();
  } catch (error) {
    logKeyboardEvent('error', `Failed ${operationName}`, error);
    return fallback;
  }
};
